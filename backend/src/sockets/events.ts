import { Server, Socket } from 'socket.io';
import { processNextTurn, CharacterState } from '../engine/turn';
import { PrismaClient } from '@prisma/client';
import { CharacterRepository } from '../repositories/CharacterRepository';

const prisma = new PrismaClient({ log: ['info'] });

export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Une al socket a la sala de la campaña
    socket.on('join_campaign', (campaignId: string) => {
      socket.join(campaignId);
      console.log(`[Socket] ${socket.id} joined campaign ${campaignId}`);
    });

    // Actualiza y retransmite el cambio de una estadística
    socket.on('stat_changed', async (data: { campaignId: string, characterId: string, stat: string, value: number }) => {
      const { campaignId, characterId, stat, value } = data;
      
      try {
        io.to(campaignId).emit('stat_updated', { characterId, stat, value });
        console.log(`[Socket] Stat changed: ${characterId} -> ${stat}: ${value}`);
      } catch (e) {
        console.error(e);
      }
    });

    // Apply damage to a character using the new OOP domain rules
    socket.on('apply_damage', async (data: { campaignId: string, characterId: string, amount: number, type: string }) => {
      const { campaignId, characterId, amount, type } = data;
      
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(characterId);
        
        if (character) {
          character.applyDirectDamage(amount, type);
          await repo.save(character);
          
          io.to(campaignId).emit('character_updated', { 
            characterId: character.id, 
            hp: character.currentHp,
            state: character.state
          });
          console.log(`[Socket] Damage applied to ${characterId}: ${amount} ${type}. New HP: ${character.currentHp} State: ${character.state}`);
        }
      } catch (e) {
        console.error('[Socket] Error applying damage:', e);
      }
    });

    // Avanza el turno, calcula regeneraciones y actualiza la base de datos
    socket.on('next_round_tick', async (campaignId: string) => {
      try {
        const dbCharacters = await prisma.character.findMany({
          where: { campaignId },
          include: { activeEffects: true }
        });

        if (dbCharacters.length === 0) return;

        const charactersState: CharacterState[] = dbCharacters.map(c => ({
          id: c.id,
          hp: c.hp,
          max_hp: c.max_hp,
          ki: c.ki,
          zeon: c.zeon,
          activeEffects: c.activeEffects.map(e => ({
            id: e.id,
            modifiers: e.modifiers,
            duration_rounds: e.duration_rounds
          })),
          dotes: c.dotes as any[]
        }));

        const updatedCharacters = processNextTurn(charactersState);

        for (const char of updatedCharacters) {
          await prisma.character.update({
            where: { id: char.id },
            data: {
              hp: char.hp,
              ki: char.ki,
              zeon: char.zeon
            }
          });
        }

        io.to(campaignId).emit('round_processed', updatedCharacters);
        console.log(`[Socket] Next round processed for campaign ${campaignId}`);
      } catch (error) {
        console.error('[Socket] Error in next_round_tick:', error);
      }
    });

    // Maneja la desconexión del socket
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
