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
  dotes?: any[];
}

// Procesa el paso de turno aplicando regeneraciones y acortando efectos
export function processNextTurn(characters: CharacterState[]): CharacterState[] {
  return characters.map(char => {
    const updatedEffects = char.activeEffects
      .map(effect => ({
        ...effect,
        duration_rounds: effect.duration_rounds - 1
      }))
      .filter(effect => effect.duration_rounds > 0);

    let newHp = char.hp;
    let newKi = char.ki;
    let newZeon = char.zeon;

    if (Array.isArray(char.dotes)) {
      char.dotes.forEach(dote => {
        if (dote.type === 'regen') {
          if (dote.stat === 'hp') {
            newHp = Math.min(newHp + dote.amount, char.max_hp);
          } else if (dote.stat === 'ki') {
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
