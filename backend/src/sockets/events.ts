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

    // Create a new character and broadcast to campaign
    socket.on('create_character', async (data) => {
      try {
        const repo = new CharacterRepository(prisma);
        
        const character = await repo.create({
          id: data.characterId,
          campaignId: data.campaignId,
          name: data.name,
          maxHp: data.maxHp,
          gold: data.gold,
          ki: data.ki,
          zeon: data.zeon,
          resistances: data.resistances
        });

        io.to(data.campaignId).emit('character_updated', {
          characterId: character.id,
          name: character.name,
          hp: character.currentHp,
          maxHp: character.maxHp,
          gold: character.gold,
          state: character.state,
          resistances: character.resistances,
          inventory: character.inventory
        });
        
        console.log(`[Socket] Character created: ${character.name}`);
      } catch (e) {
        console.error('[Socket] Error creating character:', e);
      }
    });

    const broadcastCharacterUpdate = (campaignId: string, character: any) => {
      io.to(campaignId).emit('character_updated', {
        characterId: character.id,
        name: character.name,
        hp: character.currentHp,
        maxHp: character.maxHp,
        gold: character.gold,
        state: character.state,
        resistances: character.resistances,
        inventory: character.inventory,
        activeEffects: character.activeEffects,
        ki: character.ki,
        zeon: character.zeon,
        temporaryShield: character.temporaryShield
      });
    };

    socket.on('equip_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        if (character) {
          character.equipItem(data.itemId);
          await repo.save(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('unequip_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        if (character) {
          character.unequipItem(data.itemId);
          await repo.save(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('use_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        if (character) {
          character.useItem(data.itemId);
          await repo.save(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('gm_update_character', async (data: { campaignId: string, characterId: string, updates: any }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        
        if (character) {
          character.gmOverrideStats(data.updates);
          await repo.save(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error GM Update:', e);
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
          broadcastCharacterUpdate(campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error applying damage:', e);
      }
    });

    socket.on('apply_effect', async (data: { campaignId: string, characterId: string, effect: any }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        if (character) {
          character.addEffect(data.effect);
          await repo.save(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('next_round_tick', async (data: { campaignId: string }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const dbCharacters = await prisma.character.findMany({
          where: { campaignId: data.campaignId }
        });

        for (const dbChar of dbCharacters) {
          const character = await repo.findById(dbChar.id);
          if (character) {
            character.tickEffects();
            await repo.save(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
        console.log(`[Socket] Next round tick applied for campaign: ${data.campaignId}`);
      } catch (e) { console.error(e); }
    });

    socket.on('use_character_ability', async (data: { campaignId: string, characterId: string, type: 'KI' | 'ZEON', amount: number }) => {
      try {
        const repo = new CharacterRepository(prisma);
        const character = await repo.findById(data.characterId);
        if (character) {
          let success = false;
          if (data.type === 'KI') {
            success = character.spendKi(data.amount);
          } else if (data.type === 'ZEON') {
            success = character.spendZeon(data.amount);
          }
          
          if (success) {
            // Solo guardamos en BD el gasto permanente, el shield queda en memoria pero se emite
            await repo.save(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
      } catch (e) { console.error(e); }
    });

    // Maneja la desconexión del socket
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
