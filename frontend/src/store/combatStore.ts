import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { TurnTracker } from '../../../backend/src/types/combat';
import { CombatLogEntry } from '../types/combatLog';

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
  // Fase 7
  reloadTurnsLeft?: number;
  martialStyles?: string[];
  activeMartialBonuses?: { damage: number; attackBonus: number; defenseBonus: number; freeManeuvers: string[] };
  // Fase 10
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
  // Fase 9: Progresión
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

export interface CombatStore {
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

  // Fase 7
  setFullDefense: (characterId: string, isFullDefense: boolean) => void;
  equipMartialStyle: (characterId: string, styleId: string) => void;
  unequipMartialStyle: (characterId: string, styleId: string) => void;

  // Fase 10
  sendProgressionDraft: (payload: Record<string, unknown>) => void;
  approveLevelUp: (playerId: string) => void;
  rejectLevelUp: (playerId: string) => void;

  // Fase 11
  declareAttack: (targetId: string, attackRoll: number, baseDamage: number, damageType: string, modifiers?: Record<string, unknown>) => void;
  submitDefense: (combatInstanceId: string, defenseType: 'BLOCK' | 'DODGE', defenseRoll: number) => void;
  clearIncomingAttack: () => void;

  // Fase 12
  logs: CombatLogEntry[];
  addLog: (log: CombatLogEntry) => void;
  clearLogs: () => void;

  // Fase 13
  turnTracker: TurnTracker | null;
  setTurnTracker: (tracker: TurnTracker) => void;

  toggleMagicAccumulation: (roomId: string, characterId: string) => void;
  castPersistentSpell: (roomId: string, characterId: string, spellName: string, zeonCost: number, maintenance: number) => void;
  executeGMCommand: (roomId: string, commandString: string) => void;
  toggleCharacterState: (roomId: string, characterId: string, state: string) => void;
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
  incomingAttack: null,
  pendingCounterOpportunity: null,
  criticalHitEvent: null,
  fumbleEvent: null,
  weaponShatteredEvent: null,
  persistentSpells: [],
  progressionDrafts: {},
  logs: [],
  turnTracker: null,

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setTurnTracker: (tracker) => set({ turnTracker: tracker }),

  setMyCharacterId: (id: string) => {
    localStorage.setItem('anima_character_id', id);
    set({ myCharacterId: id });
  },
  
