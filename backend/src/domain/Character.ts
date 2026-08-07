import { Resistances } from './Resistances';
import { applyDirectDamage } from '../engine/combat';
import { calculateCombinedStyle } from '../engine/martialArts';

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
  type: 'SANGRADO' | 'VENENO' | 'PENALIZADOR' | 'BUF_TA' | 'BUF_STAT' | 'ATURDIDO' | 'CEGUERA' | 'PARALISIS' | 'SORPRESA';
  value: number;
  durationRounds: number;
  statName?: string; // Para identificar qué stat afecta (ej. 'FUE', 'DES')
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  type: 'CONSUMIBLE' | 'ARMADURA' | 'ARMA' | 'OTROS';
  equipped: boolean;
  modifiers?: ItemModifier;
  isWeapon?: boolean;
  breakage?: number;
  fortitude?: number;
  isBroken?: boolean;
}

export const DEFAULT_TOTAL_DP = 600;
export const DEFAULT_POTION_HEAL = 50;
export const SHIELD_ZEON_THRESHOLD = 30;
export const SHIELD_BONUS = 50;

export interface CharacterData {
  id: string;
  name: string;
  max_hp: number;
  hp: number;
  gold: number;
  ki?: number;
  zeon?: number;
  resistances?: {
    FIL?: number;
    CON?: number;
    PEN?: number;
    CAL?: number;
    ELE?: number;
    FRI?: number;
    ENE?: number;
  };
  inventory?: Record<string, Item>;
  dotes?: ActiveEffect[];
  activeEffects?: ActiveEffect[];
  kiAbilities?: string[];
  isBleeding?: boolean;
  bleedingDamage?: number;
  maxFatigue?: number;
  currentFatigue?: number;
  isChanneling?: boolean;
  channeledZeon?: number;
  targetSpellId?: string | null;
  reloadTurnsLeft?: number;
  martialStyles?: string[];
  level?: number;
  category?: string;
  totalDP?: number;
  spentDP?: number;
  dpDistribution?: string;
  strength?: number;
  dexterity?: number;
  agility?: number;
  constitution?: number;
  intelligence?: number;
  power?: number;
  willpower?: number;
  perception?: number;
  appearance?: number;
  nephilimType?: string | null;
  hasInhumanity?: boolean;
  hasZen?: boolean;
  isDead?: boolean;
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
  public kiAbilities: string[];
  public state: CharacterState;
  
  // Fase 6
  public isBleeding: boolean;
  public bleedingDamage: number;
  public maxFatigue: number;
  public currentFatigue: number;
  public isChanneling: boolean;
  public channeledZeon: number;
  public targetSpellId: string | null;
  public zeonRegen: number = 20;
  public secondarySkills: Record<string, number> = {
    acrobacias: 60,
    frialdad: 60,
    resistir_dolor: 60
  };

  // Fase 7
  public reloadTurnsLeft: number;
  public martialStyles: string[];
  public activeMartialBonuses: { damage: number; attackBonus: number; defenseBonus: number; freeManeuvers: string[] } = { damage: 10, attackBonus: 0, defenseBonus: 0, freeManeuvers: [] };

  // Fase 9
  public level: number;
  public category: string;
  public totalDP: number;
  public spentDP: number;
  public dpDistribution: string;

  // Fase 10
  public strength: number;
  public dexterity: number;
  public agility: number;
  public constitution: number;
  public intelligence: number;
  public power: number;
  public willpower: number;
  public perception: number;
  
  public appearance: number;
  public nephilimType: string | null;
  public hasInhumanity: boolean;
  public hasZen: boolean;
  public isDead: boolean;

