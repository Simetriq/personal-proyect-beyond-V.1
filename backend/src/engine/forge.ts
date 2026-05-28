export interface ForgeConstraints {
  maxQuality: number;
  difficultyMod: number;
}

const MATERIAL_FORGE_TABLE: Record<string, ForgeConstraints> = {
  'Madera': { maxQuality: 0, difficultyMod: 0 },
  'Piedra': { maxQuality: 0, difficultyMod: 0 },
  'Bronce': { maxQuality: 0, difficultyMod: 0 },
  'Hierro': { maxQuality: 5, difficultyMod: +10 },
  'Acero': { maxQuality: 5, difficultyMod: +10 },
  'Acero Negro': { maxQuality: 5, difficultyMod: +20 },
  'Malebolgia': { maxQuality: 15, difficultyMod: +20 },
  'Cristal de Almas': { maxQuality: 15, difficultyMod: +40 },
  'Adamantium': { maxQuality: 20, difficultyMod: +60 },
  'Mithril': { maxQuality: 20, difficultyMod: +80 },
  'Oricalco': { maxQuality: 25, difficultyMod: +100 }
};

/**
 * Calculates forge constraints based on Table 22 for material types.
 * @param material The material string to lookup
 * @returns Constraints including the maximum quality limit and difficulty modifier
 */
export function calculateForge(material: string): ForgeConstraints {
  const match = MATERIAL_FORGE_TABLE[material];
  
  if (!match) {
    // Default fallback if material is unknown
    return { maxQuality: 0, difficultyMod: 0 };
  }
  
  return match;
}
