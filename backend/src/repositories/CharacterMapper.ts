import { Character, CharacterData, ActiveEffect, Item } from '../domain/Character';

/**
 * Represents the flat structure returned by Prisma for persistence.
 * This interface documents exactly what fields go to/from the database.
 */
export interface PrismaCharacterData {
  hp: number;
  gold: number;
  ki: number;
  zeon: number;
  dotes: ActiveEffect[];
  kiAbilities: string[];
  baseResistances: {
    FIL: number;
    CON: number;
    PEN: number;
    CAL: number;
    ELE: number;
    FRI: number;
    ENE: number;
  };
  isBleeding: boolean;
  bleedingDamage: number;
  currentFatigue: number;
  maxFatigue: number;
  isChanneling: boolean;
  channeledZeon: number;
  targetSpellId: string | null;
  reloadTurnsLeft: number;
  martialStyles: string[];
  level: number;
  category: string;
  totalDP: number;
  spentDP: number;
  dpDistribution: string;
  strength: number;
  dexterity: number;
  agility: number;
  constitution: number;
  intelligence: number;
  power: number;
  willpower: number;
  perception: number;
  appearance: number;
  size: number;
  nephilimType: string | null;
  hasInhumanity: boolean;
  hasZen: boolean;
  isDead: boolean;
}

/**
 * Maps between Prisma database records and domain Character objects.
 * Keeps the domain layer clean of infrastructure concerns.
 *
 * This is the ONLY place where Prisma data shapes are converted
 * to/from the domain model.
 */
export class CharacterMapper {
  /**
   * Converts a raw database record (from Prisma) into a domain Character.
   * Handles JSON parsing of serialized fields and inventory hydration.
   */
  static toDomain(prismaRecord: Record<string, unknown>): Character {
    return new Character(prismaRecord as unknown as CharacterData);
  }

  /**
   * Converts a domain Character into a flat object suitable for Prisma update.
   * Serializes complex fields (resistances, effects, abilities) as needed.
   */
  static toPrisma(character: Character): PrismaCharacterData {
    return {
      hp: character.currentHp,
      gold: character.gold,
      ki: character.ki,
      zeon: character.zeon,
      dotes: character.activeEffects,
      kiAbilities: character.kiAbilities,
      baseResistances: {
        FIL: character.baseResistances.FIL,
        CON: character.baseResistances.CON,
        PEN: character.baseResistances.PEN,
        CAL: character.baseResistances.CAL,
        ELE: character.baseResistances.ELE,
        FRI: character.baseResistances.FRI,
        ENE: character.baseResistances.ENE,
      },
      isBleeding: character.isBleeding,
      bleedingDamage: character.bleedingDamage,
      currentFatigue: character.currentFatigue,
      maxFatigue: character.maxFatigue,
      isChanneling: character.isChanneling,
      channeledZeon: character.channeledZeon,
      targetSpellId: character.targetSpellId,
      reloadTurnsLeft: character.reloadTurnsLeft,
      martialStyles: character.martialStyles,
      level: character.level,
      category: character.category,
      totalDP: character.totalDP,
      spentDP: character.spentDP,
      dpDistribution: character.dpDistribution,
      strength: character.strength,
      dexterity: character.dexterity,
      agility: character.agility,
      constitution: character.constitution,
      intelligence: character.intelligence,
      power: character.power,
      willpower: character.willpower,
      perception: character.perception,
      appearance: character.appearance,
      size: character.getSize(),
      nephilimType: character.nephilimType,
      hasInhumanity: character.hasInhumanity,
      hasZen: character.hasZen,
      isDead: character.isDead,
    };
  }
}
