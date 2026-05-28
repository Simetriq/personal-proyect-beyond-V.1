export enum FumbleSeverity {
  CLEAN_FAIL = 'CLEAN_FAIL',           // 1 to 50
  HARMFUL_FAIL = 'HARMFUL_FAIL',       // 51 to 95
  TRAGIC_FAIL = 'TRAGIC_FAIL'          // 96 to 100
}

/**
 * Evaluates the severity of a fumble roll in secondary skills.
 * @param fumbleRoll The 1d100 roll to determine fumble severity (Level of Fumble)
 * @returns The FumbleSeverity category
 */
export function evaluateSkillFumble(fumbleRoll: number): FumbleSeverity {
  if (fumbleRoll <= 50) {
    return FumbleSeverity.CLEAN_FAIL;
  } else if (fumbleRoll <= 95) {
    return FumbleSeverity.HARMFUL_FAIL;
  } else {
    return FumbleSeverity.TRAGIC_FAIL;
  }
}
