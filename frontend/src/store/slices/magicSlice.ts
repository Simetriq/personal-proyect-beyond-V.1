import { StateCreator } from 'zustand';
import { CombatStore } from '../types';

export interface MagicSlice {
  startChanneling: (characterId: string, spellId: string) => void;
  stopChanneling: (characterId: string) => void;
  reportPsychicFailure: (characterId: string, failureLevel: number) => void;
  buyKiAbility: (characterId: string, abilityId: string) => void;
  activateKiAbility: (characterId: string, abilityId: string) => void;
  deactivateKiAbility: (characterId: string, abilityId: string) => void;
  toggleMagicAccumulation: (roomId: string, characterId: string) => void;
  castPersistentSpell: (roomId: string, characterId: string, spellName: string, zeonCost: number, maintenance: number) => void;
}

export const createMagicSlice: StateCreator<CombatStore, [], [], MagicSlice> = (set, get) => ({
  startChanneling: (characterId: string, spellId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:start_channeling', { campaignId, characterId, targetSpellId: spellId });
    }
  },

  stopChanneling: (characterId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:stop_channeling', { campaignId, characterId });
    }
  },

  reportPsychicFailure: (characterId: string, failureLevel: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:psychic_failure', { campaignId, characterId, failureLevel });
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

  toggleMagicAccumulation: (roomId: string, characterId: string) => {
    const { socket } = get();
    if (socket) socket.emit('combat:toggle_magic_accumulation', { roomId, characterId });
  },

  castPersistentSpell: (roomId: string, characterId: string, spellName: string, zeonCost: number, maintenance: number) => {
    const { socket } = get();
    if (socket) socket.emit('combat:cast_persistent_spell', { roomId, characterId, spellName, zeonCost, maintenance });
  }
});
