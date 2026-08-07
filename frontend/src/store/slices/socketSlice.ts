import { StateCreator } from 'zustand';
import { io } from 'socket.io-client';
import { CombatStore, DiceRoll, CombatState, CombatLogEntry, Character } from '../types';
import { TurnTracker } from '../../../backend/src/types/combat';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

export interface SocketSlice {
  connectToCampaign: (campaignId: string) => void;
}

export const createSocketSlice: StateCreator<CombatStore, [], [], SocketSlice> = (set, get) => ({
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

    socket.on('attack_resolved', (data: Record<string, unknown>) => {
      console.log('Ataque resuelto', data);
      set({ incomingAttack: null });
    });

    socket.on('dice_rolled', (roll: DiceRoll) => {
      set((state) => ({
        diceRolls: [roll, ...state.diceRolls].slice(0, 50)
      }));
    });

    socket.on('character_updated', (data: Record<string, unknown>) => {
      console.log('Personaje actualizado:', data);
      set((state) => ({
        characters: {
          ...state.characters,
          [data.characterId as string]: {
            ...state.characters[data.characterId as string],
            id: data.characterId as string,
            name: (data.name as string) || state.characters[data.characterId as string]?.name || 'Unknown',
            hp: data.hp as number,
            maxHp: (data.maxHp as number) || state.characters[data.characterId as string]?.maxHp || 0,
            gold: data.gold !== undefined ? (data.gold as number) : state.characters[data.characterId as string]?.gold,
            resistances: (data.resistances as Record<string, number>) || state.characters[data.characterId as string]?.resistances || {},
            inventory: (data.inventory as Record<string, unknown>) || state.characters[data.characterId as string]?.inventory || {},
            activeEffects: (data.activeEffects as Record<string, unknown>[]) || [],
            ki: data.ki !== undefined ? (data.ki as number) : state.characters[data.characterId as string]?.ki,
            zeon: data.zeon !== undefined ? (data.zeon as number) : state.characters[data.characterId as string]?.zeon,
            temporaryShield: data.temporaryShield !== undefined ? (data.temporaryShield as number) : state.characters[data.characterId as string]?.temporaryShield,
            currentInitiative: data.currentInitiative !== undefined ? (data.currentInitiative as number) : state.characters[data.characterId as string]?.currentInitiative,
            kiAbilities: (data.kiAbilities as string[]) || state.characters[data.characterId as string]?.kiAbilities || [],
            state: data.state as Character['state'],
            currentFatigue: data.currentFatigue !== undefined ? (data.currentFatigue as number) : state.characters[data.characterId as string]?.currentFatigue,
            maxFatigue: data.maxFatigue !== undefined ? (data.maxFatigue as number) : state.characters[data.characterId as string]?.maxFatigue,
            isBleeding: data.isBleeding !== undefined ? (data.isBleeding as boolean) : state.characters[data.characterId as string]?.isBleeding,
            bleedingDamage: data.bleedingDamage !== undefined ? (data.bleedingDamage as number) : state.characters[data.characterId as string]?.bleedingDamage,
            isChanneling: data.isChanneling !== undefined ? (data.isChanneling as boolean) : state.characters[data.characterId as string]?.isChanneling,
            channeledZeon: data.channeledZeon !== undefined ? (data.channeledZeon as number) : state.characters[data.characterId as string]?.channeledZeon,
            targetSpellId: data.targetSpellId !== undefined ? (data.targetSpellId as string) : state.characters[data.characterId as string]?.targetSpellId
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

    socket.on('combat:weapon_shattered', (data: { characterId: string, weaponName: string }) => {
      set({ weaponShatteredEvent: data });
    });

    socket.on('combat:critical_hit', (data: { defenderId: string; level: number; location: string; instantKill: boolean }) => {
      set({ criticalHitEvent: data });
    });

    socket.on('combat:fumble_occurred', (data: { characterId: string; level: number; type: string }) => {
      set({ fumbleEvent: data });
    });

    socket.on('combat:room_spells_updated', (data: Record<string, unknown>[]) => {
      set({ persistentSpells: data });
    });

    socket.on('combat:bleeding_applied', (data: { defenderId: string }) => {
      console.log(`El personaje ${data.defenderId} está sangrando.`);
    });

    socket.on('combat:fatigue_spent', (data: { characterId: string, amount: number, bonus: number }) => {
      console.log(`El personaje ${data.characterId} gastó ${data.amount} cansancio. (Bono: +${data.bonus})`);
    });

    socket.on('combat:counter_confirmed', (data: { defenderId: string }) => {
      if (get().myCharacterId === data.defenderId) {
        set({ pendingCounterOpportunity: null });
      }
      console.log(`¡Contraataque de ${data.defenderId} confirmado!`);
    });

    socket.on('gm:update_player_draft', (draft: Record<string, unknown>) => {
      set((state) => ({
        progressionDrafts: {
          ...state.progressionDrafts,
          [draft.playerId as string]: draft
        }
      }));
    });

    socket.on('gm:remove_player_draft', (playerId: string) => {
      set((state) => {
        const newDrafts = { ...state.progressionDrafts };
        delete newDrafts[playerId];
        return { progressionDrafts: newDrafts };
      });
    });

    socket.on('player:dp_received', (data: { amount: number; newTotalDP: number, availableDP: number }) => {
      set((state) => {
        const myCharId = state.myCharacterId;
        if (!myCharId || !state.characters[myCharId]) return state;
        console.log(`[VTT] Has recibido ${data.amount} PD del Director de Juego.`);
        return {
          characters: {
            ...state.characters,
            [myCharId]: {
              ...state.characters[myCharId],
              totalDP: data.newTotalDP
            }
          }
        };
      });
    });

    socket.on('combat:defend_requested', (data: { combatInstanceId: string; attackerName: string; attackRoll: number }) => {
      set({ incomingAttack: data });
    });

    socket.on('combat:new_log', (log: CombatLogEntry) => {
      get().addLog(log);
    });

    socket.on('combat:turn_order_updated', (tracker: TurnTracker) => {
      get().setTurnTracker(tracker);
    });

    socket.on('combat:new_round_started', (tracker: TurnTracker) => {
      get().setTurnTracker(tracker);
    });

    set({ socket, campaignId });
  }
});
