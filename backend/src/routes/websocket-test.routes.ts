import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';

const router: Router = Router();

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

/**
 * 详细的WebSocket诊断
 * GET /websocket-test/diagnose
 */
router.get('/diagnose', (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol;
    const socketPath = '/project-dashboard/ws/socket.io/';
    const wsUrl = `${protocol === 'https' ? 'wss' : 'ws'}://${host}${socketPath}`;
    
    const diagnosis = {
      success: true,
      message: 'WebSocket诊断报告',
      timestamp: new Date().toISOString(),
      
      // 客户端配置
      clientConfig: {
        url: wsUrl,
        path: '/project-dashboard/ws/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true
      },
      
      // 服务器配置
      serverConfig: {
        socketPath: '/project-dashboard/ws/socket.io/',
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true
        }
      },
      
      // nginx配置
      nginxConfig: {
        location: '/project-dashboard/ws/',
        proxyPass: 'http://websocket/project-dashboard/ws/',
        proxyHttpVersion: '1.1',
        headers: [
          'Upgrade: $http_upgrade',
          'Connection: upgrade',
          'Host: $host',
          'X-Real-IP: $remote_addr',
          'X-Forwarded-For: $proxy_add_x_forwarded_for',
          'X-Forwarded-Proto: $scheme'
        ],
        timeouts: {
          connect: '60s',
          send: '60s',
          read: '300s'
        }
      },
      
      // 诊断步骤
      diagnosticSteps: [
        {
          step: 1,
          description: '检查后端Socket.IO服务器状态',
          command: `curl -I ${protocol}://${host}/health`,
          expected: 'HTTP/1.1 200 OK'
        },
        {
          step: 2,
          description: '检查nginx配置语法',
          command: 'nginx -t',
          expected: 'nginx: configuration file /etc/nginx/nginx.conf test is successful'
        },
        {
          step: 3,
          description: '检查WebSocket端点可达性',
          command: `curl -I ${protocol}://${host}/project-dashboard/ws/socket.io/`,
          expected: 'HTTP/1.1 200 OK 或 101 Switching Protocols'
        },
        {
          step: 4,
          description: '检查nginx错误日志',
          command: 'tail -f /var/log/nginx/websocket_error.log',
          expected: '无错误信息'
        }
      ],
      
      // 常见问题解决方案
      troubleshooting: [
        {
          issue: 'WebSocket连接被拒绝',
          solutions: [
            '检查后端Socket.IO服务器是否正在运行',
            '验证nginx配置中的proxy_pass路径',
            '确认防火墙允许WebSocket连接'
          ]
        },
        {
          issue: 'CORS错误',
          solutions: [
            '检查Socket.IO CORS配置',
            '验证nginx CORS头部设置',
            '确认前端请求包含正确的Origin头部'
          ]
        },
        {
          issue: '连接超时',
          solutions: [
            '增加nginx超时设置',
            '检查网络连接稳定性',
            '验证上游服务器响应时间'
          ]
        }
      ]
    };
    
    res.json(diagnosis);
  } catch (error) {
    logger.error('WebSocket diagnosis failed:', error);
    res.status(500).json({
      success: false,
      message: 'WebSocket diagnosis failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 测试WebSocket连接
 * GET /websocket-test/connect
 */
router.get('/connect', (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol;
    const wsUrl = `${protocol === 'https' ? 'wss' : 'ws'}://${host}/project-dashboard/ws/socket.io/?EIO=4&transport=websocket`;
    
    res.json({
      success: true,
      message: 'WebSocket连接测试',
      testUrl: wsUrl,
      instructions: [
        '1. 在浏览器控制台中运行以下代码:',
        `2. const ws = new WebSocket('${wsUrl}');`,
        '3. ws.onopen = () => console.log("WebSocket连接成功");',
        '4. ws.onerror = (error) => console.error("WebSocket连接失败:", error);',
        '5. ws.onclose = (event) => console.log("WebSocket连接关闭:", event.code, event.reason);'
      ],
      expectedBehavior: {
        onOpen: '连接成功建立',
        onError: '连接失败，检查网络和服务器状态',
        onClose: '连接关闭，可能是服务器问题或网络中断'
      }
    });
  } catch (error) {
    logger.error('WebSocket connect test failed:', error);
    res.status(500).json({
      success: false,
      message: 'WebSocket connect test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
