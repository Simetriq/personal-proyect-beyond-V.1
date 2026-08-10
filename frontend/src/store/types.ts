export interface CombatantTurn {
  combatantId: string;
  name: string;
  initiativeTotal: number;
  isNPC: boolean;
  hasActed: boolean;
  accumulatingTurns: number;
}

export interface TurnTracker {
  isActive: boolean;
  currentRound: number;
  currentTurnIndex: number;
  order: CombatantTurn[];
}

import { Socket } from 'socket.io-client';
import type { CombatLogEntry } from '../components/BattleLogPanel';

export type DamageType = 'FIL' | 'CON' | 'PEN' | 'CAL' | 'ELE' | 'FRI' | 'ENE';

export interface EffectModifier {
  target: 'attack' | 'defense' | 'initiative' | 'hp' | 'damage';
  operation: 'add' | 'multiply' | 'tick';
  value: number;
}

export interface EffectDefinition {
  id: string;
  name: string;
  description: string;
  modifiers: EffectModifier[];
}

export interface AppliedEffect extends EffectDefinition {
  durationRounds: number;
  sourceId?: string; // e.g., the caster or the item
}
export interface DiceRoll {
  characterId: string;
  characterName: string;
  result: number;
  isFumble: boolean;
  isOpen: boolean;
  description: string;
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  gold: number;
  inventory: Record<string, unknown>;
  resistances: Record<string, number>;
  ki: number;
  zeon: number;
  temporaryShield: number;
  currentInitiative: number | null;
  state: 'ACTIVO' | 'INCONSCIENTE' | 'MUERTO';
  kiAbilities: string[];
  activeEffects?: Record<string, unknown>[];
  maxZeon?: number;
  maxKi?: number;
  currentFatigue?: number;
  maxFatigue?: number;
  isBleeding?: boolean;
  bleedingDamage?: number;
  isChanneling?: boolean;
  channeledZeon?: number;
  targetSpellId?: string;
  reloadTurnsLeft?: number;
  martialStyles?: string[];
  activeMartialBonuses?: { damage: number; attackBonus: number; defenseBonus: number; freeManeuvers: string[] };
  strength?: number;
  dexterity?: number;
  agility?: number;
  constitution?: number;
  intelligence?: number;
  power?: number;
  willpower?: number;
  perception?: number;
  appearance?: number;
  size?: number;
  nephilimType?: string | null;
  hasInhumanity?: boolean;
  hasZen?: boolean;
  isDead?: boolean;
  totalDP?: number;
  spentDP?: number;
  dpDistribution?: string;
  category?: string;
}

export interface CharacterCombatState {
  isSurprised: boolean;
  isDefensive: boolean;
  hasActed: boolean;
  isFullDefense?: boolean;
  selectedManeuver?: Record<string, unknown>;
}

export interface CombatState {
  round: number;
  turnIndex: number;
  initiativeQueue: { characterId: string; initiative: number }[];
  isRequestingInitiative: boolean;
  characterStates: Record<string, CharacterCombatState>;
}

import { EffectSlice } from './slices/effectSlice';

export interface CombatStore extends EffectSlice {
  socket: Socket | null;
  isConnected: boolean;
  hasSynced: boolean;
  characters: Record<string, Character>;
  campaignId: string | null;
  myCharacterId: string | null;
  combatState: CombatState;
  diceRolls: DiceRoll[];
  incomingAttack: { combatInstanceId: string; attackerName: string; attackRoll: number } | null;
  pendingCounterOpportunity: { attackerId: string; bonus: number; timeoutMs: number } | null;
  criticalHitEvent: { defenderId: string; level: number; location: string; instantKill: boolean } | null;
  fumbleEvent: { characterId: string; level: number; type: string } | null;
  weaponShatteredEvent: { characterId: string; weaponName: string } | null;
  persistentSpells: Record<string, unknown>[];
  progressionDrafts: Record<string, Record<string, unknown>>;
  logs: CombatLogEntry[];
  turnTracker: TurnTracker | null;
  
  setMyCharacterId: (id: string) => void;
  clearCriticalHit: () => void;
  clearWeaponShattered: () => void;
  connectToCampaign: (campaignId: string) => void;
  applyDamage: (characterId: string, amount: number, type: DamageType) => void;
  resolveAttack: (attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: DamageType, defenseType: 'BLOCK' | 'DODGE', modifiers?: Record<string, unknown>) => void;
  spendFatigue: (characterId: string, amount: number) => void;
  startChanneling: (characterId: string, spellId: string) => void;
  stopChanneling: (characterId: string) => void;
  reportPsychicFailure: (characterId: string, failureLevel: number) => void;
  buyItem: (characterId: string, item: Record<string, unknown>, cost: number) => void;
  createCharacter: (campaignId: string, characterId: string, data: Record<string, unknown>) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, itemId: string) => void;
  useItem: (characterId: string, itemId: string) => void;
  gmUpdateCharacter: (characterId: string, updates: Record<string, unknown>) => void;
  applyEffect: (characterId: string, effect: Record<string, unknown>) => void;
  nextRoundTick: () => void;
  useAbility: (sourceId: string, targetId: string, abilityKey: string) => void;
  requestInitiatives: () => void;
  submitInitiative: (characterId: string, initiative: number) => void;
  nextTurn: () => void;
  executeCounter: (defenderId: string, attackerId: string, bonus: number) => void;
  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: Record<string, unknown> }) => void;
  removeNpc: (characterId: string) => void;
  buyKiAbility: (characterId: string, abilityId: string) => void;
  activateKiAbility: (characterId: string, abilityId: string) => void;
  deactivateKiAbility: (characterId: string, abilityId: string) => void;
  rollDice: (characterId: string, description: string) => void;
  setFullDefense: (characterId: string, isFullDefense: boolean) => void;
  equipMartialStyle: (characterId: string, styleId: string) => void;
  unequipMartialStyle: (characterId: string, styleId: string) => void;
  sendProgressionDraft: (payload: Record<string, unknown>) => void;
  approveLevelUp: (playerId: string) => void;
  rejectLevelUp: (playerId: string) => void;
  declareAttack: (targetId: string, attackRoll: number, baseDamage: number, damageType: string, modifiers?: Record<string, unknown>) => void;
  submitDefense: (combatInstanceId: string, defenseType: 'BLOCK' | 'DODGE', defenseRoll: number) => void;
  clearIncomingAttack: () => void;
  addLog: (log: CombatLogEntry) => void;
  clearLogs: () => void;
  setTurnTracker: (tracker: TurnTracker) => void;
  clearFumbleEvent: () => void;
  toggleMagicAccumulation: (roomId: string, characterId: string) => void;
  castPersistentSpell: (roomId: string, characterId: string, spellName: string, zeonCost: number, maintenance: number) => void;
  executeGMCommand: (roomId: string, commandString: string) => void;
  toggleCharacterState: (roomId: string, characterId: string, state: string) => void;
}
