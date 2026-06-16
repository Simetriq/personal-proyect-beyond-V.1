export type AlteredState = 
  | 'blindness' 
  | 'paralysis' 
  | 'surprise' 
  | 'fatigue'
  | 'critical_head'
  | 'critical_torso'
  | 'critical_arm'
  | 'critical_leg'
  | 'fumble_minor'
  | 'fumble_major';

export interface StateModifier {
  name: string;
  initMod: number;
  attackMod: number;
  defenseMod: number;
}

export const STATE_MODIFIERS: Record<AlteredState, StateModifier> = {
  blindness: { name: 'Ceguera', initMod: -30, attackMod: -100, defenseMod: -80 },
  paralysis: { name: 'Parálisis', initMod: -100, attackMod: -200, defenseMod: -200 },
  surprise: { name: 'Sorpresa', initMod: -20, attackMod: 0, defenseMod: -30 },
  fatigue: { name: 'Fatiga Grave', initMod: -10, attackMod: -20, defenseMod: -20 },
  critical_head: { name: 'Trauma Craneal', initMod: -50, attackMod: -50, defenseMod: -50 },
  critical_torso: { name: 'Hemorragia Interna', initMod: -20, attackMod: -30, defenseMod: -30 },
  critical_arm: { name: 'Brazo Mutilado', initMod: 0, attackMod: -60, defenseMod: -30 },
  critical_leg: { name: 'Pierna Mutilada', initMod: -60, attackMod: -10, defenseMod: -50 },
  fumble_minor: { name: 'Tropiezo (Pifia Menor)', initMod: -30, attackMod: -10, defenseMod: -10 },
  fumble_major: { name: 'Desastre (Pifia Mayor)', initMod: -80, attackMod: -50, defenseMod: -50 },
};

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
