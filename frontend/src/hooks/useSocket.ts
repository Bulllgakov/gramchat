import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWsUrl } from '../config/api.config';

let socket: Socket | null = null;

export function useSocket(shopId: string | undefined) {
  useEffect(() => {
    if (!shopId) return;

    if (!socket) {
      socket = io(getWsUrl(), {
        transports: ['websocket'],
        upgrade: false
      });
    }

    socket.emit('join-shop', shopId);
    console.log(`Joined shop room: shop-${shopId}`);

    return () => {
      if (socket) {
        socket.emit('leave-shop', shopId);
      }
    };
  }, [shopId]);

  return socket;
}