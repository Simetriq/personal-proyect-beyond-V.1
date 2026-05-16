import Fastify from 'fastify';
import { Server } from 'socket.io';
import { setupSocketEvents } from './sockets/events';

const fastify = Fastify({ logger: true });

async function startServer() {
  try {
    // Inicializa el servidor Fastify
    await fastify.ready();

    // Configura el servidor Socket.IO
    const io = new Server(fastify.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Registra los eventos de websockets
    setupSocketEvents(io);

    // Responde solicitudes de estado
    fastify.get('/ping', async (request, reply) => {
      return { status: 'ok', time: new Date().toISOString() };
    });

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
