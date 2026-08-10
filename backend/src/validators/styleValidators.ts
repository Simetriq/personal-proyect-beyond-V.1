/**
 * Zod validators for Martial Style payloads.
 */
import { z } from 'zod';

/**
 * Payload for learning a new martial style.
 */
export const LearnStyleSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  styleId: z.string().min(1),
});

/**
 * Payload for switching the active martial style.
 */
export const SwitchStyleSchema = z.object({
  roomId: z.string(),
  characterId: z.string(),
  styleId: z.string().min(1),
});

export type LearnStylePayload = z.infer<typeof LearnStyleSchema>;
export type SwitchStylePayload = z.infer<typeof SwitchStyleSchema>;
