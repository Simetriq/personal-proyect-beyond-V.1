import { HandlerContext } from '../types';
import { safeHandler } from '../../middleware/errorHandler';
import { loadCharacter, saveCharacter, broadcastCharacterUpdate, emitSystemLog } from './utils';
import crypto from 'crypto';
import { PersistentSpell } from '../../types/combat';

export function registerMagicHandlers(ctx: HandlerContext) {
  const { socket, roomState, io } = ctx;

  socket.on('combat:toggle_magic_accumulation', safeHandler(async ({ roomId, characterId }) => {
    const character = await loadCharacter(ctx, roomId, characterId);
    if (character) {
      if (!character.magicData) {
        character.magicData = {
          currentZeon: character.zeon || 100,
          maxZeon: character.zeon || 100,
          accumulatedZeon: 0,
          magicAccumulation: 20, // Default ACT
          isAccumulating: false
        };
      }
      character.magicData.isAccumulating = !character.magicData.isAccumulating;
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, roomId, character);
    }
  }));

  socket.on('combat:cast_persistent_spell', safeHandler(async ({ roomId, characterId, spellName, zeonCost, maintenance }) => {
    const character = await loadCharacter(ctx, roomId, characterId);
    if (character && character.magicData && character.magicData.accumulatedZeon >= zeonCost) {
      character.magicData.accumulatedZeon -= zeonCost;
      
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

  socket.on('combat:submit_secret_log', safeHandler(({ roomId, logEntry }) => {
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
  if (!character || !character.magicData) return;

  const magic = character.magicData;
  let stateChanged = false;

  if (magic.isAccumulating) {
    const spaceLeft = magic.maxZeon - magic.accumulatedZeon;
    const addAmount = Math.min(magic.magicAccumulation, spaceLeft);
    
    if (addAmount > 0) {
      magic.accumulatedZeon += addAmount;
      emitSystemLog(ctx, roomId, `✨ ${character.name} canaliza el flujo del alma. Pozo de Zeon actual: [${magic.accumulatedZeon}]`);
      stateChanged = true;
    }
  }

  const roomSpells = ctx.roomState.activePersistentSpells[roomId] || [];
  const userSpells = roomSpells.filter((s: any) => s.casterId === activeCharacterId);
  
  let spellsCollapsed = false;
  userSpells.forEach((spell: PersistentSpell) => {
    if (magic.currentZeon >= spell.zeonMaintenance) {
      magic.currentZeon -= spell.zeonMaintenance;
      emitSystemLog(ctx, roomId, `🔮 Mantenimiento: ${character.name} consume ${spell.zeonMaintenance} de Zeon para sostener [${spell.name}].`);
      stateChanged = true;
    } else {
      ctx.roomState.activePersistentSpells[roomId] = ctx.roomState.activePersistentSpells[roomId].filter((s: any) => s.id !== spell.id);
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
