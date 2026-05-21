import Fastify from 'fastify';
import { Server } from 'socket.io';
import { setupSocketEvents } from './sockets/events';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

async function startServer() {
  try {
    // Responde solicitudes de estado
    fastify.get('/ping', async (request, reply) => {
      return { status: 'ok', time: new Date().toISOString() };
    });

    // Inicializa el servidor Fastify
    await fastify.ready();

    // Asegurar que exista un usuario GM por defecto
    const gmUser = await prisma.user.upsert({
      where: { email: 'gm@anima.com' },
      update: {},
      create: {
        id: 'user-gm-1',
        email: 'gm@anima.com',
        name: 'Game Master Default'
      }
    });

    // Asegurar que la campaña por defecto exista
    await prisma.campaign.upsert({
      where: { id: 'camp-1' },
      update: {},
      create: {
        id: 'camp-1',
        name: 'La Sombra del Omega',
        gmId: gmUser.id
      }
    });
    console.log("🚀 Campaña 'camp-1' verificada/creada en PostgreSQL");

    // Configura el servidor Socket.IO
    const io = new Server(fastify.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Registra los eventos de websockets
    setupSocketEvents(io);

    // Inicia el servidor web
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor Anima Combat Assistant corriendo en http://localhost:${port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
