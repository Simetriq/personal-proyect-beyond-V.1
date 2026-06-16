/**
 * Diccionario de Clases (Categorías) y sus costes de Puntos de Desarrollo (PD).
 * Limits define el porcentaje máximo de los Total DP que se pueden gastar en esa categoría de habilidades.
 * Costs define cuántos DP cuesta comprar +1 a esa habilidad o estadística.
 */

export interface ClassLimits {
  combat: number; // Porcentaje máximo (ej: 0.60 para 60%)
  magic: number;
  psychic: number;
}

export interface ClassCosts {
  // Combate
  attack: number;
  block: number;
  dodge: number;
  hp: number; // Coste de comprar un múltiplo base de HP
  initiative: number;

  // Magia
  zeon: number; // Coste para +5 Zeon
  magicProjection: number;

  // Secundarias
  athletics: number;
  social: number;
  subterfuge: number;
}

export interface AnimaClass {
  name: string;
  limits: ClassLimits;
  costs: ClassCosts;
}

export const ClassesConfig: Record<string, AnimaClass> = {
  Guerrero: {
    name: 'Guerrero',
    limits: { combat: 0.60, magic: 0.50, psychic: 0.50 },
    costs: {
      attack: 2, block: 2, dodge: 2, hp: 15, initiative: 2,
      zeon: 3, magicProjection: 3,
      athletics: 2, social: 2, subterfuge: 2
    }
  },
  Hechicero: {
    name: 'Hechicero',
    limits: { combat: 0.50, magic: 0.60, psychic: 0.50 },
    costs: {
      attack: 3, block: 3, dodge: 3, hp: 20, initiative: 3,
      zeon: 1, magicProjection: 2,
      athletics: 2, social: 2, subterfuge: 2
    }
  },
  Freelancer: {
    name: 'Freelancer',
    limits: { combat: 0.60, magic: 0.60, psychic: 0.60 },
    costs: {
      attack: 2, block: 2, dodge: 2, hp: 20, initiative: 2,
      zeon: 2, magicProjection: 2,
      athletics: 2, social: 2, subterfuge: 2
    }
  }
};
