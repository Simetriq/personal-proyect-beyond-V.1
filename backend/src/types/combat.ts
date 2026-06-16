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
