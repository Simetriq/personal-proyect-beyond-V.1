import { HandlerContext } from '../types';
import { safeHandler } from '../middleware/errorHandler';
import { loadCharacter, saveCharacter, broadcastCharacterUpdate, emitSystemLog } from './utils';
import { CharacterData } from '../../domain/Character';
import type { AppliedEffect } from '../../types/combat';
import { GMCommandSchema } from '../../validators/socketPayloads';

export function registerGMHandlers(ctx: HandlerContext) {
  const { socket, io, roomState, prisma } = ctx;

  socket.on('combat:execute_gm_command', safeHandler(socket, async (payload: { roomId: string; commandString: string }) => {
    const parsed = GMCommandSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Payload inválido', details: parsed.error.flatten() });
      return;
    }
    const { roomId, commandString } = parsed.data;
    const parts = commandString.trim().split(' ');
    const command = parts[0]?.toLowerCase();
    
    switch (command) {
      case '/give_dp': {
        const [_, targetId, amountStr] = parts;
        const amount = parseInt(amountStr || '0', 10);
        
        if (targetId && !isNaN(amount)) {
          const character = await loadCharacter(ctx, roomId, targetId);
          if (character) {
            character.totalDP = (character.totalDP || 600) + amount;
            await saveCharacter(ctx, character);
            emitSystemLog(ctx, roomId, `🎁 El GM ha otorgado ${amount} PD a ${character.name}.`);
            broadcastCharacterUpdate(ctx, roomId, character);
          }
        }
        break;
      }

      case '/damage': {
        const [_, targetId, amountStr] = parts;
        const amount = parseInt(amountStr || '0', 10);
        
        if (targetId && !isNaN(amount)) {
          const character = await loadCharacter(ctx, roomId, targetId);
          if (character) {
            character.currentHp = Math.max(0, character.currentHp - amount);
            await saveCharacter(ctx, character);
            emitSystemLog(ctx, roomId, `💥 Una fuerza misteriosa inflige ${amount} de daño directo a ${character.name}.`);
            broadcastCharacterUpdate(ctx, roomId, character);
          }
        }
        break;
      }

      default:
        socket.emit('combat:error', { message: 'Comando no reconocido o sintaxis inválida.' });
    }
  }));

  socket.on('apply_custom_effect', safeHandler(socket, async (data: { campaignId: string, characterId: string, effect: Partial<AppliedEffect> }) => {
    const { campaignId, characterId, effect } = data;
    const character = await loadCharacter(ctx, campaignId, characterId);
    if (character) {
      const newEffect: AppliedEffect = {
        id: effect.id || Math.random().toString(36).substring(7),
        name: effect.name || 'Efecto Desconocido',
        description: effect.description || '',
        modifiers: effect.modifiers || [],
        durationRounds: effect.durationRounds || 1
      };
      character.addEffect(newEffect);
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, campaignId, character);
    }
  }));

  socket.on('remove_custom_effect', safeHandler(socket, async (data: { campaignId: string, characterId: string, effectId: string }) => {
    const { campaignId, characterId, effectId } = data;
    const character = await loadCharacter(ctx, campaignId, characterId);
    if (character && character.activeEffects) {
      character.activeEffects = character.activeEffects.filter(e => e.id !== effectId);
      // Forzar recálculo
      character.recalculateResistances();
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, campaignId, character);
    }
  }));
  socket.on('gm:command_give_dp', safeHandler(socket, async (payload: { playerId: string; amount: number }) => {
    const { playerId, amount } = payload;

    if (!playerId || isNaN(amount) || amount <= 0) {
      socket.emit('gm:console_error', 'Error: Datos inválidos. Uso: /give_dp [id] [cantidad]');
      return;
    }

    const characterActualizado = await prisma.character.update({
      where: { id: playerId },
      data: {
        totalDP: {
          increment: amount
        }
      },
      select: {
        id: true,
        name: true,
        totalDP: true,
        spentDP: true
      }
    });

    const availableDP = characterActualizado.totalDP - characterActualizado.spentDP;
    io.to(playerId).emit('player:dp_received', {
      amount,
      newTotalDP: characterActualizado.totalDP,
      availableDP
    });

    socket.emit('gm:console_success', `Inyectados ${amount} PD a ${characterActualizado.name} con éxito.`);
  }));

  socket.on('player:progression_draft', safeHandler(socket, (payload: { playerId: string; isOverLimit?: boolean; [key: string]: unknown }) => {
    roomState.activeProgressionDrafts[payload.playerId] = payload;
    socket.to('gm_room').emit('gm:update_player_draft', payload);
  }));

  socket.on('gm:approve_level_up', safeHandler(socket, async (playerId: string) => {
    const draft = roomState.activeProgressionDrafts[playerId] as { isOverLimit?: boolean } | undefined;
    if (!draft || draft.isOverLimit) return;
    io.to(playerId).emit('player:progression_approved');
    delete roomState.activeProgressionDrafts[playerId];
    io.to('gm_room').emit('gm:remove_player_draft', playerId);
  }));

  socket.on('gm:reject_level_up', safeHandler(socket, (playerId: string) => {
    if (roomState.activeProgressionDrafts[playerId]) {
      delete roomState.activeProgressionDrafts[playerId];
    }
    io.to(playerId).emit('player:progression_rejected');
    io.to('gm_room').emit('gm:remove_player_draft', playerId);
  }));

  socket.on('gm_update_character', safeHandler(socket, async (data: { campaignId: string, characterId: string, updates: Partial<CharacterData> }) => {
    const character = await loadCharacter(ctx, data.campaignId, data.characterId);
    if (character) {
      if (character.gmOverrideStats) character.gmOverrideStats(data.updates);
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, data.campaignId, character);
    }
  }));
}
