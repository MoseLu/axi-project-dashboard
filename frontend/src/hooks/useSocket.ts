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
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const url = buildWsUrl();
    const options: any = {
      path: '/project-dashboard/ws/socket.io',
      transports: ['polling', 'websocket'], // 先尝试polling，再尝试websocket
      withCredentials: true,
      // 重连配置
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, // 增加超时时间
      // 调试配置
      forceNew: true,
      autoConnect: true,
      // 添加额外的调试信息
      upgrade: true,
      rememberUpgrade: false
    };
    
    if (token) {
      options.auth = { token };
    }

    console.log('WebSocket connection attempt:', { 
      url, 
      options: {
        ...options,
        auth: options.auth ? { token: options.auth.token ? `${options.auth.token.substring(0, 10)}...` : 'none' } : 'none'
      },
      attempt: connectionAttempts + 1
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
    setConnectionAttempts(prev => prev + 1);

    const socket = io(url, options);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setConnected(true);
      setConnectionError(null);
      setIsConnecting(false);
      setConnectionAttempts(0); // 重置尝试次数
    });
    
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      setIsConnecting(false);
      
      // 根据断开原因提供不同的处理
      if (reason === 'io server disconnect') {
        // 服务器主动断开，尝试重连
        console.log('Server disconnected, attempting to reconnect...');
        socket.connect();
      } else if (reason === 'io client disconnect') {
        // 客户端主动断开
        console.log('Client disconnected');
      } else {
        // 其他原因（网络问题等）
        console.log('Connection lost due to:', reason);
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
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
        errorMessage = 'WebSocket连接错误，可能服务器不支持WebSocket或配置有误';
      } else if (error.message.includes('xhr poll error')) {
        errorMessage = '轮询连接失败，请检查网络连接';
      } else if (error.message.includes('CORS')) {
        errorMessage = '跨域访问被拒绝，请联系管理员检查CORS配置';
      }
      
      setConnectionError(errorMessage);
      
      // 如果连接尝试次数过多，停止重连
      if (connectionAttempts >= 3) {
        console.log('Too many connection attempts, stopping reconnection');
        setConnectionError('连接失败次数过多，请刷新页面重试');
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setConnectionError(null);
      setIsConnecting(false);
      setConnectionAttempts(0);
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
    }, 25000);

    return () => {
      clearTimeout(connectionTimeout);
      try { 
        socket.disconnect(); 
      } catch (error) {
        console.warn('Error disconnecting socket on cleanup:', error);
      }
      socketRef.current = null;
    };
  }, [token, connectionAttempts]);

  return { 
    socket: socketRef.current, 
    connected, 
    lastEvent, 
    connectionError,
    isConnecting,
    connectionAttempts,
    // 添加手动重连方法
    reconnect: () => {
      if (socketRef.current) {
        console.log('Manual reconnection attempt');
        socketRef.current.connect();
      }
    }
  };
};

