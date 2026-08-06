import { HandlerContext } from '../types';
import { safeHandler } from '../../middleware/errorHandler';
import { emitSystemLog } from './utils';
import { processTurnMagicMaintenance } from './magicHandlers';
import crypto from 'crypto';
import { getCombatTracker } from '../../engine/combatTracker';
import { broadcastCombatState, loadCharacter, saveCharacter, broadcastCharacterUpdate } from './utils';

export function registerTurnHandlers(ctx: HandlerContext) {
  const { socket, io, roomState, prisma } = ctx;

  socket.on('combat:submit_initiative_v2', safeHandler(({ roomId, combatantId, name, roll, baseModifier, isNPC, accumulatingTurns }) => {
    if (!roomState.activeTurnTrackers[roomId]) {
      roomState.activeTurnTrackers[roomId] = { isActive: true, currentRound: 1, currentTurnIndex: 0, order: [] };
    }

    const tracker = roomState.activeTurnTrackers[roomId];
    const initiativeTotal = roll + baseModifier;

    tracker.order = tracker.order.filter(c => c.combatantId !== combatantId);

    tracker.order.push({
      combatantId,
      name,
      initiativeTotal,
      isNPC,
      hasActed: false,
      accumulatingTurns: accumulatingTurns || 0
    });

    tracker.order.sort((a, b) => b.initiativeTotal - a.initiativeTotal);
    io.to(roomId).emit('combat:turn_order_updated', tracker);
  }));

  socket.on('combat:next_turn', safeHandler(async ({ roomId }) => {
    const tracker = roomState.activeTurnTrackers[roomId];
    if (!tracker || !tracker.isActive) return;

    if (tracker.order[tracker.currentTurnIndex]) {
      tracker.order[tracker.currentTurnIndex].hasActed = true;
    }

    tracker.currentTurnIndex += 1;

    if (tracker.currentTurnIndex >= tracker.order.length) {
      tracker.currentRound += 1;
      tracker.currentTurnIndex = 0;
      tracker.order.forEach(c => c.hasActed = false);
      
      io.to(roomId).emit('combat:new_round_started', tracker);
      emitSystemLog(ctx, roomId, `✨ ¡Comienza la Ronda ${tracker.currentRound}! Revisen sus estados.`);
      return;
    }

    const activeCombatant = tracker.order[tracker.currentTurnIndex];
    if (activeCombatant && activeCombatant.accumulatingTurns > 0) {
      activeCombatant.accumulatingTurns -= 1;
      emitSystemLog(ctx, roomId, `⏳ ${activeCombatant.name} continúa acumulando energía. Quedan ${activeCombatant.accumulatingTurns} turnos de concentración.`);
    }

    if (activeCombatant) {
      await processTurnMagicMaintenance(ctx, roomId, activeCombatant.combatantId);
    }

    io.to(roomId).emit('combat:turn_order_updated', tracker);
  }));

  socket.on('request_initiatives', safeHandler(({ campaignId }) => {
    const tracker = getCombatTracker(campaignId);
    tracker.startRound();
    broadcastCombatState(ctx, campaignId);
    io.to(campaignId).emit('combat:round_started');
  }));

  socket.on('next_turn', safeHandler(({ campaignId }) => {
    const tracker = getCombatTracker(campaignId);
    const activeChar = tracker.nextTurn();
    broadcastCombatState(ctx, campaignId);
    
    if (activeChar) {
      io.to(campaignId).emit('combat:turn_changed', activeChar);
    }
  }));

  socket.on('next_round_tick', safeHandler(async ({ campaignId }) => {
    const dbCharacters = await prisma.character.findMany({
      where: { campaignId: campaignId }
    });

    const npcs = Array.from(ctx.roomState.npcManagers.get(campaignId)?.values() || []);
    const allCharactersToTick = [...dbCharacters.map((d: any) => d.id), ...npcs.map((n: any) => n.id)];
    
    const tracker = getCombatTracker(campaignId);

    for (const charId of allCharactersToTick) {
      const character = await loadCharacter(ctx, campaignId, charId);
      if (character) {
        if (character.tickEffects) character.tickEffects();
        
        const state = tracker.characterStates.get(charId);
        const hasActedOrDefended = state ? (state.hasActed || state.isDefensive) : false;
        
        const baseKiAcc = character.getKiAccumulationBase ? character.getKiAccumulationBase() : 1;
        const kiToRec = hasActedOrDefended ? Math.ceil(baseKiAcc / 2) : baseKiAcc;
        
        character.ki = (character.ki || 0) + kiToRec;
        character.currentInitiative = null;
        await saveCharacter(ctx, character);
        broadcastCharacterUpdate(ctx, campaignId, character);
      }
    }
    
    tracker.finalizeRound();
    broadcastCombatState(ctx, campaignId);
    
    io.to(campaignId).emit('combat:new_round_ready');
  }));
}
