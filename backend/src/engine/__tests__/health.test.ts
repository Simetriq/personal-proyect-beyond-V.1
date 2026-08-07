import { describe, it, expect } from 'vitest';
import { isTrueDeath, isAgony, evaluateDeathState } from '../health';
import { Character, CharacterData } from '../../domain/Character';

/** Helper to create a minimal character for testing */
function makeCharacter(overrides: Partial<CharacterData> = {}): Character {
  return new Character({
    id: 'test-char',
    name: 'Test Character',
    max_hp: 100,
    hp: 100,
    gold: 0,
    constitution: 10,
    ...overrides,
  });
}

describe('health — isTrueDeath', () => {
  it('returns false when HP is above 0', () => {
    expect(isTrueDeath(50, 10)).toBe(false);
  });

  it('returns false when HP is at 0 (unconscious, not dead)', () => {
    expect(isTrueDeath(0, 10)).toBe(false);
  });

  it('returns false when HP is negative but above death threshold', () => {
    // threshold = constitution * -5 = -50
    expect(isTrueDeath(-30, 10)).toBe(false);
  });

  it('returns true when HP equals the death threshold', () => {
    // threshold = -50
    expect(isTrueDeath(-50, 10)).toBe(true);
  });

  it('returns true when HP is below the death threshold', () => {
    expect(isTrueDeath(-100, 10)).toBe(true);
  });

  it('handles constitution of 1 (threshold = -5)', () => {
    expect(isTrueDeath(-5, 1)).toBe(true);
    expect(isTrueDeath(-4, 1)).toBe(false);
  });
});

describe('health — isAgony', () => {
  it('returns false when HP is positive', () => {
    expect(isAgony(50, 10)).toBe(false);
  });

  it('returns false when HP is exactly 0', () => {
    expect(isAgony(0, 10)).toBe(false);
  });

  it('returns true when HP is between 0 and death threshold', () => {
    // -1 to -49 with constitution 10
    expect(isAgony(-1, 10)).toBe(true);
    expect(isAgony(-49, 10)).toBe(true);
  });

  it('returns false when HP reaches death threshold (true death, not agony)', () => {
    expect(isAgony(-50, 10)).toBe(false);
  });
});

describe('health — evaluateDeathState', () => {
  it('sets state to MUERTO when HP reaches death threshold', () => {
    const char = makeCharacter({ hp: -50, constitution: 10 });
    evaluateDeathState(char);
    expect(char.state).toBe('MUERTO');
    expect(char.isDead).toBe(true);
  });

  it('sets state to INCONSCIENTE when HP is in agony range', () => {
    const char = makeCharacter({ hp: -20, constitution: 10 });
    evaluateDeathState(char);
    expect(char.state).toBe('INCONSCIENTE');
  });

  it('does not change state when HP is above 0', () => {
    const char = makeCharacter({ hp: 50 });
    char.state = 'ACTIVO';
    evaluateDeathState(char);
    // evaluateDeathState only sets MUERTO or INCONSCIENTE, doesn't set ACTIVO
    expect(char.state).toBe('ACTIVO');
  });

  it('handles extreme negative HP (far below death threshold)', () => {
    const char = makeCharacter({ hp: -999, constitution: 5 });
    evaluateDeathState(char);
    expect(char.state).toBe('MUERTO');
    expect(char.isDead).toBe(true);
  });
});
