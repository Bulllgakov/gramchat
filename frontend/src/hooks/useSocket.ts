import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWsUrl } from '../config/api.config';

let socket: Socket | null = null;

export function useSocket(botId: string | undefined) {
  useEffect(() => {
    if (!botId) return;

    if (!socket) {
      socket = io(getWsUrl(), {
        transports: ['websocket'],
        upgrade: false
      });
    }

    socket.emit('join-bot', botId);
    console.log(`Joined bot room: bot-${botId}`);

    return () => {
      if (socket) {
        socket.emit('leave-bot', botId);
      }
    };
  }, [botId]);

  return socket;
}