// 环境配置
interface EnvConfig {
  baseUrl: string;
  apiPrefix: string;
  isProduction: boolean;
  isDevelopment: boolean;
  wsPath: string;
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
      wsPath: '/project-dashboard/ws'
    };
  }
  
  // 开发环境配置
  return {
    baseUrl: 'http://localhost:8081',
    apiPrefix: '/project-dashboard/api',
    isProduction: false,
    isDevelopment: true,
    wsPath: '/project-dashboard/ws'
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
  const host = envConfig.baseUrl.replace(/^https?:\/\//, '');
  return `${wsScheme}://${host}${envConfig.wsPath}`;
};

export default envConfig;
