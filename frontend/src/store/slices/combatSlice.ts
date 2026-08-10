import type { StateCreator } from 'zustand';
import type { CombatStore, DamageType, CombatLogEntry, TurnTracker } from '../types';
export interface CombatSlice {
  addLog: (log: CombatLogEntry) => void;
  clearLogs: () => void;
  setTurnTracker: (tracker: TurnTracker) => void;
  clearCriticalHit: () => void;
  clearFumbleEvent: () => void;
  clearWeaponShattered: () => void;
  applyDamage: (characterId: string, amount: number, type: DamageType) => void;
  resolveAttack: (attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: DamageType, defenseType: 'BLOCK' | 'DODGE', modifiers?: Record<string, unknown>) => void;
  spendFatigue: (characterId: string, amount: number) => void;
  applyEffect: (characterId: string, effect: Record<string, unknown>) => void;
  nextRoundTick: () => void;
  useAbility: (sourceId: string, targetId: string, abilityKey: string) => void;
  requestInitiatives: () => void;
  submitInitiative: (characterId: string, initiative: number) => void;
  nextTurn: () => void;
  executeCounter: (defenderId: string, attackerId: string, bonus: number) => void;
  setFullDefense: (characterId: string, isFullDefense: boolean) => void;
  equipMartialStyle: (characterId: string, styleId: string) => void;
  unequipMartialStyle: (characterId: string, styleId: string) => void;
  declareAttack: (targetId: string, attackRoll: number, baseDamage: number, damageType: string, modifiers?: Record<string, unknown>) => void;
  submitDefense: (combatInstanceId: string, defenseType: 'BLOCK' | 'DODGE', defenseRoll: number) => void;
  clearIncomingAttack: () => void;
  rollDice: (characterId: string, description: string) => void;
  executeGMCommand: (roomId: string, commandString: string) => void;
}

export const createCombatSlice: StateCreator<CombatStore, [], [], CombatSlice> = (set, get) => ({
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setTurnTracker: (tracker) => set({ turnTracker: tracker }),
  clearCriticalHit: () => set({ criticalHitEvent: null }),
  clearFumbleEvent: () => set({ fumbleEvent: null }),
  clearWeaponShattered: () => set({ weaponShatteredEvent: null }),
  
  applyDamage: (characterId, amount, type) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('apply_damage', { campaignId, characterId, amount, type });
  },

  resolveAttack: (attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType, modifiers) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('resolve_attack', { campaignId, attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType, modifiers });
    }
  },

  spendFatigue: (characterId, amount) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('combat:spend_fatigue', { campaignId, characterId, amount });
  },

  applyEffect: (characterId, effect) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('apply_effect', { campaignId, characterId, effect });
  },

  nextRoundTick: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('next_round_tick', { campaignId });
  },

  useAbility: (sourceId, targetId, abilityKey) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('use_character_ability', { campaignId, sourceId, targetId, abilityKey });
  },

  requestInitiatives: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('request_initiatives', { campaignId });
  },

  submitInitiative: (characterId, initiative) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('submit_initiative', { campaignId, characterId, initiative });
  },

  nextTurn: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('next_turn', { campaignId });
  },

  executeCounter: (defenderId, attackerId, bonus) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:execute_counter', { campaignId, defenderId, attackerId, bonus });
      set({ pendingCounterOpportunity: null });
    }
  },

  setFullDefense: (characterId, isFullDefense) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('combat:set_full_defense', { campaignId, characterId, isFullDefense });
  },

  equipMartialStyle: (characterId, styleId) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('equip_martial_style', { campaignId, characterId, styleId });
  },

  unequipMartialStyle: (characterId, styleId) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) socket.emit('unequip_martial_style', { campaignId, characterId, styleId });
  },

  declareAttack: (targetId, attackRoll, baseDamage, damageType, modifiers) => {
    const { socket, campaignId, myCharacterId } = get();
    if (socket && campaignId && myCharacterId) {
      socket.emit('combat:declare_attack', { campaignId, attackerId: myCharacterId, targetId, attackRoll, baseDamage, damageType, modifiers });
    }
  },

  submitDefense: (combatInstanceId, defenseType, defenseRoll) => {
    const { socket } = get();
    if (socket) {
      socket.emit('combat:submit_defense', { combatInstanceId, defenseType, defenseRoll });
      set({ incomingAttack: null });
    }
  },

  clearIncomingAttack: () => set({ incomingAttack: null }),

  rollDice: (characterId, description) => {
    const { socket, campaignId, characters } = get();
    if (socket && campaignId) {
      let charName = "Director de Juego";
      if (characterId !== 'gm') {
        const char = characters[characterId];
        if (!char) return;
        charName = char.name;
      }
      const result = Math.floor(Math.random() * 100) + 1;
      const isFumble = result <= 3;
      const isOpen = result >= 90;
      socket.emit('roll_dice', { campaignId, characterId, characterName: charName, result, isFumble, isOpen, description });
    }
  },

  executeGMCommand: (roomId, commandString) => {
    const { socket } = get();
    if (socket) socket.emit('combat:execute_gm_command', { roomId, commandString });
  }
});
