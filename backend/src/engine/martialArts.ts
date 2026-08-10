import type { MartialStyleDef, StyleBonuses, KnownStyle, ActiveStyle } from '../domain/martialArts/MartialStyleTypes';
import { createEmptyBonuses } from '../domain/martialArts/MartialStyleTypes';

/**
 * Static registry of all Martial Styles in Anima: Beyond Fantasy.
 * These are game-defined constants — not player-created.
 */
export const MARTIAL_STYLES_REGISTRY: Record<string, MartialStyleDef> = {
  'AIKIDO': {
    id: 'AIKIDO', name: 'Aikido',
    description: 'Estilo defensivo que redirige la fuerza del oponente.',
    bonuses: { attackBonus: 0, defenseBonus: 10, damageBonus: 10, initiativeBonus: 0, dodgeBonus: 10, freeManeuvers: ['PRESA', 'DERRIBO'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'BOXEO': {
    id: 'BOXEO', name: 'Boxeo',
    description: 'Combate cuerpo a cuerpo centrado en golpes de puño.',
    bonuses: { attackBonus: 10, defenseBonus: 10, damageBonus: 20, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'CAPOEIRA': {
    id: 'CAPOEIRA', name: 'Capoeira',
    description: 'Arte marcial acrobática que combina patadas y esquivas.',
    bonuses: { attackBonus: 10, defenseBonus: 10, damageBonus: 20, initiativeBonus: 5, dodgeBonus: 10, freeManeuvers: ['ATAQUE_AREA'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'DUMOG': {
    id: 'DUMOG', name: 'Dumog',
    description: 'Lucha de agarre filipina centrada en control.',
    bonuses: { attackBonus: 0, defenseBonus: 0, damageBonus: 10, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: ['PRESA', 'DESARME'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'EMPUJE': {
    id: 'EMPUJE', name: 'Empuje',
    description: 'Estilo básico sin arte formal.',
    bonuses: { attackBonus: 0, defenseBonus: 0, damageBonus: 10, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'KEMPO': {
    id: 'KEMPO', name: 'Kempo',
    description: 'Arte marcial japonesa equilibrada.',
    bonuses: { attackBonus: 10, defenseBonus: 10, damageBonus: 20, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'KUNG_FU': {
    id: 'KUNG_FU', name: 'Kung Fu',
    description: 'Arte marcial china versátil con múltiples sub-estilos.',
    bonuses: { attackBonus: 10, defenseBonus: 10, damageBonus: 15, initiativeBonus: 5, dodgeBonus: 5, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'LUCHA_LIBRE': {
    id: 'LUCHA_LIBRE', name: 'Lucha Libre',
    description: 'Estilo espectacular centrado en presas y llaves.',
    bonuses: { attackBonus: 0, defenseBonus: 0, damageBonus: 20, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: ['PRESA'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'MELKAIA': {
    id: 'MELKAIA', name: 'Melkaia',
    description: 'Arte marcial Sylvain de desarme y control.',
    bonuses: { attackBonus: 0, defenseBonus: 0, damageBonus: 10, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: ['DESARME', 'PRESA'] },
    requiredLevel: 2, switchPenalty: 10,
  },
  'MUAY_THAI': {
    id: 'MUAY_THAI', name: 'Muay Thai',
    description: 'Arte marcial tailandesa de alto impacto.',
    bonuses: { attackBonus: 10, defenseBonus: 0, damageBonus: 25, initiativeBonus: 5, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'PANCRACIO': {
    id: 'PANCRACIO', name: 'Pancracio',
    description: 'Antiguo combate griego sin restricciones.',
    bonuses: { attackBonus: 0, defenseBonus: 0, damageBonus: 20, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: ['PRESA', 'DERRIBO'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'SAMBO': {
    id: 'SAMBO', name: 'Sambo',
    description: 'Sistema de defensa personal soviético.',
    bonuses: { attackBonus: 0, defenseBonus: 10, damageBonus: 15, initiativeBonus: 0, dodgeBonus: 5, freeManeuvers: ['PRESA', 'DERRIBO'] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'SHOTOKAN': {
    id: 'SHOTOKAN', name: 'Shotokan',
    description: 'Karate tradicional con golpes rectos potentes.',
    bonuses: { attackBonus: 10, defenseBonus: 0, damageBonus: 20, initiativeBonus: 0, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'TAE_KWON_DO': {
    id: 'TAE_KWON_DO', name: 'Tae Kwon Do',
    description: 'Arte marcial coreana con énfasis en patadas.',
    bonuses: { attackBonus: 10, defenseBonus: 10, damageBonus: 20, initiativeBonus: 5, dodgeBonus: 0, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
  'TAI_CHI': {
    id: 'TAI_CHI', name: 'Tai Chi',
    description: 'Arte marcial interna china de movimientos suaves.',
    bonuses: { attackBonus: 0, defenseBonus: 10, damageBonus: 10, initiativeBonus: 0, dodgeBonus: 10, freeManeuvers: [] },
    requiredLevel: 1, switchPenalty: 0,
  },
};

/**
 * Calculates the combined bonuses from all active martial styles.
 * Accepts the new KnownStyle[] format (from CharacterMartialStyle).
 * @param knownStyles The styles the character knows (with isActive flag)
 * @returns Combined StyleBonuses from all active styles
 */
export function calculateCombinedStyle(knownStyles: KnownStyle[] | string[]): {
  damage: number;
  attackBonus: number;
  defenseBonus: number;
  freeManeuvers: string[];
} {
  let damage = 10; // Default unarmed damage
  let attackBonus = 0;
  let defenseBonus = 0;
  const freeManeuvers: Set<string> = new Set();

  // Support both old string[] format and new KnownStyle[] format
  const styleIds: string[] = [];
  for (const entry of knownStyles) {
    if (typeof entry === 'string') {
      styleIds.push(entry);
    } else {
      if (entry.isActive) {
        styleIds.push(entry.styleId);
      }
    }
  }

  for (const styleId of styleIds) {
    const style = MARTIAL_STYLES_REGISTRY[styleId];
    if (style) {
      if (style.bonuses.damageBonus > damage) damage = style.bonuses.damageBonus;
      attackBonus += style.bonuses.attackBonus;
      defenseBonus += style.bonuses.defenseBonus;
      style.bonuses.freeManeuvers.forEach(m => freeManeuvers.add(m));
    }
  }

  // Maximum intrinsic bonus from martial arts combined is +50
  if (attackBonus > 50) attackBonus = 50;
  if (defenseBonus > 50) defenseBonus = 50;

  return {
    damage,
    attackBonus,
    defenseBonus,
    freeManeuvers: Array.from(freeManeuvers),
  };
}

/**
 * Resolves the full ActiveStyle from a style ID.
 */
export function resolveActiveStyle(styleId: string): ActiveStyle | null {
  const def = MARTIAL_STYLES_REGISTRY[styleId];
  if (!def) return null;
  return {
    styleId: def.id,
    name: def.name,
    bonuses: { ...def.bonuses },
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
