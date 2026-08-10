import type { StateCreator } from 'zustand';
import { CombatStore } from '../types';

export interface CharacterSlice {
  setMyCharacterId: (id: string) => void;
  createCharacter: (campaignId: string, characterId: string, data: Record<string, unknown>) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, itemId: string) => void;
  useItem: (characterId: string, itemId: string) => void;
  buyItem: (characterId: string, item: Record<string, unknown>, cost: number) => void;
  gmUpdateCharacter: (characterId: string, updates: Record<string, unknown>) => void;
  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: Record<string, unknown> }) => void;
  removeNpc: (characterId: string) => void;
  sendProgressionDraft: (payload: Record<string, unknown>) => void;
  approveLevelUp: (playerId: string) => void;
  rejectLevelUp: (playerId: string) => void;
  toggleCharacterState: (roomId: string, characterId: string, state: string) => void;
}

export const createCharacterSlice: StateCreator<CombatStore, [], [], CharacterSlice> = (set, get) => ({
  setMyCharacterId: (id: string) => {
    localStorage.setItem('anima_character_id', id);
    set({ myCharacterId: id });
  },

  createCharacter: (campaignId: string, characterId: string, data: Record<string, unknown>) => {
    const { socket } = get();
    if (socket) {
      socket.emit('create_character', { campaignId, characterId, ...data });
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

  buyItem: (characterId: string, item: Record<string, unknown>, cost: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('buy_item', { campaignId, characterId, item, cost });
    }
  },

  gmUpdateCharacter: (characterId: string, updates: Record<string, unknown>) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('gm_update_character', { campaignId, characterId, updates });
    }
  },

  spawnNpc: (data: { campaignId: string, name: string, maxHp: number, resistances: Record<string, unknown> }) => {
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

  sendProgressionDraft: (payload: Record<string, unknown>) => {
    const { socket } = get();
    if (socket) {
      socket.emit('player:progression_draft', payload);
    }
  },

  approveLevelUp: (playerId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('gm:approve_level_up', playerId);
    }
  },

  rejectLevelUp: (playerId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('gm:reject_level_up', playerId);
    }
  },

  toggleCharacterState: (roomId, characterId, state) => {
    const { socket } = get();
    if (socket) socket.emit('combat:toggle_character_state', { roomId, characterId, state });
  }
});
