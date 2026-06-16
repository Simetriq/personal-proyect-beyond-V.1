export interface ClassLimits {
  combat: number;
  magic: number;
  psychic: number;
}

export interface ClassCosts {
  attack: number;
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

export interface AnimaClass {
  name: string;
  limits: ClassLimits;
  costs: ClassCosts;
}

export const CLASSES_CONFIG: Record<string, AnimaClass> = {
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
