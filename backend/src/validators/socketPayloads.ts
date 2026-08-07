import { z } from 'zod';

export const AttackRequestSchema = z.object({
  campaignId: z.string(),
  attackerId: z.string(),
  defenderId: z.string().optional(),
  targetId: z.string().optional(),
  attackRoll: z.number().int().min(1).max(1000),
  baseDamage: z.number().int().min(0),
  damageType: z.string(), // e.g. FIL, CON...
  modifiers: z.object({
    isAreaAttack: z.boolean().optional(),
    isDisarm: z.boolean().optional(),
    isFullDefense: z.boolean().optional(),
    aimedLocation: z.string().optional(),
    coverage: z.enum(['PARTIAL', 'MILITARY', 'TOTAL']).optional(),
    burnedFatigueAttack: z.number().int().min(0).max(10).optional(),
    burnedFatigueDefense: z.number().int().min(0).max(10).optional(),
    attackerRawRoll: z.number().int().min(1).max(100).optional(),
    defenderRawRoll: z.number().int().min(1).max(100).optional(),
    envAttackMod: z.number().optional(),
    envDefenseMod: z.number().optional(),
    spellsApplied: z.array(z.string()).optional(),
  }).optional(),
});

export const DefenseRequestSchema = z.object({
  combatInstanceId: z.string(),
  defenseRoll: z.number().int().min(1).max(1000),
  defenseType: z.enum(['BLOCK', 'DODGE']),
});

export const UseItemSchema = z.object({
  campaignId: z.string(),
  characterId: z.string(),
  itemId: z.string(),
});

export const AccumulateZeonSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
});

export const GMCommandSchema = z.object({
  roomId: z.string(),
  commandString: z.string(),
});
