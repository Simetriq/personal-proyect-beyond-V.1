import { Resistances } from './Resistances';

export type CharacterState = 'ACTIVO' | 'INCONSCIENTE' | 'MUERTO';

export interface ItemModifier {
  FIL?: number;
  CON?: number;
  PEN?: number;
  CAL?: number;
  ELE?: number;
  FRI?: number;
  ENE?: number;
}

export interface ActiveEffect {
  id: string;
  name: string;
  type: 'SANGRADO' | 'VENENO' | 'PENALIZADOR';
  value: number;
  durationRounds: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  type: 'CONSUMIBLE' | 'ARMADURA' | 'OTROS';
  equipped: boolean;
  modifiers?: ItemModifier;
}

export class Character {
  public id: string;
  public name: string;
  public currentHp: number;
  public maxHp: number;
  public gold: number;
  public ki: number;
  public zeon: number;
  public temporaryShield: number = 0;
  public currentInitiative: number | null = null;
  public baseResistances: Resistances;
  public resistances: Resistances;
  public inventory: Record<string, Item>; 
  public activeEffects: ActiveEffect[];
  public state: CharacterState;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.maxHp = data.max_hp;
    this.currentHp = data.hp;
    this.gold = data.gold;
    this.ki = data.ki || 0;
    this.zeon = data.zeon || 0;
    
    // Determinación del estado inicial
    this.state = this.currentHp > 0 ? 'ACTIVO' : 'INCONSCIENTE';

    // Parseo seguro de la armadura base (TA)
    const res = data.resistances || {};
    this.baseResistances = new Resistances(
      res.FIL, res.CON, res.PEN, res.CAL, res.ELE, res.FRI, res.ENE
    );

    // Inicializamos el inventario
    this.inventory = data.inventory || {};
    
    // Inicializamos estados activos guardados en 'dotes' o como 'activeEffects' directos
    this.activeEffects = data.dotes || data.activeEffects || [];
    
    // Calculamos las resistencias totales (base + equipamiento)
    this.resistances = new Resistances();
    this.recalculateResistances();
  }

  public addEffect(effect: ActiveEffect) {
    this.activeEffects.push(effect);
  }

  public tickEffects(): void {
    const remainingEffects: ActiveEffect[] = [];

    for (const effect of this.activeEffects) {
      if (effect.type === 'SANGRADO' || effect.type === 'VENENO') {
        this.currentHp -= effect.value;
      }

      effect.durationRounds -= 1;

      if (effect.durationRounds > 0) {
        remainingEffects.push(effect);
      }
    }

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }

    this.activeEffects = remainingEffects;
  }

  private recalculateResistances() {
    let FIL = this.baseResistances.FIL;
    let CON = this.baseResistances.CON;
    let PEN = this.baseResistances.PEN;
    let CAL = this.baseResistances.CAL;
    let ELE = this.baseResistances.ELE;
    let FRI = this.baseResistances.FRI;
    let ENE = this.baseResistances.ENE;

    // Sumar modificadores de todos los ítems equipados
    for (const itemId in this.inventory) {
      const item = this.inventory[itemId];
      if (item.equipped && item.modifiers) {
        FIL += item.modifiers.FIL || 0;
        CON += item.modifiers.CON || 0;
        PEN += item.modifiers.PEN || 0;
        CAL += item.modifiers.CAL || 0;
        ELE += item.modifiers.ELE || 0;
        FRI += item.modifiers.FRI || 0;
        ENE += item.modifiers.ENE || 0;
      }
    }

    this.resistances = new Resistances(FIL, CON, PEN, CAL, ELE, FRI, ENE);
  }

  public equipItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && item.type === 'ARMADURA') {
      item.equipped = true;
      this.recalculateResistances();
    }
  }

  public unequipItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && item.type === 'ARMADURA') {
      item.equipped = false;
      this.recalculateResistances();
    }
  }

  public useItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && item.type === 'CONSUMIBLE' && item.quantity > 0) {
      // Simular uso de poción genérica (cura 50 HP)
      // Idealmente, esto vendría en los modifiers del item o un handler específico
      this.currentHp += 50;
      if (this.currentHp > this.maxHp) this.currentHp = this.maxHp;
      
      item.quantity -= 1;
      
      if (this.currentHp > 0 && this.state === 'INCONSCIENTE') {
        this.state = 'ACTIVO';
      }
      
      if (item.quantity <= 0) {
        delete this.inventory[itemId]; // Eliminar si se agota
      }
    }
  }

  public gmOverrideStats(updates: { hp?: number, gold?: number, ki?: number, zeon?: number, currentInitiative?: number | null }) {
    if (updates.hp !== undefined) {
      this.currentHp = updates.hp;
      if (this.currentHp > this.maxHp) this.currentHp = this.maxHp;
      if (this.currentHp <= 0) {
        this.currentHp = 0;
        this.state = 'INCONSCIENTE';
      } else if (this.state === 'INCONSCIENTE') {
        this.state = 'ACTIVO';
      }
    }
    
    if (updates.gold !== undefined) {
      this.gold = Math.max(0, updates.gold);
    }
    
    if (updates.ki !== undefined) {
      this.ki = Math.max(0, updates.ki);
    }
    
    if (updates.zeon !== undefined) {
      this.zeon = Math.max(0, updates.zeon);
    }

    if (updates.currentInitiative !== undefined) {
      this.currentInitiative = updates.currentInitiative;
    }
  }

  public spendKi(amount: number): boolean {
    if (this.ki >= amount) {
      this.ki -= amount;
      return true;
    }
    return false;
  }

  public spendZeon(amount: number): boolean {
    if (this.zeon >= amount) {
      this.zeon -= amount;
      
      // Habilidad mística hardcodeada de prueba
      if (amount === 30) {
        this.temporaryShield += 50;
      }
      return true;
    }
    return false;
  }

  /**
   * Aplica la regla oficial de daño de Anima:
   * 10% de reducción de daño por cada punto de TA. Mínimo 1 de daño.
   */
  applyDirectDamage(amount: number, type: string): void {
    if (amount <= 0 || this.state === 'MUERTO') return;

    let remainingDamage = amount;

    // 1. Intercepción por Escudo Místico
    if (this.temporaryShield > 0) {
      if (this.temporaryShield >= remainingDamage) {
        this.temporaryShield -= remainingDamage;
        return; // El escudo absorbió todo el daño
      } else {
        remainingDamage -= this.temporaryShield;
        this.temporaryShield = 0;
      }
    }

    const ta = this.resistances.getResistanceByType(type);
    
    // Reducción del 10% por punto de TA (ej. 3 TA = 30% reducción)
    const reductionPercentage = ta * 0.10;
    
    // Evitamos reducciones mayores al 100% si TA >= 10
    const effectiveReduction = Math.min(reductionPercentage, 1);
    
    // Calculamos el daño final (siempre mínimo 1 si el ataque impactó la armadura)
    let finalDamage = remainingDamage * (1 - effectiveReduction);
    finalDamage = Math.max(1, Math.round(finalDamage));

    this.currentHp -= finalDamage;

    // Verificamos estado inconsciente
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }
  }
}
