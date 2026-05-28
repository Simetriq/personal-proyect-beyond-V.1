import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type DamageType = 'FIL' | 'CON' | 'PEN' | 'CAL' | 'ELE' | 'FRI' | 'ENE';

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
  inventory: any;
  resistances: Record<string, number>;
  ki: number;
  zeon: number;
  temporaryShield: number;
  currentInitiative: number | null;
  state: 'ACTIVO' | 'INCONSCIENTE' | 'MUERTO';
  kiAbilities: string[];
  activeEffects?: any[];
  maxZeon?: number;
  maxKi?: number;
}

export interface CharacterCombatState {
  isSurprised: boolean;
  isDefensive: boolean;
  hasActed: boolean;
}

export interface CombatState {
  round: number;
  turnIndex: number;
  initiativeQueue: { characterId: string; initiative: number }[];
  isRequestingInitiative: boolean;
  characterStates: Record<string, CharacterCombatState>;
}

export interface CombatStore {
  socket: Socket | null;
  isConnected: boolean;
  hasSynced: boolean;
  characters: Record<string, Character>;
  campaignId: string | null;
  myCharacterId: string | null;
  combatState: CombatState;
  diceRolls: DiceRoll[];
  pendingCounterOpportunity: { attackerId: string; bonus: number; timeoutMs: number } | null;
  
  setMyCharacterId: (id: string) => void;
  connectToCampaign: (campaignId: string) => void;
  applyDamage: (characterId: string, amount: number, type: DamageType) => void;
  resolveAttack: (attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: DamageType) => void;
  createCharacter: (campaignId: string, characterId: string, data: any) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, itemId: string) => void;
  useItem: (characterId: string, itemId: string) => void;
  buyItem: (characterId: string, item: any, cost: number) => void;
  gmUpdateCharacter: (characterId: string, updates: any) => void;
  applyEffect: (characterId: string, effect: any) => void;
  nextRoundTick: () => void;
  useAbility: (sourceId: string, targetId: string, abilityKey: string) => void;
  requestInitiatives: () => void;
  submitInitiative: (characterId: string, initiative: number) => void;
  nextTurn: () => void;
  executeCounter: (defenderId: string, attackerId: string, bonus: number) => void;
  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: any }) => void;
  removeNpc: (characterId: string) => void;

  buyKiAbility: (characterId: string, abilityId: string) => void;
  activateKiAbility: (characterId: string, abilityId: string) => void;
  deactivateKiAbility: (characterId: string, abilityId: string) => void;

  rollDice: (characterId: string, description: string) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

