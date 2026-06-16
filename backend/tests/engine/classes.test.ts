import { validateDPSpend, DpDistribution } from '../../src/engine/leveling';

describe('Engine: Leveling and DP Validation', () => {
  const emptyDp: DpDistribution = {
    attack: 0, block: 0, dodge: 0, hp: 0, initiative: 0,
    zeon: 0, magicProjection: 0,
    athletics: 0, social: 0, subterfuge: 0
  };

  it('should allow valid spend for Guerrero (High Combat)', () => {
    // Guerrero has 60% limit in combat (360 DP max out of 600)
    const newSpend: Partial<DpDistribution> = {
      attack: 150,
      block: 150, // Total combat: 300 (Legal)
      athletics: 50
    };

    const result = validateDPSpend('Guerrero', emptyDp, newSpend, 600);
    expect(result.valid).toBe(true);
    expect(result.newSpentDP).toBe(350);
  });

  it('should reject Guerrero exceeding combat limit', () => {
    // 60% of 600 = 360
    const newSpend: Partial<DpDistribution> = {
      attack: 200,
      block: 200 // Total combat: 400 (Illegal)
    };

    const result = validateDPSpend('Guerrero', emptyDp, newSpend, 600);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Límite de Combate excedido/);
  });

  it('should allow valid spend for Hechicero (High Magic)', () => {
    // Hechicero has 60% limit in magic (360 DP out of 600)
    const newSpend: Partial<DpDistribution> = {
      zeon: 200,
      magicProjection: 100 // Total magic: 300 (Legal)
    };

    const result = validateDPSpend('Hechicero', emptyDp, newSpend, 600);
    expect(result.valid).toBe(true);
    expect(result.newSpentDP).toBe(300);
  });

  it('should reject Hechicero exceeding combat limit', () => {
    // Hechicero has 50% limit in combat (300 DP max out of 600)
    const newSpend: Partial<DpDistribution> = {
      attack: 350 // Illegal
    };

    const result = validateDPSpend('Hechicero', emptyDp, newSpend, 600);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Límite de Combate excedido/);
  });

  it('should reject spending more than total DP', () => {
    const newSpend: Partial<DpDistribution> = {
      attack: 400,
      athletics: 300 // Total 700 (Illegal out of 600)
    };

    const result = validateDPSpend('Freelancer', emptyDp, newSpend, 600);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Gasto excede el Total PD/);
  });
});