  /**
   * Constructs a domain Character instance from CharacterData.
   */
  constructor(data: CharacterData) {
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
    
    // Inicializamos kiAbilities
    this.kiAbilities = data.kiAbilities || [];
    
    // Fase 6
    this.isBleeding = data.isBleeding || false;
    this.bleedingDamage = data.bleedingDamage || 0;
    this.maxFatigue = data.maxFatigue || 5;
    this.currentFatigue = data.currentFatigue ?? 5; // allow 0
    this.isChanneling = data.isChanneling || false;
    this.channeledZeon = data.channeledZeon || 0;
    this.targetSpellId = data.targetSpellId || null;

    // Fase 7
    this.reloadTurnsLeft = data.reloadTurnsLeft || 0;
    this.martialStyles = Array.isArray(data.martialStyles) ? data.martialStyles : [];
    this.activeMartialBonuses = calculateCombinedStyle(this.martialStyles);

    // Fase 9
    this.level = data.level || 1;
    this.category = data.category || 'Freelancer';
    this.totalDP = data.totalDP || 600;
    this.spentDP = data.spentDP || 0;
    this.dpDistribution = data.dpDistribution || "{}";

    // Fase 10
    this.strength = data.strength ?? 5;
    this.dexterity = data.dexterity ?? 5;
    this.agility = data.agility ?? 5;
    this.constitution = data.constitution ?? 5;
    this.intelligence = data.intelligence ?? 5;
    this.power = data.power ?? 5;
    this.willpower = data.willpower ?? 5;
    this.perception = data.perception ?? 5;
    
    this.appearance = data.appearance ?? 5;
    this.nephilimType = data.nephilimType || null;
    this.hasInhumanity = data.hasInhumanity || false;
    this.hasZen = data.hasZen || false;
    this.isDead = data.isDead || false;

    // Calculamos las resistencias totales (base + equipamiento)
    this.resistances = new Resistances();
    this.recalculateResistances();
  }

  public addEffect(effect: ActiveEffect) {
    this.activeEffects.push(effect);
    if (effect.type === 'BUF_TA') {
      this.recalculateResistances();
    }
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
    
    // Fase 6.1: Desangramiento Activo
    if (this.isBleeding) {
      this.currentHp -= 1;
      this.bleedingDamage += 1;
    }

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }

    this.activeEffects = remainingEffects;
    this.recalculateResistances();
    
    // Fase 6.4: Acumulación Mágica
    if (this.isChanneling) {
      this.channeledZeon += this.zeonRegen;
      if (this.channeledZeon > this.zeon) {
        this.channeledZeon = this.zeon; // Cap at max Zeon available
      }
    }