  clearCriticalHit: () => set({ criticalHitEvent: null }),
  clearFumbleEvent: () => set({ fumbleEvent: null }),
  clearWeaponShattered: () => set({ weaponShatteredEvent: null }),

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
      // Podríamos mostrar un toast notification aquí
    });

    socket.on('dice_rolled', (roll: DiceRoll) => {
      set((state) => ({
        diceRolls: [roll, ...state.diceRolls].slice(0, 50) // Mantener las últimas 50 tiradas
      }));
    });

    socket.on('character_updated', (data: Record<string, unknown>) => {
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
            state: data.state as Character['state'],
            currentFatigue: data.currentFatigue !== undefined ? data.currentFatigue : state.characters[data.characterId]?.currentFatigue,
            maxFatigue: data.maxFatigue !== undefined ? data.maxFatigue : state.characters[data.characterId]?.maxFatigue,
            isBleeding: data.isBleeding !== undefined ? data.isBleeding : state.characters[data.characterId]?.isBleeding,
            bleedingDamage: data.bleedingDamage !== undefined ? data.bleedingDamage : state.characters[data.characterId]?.bleedingDamage,
            isChanneling: data.isChanneling !== undefined ? data.isChanneling : state.characters[data.characterId]?.isChanneling,
            channeledZeon: data.channeledZeon !== undefined ? data.channeledZeon : state.characters[data.characterId]?.channeledZeon,
            targetSpellId: data.targetSpellId !== undefined ? data.targetSpellId : state.characters[data.characterId]?.targetSpellId
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

    socket.on('combat:critical_hit', (data) => {
      set({ criticalHitEvent: data });
    });

    socket.on('combat:fumble_occurred', (data) => {
      set({ fumbleEvent: data });
    });

    socket.on('combat:room_spells_updated', (data) => {
      set({ persistentSpells: data });
    });

    socket.on('combat:bleeding_applied', (data: { defenderId: string }) => {
      // Opcional: mostrar notificación o simplemente dejar que la actualización del personaje maneje la UI
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

    // Fase 10: GM Progression Drafts
    socket.on('gm:update_player_draft', (draft: Record<string, unknown>) => {
      set((state) => ({
        progressionDrafts: {
          ...state.progressionDrafts,
          [draft.playerId]: draft
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
      // Si el evento nos llega, actualizamos el character en el store
      set((state) => {
        const myCharId = state.myCharacterId;
        if (!myCharId || !state.characters[myCharId]) return state;
        
        // El servidor también enviará un character_updated si está implementado el broadcsat general,
        // pero podemos actualizarlo en caliente acá:
        console.log(`[VTT] Has recibido ${data.amount} PD del Director de Juego.`);
        
        return {
          characters: {
            ...state.characters,
            [myCharId]: {
              ...state.characters[myCharId],
              // @ts-ignore - totalDP might not be explicitly typed in Character interface but it's used
              totalDP: data.newTotalDP
            }
          }
        };
      });
    });

    // Fase 11: Combate Asíncrono
    socket.on('combat:defend_requested', (data: { combatInstanceId: string; attackerName: string; attackRoll: number }) => {
      set({ incomingAttack: data });
    });

    socket.on('attack_resolved', () => {
      set({ incomingAttack: null });
    });

    // Fase 12: Logs de Combate
    socket.on('combat:new_log', (log: CombatLogEntry) => {
      get().addLog(log);
    });

    // Fase 13: Trackeo de Turnos
    socket.on('combat:turn_order_updated', (tracker: TurnTracker) => {
      get().setTurnTracker(tracker);
    });

    socket.on('combat:new_round_started', (tracker: TurnTracker) => {
      get().setTurnTracker(tracker);
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

  resolveAttack: (attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: DamageType, defenseType: 'BLOCK' | 'DODGE', modifiers?: Record<string, unknown>) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('resolve_attack', { campaignId, attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType, modifiers });
    }
  },

  spendFatigue: (characterId: string, amount: number) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:spend_fatigue', { campaignId, characterId, amount });
    }
  },

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

  createCharacter: (campaignId: string, characterId: string, data: Record<string, unknown>) => {
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

  applyEffect: (characterId: string, effect: Record<string, unknown>) => {
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
  },

  setFullDefense: (characterId: string, isFullDefense: boolean) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('combat:set_full_defense', { campaignId, characterId, isFullDefense });
    }
  },

  equipMartialStyle: (characterId: string, styleId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('equip_martial_style', { campaignId, characterId, styleId });
    }
  },

  unequipMartialStyle: (characterId: string, styleId: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('unequip_martial_style', { campaignId, characterId, styleId });
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

  declareAttack: (targetId: string, attackRoll: number, baseDamage: number, damageType: string, modifiers?: Record<string, unknown>) => {
    const { socket, campaignId, myCharacterId } = get();
    if (socket && campaignId && myCharacterId) {
      socket.emit('combat:declare_attack', {
        campaignId,
        attackerId: myCharacterId,
        targetId,
        attackRoll,
        baseDamage,
        damageType,
        modifiers
      });
    }
  },

  submitDefense: (combatInstanceId: string, defenseType: 'BLOCK' | 'DODGE', defenseRoll: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('combat:submit_defense', { combatInstanceId, defenseType, defenseRoll });
      set({ incomingAttack: null });
    }
  },

  clearIncomingAttack: () => set({ incomingAttack: null }),

  toggleMagicAccumulation: (roomId, characterId) => {
    const { socket } = get();
    if (socket) socket.emit('combat:toggle_magic_accumulation', { roomId, characterId });
  },
  castPersistentSpell: (roomId, characterId, spellName, zeonCost, maintenance) => {
    const { socket } = get();
    if (socket) socket.emit('combat:cast_persistent_spell', { roomId, characterId, spellName, zeonCost, maintenance });
  },
  executeGMCommand: (roomId, commandString) => {
    const { socket } = get();
    if (socket) socket.emit('combat:execute_gm_command', { roomId, commandString });
  },
  toggleCharacterState: (roomId, characterId, state) => {
    const { socket } = get();
    if (socket) socket.emit('combat:toggle_character_state', { roomId, characterId, state });
  }
}));
