import { resolveAttack } from '../../src/engine/combat';

describe('Engine: Combat', () => {
  it('should calculate correct damage when margin is high enough', () => {
    // attack = 150, def = 50, TA = 2, baseDamage = 100
    // margin = 100
    // formula: 100 - (20 + 20) = 60% of 100 = 60
    const damage = resolveAttack(150, 50, 2, 100);
    expect(damage).toBe(60);
  });

  it('should return 0 damage if margin is not enough to overcome armor', () => {
    // attack = 100, def = 80, TA = 1, baseDamage = 100
    // margin = 20
    // formula: 20 - (20 + 10) = -10 => 0
    const damage = resolveAttack(100, 80, 1, 100);
    expect(damage).toBe(0);
  });

  it('should return 0 damage if defense is higher than attack', () => {
    const damage = resolveAttack(80, 100, 0, 100);
    expect(damage).toBe(0);
  });
});
