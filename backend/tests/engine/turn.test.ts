import { processNextTurn, CharacterState } from '../../src/engine/turn';

describe('Engine: Turn Manager', () => {
  it('should decrease duration of active effects and apply regeneration', () => {
    const characters: CharacterState[] = [
      {
        id: 'char1',
        hp: 50,
        max_hp: 100,
        ki: 10,
        zeon: 20,
        activeEffects: [
          { id: 'e1', modifiers: {}, duration_rounds: 1 }
        ],
        dotes: [
          { type: 'regen', stat: 'hp', amount: 10 },
          { type: 'regen', stat: 'zeon', amount: 5 }
        ]
      }
    ];

    const result = processNextTurn(characters);

    expect(result[0].activeEffects.length).toBe(0); // Verifica expiración de efecto
    expect(result[0].hp).toBe(60); // Verifica regeneración de salud
    expect(result[0].zeon).toBe(25); // Verifica regeneración de zeon
  });

  it('hp regeneration should not exceed max_hp', () => {
    const characters: CharacterState[] = [
      {
        id: 'char1',
        hp: 95,
        max_hp: 100,
        ki: 0,
        zeon: 0,
        activeEffects: [],
        dotes: [
          { type: 'regen', stat: 'hp', amount: 10 }
        ]
      }
    ];

    const result = processNextTurn(characters);
    expect(result[0].hp).toBe(100);
  });
});
