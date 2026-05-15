export interface Alert {
  type: string;
  message: string;
}

/**
 * Evalúa los triggers del personaje (actualmente umbral de salud < 30%)
 * y retorna las alertas generadas.
 * @param currentHp Vida actual
 * @param maxHp Vida máxima
 * @returns Array de alertas
 */
export function checkTriggers(currentHp: number, maxHp: number): Alert[] {
  const alerts: Alert[] = [];

  if (maxHp <= 0) return alerts;

  const hpPercentage = currentHp / maxHp;

  if (hpPercentage < 0.3) {
    alerts.push({
      type: 'HEALTH_CRITICAL',
      message: '¡Salud Crítica! Revisa tus dotes de supervivencia'
    });
  }

  return alerts;
}
