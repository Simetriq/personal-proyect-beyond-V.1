import { Socket } from 'socket.io';

export function safeHandler<T>(
  handler: (data: T) => Promise<void> | void
): (data: T) => void {
  return (data: T) => {
    try {
      const result = handler(data);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error('[Socket Handler Error]', err);
        });
      }
    } catch (err) {
      console.error('[Socket Handler Error]', err);
    }
  };
}
