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
      path: '/project-dashboard/ws/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    };
    if (token) {
      options.auth = { token };
    }

    console.log('WebSocket connection attempt:', { 
      url, 
      options: {
        ...options,
        auth: options.auth ? { token: options.auth.token ? `${options.auth.token.substring(0, 10)}...` : 'none' } : 'none'
      }
    });
    const socket = io(url, options);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setConnected(true);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      setConnected(false);
    });
    
    socket.on('event', (evt: SocketEvent) => setLastEvent(evt));
    socket.on('heartbeat', () => {});

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);

  return { socket: socketRef.current, connected, lastEvent };
};

