import Fastify from 'fastify';
import { Server } from 'socket.io';
import { setupSocketEvents } from './sockets/events';

const fastify = Fastify({ logger: true });

async function startServer() {
  try {
    // Inicializar Fastify
    await fastify.ready();

    // Integrar Socket.IO con el servidor nativo de Node provisto por Fastify
    const io = new Server(fastify.server, {
      cors: {
        origin: '*', // En producción deberíamos limitar esto
        methods: ['GET', 'POST']
      }
    });

    // Configurar Eventos
    setupSocketEvents(io);

    // Endpoint básico para comprobar estado
    fastify.get('/ping', async (request, reply) => {
      return { status: 'ok', time: new Date().toISOString() };
    });

    // Arrancar el servidor
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor Anima Combat Assistant corriendo en http://localhost:${port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
