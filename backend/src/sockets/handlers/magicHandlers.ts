import { HandlerContext } from '../types';
import { safeHandler } from '../middleware/errorHandler';
import { loadCharacter, saveCharacter, broadcastCharacterUpdate, emitSystemLog } from './utils';
import crypto from 'crypto';
import { PersistentSpell } from '../../types/combat';
import { AccumulateZeonSchema } from '../../validators/socketPayloads';

export function registerMagicHandlers(ctx: HandlerContext) {
  const { socket, roomState, io } = ctx;

  socket.on('combat:toggle_magic_accumulation', safeHandler(socket, async (payload: { roomId: string; characterId: string }) => {
    const parsed = AccumulateZeonSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Payload inválido', details: parsed.error.flatten() });
      return;
    }
    const { roomId, characterId } = parsed.data;
    const character = await loadCharacter(ctx, roomId, characterId);
    if (character) {
      character.isChanneling = !character.isChanneling;
      if (character.isChanneling && character.channeledZeon === undefined) {
        character.channeledZeon = 0;
      }
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, roomId, character);
    }
  }));

  socket.on('combat:cast_persistent_spell', safeHandler(socket, async (data: { roomId: string, characterId: string, spellName: string, zeonCost: number, maintenance: number }) => {
    const { roomId, characterId, spellName, zeonCost, maintenance } = data;
    const character = await loadCharacter(ctx, roomId, characterId);
    if (character && character.channeledZeon >= zeonCost) {
      character.channeledZeon -= zeonCost;
      
      if (!roomState.activePersistentSpells[roomId]) roomState.activePersistentSpells[roomId] = [];
      
      const newSpell: PersistentSpell = {
        id: crypto.randomUUID(),
        name: spellName,
        casterId: characterId,
        zeonMaintenance: maintenance,
        description: 'Manifestación Mística',
        globalModifiers: {}
      };
      
      roomState.activePersistentSpells[roomId].push(newSpell);
      
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, roomId, character);
      io.to(roomId).emit('combat:room_spells_updated', roomState.activePersistentSpells[roomId]);
      emitSystemLog(ctx, roomId, `💥 ${character.name} ha desatado [${spellName}] consumiendo ${zeonCost} Zeon. Coste de Mantenimiento: ${maintenance}/t.`);
    }
  }));

  socket.on('combat:submit_secret_log', safeHandler(socket, (data: { roomId: string, logEntry: Record<string, unknown> }) => {
    const { roomId, logEntry } = data;
    const publicLog = {
      ...logEntry,
      message: `🤫 El Game Master realiza una acción en las sombras...`,
      mathDetails: undefined
    };

    socket.to(roomId).emit('combat:new_log', publicLog);
    socket.emit('combat:new_log', logEntry);
  }));
}

export const processTurnMagicMaintenance = async (ctx: HandlerContext, roomId: string, activeCharacterId: string) => {
  const character = await loadCharacter(ctx, roomId, activeCharacterId);
  if (!character) return;

  let stateChanged = false;

  if (character.isChanneling) {
    const spaceLeft = character.zeon - (character.channeledZeon || 0);
    const accumulationBase = 20; // Default ACT
    const addAmount = Math.min(accumulationBase, spaceLeft);
    
    if (addAmount > 0) {
      character.channeledZeon = (character.channeledZeon || 0) + addAmount;
      emitSystemLog(ctx, roomId, `✨ ${character.name} canaliza el flujo del alma. Pozo de Zeon actual: [${character.channeledZeon}]`);
      stateChanged = true;
    }
  }

  const roomSpells = ctx.roomState.activePersistentSpells[roomId] || [];
  const userSpells = roomSpells.filter((s: PersistentSpell) => s.casterId === activeCharacterId);
  
  let spellsCollapsed = false;
  userSpells.forEach((spell: PersistentSpell) => {
    if (character.zeon >= spell.zeonMaintenance) {
      character.zeon -= spell.zeonMaintenance;
      emitSystemLog(ctx, roomId, `🔮 Mantenimiento: ${character.name} consume ${spell.zeonMaintenance} de Zeon para sostener [${spell.name}].`);
      stateChanged = true;
    } else {
      if (ctx.roomState.activePersistentSpells[roomId]) {
        ctx.roomState.activePersistentSpells[roomId] = ctx.roomState.activePersistentSpells[roomId].filter((s: PersistentSpell) => s.id !== spell.id);
      }
      emitSystemLog(ctx, roomId, `⚠️ El conjuro [${spell.name}] de ${character.name} colapsa por falta de energía mística.`);
      spellsCollapsed = true;
    }
  });

  if (spellsCollapsed) {
    ctx.io.to(roomId).emit('combat:room_spells_updated', ctx.roomState.activePersistentSpells[roomId]);
  }

  if (stateChanged) {
    await saveCharacter(ctx, character);
    broadcastCharacterUpdate(ctx, roomId, character);
  }
};
