import { checkTriggers } from '../../src/engine/alerts';

describe('Engine: Alerts', () => {
  it('should not trigger alert if hp is above 30%', () => {
    const alerts = checkTriggers(50, 100);
    expect(alerts.length).toBe(0);
  });

  it('should trigger alert if hp is strictly below 30%', () => {
    const alerts = checkTriggers(29, 100);
    expect(alerts.length).toBe(1);
    expect(alerts[0]!.type).toBe('HEALTH_CRITICAL');
    expect(alerts[0]!.message).toBe('¡Salud Crítica! Revisa tus dotes de supervivencia');
  });

  it('should not trigger if maxHp is 0', () => {
    const alerts = checkTriggers(0, 0);
    expect(alerts.length).toBe(0);
  });
});
