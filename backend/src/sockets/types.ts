import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { TurnTracker, PersistentSpell } from '../types/combat';

export interface RoomState {
  npcManagers: Map<string, Map<string, any>>;
  activeProgressionDrafts: Record<string, unknown>;
  activeCombats: Record<string, unknown>;
  activeTurnTrackers: Record<string, TurnTracker>;
  activePersistentSpells: Record<string, PersistentSpell[]>;
}

export interface HandlerContext {
  io: Server;
  socket: Socket;
  prisma: PrismaClient;
  roomState: RoomState;
}
