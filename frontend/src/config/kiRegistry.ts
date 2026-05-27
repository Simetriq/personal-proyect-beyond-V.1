export type KiEffectType = 'PASSIVE' | 'STAT_BUFF' | 'TA_BUFF' | 'UI_BADGE' | 'ACTION' | 'EFFECT';

export interface KiAbilityDef {
  id: string;
  name: string;
  cmCost: number;
  prerequisites: string[];
  effectType: KiEffectType;
  kiCostActivation: number;
  kiCostMaintenance?: number;
  description: string;
}

export const KI_ABILITIES_DAG: Record<string, KiAbilityDef> = {
  uso_ki: {
    id: 'uso_ki', name: 'Uso del Ki', cmCost: 40, prerequisites: [],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Nodo raíz indispensable para comprar cualquier otra habilidad de Ki.'
  },
  control_ki: {
    id: 'control_ki', name: 'Control del Ki', cmCost: 30, prerequisites: ['uso_ki'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Permite acumular Ki voluntariamente y usar Técnicas.'
  },
  deteccion_ki: {
    id: 'deteccion_ki', name: 'Detección del Ki', cmCost: 20, prerequisites: ['control_ki'],
    effectType: 'UI_BADGE', kiCostActivation: 0, description: 'Desbloquea la capacidad de detectar energías. Añade un badge visual de +10 por nivel a la habilidad.'
  },
  erudicion: {
    id: 'erudicion', name: 'Erudición', cmCost: 10, prerequisites: ['deteccion_ki'],
    effectType: 'UI_BADGE', kiCostActivation: 0, description: 'Permite precisar la potencia, tipo y naturaleza exacta de las energías detectadas.'
  },
  energia_necesaria: {
    id: 'energia_necesaria', name: 'Uso de la energía necesaria', cmCost: 10, prerequisites: ['uso_ki'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Optimiza el esfuerzo físico. Multiplica la resistencia a la fatiga y permite quemar hasta 5 Cansancio por asalto.'
  },
  ocultacion_ki: {
    id: 'ocultacion_ki', name: 'Ocultación del Ki', cmCost: 10, prerequisites: ['energia_necesaria'],
    effectType: 'UI_BADGE', kiCostActivation: 0, description: 'Esconde la presencia anímica. Otorga un bono de +5 por nivel a la ocultación.'
  },
  falsa_muerte: {
    id: 'falsa_muerte', name: 'Falsa Muerte', cmCost: 10, prerequisites: ['ocultacion_ki'],
    effectType: 'UI_BADGE', kiCostActivation: 0, description: 'Entra en un estado comatoso idéntico a la muerte física y espiritual reteniendo percepción pasiva.'
  },
  elim_necesidades: {
    id: 'elim_necesidades', name: 'Eliminación de necesidades', cmCost: 10, prerequisites: ['energia_necesaria'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Reduce los requerimientos biológicos básicos (alimento, bebida, sueño) a 1/10.'
  },
  elim_penalizadores: {
    id: 'elim_penalizadores', name: 'Eliminación de penalizadores', cmCost: 20, prerequisites: ['energia_necesaria'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Reduce a la mitad (1/2) penalizadores continuos por dolor, fatiga o críticos físicos.'
  },
  recuperacion: {
    id: 'recuperacion', name: 'Recuperación', cmCost: 20, prerequisites: ['elim_penalizadores'],
    effectType: 'ACTION', kiCostActivation: 5, description: 'Consume 5 puntos de Ki para recuperar 1 punto de Cansancio (Máximo 1 por asalto).'
  },
  aumento_stats: {
    id: 'aumento_stats', name: 'Aumento de características', cmCost: 20, prerequisites: ['energia_necesaria'],
    effectType: 'STAT_BUFF', kiCostActivation: 0, kiCostMaintenance: 1, description: 'Incrementa temporalmente atributos físicos (FUE, DES, AGI, CON) hasta +3. Cuesta Ki igual al valor final deseado.'
  },
  extrusion_presencia: {
    id: 'extrusion_presencia', name: 'Extrusión de presencia', cmCost: 10, prerequisites: ['uso_ki'],
    effectType: 'EFFECT', kiCostActivation: 15, description: 'Permite golpear elementos incorpóreos/intangibles y parar ataques puramente místicos.'
  },
  extension_arma: {
    id: 'extension_arma', name: 'Extensión del aura al arma', cmCost: 10, prerequisites: ['extrusion_presencia'],
    effectType: 'EFFECT', kiCostActivation: 10, description: 'El arma/armadura hereda tus Resistencias, añade +10 daño base, +10 Entereza y +5 Rotura.'
  },
  armadura_energia: {
    id: 'armadura_energia', name: 'Armadura de energía', cmCost: 10, prerequisites: ['extrusion_presencia'],
    effectType: 'TA_BUFF', kiCostActivation: 10, description: 'Otorga un Tipo de Armadura (TA) natural de 2 contra ataques basados en energía pura.'
  },
  destruccion_ki: {
    id: 'destruccion_ki', name: 'Destrucción por Ki', cmCost: 20, prerequisites: ['extrusion_presencia'],
    effectType: 'ACTION', kiCostActivation: 1, description: 'Transmite Ki destructivo por contacto físico directo contra la RF del objetivo.'
  },
  eliminacion_peso: {
    id: 'eliminacion_peso', name: 'Eliminación de peso', cmCost: 10, prerequisites: ['uso_ki'],
    effectType: 'EFFECT', kiCostActivation: 0, kiCostMaintenance: 1, description: 'Altera la masa corporal. Permite correr por paredes verticales o agua.'
  },
  levitacion: {
    id: 'levitacion', name: 'Levitación', cmCost: 20, prerequisites: ['eliminacion_peso'],
    effectType: 'EFFECT', kiCostActivation: 1, kiCostMaintenance: 1, description: 'Flota en el aire. Cada punto inyectado otorga un nivel de Tipo de Vuelo limitado.'
  },
  movimiento_objetos: {
    id: 'movimiento_objetos', name: 'Movimiento de objetos', cmCost: 10, prerequisites: ['levitacion'],
    effectType: 'ACTION', kiCostActivation: 1, description: 'Telequinesis física continua (1 Ki por cada 5 kg de masa manipulada).'
  },
  vuelo: {
    id: 'vuelo', name: 'Vuelo', cmCost: 20, prerequisites: ['levitacion'],
    effectType: 'EFFECT', kiCostActivation: 1, kiCostMaintenance: 1, description: 'Control tridimensional absoluto en el aire con Tipo de Vuelo igual a movimiento pleno.'
  },
  transmision_ki: {
    id: 'transmision_ki', name: 'Transmisión del Ki', cmCost: 10, prerequisites: ['uso_ki'],
    effectType: 'ACTION', kiCostActivation: 0, description: 'Permite ceder o absorber puntos de Ki por contacto físico con otros sujetos con la habilidad.'
  },
  curacion_ki: {
    id: 'curacion_ki', name: 'Curación por Ki', cmCost: 10, prerequisites: ['transmision_ki'],
    effectType: 'ACTION', kiCostActivation: 1, description: 'Restaura inmediatamente 2 PV por cada 1 punto de Ki invertido por contacto físico.'
  },
  inhumanidad: {
    id: 'inhumanidad', name: 'Inhumanidad', cmCost: 30, prerequisites: ['uso_ki'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Desbloquea y capacita al personaje para superar controles de dificultad Inhumano.'
  },
  zen: {
    id: 'zen', name: 'Zen', cmCost: 50, prerequisites: ['inhumanidad'],
    effectType: 'PASSIVE', kiCostActivation: 0, description: 'Unificación máxima. Faculta al personaje para alcanzar controles de dificultad Zen.'
  }
};
