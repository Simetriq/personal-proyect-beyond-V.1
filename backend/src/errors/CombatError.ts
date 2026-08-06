export class CombatError extends Error {
  constructor(
    message: string, 
    public readonly code: string, 
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CombatError';
    Object.setPrototypeOf(this, CombatError.prototype);
  }
}

export class InvalidCombatInputError extends CombatError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_INPUT', context);
    this.name = 'InvalidCombatInputError';
    Object.setPrototypeOf(this, InvalidCombatInputError.prototype);
  }
}

export class HandlerError extends CombatError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'HANDLER_ERROR', context);
    this.name = 'HandlerError';
    Object.setPrototypeOf(this, HandlerError.prototype);
  }
}
