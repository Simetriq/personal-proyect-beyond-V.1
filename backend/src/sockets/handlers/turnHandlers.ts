import { HandlerContext } from '../types';
import { safeHandler } from '../middleware/errorHandler';
import { emitSystemLog } from './utils';
import { processTurnMagicMaintenance } from './magicHandlers';
import crypto from 'crypto';
import { getCombatTracker } from '../../engine/combatTracker';
import { broadcastCombatState, loadCharacter, saveCharacter, broadcastCharacterUpdate } from './utils';

export function registerTurnHandlers(ctx: HandlerContext) {
  const { socket, io, roomState, prisma } = ctx;

  socket.on('combat:submit_initiative_v2', safeHandler(socket, (data: { roomId: string, combatantId: string, name: string, roll: number, baseModifier: number, isNPC: boolean, accumulatingTurns: boolean }) => {
    const { roomId, combatantId, name, roll, baseModifier, isNPC, accumulatingTurns } = data;
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
      accumulatingTurns: typeof accumulatingTurns === 'number' ? accumulatingTurns : (accumulatingTurns ? 1 : 0)
    });

    tracker.order.sort((a, b) => b.initiativeTotal - a.initiativeTotal);
    io.to(roomId).emit('combat:turn_order_updated', tracker);
  }));

  socket.on('combat:next_turn', safeHandler(socket, async (data: { roomId: string }) => {
    const { roomId } = data;
    const tracker = roomState.activeTurnTrackers[roomId];
    if (!tracker || !tracker.isActive) return;

    const currentTurn = tracker.order[tracker.currentTurnIndex];
    if (currentTurn) {
      currentTurn.hasActed = true;
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

  socket.on('request_initiatives', safeHandler(socket, (data: { campaignId: string }) => {
    const { campaignId } = data;
    const tracker = getCombatTracker(campaignId);
    tracker.startRound();
    broadcastCombatState(ctx, campaignId);
    io.to(campaignId).emit('combat:round_started');
  }));

  socket.on('next_turn', safeHandler(socket, (data: { campaignId: string }) => {
    const { campaignId } = data;
    const tracker = getCombatTracker(campaignId);
    const activeChar = tracker.nextTurn();
    broadcastCombatState(ctx, campaignId);
    
    if (activeChar) {
      io.to(campaignId).emit('combat:turn_changed', activeChar);
    }
  }));

  socket.on('next_round_tick', safeHandler(socket, async (data: { campaignId: string }) => {
    const { campaignId } = data;
    const dbCharacters = await prisma.character.findMany({
      where: { campaignId: campaignId }
    });

    const npcs = Array.from(ctx.roomState.npcManagers.get(campaignId)?.values() || []);
    const allCharactersToTick = [...dbCharacters.map((d: {id: string}) => d.id), ...Array.from(npcs.values()).map((n: {id: string}) => n.id)];
    
    const tracker = getCombatTracker(campaignId);

    for (const charId of allCharactersToTick) {
      const character = await loadCharacter(ctx, campaignId, charId);
      if (character) {
        if (character.tickEffects) character.tickEffects();
        
        const state = tracker.characterStates.get(charId);
        const hasActedOrDefended = state ? (state.hasActed || state.isDefensive) : false;
        
        const baseKiAcc = 1; // Generic ki accumulation fallback
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
