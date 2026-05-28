/**
 * Determines if a diagnosis is successful based on the medicine skill roll.
 * Diagnosing requires passing a difficulty of 3 times the disease level.
 * @param medicineRoll The final result of the medicine skill check
 * @param diseaseLevel The level of the disease/ailment
 * @returns true if diagnosis is successful
 */
export function diagnose(medicineRoll: number, diseaseLevel: number): boolean {
  const targetDifficulty = diseaseLevel * 3;
  return medicineRoll >= targetDifficulty;
}

/**
 * Applies First Aid to a character in negative HP.
 * If the character is in negative HP, a successful Medicine check against Medium Difficulty (120)
 * stabilizes them, stopping bleeding and setting their HP to 0.
 * @param currentHp The current hit points of the patient
 * @param medicineRoll The final result of the medicine skill check
 * @returns { success: boolean, newHp: number } indicating if the stabilization worked and the new HP.
 */
export function firstAid(currentHp: number, medicineRoll: number): { success: boolean; newHp: number } {
  // Can only apply first aid if the character is in negative HP
  if (currentHp >= 0) {
    return { success: false, newHp: currentHp };
  }

  const MEDIUM_DIFFICULTY = 120;
  if (medicineRoll >= MEDIUM_DIFFICULTY) {
    return { success: true, newHp: 0 };
  }

  return { success: false, newHp: currentHp };
}
