import { Resistances } from './Resistances';

export type CharacterState = 'ACTIVO' | 'INCONSCIENTE' | 'MUERTO';

export class Character {
  public id: string;
  public name: string;
  public currentHp: number;
  public maxHp: number;
  public gold: number;
  public resistances: Resistances;
  public inventory: any; // Mapea al JSON de la DB
  public state: CharacterState;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.maxHp = data.max_hp;
    this.currentHp = data.hp;
    this.gold = data.gold;
    
    // Determinación del estado inicial
    this.state = this.currentHp > 0 ? 'ACTIVO' : 'INCONSCIENTE';

    // Parseo seguro de la armadura (TA)
    const res = data.resistances || {};
    this.resistances = new Resistances(
      res.FIL, res.CON, res.PEN, res.CAL, res.ELE, res.FRI, res.ENE
    );

    this.inventory = data.inventory || {};
  }

  /**
   * Aplica la regla oficial de daño de Anima:
   * 10% de reducción de daño por cada punto de TA. Mínimo 1 de daño.
   */
  applyDirectDamage(amount: number, type: string): void {
    if (amount <= 0 || this.state === 'MUERTO') return;

    const ta = this.resistances.getResistanceByType(type);
    
    // Reducción del 10% por punto de TA (ej. 3 TA = 30% reducción)
    const reductionPercentage = ta * 0.10;
    
    // Evitamos reducciones mayores al 100% si TA >= 10
    const effectiveReduction = Math.min(reductionPercentage, 1);
    
    // Calculamos el daño final (siempre mínimo 1 si el ataque impactó)
    let finalDamage = amount * (1 - effectiveReduction);
    finalDamage = Math.max(1, Math.floor(finalDamage));

    this.currentHp -= finalDamage;

    // Verificamos estado inconsciente
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }
  }
}
