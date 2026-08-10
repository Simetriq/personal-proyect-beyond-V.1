export interface EffectModifier {
  target: 'attack' | 'defense' | 'initiative' | 'hp' | 'damage';
  operation: 'add' | 'multiply' | 'tick';
  value: number;
}

export interface EffectDefinition {
  id: string;
  name: string;
  description: string;
  modifiers: EffectModifier[];
}

export interface AppliedEffect extends EffectDefinition {
  durationRounds: number;
  sourceId?: string; // e.g., the caster or the item
}
export interface CombatantTurn {
  combatantId: string;
  name: string;
  initiativeTotal: number;
  isNPC: boolean;
  hasActed: boolean;
  accumulatingTurns: number;
}

export interface MagicData {
  currentZeon: number;
  maxZeon: number;
  accumulatedZeon: number;
  magicAccumulation: number;
  isAccumulating: boolean;
}

export interface PersistentSpell {
  id: string;
  name: string;
  casterId: string;
  zeonMaintenance: number;
  description: string;
  globalModifiers: {
    attackMod?: number;
    defenseMod?: number;
    magicResistance?: number;
  };
}

export interface TurnTracker {
  isActive: boolean;
  currentRound: number;
  currentTurnIndex: number;
  order: CombatantTurn[];
}
