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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const url = buildWsUrl();
    const options: any = {
      path: '/project-dashboard/ws/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      // 添加重连配置
      reconnection: true,
      reconnectionAttempts: 3, // 减少重连次数
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // 减少超时时间
      // 添加调试信息
      forceNew: true,
      autoConnect: true
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

    // 如果已有连接，先断开
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (error) {
        console.warn('Error disconnecting existing socket:', error);
      }
    }

    setIsConnecting(true);
    setConnectionError(null);

    const socket = io(url, options);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setConnected(true);
      setConnectionError(null);
      setIsConnecting(false);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      setIsConnecting(false);
      if (reason === 'io server disconnect') {
        // 服务器主动断开，尝试重连
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        description: error.description,
        context: error.context
      });
      setConnected(false);
      setIsConnecting(false);
      
      // 根据错误类型提供友好的错误信息
      let errorMessage = 'WebSocket连接失败';
      if (error.message.includes('timeout')) {
        errorMessage = '连接超时，请检查网络连接';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '后端服务未启动，请联系管理员';
      } else if (error.message.includes('websocket error')) {
        errorMessage = 'WebSocket连接错误，请刷新页面重试';
      }
      
      setConnectionError(errorMessage);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setConnectionError(null);
      setIsConnecting(false);
    });

    socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      setConnectionError('重连失败，请检查网络连接');
      setIsConnecting(false);
    });

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setConnectionError('连接失败，实时功能不可用，但其他功能正常');
      setIsConnecting(false);
    });
    
    socket.on('event', (evt: SocketEvent) => setLastEvent(evt));
    socket.on('heartbeat', () => {
      console.log('WebSocket heartbeat received');
    });

    // 设置连接超时
    const connectionTimeout = setTimeout(() => {
      if (!connected && !isConnecting) {
        setConnectionError('连接超时，实时功能不可用');
        setIsConnecting(false);
      }
    }, 15000);

    return () => {
      clearTimeout(connectionTimeout);
      try { 
        socket.disconnect(); 
      } catch (error) {
        console.warn('Error disconnecting socket on cleanup:', error);
      }
      socketRef.current = null;
    };
  }, [token, connected, isConnecting]);

  return { 
    socket: socketRef.current, 
    connected, 
    lastEvent, 
    connectionError,
    isConnecting,
    // 添加手动重连方法
    reconnect: () => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }
  };
};

