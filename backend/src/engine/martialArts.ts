export interface MartialStyle {
  id: string;
  name: string;
  attackBonus: number;
  defenseBonus: number;
  baseDamage: number;
  freeManeuvers: string[]; // Maneuvers that don't have penalty with this style
}

export const MARTIAL_STYLES_REGISTRY: Record<string, MartialStyle> = {
  'AIKIDO': { id: 'AIKIDO', name: 'Aikido', attackBonus: 0, defenseBonus: 10, baseDamage: 10, freeManeuvers: ['PRESA', 'DERRIBO'] },
  'BOXEO': { id: 'BOXEO', name: 'Boxeo', attackBonus: 10, defenseBonus: 10, baseDamage: 20, freeManeuvers: [] },
  'CAPOEIRA': { id: 'CAPOEIRA', name: 'Capoeira', attackBonus: 10, defenseBonus: 10, baseDamage: 20, freeManeuvers: ['ATAQUE_AREA'] },
  'DUMOG': { id: 'DUMOG', name: 'Dumog', attackBonus: 0, defenseBonus: 0, baseDamage: 10, freeManeuvers: ['PRESA', 'DESARME'] },
  'EMPUJE': { id: 'EMPUJE', name: 'Empuje', attackBonus: 0, defenseBonus: 0, baseDamage: 10, freeManeuvers: [] },
  'KEMPO': { id: 'KEMPO', name: 'Kempo', attackBonus: 10, defenseBonus: 10, baseDamage: 20, freeManeuvers: [] },
  'KUNG_FU': { id: 'KUNG_FU', name: 'Kung Fu', attackBonus: 10, defenseBonus: 10, baseDamage: 15, freeManeuvers: [] },
  'LUCHA_LIBRE': { id: 'LUCHA_LIBRE', name: 'Lucha Libre', attackBonus: 0, defenseBonus: 0, baseDamage: 20, freeManeuvers: ['PRESA'] },
  'MELKAIA': { id: 'MELKAIA', name: 'Melkaia', attackBonus: 0, defenseBonus: 0, baseDamage: 10, freeManeuvers: ['DESARME', 'PRESA'] },
  'MUAY_THAI': { id: 'MUAY_THAI', name: 'Muay Thai', attackBonus: 10, defenseBonus: 0, baseDamage: 25, freeManeuvers: [] },
  'PANCRACIO': { id: 'PANCRACIO', name: 'Pancracio', attackBonus: 0, defenseBonus: 0, baseDamage: 20, freeManeuvers: ['PRESA', 'DERRIBO'] },
  'SAMBO': { id: 'SAMBO', name: 'Sambo', attackBonus: 0, defenseBonus: 10, baseDamage: 15, freeManeuvers: ['PRESA', 'DERRIBO'] },
  'SHOTOKAN': { id: 'SHOTOKAN', name: 'Shotokan', attackBonus: 10, defenseBonus: 0, baseDamage: 20, freeManeuvers: [] },
  'TAE_KWON_DO': { id: 'TAE_KWON_DO', name: 'Tae Kwon Do', attackBonus: 10, defenseBonus: 10, baseDamage: 20, freeManeuvers: [] },
  'TAI_CHI': { id: 'TAI_CHI', name: 'Tai Chi', attackBonus: 0, defenseBonus: 10, baseDamage: 10, freeManeuvers: [] }
};

export function calculateCombinedStyle(equippedStylesIds: string[]): {
  damage: number;
  attackBonus: number;
  defenseBonus: number;
  freeManeuvers: string[];
} {
  let damage = 10; // Default unarmed damage
  let attackBonus = 0;
  let defenseBonus = 0;
  const freeManeuvers: Set<string> = new Set();

  for (const styleId of equippedStylesIds) {
    const style = MARTIAL_STYLES_REGISTRY[styleId];
    if (style) {
      if (style.baseDamage > damage) damage = style.baseDamage;
      attackBonus += style.attackBonus;
      defenseBonus += style.defenseBonus;
      style.freeManeuvers.forEach(m => freeManeuvers.add(m));
    }
  }

  // Maximum intrinsic bonus from martial arts combined is +50
  if (attackBonus > 50) attackBonus = 50;
  if (defenseBonus > 50) defenseBonus = 50;

  return {
    damage,
    attackBonus,
    defenseBonus,
    freeManeuvers: Array.from(freeManeuvers)
  };
}

/**
 * Validates the maximum number of martial arts a character can learn or equip based on their base attack and defense.
 * The limit is (Base Attack + Base Defense) / 40, rounded down.
 * @param attackBase The character's base attack ability (HA)
 * @param defenseBase The character's base defense ability (HD)
 * @returns The maximum number of martial styles allowed
 */
export function validateStyleLimit(attackBase: number, defenseBase: number): number {
  return Math.floor((attackBase + defenseBase) / 40);
}
