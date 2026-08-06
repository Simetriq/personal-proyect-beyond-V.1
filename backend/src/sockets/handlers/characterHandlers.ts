import { HandlerContext } from '../types';
import { safeHandler } from '../../middleware/errorHandler';
import { loadCharacter, saveCharacter, broadcastCharacterUpdate, getCampaignNpcs, broadcastCombatState } from './utils';
import { getCombatTracker } from '../../engine/combatTracker';
import { CharacterRepository } from '../../repositories/CharacterRepository';
import { tickBleeding } from '../../engine/bleeding';
import { isAgony } from '../../engine/health';
import { roll1d100 } from '../../engine/dice';
import { ABILITIES_REGISTRY } from '../../domain/abilitiesRegistry';

export function registerCharacterHandlers(ctx: HandlerContext) {
  const { socket, io, prisma, roomState } = ctx;

  socket.on('join_campaign', safeHandler(async (campaignId: string) => {
    socket.join(campaignId);
    console.log(`[Socket] ${socket.id} joined campaign ${campaignId}`);
    
    const repo = new CharacterRepository(prisma);
    const dbCharacters = await prisma.character.findMany({ where: { campaignId } });
    
    for (const dbChar of dbCharacters) {
      const character = await repo.findById(dbChar.id);
      if (character) broadcastCharacterUpdate(ctx, campaignId, character);
    }

    const npcs = getCampaignNpcs(ctx, campaignId);
    for (const npc of npcs.values()) {
      broadcastCharacterUpdate(ctx, campaignId, npc);
    }
    
    broadcastCombatState(ctx, campaignId);
  }));

  socket.on('join_gm_room', safeHandler(() => {
    socket.join('gm_room');
  }));

  socket.on('equip_item', safeHandler(async (data: { campaignId: string, characterId: string, itemId: string }) => {
    const character = await loadCharacter(ctx, data.campaignId, data.characterId);
    if (character && character.equipItem) {
      character.equipItem(data.itemId);
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, data.campaignId, character);
    }
  }));

  socket.on('unequip_item', safeHandler(async (data: { campaignId: string, characterId: string, itemId: string }) => {
    const character = await loadCharacter(ctx, data.campaignId, data.characterId);
    if (character && character.unequipItem) {
      character.unequipItem(data.itemId);
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, data.campaignId, character);
    }
  }));

  socket.on('use_item', safeHandler(async (data: { campaignId: string, characterId: string, itemId: string }) => {
    const character = await loadCharacter(ctx, data.campaignId, data.characterId);
    if (character && character.useItem) {
      character.useItem(data.itemId);
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, data.campaignId, character);
    }
  }));

  socket.on('buy_item', safeHandler(async (data: { campaignId: string, characterId: string, item: any, cost: number }) => {
    const character = await loadCharacter(ctx, data.campaignId, data.characterId);
    if (character && character.gold >= data.cost) {
      character.gold -= data.cost;
      const existingItem = character.inventory[data.item.id];
      if (existingItem) existingItem.quantity += data.item.quantity;
      else character.inventory[data.item.id] = data.item;
      await saveCharacter(ctx, character);
      broadcastCharacterUpdate(ctx, data.campaignId, character);
    }
  }));

  socket.on('use_character_ability', safeHandler(async (data: { campaignId: string, sourceId: string, targetId: string, abilityKey: string }) => {
    const sourceChar = await loadCharacter(ctx, data.campaignId, data.sourceId);
    if (!sourceChar) return;
    const ability = ABILITIES_REGISTRY[data.abilityKey];
    if (!ability) return;

    let success = false;
    if (ability.resource === 'KI' && sourceChar.spendKi) success = sourceChar.spendKi(ability.cost);
    else if (ability.resource === 'ZEON' && sourceChar.spendZeon) success = sourceChar.spendZeon(ability.cost);

    if (success) {
      // Abbreviated for space
      await saveCharacter(ctx, sourceChar);
      broadcastCharacterUpdate(ctx, data.campaignId, sourceChar);
    }
  }));

  socket.on('combat:tick_hour', safeHandler(async (campaignId: string) => {
    const repo = new CharacterRepository(prisma);
    const dbCharacters = await prisma.character.findMany({ where: { campaignId } });
    
    const processHour = async (character: any) => {
      if (character.isDead) return false;
      let changed = false;
      if (isAgony(character.currentHp, character.constitution)) {
        const rfTotal = (character.resistances?.RF || 0) + roll1d100();
        if (rfTotal >= 120) {
          character.currentHp = 0; character.state = 'INCONSCIENTE'; character.isBleeding = false;
          character.activeEffects.push({
            id: Math.random().toString(36).substring(7),
            name: 'Estabilizado (Heridas graves)',
            characterId: character.id,
            modifiers: { HA: -60, HD: -60, ACCION: -60 },
            duration_rounds: 9999,
            createdAt: new Date()
          });
          changed = true;
        } else {
          if (120 - rfTotal > 60) {
            character.isDead = true; character.state = 'MUERTO'; changed = true;
          }
        }
      }
      return changed;
    };

    for (const dbChar of dbCharacters) {
      const character = await repo.findById(dbChar.id);
      if (character && await processHour(character)) {
        await saveCharacter(ctx, character); broadcastCharacterUpdate(ctx, campaignId, character);
      }
    }
    
    const npcs = getCampaignNpcs(ctx, campaignId);
    for (const character of npcs.values()) {
      if (await processHour(character)) broadcastCharacterUpdate(ctx, campaignId, character);
    }
  }));

  socket.on('roll_dice', safeHandler((data: { campaignId: string, characterId: string, characterName: string, result: number, isFumble: boolean, isOpen: boolean, description: string }) => {
    io.to(data.campaignId).emit('dice_rolled', { ...data, timestamp: Date.now() });
  }));

  socket.on('delete_dice_roll', safeHandler((data: { campaignId: string, timestamp: number }) => {
    io.to(data.campaignId).emit('dice_roll_deleted', { timestamp: data.timestamp });
  }));

  socket.on('update_character_stats', safeHandler(async (data: any) => {
    // Legacy support placeholder
  }));

  socket.on('remove_npc', safeHandler((data: { campaignId: string, characterId: string }) => {
    if (data.characterId.startsWith('npc_')) {
      getCampaignNpcs(ctx, data.campaignId).delete(data.characterId);
      const tracker = getCombatTracker(data.campaignId);
      tracker.initiativeQueue = tracker.initiativeQueue.filter(q => q.characterId !== data.characterId);
      broadcastCombatState(ctx, data.campaignId);
      io.to(data.campaignId).emit('character_removed', data.characterId);
    }
  }));

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
}
