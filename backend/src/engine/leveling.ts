import { ClassesConfig, AnimaClass } from './classes';

export interface DpDistribution {
  attack: number; // Puntos gastados, no el valor de la habilidad
  block: number;
  dodge: number;
  hp: number;
  initiative: number;
  zeon: number;
  magicProjection: number;
  athletics: number;
  social: number;
  subterfuge: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  newSpentDP?: number;
}

/**
 * Valida si un gasto propuesto de PD es legal para una clase y totalDP dados.
 * @param className Nombre de la Categoría (ej. 'Guerrero')
 * @param existingDp El JSON parseado con la distribución actual
 * @param newSpend El JSON con el gasto que se quiere sumar en esta subida de nivel
 * @param totalDp PD totales del personaje
 */
export function validateDPSpend(
  className: string,
  existingDp: DpDistribution,
  newSpend: Partial<DpDistribution>,
  totalDp: number
): ValidationResult {
  
  const classConfig = ClassesConfig[className];
  if (!classConfig) {
    return { valid: false, error: `Clase no encontrada: ${className}` };
  }

  // 1. Calcular el gasto total proyectado por campo
  const projectedDp: DpDistribution = {
    attack: (existingDp.attack || 0) + (newSpend.attack || 0),
    block: (existingDp.block || 0) + (newSpend.block || 0),
    dodge: (existingDp.dodge || 0) + (newSpend.dodge || 0),
    hp: (existingDp.hp || 0) + (newSpend.hp || 0),
    initiative: (existingDp.initiative || 0) + (newSpend.initiative || 0),
    zeon: (existingDp.zeon || 0) + (newSpend.zeon || 0),
    magicProjection: (existingDp.magicProjection || 0) + (newSpend.magicProjection || 0),
    athletics: (existingDp.athletics || 0) + (newSpend.athletics || 0),
    social: (existingDp.social || 0) + (newSpend.social || 0),
    subterfuge: (existingDp.subterfuge || 0) + (newSpend.subterfuge || 0)
  };

  // 2. Sumar totales por áreas para validar límites
  const totalCombatSpend = projectedDp.attack + projectedDp.block + projectedDp.dodge; // HP e Iniciativa pueden ir aparte o en Combate según la regla exacta, asumamos Combate aquí.
  const totalMagicSpend = projectedDp.zeon + projectedDp.magicProjection;
  
  const grandTotalSpend = Object.values(projectedDp).reduce((sum, val) => sum + val, 0);

  // 3. Validar: Costo total vs Total PD disponibles
  if (grandTotalSpend > totalDp) {
    return { 
      valid: false, 
      error: `Gasto excede el Total PD. Solicitado: ${grandTotalSpend}, Disponible: ${totalDp}` 
    };
  }

  // 4. Validar: Límites de Clase
  const combatLimitMax = totalDp * classConfig.limits.combat;
  if (totalCombatSpend > combatLimitMax) {
    return { 
      valid: false, 
      error: `Límite de Combate excedido. Máx: ${combatLimitMax}, Gastado: ${totalCombatSpend}` 
    };
  }

  const magicLimitMax = totalDp * classConfig.limits.magic;
  if (totalMagicSpend > magicLimitMax) {
    return { 
      valid: false, 
      error: `Límite Mágico excedido. Máx: ${magicLimitMax}, Gastado: ${totalMagicSpend}` 
    };
  }

  // Si pasa todo, es válido
  return {
    valid: true,
    newSpentDP: grandTotalSpend
  };
}
