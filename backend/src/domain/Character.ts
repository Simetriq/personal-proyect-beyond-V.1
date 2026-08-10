import { Resistances } from './Resistances';
import { applyDirectDamage } from '../engine/combat';
import { calculateCombinedStyle } from '../engine/martialArts';
import type { KiReserves, KiCost, KiCharacteristic } from './ki/KiTypes';
import { createDefaultKiReserves, KI_CHARACTERISTICS, canAffordKiCost } from './ki/KiTypes';
import type { TechniqueData } from './techniques/TechniqueTypes';
import type { KnownStyle } from './martialArts/MartialStyleTypes';

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

import { AppliedEffect } from '../types/combat';

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
  dotes?: AppliedEffect[];
  activeEffects?: AppliedEffect[];
  kiAbilities?: string[];
  isBleeding?: boolean;
  bleedingDamage?: number;
  maxFatigue?: number;
  currentFatigue?: number;
  isChanneling?: boolean;
  channeledZeon?: number;
  targetSpellId?: string | null;
  reloadTurnsLeft?: number;
  martialStyles?: string[];       // Legacy: old string[] format
  knownStyles?: KnownStyle[];     // New: structured known styles
  activeStyleId?: string | null;
  kiReserves?: KiReserves;
  techniques?: TechniqueData[];
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
  campaignId?: string;
  maxHp?: number;
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
  public activeEffects: AppliedEffect[];
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
  public martialStyles: string[]; // Legacy compat
  public knownStyles: KnownStyle[];
  public activeStyleId: string | null;
  public activeMartialBonuses: { damage: number; attackBonus: number; defenseBonus: number; freeManeuvers: string[] } = { damage: 10, attackBonus: 0, defenseBonus: 0, freeManeuvers: [] };

  // Fase K1: Ki por características
  public kiReserves: KiReserves;
  public techniques: TechniqueData[];

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
    this.knownStyles = Array.isArray(data.knownStyles) ? data.knownStyles : [];
    this.activeStyleId = data.activeStyleId || null;
    // Use knownStyles if available, fall back to legacy martialStyles
    if (this.knownStyles.length > 0) {
      this.activeMartialBonuses = calculateCombinedStyle(this.knownStyles);
    } else {
      this.activeMartialBonuses = calculateCombinedStyle(this.martialStyles);
    }

    // Fase K1: Ki por características
    this.kiReserves = data.kiReserves || createDefaultKiReserves();
    this.techniques = Array.isArray(data.techniques) ? data.techniques : [];

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

  public addEffect(effect: AppliedEffect) {
    this.activeEffects.push(effect);
    this.recalculateResistances();
  }

  public tickEffects(): void {
    const remainingEffects: AppliedEffect[] = [];

    for (const effect of this.activeEffects) {
      for (const mod of effect.modifiers) {
        if (mod.operation === 'tick' && mod.target === 'hp') {
          this.currentHp -= mod.value;
        }
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
      if (item && item.equipped && item.modifiers) {
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

  // ─── Fase K1: Ki por Características ───

  /**
   * Accumulates Ki in a specific characteristic reserve.
   * @param characteristic Which reserve to charge
   * @param amount How much Ki to add
   */
  public accumulateKi(characteristic: KiCharacteristic, amount: number): void {
    const pool = this.kiReserves[characteristic];
    pool.current = Math.min(pool.current + amount, pool.maximum);
  }

  /**
   * Spends Ki from multiple reserves simultaneously.
   * Validates that all reserves have enough before spending.
   * @param costs Which reserves to spend from and how much
   * @returns true if spend was successful, false if insufficient Ki
   */
  public spendKiFromReserves(costs: KiCost): boolean {
    if (!canAffordKiCost(this.kiReserves, costs)) {
      return false;
    }
    for (const key of KI_CHARACTERISTICS) {
      const required = costs[key] ?? 0;
      if (required > 0) {
        this.kiReserves[key].current -= required;
      }
    }
    return true;
  }

  /**
   * Returns the total Ki currently available across all reserves.
   */
  public getTotalKi(): number {
    let total = 0;
    for (const key of KI_CHARACTERISTICS) {
      total += this.kiReserves[key].current;
    }
    return total;
  }

  // ─── Fase K1: Técnicas de Dominio ───

  /**
   * Adds a technique to the character's known techniques.
   */
  public learnTechnique(technique: TechniqueData): void {
    this.techniques.push(technique);
  }

  /**
   * Activates a technique by ID, spending its Ki cost.
   * @returns true if activation was successful
   */
  public activateTechnique(techniqueId: string): boolean {
    const technique = this.techniques.find(t => t.id === techniqueId);
    if (!technique || technique.isActive) return false;

    if (!this.spendKiFromReserves(technique.kiCost)) {
      return false;
    }

    technique.isActive = true;
    return true;
  }

  /**
   * Deactivates a maintained technique.
   */
  public deactivateTechnique(techniqueId: string): boolean {
    const technique = this.techniques.find(t => t.id === techniqueId);
    if (!technique || !technique.isActive) return false;

    technique.isActive = false;
    return true;
  }

  // ─── Fase K1: Estilos de Artes Marciales ───

  /**
   * Learns a new martial style.
   */
  public learnStyle(styleId: string): void {
    if (this.knownStyles.some(s => s.styleId === styleId)) return;
    this.knownStyles.push({ styleId, isActive: false });
  }

  /**
   * Sets a known style as the active martial style.
   * Deactivates any previously active style.
   */
  public setActiveStyle(styleId: string): boolean {
    const style = this.knownStyles.find(s => s.styleId === styleId);
    if (!style) return false;

    // Deactivate all styles
    for (const s of this.knownStyles) {
      s.isActive = false;
    }
    // Activate the chosen one
    style.isActive = true;
    this.activeStyleId = styleId;
    this.activeMartialBonuses = calculateCombinedStyle(this.knownStyles);
    return true;
  }
  
}
