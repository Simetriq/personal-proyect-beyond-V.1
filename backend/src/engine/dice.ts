export interface RollOptions {
  mastery?: boolean;
  isResistance?: boolean;
  isFumbleLevel?: boolean;
  isCritLevel?: boolean;
}

export interface RollResult {
  total: number;
  rolls: number[]; // Natural rolls sequence
  isOpenRoll: boolean;
  isFumble: boolean;
  fumbleLevel: number;
}

// Pure helper for 1d100
export const roll1d100 = (): number => Math.floor(Math.random() * 100) + 1;

/**
 * Core Dice Engine for Anima Beyond Fantasy
 * @param modifier Base ability / stat modifier
 * @param options Object containing mastery boolean
 * @param mockRolls Optional array of pre-determined rolls for testing
 * @returns RollResult
 */
export function rollD100(modifier: number, options?: RollOptions, mockRolls?: number[]): RollResult {
  const rolls: number[] = [];
  
  // Allows injecting predictable rolls for testing
  const getNextRoll = (): number => {
    if (mockRolls && mockRolls.length > 0) {
      return mockRolls.shift()!;
    }
    return roll1d100();
  };

  let currentRoll = getNextRoll();
  rolls.push(currentRoll);

  // --- Fumble Logic (Pifia) ---
  const fumbleThreshold = options?.mastery ? 2 : 3;

  if (currentRoll <= fumbleThreshold) {
    const secondaryRoll = getNextRoll();
    rolls.push(secondaryRoll);
    
    return {
      total: modifier - secondaryRoll,
      rolls,
      isOpenRoll: false,
      isFumble: true,
      fumbleLevel: secondaryRoll
    };
  }

  // --- Open Roll Logic (Tiradas Abiertas) ---
  let sumOfRolls = currentRoll;
  let openRollThreshold = 90;
  let isOpenRoll = false;

  const canOpenRoll = !(options?.isResistance || options?.isFumbleLevel || options?.isCritLevel);

  while (canOpenRoll && (currentRoll >= openRollThreshold || currentRoll === 100)) {
    isOpenRoll = true;
    currentRoll = getNextRoll();
    rolls.push(currentRoll);
    sumOfRolls += currentRoll;
    openRollThreshold += 1;
  }

  return {
    total: modifier + sumOfRolls,
    rolls,
    isOpenRoll,
    isFumble: false,
    fumbleLevel: 0
  };
}
