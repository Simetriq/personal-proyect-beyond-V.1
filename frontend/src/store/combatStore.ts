import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type DamageType = 'FIL' | 'CON' | 'PEN' | 'CAL' | 'ELE' | 'FRI' | 'ENE';

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
}

export interface CombatState {
  round: number;
  turnIndex: number;
  initiativeQueue: { characterId: string; initiative: number }[];
  isRequestingInitiative: boolean;
}

interface CombatStore {
  socket: Socket | null;
  characters: Record<string, Character>;
  campaignId: string | null;
  combatState: CombatState;
  
  connectToCampaign: (campaignId: string) => void;
  applyDamage: (characterId: string, amount: number, type: DamageType) => void;
  createCharacter: (campaignId: string, characterId: string, data: any) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, itemId: string) => void;
  useItem: (characterId: string, itemId: string) => void;
  gmUpdateCharacter: (characterId: string, updates: any) => void;
  applyEffect: (characterId: string, effect: any) => void;
  nextRoundTick: () => void;
  useAbility: (characterId: string, type: 'KI' | 'ZEON', amount: number) => void;
  requestInitiatives: () => void;
  submitInitiative: (characterId: string, initiative: number) => void;
  nextTurn: () => void;
  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: any }) => void;
  removeNpc: (characterId: string) => void;
}

const SOCKET_URL = 'http://localhost:3000'; // Ajustar según el entorno

export const useCombatStore = create<CombatStore>((set, get) => ({
  socket: null,
  characters: {},
  campaignId: null,
  combatState: {
    round: 1,
    turnIndex: -1,
    initiativeQueue: [],
    isRequestingInitiative: false
  },

  connectToCampaign: (campaignId: string) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Conectado al servidor de Anima Combat');
      socket.emit('join_campaign', campaignId);
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
            state: data.state as Character['state']
          }
        }
      }));
    });

    socket.on('combat_state_updated', (data: CombatState) => {
      set({ combatState: data });
    });

    socket.on('character_removed', (characterId: string) => {
      set((state) => {
        const newCharacters = { ...state.characters };
        delete newCharacters[characterId];
        return { characters: newCharacters };
      });
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

  useAbility: (characterId: string, type: 'KI' | 'ZEON', amount: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('use_character_ability', { campaignId, characterId, type, amount });
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
  }
}));