export const useCombatStore = create<CombatStore>((set, get) => ({
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
  pendingCounterOpportunity: null,

  setMyCharacterId: (id: string) => {
    localStorage.setItem('anima_character_id', id);
    set({ myCharacterId: id });
  },

  connectToCampaign: (campaignId: string) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Conectado al servidor de Anima Combat');
      set({ isConnected: true });
      socket.emit('join_campaign', campaignId);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, hasSynced: false });
    });

    socket.on('attack_resolved', (data: any) => {
      console.log('Ataque resuelto', data);
      // Podríamos mostrar un toast notification aquí
    });

    socket.on('dice_rolled', (roll: DiceRoll) => {
      set((state) => ({
        diceRolls: [roll, ...state.diceRolls].slice(0, 50) // Mantener las últimas 50 tiradas
      }));
    });

    socket.on('character_updated', (data: any) => {
      console.log('Personaje actualizado:', data);
      set((state) => ({
        characters: {
          ...state.characters,
          [data.characterId]: {
            ...state.characters[data.characterId],
            id: data.characterId,
            name: data.name || state.characters[data.characterId]?.name || 'Unknown',
            hp: data.hp,
            maxHp: data.maxHp || state.characters[data.characterId]?.maxHp || 0,
            gold: data.gold !== undefined ? data.gold : state.characters[data.characterId]?.gold,
            resistances: data.resistances || state.characters[data.characterId]?.resistances || {},
            inventory: data.inventory || state.characters[data.characterId]?.inventory || {},
            activeEffects: data.activeEffects || [],
            ki: data.ki !== undefined ? data.ki : state.characters[data.characterId]?.ki,
            zeon: data.zeon !== undefined ? data.zeon : state.characters[data.characterId]?.zeon,
            temporaryShield: data.temporaryShield !== undefined ? data.temporaryShield : state.characters[data.characterId]?.temporaryShield,
            currentInitiative: data.currentInitiative !== undefined ? data.currentInitiative : state.characters[data.characterId]?.currentInitiative,
            kiAbilities: data.kiAbilities || state.characters[data.characterId]?.kiAbilities || [],
            state: data.state as Character['state']
          }
        }
      }));
    });

    socket.on('combat_state_updated', (data: CombatState) => {
      set({ combatState: data, hasSynced: true });
    });

    socket.on('character_removed', (characterId: string) => {
      set((state) => {
        const newCharacters = { ...state.characters };
        delete newCharacters[characterId];
        return { characters: newCharacters };
      });
    });

    socket.on('attack_resolved', (data: any) => {
      // Opcional: mostrar una notificación o toast en el frontend con el resultado del combate.
      console.log('Resultado de combate:', data.result.message);
    });

    socket.on('combat:counter_opportunity', (data: { defenderId: string, attackerId: string, bonus: number, timeoutMs: number }) => {
      if (get().myCharacterId === data.defenderId) {
        set({ pendingCounterOpportunity: { attackerId: data.attackerId, bonus: data.bonus, timeoutMs: data.timeoutMs } });
      }
    });

    socket.on('combat:counter_expired', (data: { defenderId: string }) => {
      if (get().myCharacterId === data.defenderId) {
        set({ pendingCounterOpportunity: null });
      }
    });

    socket.on('combat:counter_confirmed', (data: { defenderId: string }) => {
      if (get().myCharacterId === data.defenderId) {
        set({ pendingCounterOpportunity: null });
      }
      console.log(`¡Contraataque de ${data.defenderId} confirmado!`);
    });

    set({ socket, campaignId });
  },

  applyDamage: (characterId: string, amount: number, type: DamageType) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('apply_damage', {
        campaignId,
        characterId,
        amount,
        type
      });
    }
  },

  resolveAttack: (attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: DamageType) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('resolve_attack', {
        campaignId,
        attackerId,
        defenderId,
        attackRoll,
        defenseRoll,
        baseDamage,
        damageType
      });
    }
  },

  createCharacter: (campaignId: string, characterId: string, data: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit('create_character', {
        campaignId,
        characterId,
        ...data
      });
    }
  },

  equipItem: (characterId: string, itemId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('equip_item', { campaignId, characterId, itemId });
    }
  },

  unequipItem: (characterId: string, itemId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('unequip_item', { campaignId, characterId, itemId });
    }
  },

  useItem: (characterId: string, itemId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('use_item', { campaignId, characterId, itemId });
    }
  },

  buyItem: (characterId: string, item: any, cost: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('buy_item', { campaignId, characterId, item, cost });
    }
  },

  gmUpdateCharacter: (characterId: string, updates: any) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('gm_update_character', { campaignId, characterId, updates });
    }
  },

  applyEffect: (characterId: string, effect: any) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('apply_effect', { campaignId, characterId, effect });
    }
  },

  nextRoundTick: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('next_round_tick', { campaignId });
    }
  },

  useAbility: (sourceId: string, targetId: string, abilityKey: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('use_character_ability', { campaignId, sourceId, targetId, abilityKey });
    }
  },

  requestInitiatives: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('request_initiatives', { campaignId });
    }
  },

  submitInitiative: (characterId: string, initiative: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('submit_initiative', { campaignId, characterId, initiative });
    }
  },

  nextTurn: () => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('next_turn', { campaignId });
    }
  },

  executeCounter: (defenderId: string, attackerId: string, bonus: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:execute_counter', { campaignId, defenderId, attackerId, bonus });
      set({ pendingCounterOpportunity: null }); // Limpiar local preventivamente
    }
  },

  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: any }) => {
    const { socket } = get();
    if (socket) {
      socket.emit('spawn_npc', data);
    }
  },

  removeNpc: (characterId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('remove_npc', { campaignId, characterId });
    }
  },

  buyKiAbility: (characterId: string, abilityId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('buy_ki_ability', { campaignId, characterId, abilityId });
    }
  },

  activateKiAbility: (characterId: string, abilityId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('activate_ki_ability', { campaignId, characterId, abilityId });
    }
  },

  deactivateKiAbility: (characterId: string, abilityId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('deactivate_ki_ability', { campaignId, characterId, abilityId });
    }
  },

  rollDice: (characterId: string, description: string) => {
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

      socket.emit('roll_dice', { 
        campaignId, 
        characterId, 
        characterName: charName, 
        result, 
        isFumble, 
        isOpen, 
        description 
      });
    }
  }
}));