    // Fase 7: Recarga
    this.tickReload();
  }

  // Fase 7: Recalcular Artes Marciales
  public recalculateMartialArts() {
    this.activeMartialBonuses = calculateCombinedStyle(this.martialStyles);
  }

  // Fase 7: Recarga
  public tickReload(): void {
    if (this.reloadTurnsLeft > 0) {
      this.reloadTurnsLeft--;
    }
  }

  // --- Subfase B: Fisiología de Personaje ---

  public getSize(): number {
    return this.strength + this.constitution;
  }

  public getMaxLoad(): number {
    // Tabla básica aproximada (Reglas Básicas p. 55)
    // El índice de peso se basa en la Fuerza.
    // Asumiremos un límite directo o llamaremos a physics.ts
    // Por simplicidad en dominio, calcularemos una base de peso.
    const weightIndex = this.strength;
    return weightIndex * 10; // Placeholder para kg máximos
  }

  public getJumpDistance(): number {
    return Math.max(1, this.agility / 2); // Placeholder para distancia
  }

  public canFire(): boolean {
    return this.reloadTurnsLeft <= 0;
  }

  public startReload(turns: number): void {
    this.reloadTurnsLeft = turns;
  }

  public recalculateResistances() {
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

    // Sumar modificadores de bufos activos
    for (const effect of this.activeEffects) {
      if (effect.type === 'BUF_TA') {
        FIL += effect.value;
        CON += effect.value;
        PEN += effect.value;
        CAL += effect.value;
        ELE += effect.value;
        FRI += effect.value;
        ENE += effect.value;
      }
    }

    this.resistances = new Resistances(FIL, CON, PEN, CAL, ELE, FRI, ENE);
  }

  public equipItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && (item.type === 'ARMADURA' || item.type === 'ARMA')) {
      item.equipped = true;
      if (item.type === 'ARMADURA') this.recalculateResistances();
    }
  }

  public unequipItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && (item.type === 'ARMADURA' || item.type === 'ARMA')) {
      item.equipped = false;
      if (item.type === 'ARMADURA') this.recalculateResistances();
    }
  }

  public getEquippedWeapon(): Item | null {
    return Object.values(this.inventory).find(i => i.equipped && (i.type === 'ARMA' || i.isWeapon)) || null;
  }

  public useItem(itemId: string) {
    const item = this.inventory[itemId];
    if (item && item.type === 'CONSUMIBLE' && item.quantity > 0) {
      // Simular uso de poción genérica
      this.currentHp += DEFAULT_POTION_HEAL;
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
      if (amount === SHIELD_ZEON_THRESHOLD) {
        this.temporaryShield += SHIELD_BONUS;
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
    
    // Calculamos el daño final usando el motor de combate
    const finalDamage = applyDirectDamage(remainingDamage, ta);

    this.currentHp -= finalDamage;

    // Verificamos estado inconsciente
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }
  }

  applyResolvedDamage(damage: number): void {
    if (damage <= 0 || this.state === 'MUERTO') return;

    let remainingDamage = damage;

    if (this.temporaryShield > 0) {
      if (this.temporaryShield >= remainingDamage) {
        this.temporaryShield -= remainingDamage;
        return;
      } else {
        remainingDamage -= this.temporaryShield;
        this.temporaryShield = 0;
      }
    }

    this.currentHp -= remainingDamage;

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.state = 'INCONSCIENTE';
    }
  }

  // Fase 6.4: Falla de Proyección Psíquica (Consumición)
  public applyPsychicFailure(failureLevel: number) {
    this.currentFatigue -= failureLevel;
    if (this.currentFatigue < 0) {
      this.currentFatigue = 0;
      this.state = 'INCONSCIENTE'; // Colapso por consumición psíquica
    }
  }

  // Fase 6.2: Cálculo de Penalizadores Físicos
  public getPhysicalPenalty(): number {
    let penalty = 0;
    
    // Penalizador por Agotamiento
    if (this.currentFatigue <= 0) {
      penalty -= 40;
    }
    
    // Penalizador por Desangramiento
    const bleedingPenalty = Math.floor(this.bleedingDamage / 5) * 10;
    penalty -= bleedingPenalty;
    
    return penalty;
  }
  
  // Extrae y prepara los datos para guardar en Prisma, incluyendo campos Fase 6
  /**
   * @deprecated Use CharacterMapper.toPrisma(character) instead.
   * Extracts and prepares data for Prisma storage.
   */
  public toPrismaData() {
    return {
      hp: this.currentHp,
      gold: this.gold,
      ki: this.ki,
      zeon: this.zeon,
      dotes: this.activeEffects as any,
      isBleeding: this.isBleeding,
      bleedingDamage: this.bleedingDamage,
      currentFatigue: this.currentFatigue,
      maxFatigue: this.maxFatigue,
      isChanneling: this.isChanneling,
      channeledZeon: this.channeledZeon,
      targetSpellId: this.targetSpellId,
      reloadTurnsLeft: this.reloadTurnsLeft,
      martialStyles: this.martialStyles as any,
      level: this.level,
      category: this.category,
      totalDP: this.totalDP,
      spentDP: this.spentDP,
      dpDistribution: this.dpDistribution,
      strength: this.strength,
      dexterity: this.dexterity,
      agility: this.agility,
      constitution: this.constitution,
      intelligence: this.intelligence,
      power: this.power,
      willpower: this.willpower,
      perception: this.perception,
      appearance: this.appearance,
      size: this.getSize(),
      nephilimType: this.nephilimType,
      hasInhumanity: this.hasInhumanity,
      hasZen: this.hasZen,
      isDead: this.isDead
    };
  }
}
