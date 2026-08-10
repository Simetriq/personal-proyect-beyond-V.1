import type { StateCreator } from 'zustand';
import type { CombatStore, AppliedEffect } from '../types';

export interface EffectSlice {
  applyCustomEffect: (characterId: string, effect: Partial<AppliedEffect>) => void;
  removeEffect: (characterId: string, effectId: string) => void;
}

export const createEffectSlice: StateCreator<CombatStore, [], [], EffectSlice> = (set, get) => ({

  applyCustomEffect: (characterId, effect) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('apply_custom_effect', { campaignId, characterId, effect });
    }
  },

  removeEffect: (characterId, effectId) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('remove_custom_effect', { campaignId, characterId, effectId });
    }
  }
});
