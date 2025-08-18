import { Router } from 'express';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * WebSocket连接测试端点
 * GET /websocket-test
 */
router.get('/', (req, res) => {
  try {
    logger.info('WebSocket test endpoint accessed', {
      headers: req.headers,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'WebSocket test endpoint is working',
      timestamp: new Date().toISOString(),
      headers: {
        upgrade: req.headers.upgrade,
        connection: req.headers.connection,
        'sec-websocket-key': req.headers['sec-websocket-key'],
        'sec-websocket-version': req.headers['sec-websocket-version'],
        'sec-websocket-protocol': req.headers['sec-websocket-protocol']
      },
      socketPath: '/project-dashboard/ws/socket.io/',
      instructions: [
        '1. 确保后端Socket.IO服务器正在运行',
        '2. 确保nginx配置正确转发WebSocket请求',
        '3. 检查防火墙和网络连接',
        '4. 验证CORS配置'
      ]
    });
  } catch (error) {
    logger.error('WebSocket test failed:', error);
    res.status(500).json({
      success: false,
      message: 'WebSocket test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Socket.IO路径测试
 * GET /websocket-test/path
 */
router.get('/path', (req, res) => {
  try {
    const socketPath = '/project-dashboard/ws/socket.io/';
    const testUrl = `${req.protocol}://${req.get('host')}${socketPath}`;
    
    res.json({
      success: true,
      message: 'Socket.IO path test',
      socketPath,
      testUrl,
      expectedClientConfig: {
        path: '/project-dashboard/ws/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true
      },
      nginxConfig: {
        location: '/project-dashboard/ws/',
        proxyPass: 'http://websocket/project-dashboard/ws/',
        headers: [
          'Upgrade: $http_upgrade',
          'Connection: upgrade',
          'Host: $host'
        ]
      }
    });
  } catch (error) {
    logger.error('Socket.IO path test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Socket.IO path test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
