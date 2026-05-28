import { Character } from '../domain/Character';

export interface NephilimModifiers {
  bonusResistances: { RF: number; RM: number; RP: number; RE: number; RV: number };
  bonusSize: number;
  bonusFatigue: number;
  bonusRegen: number;
  bonusStrength: number;
  exPenalty: number;
  passives: string[];
}

/**
 * Returns the passive modifiers for a given Nephilim race.
 */
export function getNephilimModifiers(type: string, gender: 'M' | 'F' = 'M'): NephilimModifiers {
  const mods: NephilimModifiers = {
    bonusResistances: { RF: 0, RM: 0, RP: 0, RE: 0, RV: 0 },
    bonusSize: 0,
    bonusFatigue: 0,
    bonusRegen: 0,
    bonusStrength: 0,
    exPenalty: 0,
    passives: []
  };

  switch (type.toLowerCase()) {
    case 'sylvain':
      mods.bonusResistances = { RF: 5, RM: 10, RP: 10, RE: 20, RV: 5 };
      mods.bonusRegen = 1;
      mods.exPenalty = -4;
      mods.passives.push('Half physical needs');
      break;

    case 'jayan':
    case 'jayán':
      mods.bonusResistances.RF = 15;
      mods.bonusResistances.RM = -10;
      mods.bonusSize = 2;
      mods.bonusFatigue = 1;
      mods.bonusStrength = 1;
      mods.exPenalty = -3;
      break;

    case 'daimah':
      mods.bonusSize = -1;
      mods.exPenalty = -2;
      mods.passives.push('Ver la Esencia (RM 140 evasion)', 'Regen +3 in forests');
      break;

    case 'danjayni':
    case "d'anjayni":
      mods.exPenalty = -3;
      mods.passives.push('Olvido (RM 100)', 'Indetectability (+30 evasion)');
      break;

    case 'dukzarist':
    case "duk'zarist":
      mods.bonusResistances = { 
        RF: gender === 'M' ? 20 : 15, 
        RM: gender === 'F' ? 20 : 15, 
        RP: 15, RE: 15, RV: 15 
      };
      mods.bonusRegen = 1;
      mods.exPenalty = -5;
      mods.passives.push('Immune to malformations', 'Night Vision', 'Metal Allergy (Check presence 60/80)');
      break;
  }

  return mods;
}

/**
 * Applies the Nephilim restrictions that modify base character properties (like D'Anjayni Appearance).
 */
export function enforceNephilimRules(character: Character) {
  if (character.nephilimType?.toLowerCase().includes('anjayni')) {
    if (character.appearance < 3) character.appearance = 3;
    if (character.appearance > 7) character.appearance = 7;
  }
}
