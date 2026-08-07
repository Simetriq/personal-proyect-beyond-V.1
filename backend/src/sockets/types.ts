import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { TurnTracker, PersistentSpell } from '../types/combat';
import { Character } from '../domain/Character';

export interface ActiveCombat {
  campaignId: string;
  attackerId: string;
  targetId: string;
  attackRoll: number;
  baseDamage: number;
  damageType: string;
  attackerName: string;
  modifiers?: Record<string, unknown>;
  weaponCard?: Record<string, unknown>;
}

export interface RoomState {
  npcManagers: Map<string, Map<string, Character>>;
  activeProgressionDrafts: Record<string, unknown>;
  activeCombats: Record<string, ActiveCombat>;
  activeTurnTrackers: Record<string, TurnTracker>;
  activePersistentSpells: Record<string, PersistentSpell[]>;
}

export interface HandlerContext {
  io: Server;
  socket: Socket;
  prisma: PrismaClient;
  roomState: RoomState;
}
