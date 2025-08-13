/**
 * 主题工具函数
 * 提供优化的主题切换功能，避免样式水合问题
 */

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  borderRadius: number;
  glassEffect: boolean;
  compactMode: boolean;
  animationEnabled: boolean;
}

/**
 * 获取当前主题设置
 */
export const getCurrentTheme = (): ThemeConfig => {
  try {
    const savedSettings = localStorage.getItem('axi-dashboard-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        theme: settings.theme || 'dark',
        primaryColor: settings.primaryColor || '#667eea',
        borderRadius: settings.borderRadius || 8,
        glassEffect: settings.glassEffect !== false,
        compactMode: settings.compactMode || false,
        animationEnabled: settings.animationEnabled !== false,
      };
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
  }
  
  return {
    theme: 'dark',
    primaryColor: '#667eea',
    borderRadius: 8,
    glassEffect: true,
    compactMode: false,
    animationEnabled: true,
  };
};

/**
 * 应用主题到DOM（优化版本）
 */
export const applyThemeOptimized = (config: ThemeConfig): void => {
  const root = document.documentElement;
  
  // 使用 requestAnimationFrame 确保在下一帧应用主题，避免阻塞渲染
  requestAnimationFrame(() => {
    // 批量应用CSS变量，减少重排重绘
    const cssVars = {
      '--primary-color': config.primaryColor,
      '--border-radius': `${config.borderRadius}px`,
      '--border-radius-sm': `${Math.max(0, config.borderRadius - 2)}px`,
      '--border-radius-lg': `${config.borderRadius + 2}px`,
    };
    
    // 批量设置CSS变量
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // 应用主题
    const actualTheme = config.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.theme;
    
    root.setAttribute('data-theme', actualTheme);
    
    // 应用毛玻璃效果
    if (config.glassEffect) {
      root.style.setProperty('--glass-effect', 'blur(20px)');
      if (actualTheme === 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.9)');
      } else {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.3)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.9)');
      }
    } else {
      root.style.setProperty('--glass-effect', 'none');
      if (actualTheme === 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.95)');
      } else {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.95)');
      }
    }
    
    // 应用紧凑模式
    if (config.compactMode) {
      document.body.classList.add('compact-mode');
      root.style.setProperty('--spacing-xs', '2px');
      root.style.setProperty('--spacing-sm', '4px');
      root.style.setProperty('--spacing-md', '8px');
      root.style.setProperty('--spacing-lg', '16px');
      root.style.setProperty('--spacing-xl', '24px');
    } else {
      document.body.classList.remove('compact-mode');
      root.style.setProperty('--spacing-xs', '4px');
      root.style.setProperty('--spacing-sm', '8px');
      root.style.setProperty('--spacing-md', '16px');
      root.style.setProperty('--spacing-lg', '24px');
      root.style.setProperty('--spacing-xl', '32px');
    }
    
    // 应用动画设置
    if (!config.animationEnabled) {
      document.body.classList.add('no-animation');
      root.style.setProperty('--sider-transition-duration', '0s');
      root.style.setProperty('--sider-title-transition', '0s');
      root.style.setProperty('--sider-menu-transition', '0s');
    } else {
      document.body.classList.remove('no-animation');
      root.style.setProperty('--sider-transition-duration', '0.3s');
      root.style.setProperty('--sider-title-transition', '0.2s cubic-bezier(0.4, 0, 0.2, 1)');
      root.style.setProperty('--sider-menu-transition', '0.25s cubic-bezier(0.4, 0, 0.2, 1)');
    }
  });
};

/**
 * 保存主题设置
 */
export const saveThemeConfig = (config: ThemeConfig): void => {
  try {
    localStorage.setItem('axi-dashboard-settings', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save theme config:', error);
  }
};

/**
 * 监听系统主题变化
 */
export const watchSystemTheme = (callback: (isDark: boolean) => void): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // 返回清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

/**
 * 检查是否支持主题切换
 */
export const supportsThemeSwitching = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof localStorage !== 'undefined' && 
         typeof window.matchMedia !== 'undefined';
};

/**
 * 获取主题切换的性能指标
 */
export const getThemePerformanceMetrics = (): {
  supportsGPU: boolean;
  supportsCSSVariables: boolean;
  supportsLocalStorage: boolean;
} => {
  return {
    supportsGPU: typeof window !== 'undefined' && 'WebGLRenderingContext' in window,
    supportsCSSVariables: typeof window !== 'undefined' && CSS.supports('color', 'var(--test)'),
    supportsLocalStorage: typeof localStorage !== 'undefined',
  };
};

/**
 * 预加载主题资源
 */
export const preloadThemeResources = (): void => {
  // 预加载主题相关的CSS文件
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = '/src/styles/theme-transitions.css';
  document.head.appendChild(link);
};

/**
 * 优化主题切换的防抖函数
 */
export const debounceThemeChange = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
