// 环境配置
interface EnvConfig {
  baseUrl: string;
  apiPrefix: string;
  isProduction: boolean;
  isDevelopment: boolean;
  wsPath: string;
  wsPort?: number;
}

const getEnvConfig = (): EnvConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  // const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 生产环境配置
  if (isProduction) {
    return {
      baseUrl: 'https://redamancy.com.cn',
      apiPrefix: '/project-dashboard/api',
      isProduction: true,
      isDevelopment: false,
      wsPath: '/project-dashboard/ws',
      wsPort: 8090 // 生产环境WebSocket端口
    };
  }
  
  // 开发环境配置
  return {
    baseUrl: 'http://localhost:8081',
    apiPrefix: '/project-dashboard/api',
    isProduction: false,
    isDevelopment: true,
    wsPath: '/project-dashboard/ws',
    wsPort: 8081 // 开发环境使用相同端口
  };
};

export const envConfig = getEnvConfig();

// API URL 构建器
export const buildApiUrl = (endpoint: string): string => {
  return `${envConfig.baseUrl}${envConfig.apiPrefix}${endpoint}`;
};

// 页面 URL 构建器
export const buildPageUrl = (path: string): string => {
  if (envConfig.isProduction) {
    return `${envConfig.baseUrl}/project-dashboard${path}`;
  }
  return `${envConfig.baseUrl}${path}`;
};

// 静态资源 URL 构建器
export const buildStaticUrl = (path: string): string => {
  return `${envConfig.baseUrl}${path}`;
};

// WebSocket URL 构建器
export const buildWsUrl = (): string => {
  const isHttps = envConfig.baseUrl.startsWith('https://');
  const wsScheme = isHttps ? 'wss' : 'ws';
  
  if (envConfig.isProduction) {
    // 生产环境：使用域名，不指定端口（由nginx代理）
    const host = envConfig.baseUrl.replace(/^https?:\/\//, '');
    return `${wsScheme}://${host}${envConfig.wsPath}`;
  } else {
    // 开发环境：使用localhost和指定端口
    const port = envConfig.wsPort || 8081;
    return `${wsScheme}://localhost:${port}${envConfig.wsPath}`;
  }
};

export default envConfig;
