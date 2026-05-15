export interface ActiveEffect {
  id: string;
  modifiers: any;
  duration_rounds: number;
}

export interface CharacterState {
  id: string;
  activeEffects: ActiveEffect[];
}

/**
 * Procesa el paso del turno para una lista de personajes.
 * Reduce la duración de los efectos activos en 1 round.
 * Elimina los efectos que llegan a 0 de duración.
 * @param characters Lista de personajes de la campaña en combate
 * @returns Lista de personajes con sus efectos actualizados
 */
export function processNextTurn(characters: CharacterState[]): CharacterState[] {
  return characters.map(char => {
    // Filtramos y actualizamos los efectos
    const updatedEffects = char.activeEffects
      .map(effect => ({
        ...effect,
        duration_rounds: effect.duration_rounds - 1
      }))
      .filter(effect => effect.duration_rounds > 0);

    return {
      ...char,
      activeEffects: updatedEffects
    };
  });
}
