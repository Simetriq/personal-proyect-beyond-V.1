/**
 * Zod validators for Dominion Technique payloads.
 */
import { z } from 'zod';
import { KiCostSchema } from './kiValidators';

/** Valid technique effect types */
const TechniqueEffectTypeEnum = z.enum([
  'DAMAGE', 'AREA', 'STATE', 'BUFF', 'DEBUFF', 'HEAL', 'MOVEMENT', 'SPECIAL',
]);

/** Valid effect targets */
const TechniqueTargetEnum = z.enum(['SELF', 'ENEMY', 'ALLY', 'AREA']);

/** Schema for a single technique effect */
const TechniqueEffectSchema = z.object({
  type: TechniqueEffectTypeEnum,
  value: z.number().int(),
  description: z.string(),
  target: TechniqueTargetEnum.optional(),
  damageType: z.string().optional(),
  stateInflicted: z.string().optional(),
  durationRounds: z.number().int().min(0).optional(),
});

/**
 * Payload for creating a new Dominion Technique.
 */
export const CreateTechniqueSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  level: z.number().int().min(1).max(5),
  kiCost: KiCostSchema,
  maintenanceCost: KiCostSchema.optional().default({}),
  effects: z.array(TechniqueEffectSchema).min(1),
  isPersistent: z.boolean().default(false),
});

/**
 * Payload for activating an existing technique.
 */
export const ActivateTechniqueSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  techniqueId: z.string(),
});

/**
 * Payload for deactivating a maintained technique.
 */
export const DeactivateTechniqueSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  techniqueId: z.string(),
});

export type CreateTechniquePayload = z.infer<typeof CreateTechniqueSchema>;
export type ActivateTechniquePayload = z.infer<typeof ActivateTechniqueSchema>;
export type DeactivateTechniquePayload = z.infer<typeof DeactivateTechniqueSchema>;
