import { Socket } from 'socket.io';

export function safeHandler<T>(
  socket: Socket,
  handler: (data: T) => Promise<void> | void
): (data: T) => void {
  return (data: T) => {
    try {
      const result = handler(data);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error(`[Socket Handler Error] (socket ${socket.id}):`, err);
          socket.emit('error', { message: 'Error interno del servidor al procesar la solicitud.' });
        });
      }
    } catch (err) {
      console.error(`[Socket Handler Error] (socket ${socket.id}):`, err);
      socket.emit('error', { message: 'Error interno del servidor al procesar la solicitud.' });
    }
  };
}
