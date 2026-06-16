export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: 'attack_hit' | 'attack_miss' | 'system' | 'critical';
  characterId: string;
  characterName: string;
  message: string;
  isSecret: boolean;
  mathDetails?: {
    roll: number;
    modifier: number;
    total: number;
    defenseTotal?: number;
    damageFinal?: number;
  };
}
