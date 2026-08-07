import { describe, it, expect } from 'vitest';
import { resolveAttack, CombatModifiers } from './combatResolution';
import { InvalidCombatInputError } from '../errors/CombatError';

const fixedRandom = (value: number) => () => value;

describe('combatResolution - resolveAttack', () => {

  it('validates input: throws on NaN or negative base damage', () => {
    expect(() => resolveAttack(NaN, 50, 100, 1, 100)).toThrow(InvalidCombatInputError);
    expect(() => resolveAttack(100, NaN, 100, 1, 100)).toThrow(InvalidCombatInputError);
    expect(() => resolveAttack(100, 50, -10, 1, 100)).toThrow(InvalidCombatInputError);
  });

  it('handles attacker fumble (rawRoll <= 3)', () => {
    const mods: CombatModifiers = { attackerRawRoll: 2 };
    const res = resolveAttack(100, 50, 50, 1, 100, 'DODGE', 0, 0, mods, fixedRandom(0.5));
    expect(res.isFumble).toBe(true);
    expect(res.fumbleTarget).toBe('attacker');
    expect(res.damage).toBe(0);
  });

  it('handles defender fumble applying penalty', () => {
    const mods: CombatModifiers = { defenderRawRoll: 3 };
    const res = resolveAttack(100, 100, 100, 0, 100, 'DODGE', 0, 0, mods, fixedRandom(0.5));
    expect(res.damage).toBe(50);
  });

  it('applies maneuver modifiers correctly', () => {
    const mods: CombatModifiers = {
      isAreaAttack: true,
      isDisarm: true,
      isFullDefense: true,
      aimedLocation: 'CABEZA'
    };
    const res = resolveAttack(200, 0, 100, 0, 100, 'DODGE', 0, 0, mods);
    expect(res.damage).toBe(0);
    expect(res.message).toMatch(/Desarme exitoso/);
  });

  it('applies environment modifiers', () => {
    const mods: CombatModifiers = { envAttackMod: -20, envDefenseMod: +10 };
    const res = resolveAttack(150, 50, 100, 0, 100, 'DODGE', 0, 0, mods);
    expect(res.damage).toBe(70);
  });

  it('calculates net damage with armor absorption', () => {
    const res = resolveAttack(150, 50, 100, 2, 1000);
    expect(res.armorAbsorbed).toBe(20);
    expect(res.damage).toBe(80);
  });

  it('triggers critical hit and maps locations', () => {
    const headRes = resolveAttack(150, 50, 100, 0, 100, 'DODGE', 0, 0, undefined, fixedRandom(0.01));
    expect(headRes.isCritical).toBe(true);
    expect(headRes.criticalLocation).toBe('CABEZA');

    const torsoRes = resolveAttack(150, 50, 100, 0, 100, 'DODGE', 0, 0, undefined, fixedRandom(0.3));
    expect(torsoRes.criticalLocation).toBe('TORSO');

    const armRes = resolveAttack(150, 50, 100, 0, 100, 'DODGE', 0, 0, undefined, fixedRandom(0.6));
    expect(armRes.criticalLocation).toBe('BRAZO');

    const legRes = resolveAttack(150, 50, 100, 0, 100, 'DODGE', 0, 0, undefined, fixedRandom(0.8));
    expect(legRes.criticalLocation).toBe('PIERNA');
  });

  it('handles edge cases: total absorption', () => {
    const res = resolveAttack(120, 100, 100, 3, 100);
    expect(res.damage).toBe(0);
    expect(res.armorAbsorbed).toBe(30);
    expect(res.message).toMatch(/la armadura absorbió todo el daño/);
  });

  it('handles edge cases: negative differential (counter attack)', () => {
    const res = resolveAttack(50, 150, 100, 0, 100);
    expect(res.damage).toBe(0);
    expect(res.counterAttackBonus).toBe(50);
  });
  
  it('verifies exact counter attack logic', () => {
    const res = resolveAttack(100, 131, 100, 0, 100);
    expect(res.counterAttackBonus).toBe(15);
  });
});
