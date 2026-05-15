import { calculateInitiative } from '../../src/engine/initiative';

describe('Engine: Initiative', () => {
  it('should sum base initiative and roll correctly', () => {
    expect(calculateInitiative(50, 45)).toBe(95);
  });

  it('should include modifiers correctly', () => {
    expect(calculateInitiative(50, 45, -20)).toBe(75);
    expect(calculateInitiative(50, 45, 20)).toBe(115);
  });
});
