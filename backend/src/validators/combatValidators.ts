export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateAttackPayload(payload: unknown): ValidationResult<unknown> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }
  // Basic validation, to be extended with proper interfaces
  return { valid: true, data: payload };
}

export function validateDefensePayload(payload: unknown): ValidationResult<unknown> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }
  return { valid: true, data: payload };
}

export function validateGMCommandPayload(payload: unknown): ValidationResult<unknown> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }
  return { valid: true, data: payload };
}

export function validateMagicPayload(payload: unknown): ValidationResult<unknown> {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }
  return { valid: true, data: payload };
}
