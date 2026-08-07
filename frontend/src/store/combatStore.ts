import { create } from 'zustand';
import { CombatStore } from './types';
import { createSocketSlice } from './slices/socketSlice';
import { createCharacterSlice } from './slices/characterSlice';
import { createCombatSlice } from './slices/combatSlice';
import { createMagicSlice } from './slices/magicSlice';

export * from './types';

export const useCombatStore = create<CombatStore>((set, get, api) => ({
  socket: null,
  isConnected: false,
  hasSynced: false,
  characters: {},
  campaignId: null,
  myCharacterId: localStorage.getItem('anima_character_id') || null,
  combatState: {
    round: 1,
    turnIndex: -1,
    initiativeQueue: [],
    isRequestingInitiative: false,
    characterStates: {}
  },
  diceRolls: [],
  incomingAttack: null,
  pendingCounterOpportunity: null,
  criticalHitEvent: null,
  fumbleEvent: null,
  weaponShatteredEvent: null,
  persistentSpells: [],
  progressionDrafts: {},
  logs: [],
  turnTracker: null,

  ...createSocketSlice(set, get, api),
  ...createCharacterSlice(set, get, api),
  ...createCombatSlice(set, get, api),
  ...createMagicSlice(set, get, api),
}));
