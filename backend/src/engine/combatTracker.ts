export interface CombatantInitiativeInfo {
  characterId: string;
  baseInitiative: number; // Base (20) + DES + AGI + Categoría
  armorPenalty: number;
  weaponModifier: number; // +20 if unarmed, otherwise weapon mod
  isSurprised: boolean;
  isRanged: boolean;
}

export interface InitiativeEntry {
  characterId: string;
  roll: number;
  initiative: number; // Final Initiative
  isSurprised: boolean;
  isRanged: boolean;
}

export interface CharacterCombatState {
  isSurprised: boolean;
  isDefensive: boolean;
  hasActed: boolean;
}

export class CombatTracker {
  round: number = 1;
  turnIndex: number = -1;
  initiativeQueue: InitiativeEntry[] = [];
  isRequestingInitiative: boolean = false;
  
  // Memoria del estado de combate (A la defensiva, Sorprendido, etc.)
  characterStates: Map<string, CharacterCombatState> = new Map();

  // Gestión de contraataques (Fase 4)
  pendingCounters: Map<string, NodeJS.Timeout> = new Map();

  addPendingCounter(defenderId: string, onTimeout: () => void) {
    if (this.pendingCounters.has(defenderId)) {
      clearTimeout(this.pendingCounters.get(defenderId));
    }
    const timeout = setTimeout(() => {
      this.pendingCounters.delete(defenderId);
      onTimeout();
    }, 15000);
    this.pendingCounters.set(defenderId, timeout);
  }

  resolvePendingCounter(defenderId: string): boolean {
    if (this.pendingCounters.has(defenderId)) {
      clearTimeout(this.pendingCounters.get(defenderId));
      this.pendingCounters.delete(defenderId);
      return true;
    }
    return false;
  }

  startRound() {
    this.isRequestingInitiative = true;
    this.initiativeQueue = [];
    this.turnIndex = -1;
  }

  finalizeRound() {
    this.round += 1;
    this.startRound();
    
    // Limpiar estados temporales de asalto (Fase 5)
    for (const [id, state] of this.characterStates.entries()) {
      state.isDefensive = false;
      state.hasActed = false;
      state.isSurprised = false;
    }
  }

  /**
   * Fórmula de Turno Final:
   * Base + Bono DES + Bono AGI + Bono Categoría - Penalizador Armadura + Modificador Arma
   * Si está sorprendido: -90
   */
  calculateFinalTurn(info: CombatantInitiativeInfo, rollResult: number): number {
    let final = info.baseInitiative - info.armorPenalty + info.weaponModifier + rollResult;
    if (info.isSurprised) {
      final -= 90;
    }
    return final;
  }

  submitInitiative(info: CombatantInitiativeInfo, rollResult: number) {
    const finalInit = this.calculateFinalTurn(info, rollResult);
    
    // Update memory states
    if (!this.characterStates.has(info.characterId)) {
        this.characterStates.set(info.characterId, { 
          isSurprised: info.isSurprised, 
          isDefensive: false, 
          hasActed: false 
        });
    } else {
        const state = this.characterStates.get(info.characterId)!;
        state.isSurprised = info.isSurprised;
    }

    const entry: InitiativeEntry = {
      characterId: info.characterId,
      roll: rollResult,
      initiative: finalInit,
      isSurprised: info.isSurprised,
      isRanged: info.isRanged
    };

    const existingIndex = this.initiativeQueue.findIndex(q => q.characterId === info.characterId);
    if (existingIndex !== -1) {
      this.initiativeQueue[existingIndex] = entry;
    } else {
      this.initiativeQueue.push(entry);
    }

    // Sort Queue descending (mayor a menor)
    this.initiativeQueue.sort((a, b) => b.initiative - a.initiative);
  }

  nextTurn(): string | null {
    this.isRequestingInitiative = false;
    if (this.initiativeQueue.length === 0) return null;

    this.turnIndex++;
    if (this.turnIndex >= this.initiativeQueue.length) {
      this.turnIndex = -1; // Fin de la ronda
      return null;
    }

    return this.initiativeQueue[this.turnIndex].characterId;
  }

  getActiveCharacterId(): string | null {
    if (this.turnIndex >= 0 && this.turnIndex < this.initiativeQueue.length) {
      return this.initiativeQueue[this.turnIndex].characterId;
    }
    return null;
  }

  /**
   * Disparos Paralelos: Si la diferencia de iniciativa entre dos personajes 
   * con armas a distancia es < 25, actúan simultáneamente.
   */
  getParallelShots(): string[] {
    if (this.turnIndex < 0 || this.turnIndex >= this.initiativeQueue.length) return [];
    
    const active = this.initiativeQueue[this.turnIndex];
    if (!active.isRanged) return [active.characterId];

    const parallel: string[] = [active.characterId];

    // Revisar siguientes en la cola ordenada
    for (let i = this.turnIndex + 1; i < this.initiativeQueue.length; i++) {
        const next = this.initiativeQueue[i];
        if (next.isRanged && (active.initiative - next.initiative) < 25) {
            parallel.push(next.characterId);
        } else {
            break; 
        }
    }
    return parallel;
  }

  // To send state to the client
  getPublicState() {
    return {
      round: this.round,
      turnIndex: this.turnIndex,
      initiativeQueue: this.initiativeQueue,
      isRequestingInitiative: this.isRequestingInitiative,
      characterStates: Object.fromEntries(this.characterStates)
    };
  }
}

export const combatManagers = new Map<string, CombatTracker>();

export function getCombatTracker(campaignId: string): CombatTracker {
  if (!combatManagers.has(campaignId)) {
    combatManagers.set(campaignId, new CombatTracker());
  }
  return combatManagers.get(campaignId)!;
}
