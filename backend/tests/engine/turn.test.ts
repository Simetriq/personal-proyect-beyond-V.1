import { processNextTurn, CharacterState } from '../../src/engine/turn';

describe('Engine: Turn', () => {
  it('should decrease duration of active effects and remove expired ones', () => {
    const characters: CharacterState[] = [
      {
        id: 'char1',
        activeEffects: [
          { id: 'effect1', modifiers: { stat: 'atk', value: -10 }, duration_rounds: 2 },
          { id: 'effect2', modifiers: { stat: 'def', value: -20 }, duration_rounds: 1 }
        ]
      },
      {
        id: 'char2',
        activeEffects: [
          { id: 'effect3', modifiers: { stat: 'atk', value: 10 }, duration_rounds: 5 }
        ]
      }
    ];

    const result = processNextTurn(characters);

    // Char 1: effect1 duration becomes 1. effect2 duration becomes 0 (removed).
    expect(result[0].activeEffects.length).toBe(1);
    expect(result[0].activeEffects[0].id).toBe('effect1');
    expect(result[0].activeEffects[0].duration_rounds).toBe(1);

    // Char 2: effect3 duration becomes 4.
    expect(result[1].activeEffects.length).toBe(1);
    expect(result[1].activeEffects[0].id).toBe('effect3');
    expect(result[1].activeEffects[0].duration_rounds).toBe(4);
  });
});
