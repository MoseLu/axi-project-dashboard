import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { buildWsUrl } from '../config/env';

export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: string | Date;
}

export const useSocket = (token?: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);

  useEffect(() => {
    const url = buildWsUrl();
    const options: any = {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    };
    if (token) {
      options.auth = { token };
    }

    const socket = io(url, options);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('event', (evt: SocketEvent) => setLastEvent(evt));
    socket.on('heartbeat', () => {});

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);

  return { socket: socketRef.current, connected, lastEvent };
};

