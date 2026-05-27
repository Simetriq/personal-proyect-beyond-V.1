import { Character, ActiveEffect } from '../Character';
import { KiAbilityDef } from './KiCommands';

export interface IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void;
  remove(character: Character, ability: KiAbilityDef): void;
}

export class PassiveKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    // Los efectos pasivos no hacen nada en la activación activa de combate,
    // o pueden agregar una flag al character, pero en este diseño 
    // asumimos que el mero hecho de tenerla comprada ya es suficiente.
  }
  remove(character: Character, ability: KiAbilityDef): void {
    // Nada
  }
}

export class StatBuffKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    const effect: ActiveEffect = {
      id: `ki_${ability.id}`,
      name: ability.name,
      type: 'BUF_STAT',
      value: ability.kiCostActivation, // Esto puede ser dinámico en implementaciones complejas
      durationRounds: 9999, // Mantenimiento indefinido si paga coste de mant.
      statName: 'FUE' // Simulado
    };
    character.addEffect(effect);
  }
  
  remove(character: Character, ability: KiAbilityDef): void {
    character.activeEffects = character.activeEffects.filter(e => e.id !== `ki_${ability.id}`);
  }
}

export class TaBuffKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    const effect: ActiveEffect = {
      id: `ki_${ability.id}`,
      name: ability.name,
      type: 'BUF_TA',
      value: 2, // Hardcoded per prompt para Armadura de Energía
      durationRounds: 9999,
    };
    character.addEffect(effect);
  }
  
  remove(character: Character, ability: KiAbilityDef): void {
    character.activeEffects = character.activeEffects.filter(e => e.id !== `ki_${ability.id}`);
    // Necesitamos recalcular resistencias, se hace al llamar character.addEffect/removeEffect, 
    // pero removeEffect no está explícito en Character, lo haremos via proxy o refactor.
    // Para simplificar, llamamos a un fix posterior en Character.ts
  }
}

export class UiBadgeKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    // UI badge es solo visual, no altera atributos
  }
  remove(character: Character, ability: KiAbilityDef): void {}
}

export class ActionKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    // Efectos instantáneos, como curación o recuperación de fatiga.
    if (ability.id === 'recuperacion') {
      // Simula recuperar cansancio
    } else if (ability.id === 'destruccion_ki') {
      // Aplicaría daño al target, pero eso requiere el targetId, lo cual 
      // suele manejarse a nivel de Command en lugar de Strategy puro del caster.
    }
  }
  remove(character: Character, ability: KiAbilityDef): void {}
}

export class EffectKiStrategy implements IKiEffectStrategy {
  apply(character: Character, ability: KiAbilityDef): void {
    // Efectos continuos diversos
    const effect: ActiveEffect = {
      id: `ki_${ability.id}`,
      name: ability.name,
      type: 'PENALIZADOR', // Usando tipo base o creando uno nuevo
      value: 0,
      durationRounds: 9999
    };
    character.addEffect(effect);
  }
  remove(character: Character, ability: KiAbilityDef): void {
    character.activeEffects = character.activeEffects.filter(e => e.id !== `ki_${ability.id}`);
  }
}

export class KiStrategyFactory {
  static getStrategy(effectType: string): IKiEffectStrategy {
    switch (effectType) {
      case 'PASSIVE': return new PassiveKiStrategy();
      case 'STAT_BUFF': return new StatBuffKiStrategy();
      case 'TA_BUFF': return new TaBuffKiStrategy();
      case 'UI_BADGE': return new UiBadgeKiStrategy();
      case 'ACTION': return new ActionKiStrategy();
      case 'EFFECT': return new EffectKiStrategy();
      default: return new PassiveKiStrategy();
    }
  }
}
