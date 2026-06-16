export interface Spell {
  id: string;
  name: string;
  via: 'FUEGO' | 'AGUA' | 'TIERRA' | 'AIRE' | 'LUZ' | 'OSCURIDAD' | 'ESENCIA';
  requiredLevel: number;
  zeonCostBase: number;
  description: string;
}

export const MAGIC_SPELLS_REGISTRY: Record<string, Spell> = {
  FUEGO_10: {
    id: 'FUEGO_10',
    name: 'Crear Fuego',
    via: 'FUEGO',
    requiredLevel: 10,
    zeonCostBase: 20,
    description: 'Crea una pequeña llama, capaz de iluminar o encender materiales inflamables.'
  },
  FUEGO_20: {
    id: 'FUEGO_20',
    name: 'Proyectil Ígneo',
    via: 'FUEGO',
    requiredLevel: 20,
    zeonCostBase: 40,
    description: 'Lanza una bola de fuego menor que inflige daño mágico.'
  },
  FUEGO_50: {
    id: 'FUEGO_50',
    name: 'Tormenta de Llamas',
    via: 'FUEGO',
    requiredLevel: 50,
    zeonCostBase: 120,
    description: 'Una explosión masiva de fuego que envuelve un área.'
  },
  AGUA_10: {
    id: 'AGUA_10',
    name: 'Crear Agua',
    via: 'AGUA',
    requiredLevel: 10,
    zeonCostBase: 20,
    description: 'Condensa humedad para crear agua pura.'
  },
  AGUA_20: {
    id: 'AGUA_20',
    name: 'Flecha de Hielo',
    via: 'AGUA',
    requiredLevel: 20,
    zeonCostBase: 40,
    description: 'Dispara un proyectil congelado que puede ralentizar.'
  },
  AGUA_50: {
    id: 'AGUA_50',
    name: 'Tormenta de Escarcha',
    via: 'AGUA',
    requiredLevel: 50,
    zeonCostBase: 120,
    description: 'Crea una zona de frío extremo.'
  }
};
