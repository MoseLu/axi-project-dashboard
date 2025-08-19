import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// 定义指标
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route']
});

const activeConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

const deploymentStatus = new Gauge({
  name: 'deployment_status',
  help: 'Deployment status (1=success, 0=failed)',
  labelNames: ['project', 'status']
});

const deploymentDuration = new Histogram({
  name: 'deployment_duration_seconds',
  help: 'Deployment duration in seconds',
  labelNames: ['project']
});

const systemMetrics = {
  cpuUsage: new Gauge({
    name: 'system_cpu_usage_percent',
    help: 'System CPU usage percentage'
  }),
  memoryUsage: new Gauge({
    name: 'system_memory_usage_percent',
    help: 'System memory usage percentage'
  }),
  diskUsage: new Gauge({
    name: 'system_disk_usage_percent',
    help: 'System disk usage percentage'
  })
};

export const prometheusMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path
    }, duration);
  });
  
  next();
};

export const metrics = {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  deploymentStatus,
  deploymentDuration,
  systemMetrics
};

// 默认指标收集
register.setDefaultLabels({
  app: 'axi-project-dashboard',
  version: '1.0.0'
});

// 启用默认指标收集
register.metrics();
