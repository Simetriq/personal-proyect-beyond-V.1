export interface ActiveEffect {
  id: string;
  modifiers: any;
  duration_rounds: number;
}

export interface CharacterState {
  id: string;
  hp: number;
  max_hp: number;
  ki: number;
  zeon: number;
  activeEffects: ActiveEffect[];
  dotes?: any[]; // Array de dotes, ej. { "type": "regen", "stat": "zeon", "amount": 10 }
}

/**
 * Procesa el paso de turno (next_round_tick) para una lista de personajes.
 * Reduce la duración de efectos, elimina expirados y aplica regeneraciones.
 * @param characters Lista del estado de los personajes de la campaña
 * @returns Lista con el estado actualizado
 */
export function processNextTurn(characters: CharacterState[]): CharacterState[] {
  return characters.map(char => {
    // 1. Limpieza de efectos
    const updatedEffects = char.activeEffects
      .map(effect => ({
        ...effect,
        duration_rounds: effect.duration_rounds - 1
      }))
      .filter(effect => effect.duration_rounds > 0);

    // 2. Regeneración
    let newHp = char.hp;
    let newKi = char.ki;
    let newZeon = char.zeon;

    if (Array.isArray(char.dotes)) {
      char.dotes.forEach(dote => {
        if (dote.type === 'regen') {
          if (dote.stat === 'hp') {
            newHp = Math.min(newHp + dote.amount, char.max_hp);
          } else if (dote.stat === 'ki') {
            // Asumiremos que por ahora no controlamos max_ki, sólo sumamos
            newKi += dote.amount;
          } else if (dote.stat === 'zeon') {
            newZeon += dote.amount;
          }
        }
      });
    }

    return {
      ...char,
      hp: newHp,
      ki: newKi,
      zeon: newZeon,
      activeEffects: updatedEffects
    };
  });
}
