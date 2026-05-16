import { Server, Socket } from 'socket.io';
import { processNextTurn, CharacterState } from '../engine/turn';
import { PrismaClient } from '@prisma/client';

// Forzamos la actualización del IDE
const prisma = new PrismaClient();

export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // join_campaign: Para unir al usuario a la room
    socket.on('join_campaign', (campaignId: string) => {
      socket.join(campaignId);
      console.log(`[Socket] ${socket.id} joined campaign ${campaignId}`);
      // Opcional: Podríamos emitir el estado inicial aquí
    });

    // stat_changed: Para cambios manuales (vida, oro, energía)
    socket.on('stat_changed', async (data: { campaignId: string, characterId: string, stat: string, value: number }) => {
      const { campaignId, characterId, stat, value } = data;
      
      try {
        // En un entorno real, actualizaríamos la DB:
        // await prisma.character.update({ where: { id: characterId }, data: { [stat]: value } });
        
        // Retransmitimos a la sala (incluyendo a quien lo envió, o usando broadcast)
        io.to(campaignId).emit('stat_updated', { characterId, stat, value });
        console.log(`[Socket] Stat changed: ${characterId} -> ${stat}: ${value}`);
      } catch (e) {
        console.error(e);
      }
    });

    // next_round_tick: Evento maestro que dispara el GM para procesar el turno
    socket.on('next_round_tick', async (campaignId: string) => {
      try {
        // 1. Cargar personajes de la DB
        const dbCharacters = await prisma.character.findMany({
          where: { campaignId },
          include: { activeEffects: true }
        });

        if (dbCharacters.length === 0) return;

        // Formatear para el Turn Manager
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
          dotes: c.dotes as any[] // Parsear del JSONB
        }));

        // 2. Procesar con el Turn Manager (limpieza y regeneración)
        const updatedCharacters = processNextTurn(charactersState);

        // 3. Persistir los cambios en Prisma (Simulación de batch update)
        for (const char of updatedCharacters) {
          await prisma.character.update({
            where: { id: char.id },
            data: {
              hp: char.hp,
              ki: char.ki,
              zeon: char.zeon
              // Aquí también actualizaríamos los efectos activos si eliminamos expirados
            }
          });
        }

        // 4. Emitir el nuevo estado completo a la sala
        io.to(campaignId).emit('round_processed', updatedCharacters);
        console.log(`[Socket] Next round processed for campaign ${campaignId}`);
      } catch (error) {
        console.error('[Socket] Error in next_round_tick:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
