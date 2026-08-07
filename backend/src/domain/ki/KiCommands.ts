import { Character } from '../Character';
import { KiStrategyFactory } from './KiStrategies';

export interface KiAbilityDef {
  id: string;
  name: string;
  cmCost: number;
  prerequisites: string[];
  effectType: string;
  kiCostActivation: number;
  kiCostMaintenance?: number;
  description: string;
}

export interface ICommand {
  execute(): boolean;
}

export class BuyKiAbilityCommand implements ICommand {
  constructor(private character: Character, private ability: KiAbilityDef) {}

  execute(): boolean {
    // Verificar si ya la tiene
    if (this.character.kiAbilities.includes(this.ability.id)) {
      return false;
    }

    // Verificar prerequisitos
    const prereqs = Array.isArray(this.ability.prerequisites) ? this.ability.prerequisites : [];
    for (const prereq of prereqs) {
      if (!this.character.kiAbilities.includes(prereq)) {
        return false;
      }
    }
    
    // Agregamos la habilidad
    this.character.kiAbilities.push(this.ability.id);
    return true;
  }
}

export class ActivateKiAbilityCommand implements ICommand {
  constructor(private character: Character, private ability: KiAbilityDef) {}

  execute(): boolean {
    if (!this.character.kiAbilities.includes(this.ability.id)) {
      return false; // No la tiene comprada
    }

    // Verificar si ya está activa
    if (this.character.activeEffects.some(e => e.id === `ki_${this.ability.id}`)) {
      return false; // Ya está activa
    }

    // Consumir Ki
    if (this.ability.kiCostActivation > 0) {
      if (!this.character.spendKi(this.ability.kiCostActivation)) {
        return false; // Ki insuficiente
      }
    }

    // Aplicar estrategia
    const strategy = KiStrategyFactory.getStrategy(this.ability.effectType);
    strategy.apply(this.character, this.ability);
    
    return true;
  }
}

export class DeactivateKiAbilityCommand implements ICommand {
  constructor(private character: Character, private ability: KiAbilityDef) {}

  execute(): boolean {
    const strategy = KiStrategyFactory.getStrategy(this.ability.effectType);
    strategy.remove(this.character, this.ability);
    
    // Necesitamos recalcular las resistencias si era buf de TA
    // @ts-ignore
    if (typeof this.character['recalculateResistances'] === 'function') {
      this.character['recalculateResistances']();
    }
    
    return true;
  }
}
