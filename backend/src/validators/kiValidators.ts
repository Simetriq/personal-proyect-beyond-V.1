/**
 * Zod validators for Ki-related socket payloads.
 */
import { z } from 'zod';

/** The 6 valid Ki characteristics */
const KiCharacteristicEnum = z.enum(['FUE', 'DES', 'AGI', 'CON', 'POD', 'VOL']);

/** Schema for a Ki cost object (partial — only consumed reserves are specified) */
export const KiCostSchema = z.object({
  FUE: z.number().int().min(0).optional(),
  DES: z.number().int().min(0).optional(),
  AGI: z.number().int().min(0).optional(),
  CON: z.number().int().min(0).optional(),
  POD: z.number().int().min(0).optional(),
  VOL: z.number().int().min(0).optional(),
});

/**
 * Payload for accumulating Ki in a specific characteristic.
 * The player declares which characteristic to charge and how much.
 */
export const AccumulateKiSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  characteristic: KiCharacteristicEnum,
  amount: z.number().int().min(1).max(100),
});

/**
 * Payload for spending Ki from multiple reserves at once.
 * Used when activating techniques that consume from several pools.
 */
export const SpendKiSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  costs: KiCostSchema.refine(
    (data) => Object.values(data).some((v) => v !== undefined && v > 0),
    { message: 'At least one Ki reserve must be specified' }
  ),
});

export type AccumulateKiPayload = z.infer<typeof AccumulateKiSchema>;
export type SpendKiPayload = z.infer<typeof SpendKiSchema>;
export type KiCostPayload = z.infer<typeof KiCostSchema>;
