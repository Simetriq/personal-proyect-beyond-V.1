export interface CombatLogEntry {
  id: string;
  timestamp: string;
  type: 'attack_hit' | 'attack_miss' | 'critical' | 'fumble';
  attackerName: string;
  targetName: string;
  payload: {
    attackTotal: number;
    defenseTotal: number;
    defenseType: 'BLOCK' | 'DODGE';
    damageDealt: number;
    armorMitigation: number;
    finalHpMinus: number;
    isCritical: boolean;
    criticalEffect?: string;
  };
}
