export class Resistances {
  constructor(
    public FIL: number = 0,
    public CON: number = 0,
    public PEN: number = 0,
    public CAL: number = 0,
    public ELE: number = 0,
    public FRI: number = 0,
    public ENE: number = 0
  ) {}

  /**
   * Obtiene la armadura (TA) basada en el tipo de daño.
   */
  getResistanceByType(type: string): number {
    const key = type.toUpperCase() as keyof Resistances;
    if (this[key] !== undefined) {
      return this[key] as number;
    }
    return 0; // Por defecto si el tipo no es válido o no tiene TA
  }
}
