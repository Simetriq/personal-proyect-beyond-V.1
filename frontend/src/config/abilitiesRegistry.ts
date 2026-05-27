export type AbilityCategory = 'DAMAGE' | 'BUFF_STAT' | 'SHIELD' | 'EFFECT';
export type ResourceType = 'KI' | 'ZEON';
export type TargetType = 'SELF' | 'ENEMY';

export interface AbilityDef {
  id: string;
  name: string;
  resource: ResourceType;
  cost: number;
  type: AbilityCategory;
  target: TargetType;
  effect: {
    damageType?: string; // e.g. 'CAL', 'FIL'
    value: number; // Damage amount, Shield amount, or Buff/Effect value
    durationRounds?: number;
    effectType?: 'BUF_TA' | 'BUF_STAT' | 'PENALIZADOR';
    statName?: string; // e.g. 'FUE'
  };
}

export const KI_ABILITIES: Record<string, AbilityDef> = {
  'FUERZA_SOBRENATURAL': {
    id: 'FUERZA_SOBRENATURAL',
    name: 'Fuerza Sobrenatural',
    resource: 'KI',
    cost: 20,
    type: 'BUFF_STAT',
    target: 'SELF',
    effect: {
      value: 5,
      durationRounds: 3,
      effectType: 'BUF_STAT',
      statName: 'FUE'
    }
  },
  'PIEL_DE_HIERRO': {
    id: 'PIEL_DE_HIERRO',
    name: 'Piel de Hierro',
    resource: 'KI',
    cost: 15,
    type: 'BUFF_STAT',
    target: 'SELF',
    effect: {
      value: 2,
      durationRounds: 1,
      effectType: 'BUF_TA'
    }
  },
  'ESCUDO_DE_KI': {
    id: 'ESCUDO_DE_KI',
    name: 'Escudo de Ki',
    resource: 'KI',
    cost: 10,
    type: 'SHIELD',
    target: 'SELF',
    effect: {
      value: 30
    }
  }
};

export const MAGIC_SPELLS: Record<string, AbilityDef> = {
  'BOLA_DE_FUEGO': {
    id: 'BOLA_DE_FUEGO',
    name: 'Bola de Fuego',
    resource: 'ZEON',
    cost: 30,
    type: 'DAMAGE',
    target: 'ENEMY',
    effect: {
      value: 50,
      damageType: 'CAL'
    }
  },
  'CORTE_DE_VIENTO': {
    id: 'CORTE_DE_VIENTO',
    name: 'Corte de Viento',
    resource: 'ZEON',
    cost: 20,
    type: 'DAMAGE',
    target: 'ENEMY',
    effect: {
      value: 40,
      damageType: 'FIL'
    }
  },
  'DESTELLO_DE_LUZ': {
    id: 'DESTELLO_DE_LUZ',
    name: 'Destello de Luz',
    resource: 'ZEON',
    cost: 15,
    type: 'EFFECT',
    target: 'ENEMY',
    effect: {
      value: -80,
      durationRounds: 2,
      effectType: 'PENALIZADOR'
    }
  },
  'ESCUDO_MISTICO': {
    id: 'ESCUDO_MISTICO',
    name: 'Escudo Místico',
    resource: 'ZEON',
    cost: 30,
    type: 'SHIELD',
    target: 'SELF',
    effect: {
      value: 50
    }
  }
};

export const ABILITIES_REGISTRY: Record<string, AbilityDef> = {
  ...KI_ABILITIES,
  ...MAGIC_SPELLS
};
