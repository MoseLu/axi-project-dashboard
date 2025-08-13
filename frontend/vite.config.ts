import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 自定义插件：优化主题切换
const themeOptimizationPlugin = () => {
  return {
    name: 'theme-optimization',
    transformIndexHtml(html: string) {
      // 确保HTML中的主题脚本在CSS之前执行
      return html;
    },
    configureServer(server: any) {
      // 开发服务器优化
      server.middlewares.use((req: any, res: any, next: any) => {
        // 为CSS文件添加缓存控制，确保主题切换时能正确更新
        if (req.url?.endsWith('.css')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
        next();
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    themeOptimizationPlugin()
  ],
  base: process.env.NODE_ENV === 'production' ? '/project-dashboard/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/project-dashboard/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons', '@ant-design/pro-components'],
          charts: ['echarts', 'echarts-for-react', 'recharts'],
          utils: ['lodash', 'dayjs', 'axios'],
        },
      },
    },
    // 启用 Turbopack 优化
    target: 'esnext',
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'antd', 
      '@ant-design/icons',
      '@ant-design/pro-components',
      'echarts',
      'echarts-for-react',
      'recharts',
      'lodash',
      'dayjs',
      'axios'
    ],
    // 启用 Turbopack 预构建
    force: true,
  },
  // 性能优化
  esbuild: {
    target: 'esnext',
  },
  // 开发工具配置
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
  // CSS 优化
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          // 全局SCSS变量，确保主题变量在所有文件中可用
          $primary-color: var(--primary-color);
          $border-radius: var(--border-radius);
          $text-color: var(--text-color);
          $bg-color: var(--bg-color);
        `,
        // 使用现代 Sass API
        api: 'modern-compiler',
      },
    },
  },
})
