const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8090;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// 简单的内存存储
const deploymentStore = {
  deployments: [],
  metrics: {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    averageDeploymentTime: 0
  }
};

// 添加部署记录的函数
function addDeployment(project, status, duration = 0) {
  const deployment = {
    id: Date.now(),
    project_name: project,
    status,
    duration,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  deploymentStore.deployments.unshift(deployment);
  deploymentStore.deployments = deploymentStore.deployments.slice(0, 50);
  
  // 更新指标
  deploymentStore.metrics.totalDeployments++;
  if (status === 'success') {
    deploymentStore.metrics.successfulDeployments++;
  } else {
    deploymentStore.metrics.failedDeployments++;
  }
  
  // 计算平均部署时间
  const successfulDeployments = deploymentStore.deployments.filter(d => d.status === 'success' && d.duration > 0);
  if (successfulDeployments.length > 0) {
    const totalTime = successfulDeployments.reduce((sum, d) => sum + d.duration, 0);
    deploymentStore.metrics.averageDeploymentTime = Math.round(totalTime / successfulDeployments.length);
  }
  
  console.log(`📊 部署记录已添加: ${project} - ${status}`);
}

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 部署数据端点
app.get('/api/deployments', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const paginatedDeployments = deploymentStore.deployments.slice(start, end);
  
  res.json({
    success: true,
    message: 'Deployments retrieved successfully',
    data: paginatedDeployments,
    pagination: {
      page,
      limit,
      total: deploymentStore.deployments.length,
      totalPages: Math.ceil(deploymentStore.deployments.length / limit),
      hasNext: end < deploymentStore.deployments.length,
      hasPrev: page > 1
    }
  });
});

// 指标端点
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics retrieved successfully',
    data: deploymentStore.metrics
  });
});

// 手动添加部署记录端点（用于测试）
app.post('/api/deployments', (req, res) => {
  try {
    const { project, status, duration } = req.body;
    
    if (!project || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project, status'
      });
    }
    
    addDeployment(project, status, duration || 0);
    
    res.json({
      success: true,
      message: 'Deployment record added successfully',
      data: { project, status, duration }
    });
  } catch (error) {
    console.error('添加部署记录时出错:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 根端点
app.get('/', (req, res) => {
  res.json({
    message: 'axi-project-dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 axi-project-dashboard server is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API URL: http://localhost:${port}/api`);
  
  // 添加一些示例数据
  addDeployment('axi-star-cloud', 'success', 45);
  addDeployment('axi-project-dashboard', 'success', 32);
  addDeployment('axi-deploy', 'failed', 120);
  addDeployment('axi-docs', 'success', 28);
  addDeployment('test-project', 'success', 67);
  
  console.log('📊 示例数据已添加');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
