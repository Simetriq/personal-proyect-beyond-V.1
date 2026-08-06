import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { RoomState, HandlerContext } from './types';
import { registerCombatHandlers } from './handlers/combatHandlers';
import { registerTurnHandlers } from './handlers/turnHandlers';
import { registerMagicHandlers } from './handlers/magicHandlers';
import { registerGMHandlers } from './handlers/gmHandlers';
import { registerCharacterHandlers } from './handlers/characterHandlers';

const prisma = new PrismaClient({ log: ['info'] });

const roomState: RoomState = {
  npcManagers: new Map(),
  activeProgressionDrafts: {},
  activeCombats: {},
  activeTurnTrackers: {},
  activePersistentSpells: {},
};

export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    const ctx: HandlerContext = { io, socket, prisma, roomState };
    
    registerCharacterHandlers(ctx);
    registerCombatHandlers(ctx);
    registerTurnHandlers(ctx);
    registerMagicHandlers(ctx);
    registerGMHandlers(ctx);
  });
}
