import { HandlerContext } from '../types';
import { CharacterRepository } from '../../repositories/CharacterRepository';
import { getCombatTracker } from '../../engine/combatTracker';
import { Character } from '../../domain/Character';
import crypto from 'crypto';

export function getCampaignNpcs(ctx: HandlerContext, campaignId: string) {
  if (!ctx.roomState.npcManagers.has(campaignId)) ctx.roomState.npcManagers.set(campaignId, new Map());
  return ctx.roomState.npcManagers.get(campaignId)!;
}

export async function loadCharacter(ctx: HandlerContext, campaignId: string, characterId: string) {
  if (characterId.startsWith('npc_')) return getCampaignNpcs(ctx, campaignId).get(characterId);
  const repo = new CharacterRepository(ctx.prisma);
  return await repo.findById(characterId);
}

export async function saveCharacter(ctx: HandlerContext, character: Character) {
  if (!character.id.startsWith('npc_')) {
    const repo = new CharacterRepository(ctx.prisma);
    await repo.save(character);
  }
}

export function broadcastCharacterUpdate(ctx: HandlerContext, campaignId: string, character: Character) {
  ctx.io.to(campaignId).emit('character_updated', {
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
    temporaryShield: character.temporaryShield,
    currentInitiative: character.currentInitiative,
    kiAbilities: character.kiAbilities,
    reloadTurnsLeft: character.reloadTurnsLeft,
    martialStyles: character.martialStyles,
    activeMartialBonuses: character.activeMartialBonuses,
    strength: character.strength,
    dexterity: character.dexterity,
    agility: character.agility,
    constitution: character.constitution,
    intelligence: character.intelligence,
    power: character.power,
    willpower: character.willpower,
    perception: character.perception,
    appearance: character.appearance,
    nephilimType: character.nephilimType,
    hasInhumanity: character.hasInhumanity,
    hasZen: character.hasZen,
    isDead: character.isDead
  });
}

export function emitSystemLog(ctx: HandlerContext, rId: string, msg: string) {
  ctx.io.to(rId).emit('combat:new_log', {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type: 'system',
    characterId: 'system',
    characterName: 'Sistema',
    message: msg,
    isSecret: false
  });
}

export function broadcastCombatState(ctx: HandlerContext, campaignId: string) {
  ctx.io.to(campaignId).emit('combat_state_updated', getCombatTracker(campaignId).getPublicState());
}
