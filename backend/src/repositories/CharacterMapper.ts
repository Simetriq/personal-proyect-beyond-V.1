import { Character, CharacterData } from '../domain/Character';

/**
 * Maps between Prisma database records and domain Character objects.
 * Keeps the domain layer clean of infrastructure concerns.
 */
export class CharacterMapper {
  /**
   * Converts a Prisma character record to a domain Character instance.
   */
  static toDomain(prismaRecord: Record<string, unknown>): Character {
    return new Character(prismaRecord as unknown as CharacterData);
  }

  /**
   * Converts a domain Character to a Prisma-compatible data object for persistence.
   */
  static toPrisma(character: Character): Record<string, unknown> {
    return {
      hp: character.currentHp,
      gold: character.gold,
      ki: character.ki,
      zeon: character.zeon,
      dotes: character.activeEffects,
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
      isDead: character.isDead
    };
  }
}
