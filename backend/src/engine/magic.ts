import { Character } from '../domain/Character';

/**
 * Calculates the effective combat ability (HA or HD) taking into account 
 * mystical and psychic projection tables.
 * 
 * In Anima, if a character has the "Proyección Mágica como Ataque/Defensa" feat,
 * they can substitute their physical attack/defense ability with their Magic Projection.
 * 
 * @param character The character to evaluate
 * @param baseAbility The physical base ability (HA or HD)
 * @param projectionStat The value of their Magic Projection or Psychic Projection
 * @param isDefending True if calculating defense (HD), false for attack (HA)
 * @returns The final ability score to use in combat resolution
 */
export function getEffectiveCombatAbility(
  character: Character, 
  baseAbility: number, 
  projectionStat: number, 
  isDefending: boolean
): number {
  // Check if character has the feat. 
  // We'll look for strings like "Proyección Mágica como Defensa" in their activeEffects (dotes)
  const hasMagicDefenseFeat = character.activeEffects.some(e => e.name.toLowerCase().includes('proyección mágica como defensa') || e.name.toLowerCase().includes('proyeccion magica como defensa'));
  const hasMagicAttackFeat = character.activeEffects.some(e => e.name.toLowerCase().includes('proyección mágica como ataque') || e.name.toLowerCase().includes('proyeccion magica como ataque'));

  if (isDefending && hasMagicDefenseFeat) {
    return Math.max(baseAbility, projectionStat);
  }

  if (!isDefending && hasMagicAttackFeat) {
    return Math.max(baseAbility, projectionStat);
  }

  return baseAbility;
}
