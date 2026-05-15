import { applyDirectDamage } from '../../src/engine/combat';

describe('Engine: Direct Combat Damage', () => {
  it('should reduce damage by 10% for TA 1', () => {
    // 30 damage * (1 - 0.1) = 27
    expect(applyDirectDamage(30, 1)).toBe(27);
  });

  it('should reduce damage by 20% for TA 2', () => {
    // 30 damage * (1 - 0.2) = 24
    expect(applyDirectDamage(30, 2)).toBe(24);
  });

  it('should reduce damage by 50% for TA 5', () => {
    // 30 damage * (1 - 0.5) = 15
    expect(applyDirectDamage(30, 5)).toBe(15);
  });

  it('should reduce damage to 1 if TA is 10 or more', () => {
    // 30 damage * (1 - 1.0) = 0 -> Minimum 1
    expect(applyDirectDamage(30, 10)).toBe(1);
    expect(applyDirectDamage(30, 15)).toBe(1);
  });

  it('should return 0 if damage received is 0', () => {
    expect(applyDirectDamage(0, 5)).toBe(0);
  });
});
