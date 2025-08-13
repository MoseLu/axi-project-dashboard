import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeSettings {
  primaryColor: string;
  borderRadius: number;
  menuLayout: 'side' | 'top';
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showBreadcrumb: boolean;
  showFooter: boolean;
  animationEnabled: boolean;
  glassEffect: boolean;
}

interface SettingsContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
  loadSettings: () => void;
  getCurrentDisplayTheme: () => 'light' | 'dark';
}

const defaultSettings: ThemeSettings = {
  primaryColor: '#667eea',
  borderRadius: 8,
  menuLayout: 'side',
  theme: 'dark',
  compactMode: false,
  showBreadcrumb: true,
  showFooter: false,
  animationEnabled: true,
  glassEffect: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('axi-dashboard-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const updatedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(updatedSettings);
        // 只在主题发生变化时才重新应用，避免与HTML内联脚本冲突
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const expectedTheme = updatedSettings.theme === 'auto' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : updatedSettings.theme;
        
        if (currentTheme !== expectedTheme) {
          applySettings(updatedSettings);
        } else {
          // 只应用非主题相关的设置
          applyNonThemeSettings(updatedSettings);
        }
      } else {
        // 如果没有保存的设置，应用默认设置
        applyNonThemeSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      applyNonThemeSettings(defaultSettings);
    }
  };

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // 如果主题发生变化，触发动画
    if (newSettings.theme && newSettings.theme !== settings.theme) {
      const oldTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
      const newTheme = newSettings.theme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : newSettings.theme;
      
      // 触发主题切换动画
      if ((window as any).triggerThemeTransition) {
        (window as any).triggerThemeTransition(oldTheme, newTheme);
      }
    }
    
    setSettings(updatedSettings);
    applySettings(updatedSettings);
    
    // 保存到localStorage
    try {
      localStorage.setItem('axi-dashboard-settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.removeItem('axi-dashboard-settings');
  };

  // 获取当前实际显示的主题（用于图标显示）
  const getCurrentDisplayTheme = () => {
    if (settings.theme === 'light') return 'light';
    if (settings.theme === 'dark') return 'dark';
    // 如果是auto，根据当前实际显示的主题
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  };

  // 应用非主题相关的设置（避免与HTML内联脚本冲突）
  const applyNonThemeSettings = (newSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    // 应用CSS变量
    root.style.setProperty('--primary-color', newSettings.primaryColor);
    root.style.setProperty('--border-radius', `${newSettings.borderRadius}px`);
    root.style.setProperty('--border-radius-sm', `${Math.max(0, newSettings.borderRadius - 2)}px`);
    root.style.setProperty('--border-radius-lg', `${newSettings.borderRadius + 2}px`);
    
    // 应用毛玻璃效果
    if (newSettings.glassEffect) {
      root.style.setProperty('--glass-effect', 'blur(20px)');
      // 浅色主题的毛玻璃效果
      if (root.getAttribute('data-theme') !== 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.3)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.9)');
      } else {
        // 深色主题的毛玻璃效果
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.9)');
      }
    } else {
      root.style.setProperty('--glass-effect', 'none');
      // 关闭毛玻璃效果
      if (root.getAttribute('data-theme') !== 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.95)');
      } else {
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.95)');
      }
    }

    // 应用紧凑模式
    if (newSettings.compactMode) {
      document.body.classList.add('compact-mode');
      // 紧凑模式下的样式调整
      root.style.setProperty('--spacing-xs', '2px');
      root.style.setProperty('--spacing-sm', '4px');
      root.style.setProperty('--spacing-md', '8px');
    } else {
      document.body.classList.remove('compact-mode');
      // 正常模式下的样式调整
      root.style.setProperty('--spacing-xs', '4px');
      root.style.setProperty('--spacing-sm', '8px');
      root.style.setProperty('--spacing-md', '16px');
    }
  };

  const applySettings = (newSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    // 应用CSS变量
    root.style.setProperty('--primary-color', newSettings.primaryColor);
    root.style.setProperty('--border-radius', `${newSettings.borderRadius}px`);
    root.style.setProperty('--border-radius-sm', `${Math.max(0, newSettings.borderRadius - 2)}px`);
    root.style.setProperty('--border-radius-lg', `${newSettings.borderRadius + 2}px`);
    
    // 应用毛玻璃效果
    if (newSettings.glassEffect) {
      root.style.setProperty('--glass-effect', 'blur(20px)');
      // 浅色主题的毛玻璃效果
      if (root.getAttribute('data-theme') !== 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.3)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.9)');
      } else {
        // 深色主题的毛玻璃效果
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.8)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.9)');
      }
    } else {
      root.style.setProperty('--glass-effect', 'none');
      // 关闭毛玻璃效果
      if (root.getAttribute('data-theme') !== 'dark') {
        root.style.setProperty('--content-glass-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(255, 255, 255, 0.95)');
      } else {
        root.style.setProperty('--content-glass-bg', 'rgba(20, 20, 20, 0.95)');
        root.style.setProperty('--content-glass-border', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--header-bg', 'rgba(20, 20, 20, 0.98)');
        root.style.setProperty('--sider-bg', 'rgba(20, 20, 20, 0.95)');
      }
    }

    // 应用主题 - 使用data-theme属性
    if (newSettings.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (newSettings.theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      // auto theme - 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
      }
    }

    // 应用紧凑模式
    if (newSettings.compactMode) {
      document.body.classList.add('compact-mode');
      // 紧凑模式下的样式调整
      root.style.setProperty('--spacing-xs', '2px');
      root.style.setProperty('--spacing-sm', '4px');
      root.style.setProperty('--spacing-md', '8px');
      root.style.setProperty('--spacing-lg', '16px');
      root.style.setProperty('--spacing-xl', '24px');
    } else {
      document.body.classList.remove('compact-mode');
      // 恢复正常间距
      root.style.setProperty('--spacing-xs', '4px');
      root.style.setProperty('--spacing-sm', '8px');
      root.style.setProperty('--spacing-md', '16px');
      root.style.setProperty('--spacing-lg', '24px');
      root.style.setProperty('--spacing-xl', '32px');
    }

    // 应用动画设置
    if (!newSettings.animationEnabled) {
      document.body.classList.add('no-animation');
      // 禁用动画时的样式
      root.style.setProperty('--sider-transition-duration', '0s');
      root.style.setProperty('--sider-title-transition', '0s');
      root.style.setProperty('--sider-menu-transition', '0s');
    } else {
      document.body.classList.remove('no-animation');
      // 恢复动画
      root.style.setProperty('--sider-transition-duration', '0.3s');
      root.style.setProperty('--sider-title-transition', '0.2s cubic-bezier(0.4, 0, 0.2, 1)');
      root.style.setProperty('--sider-menu-transition', '0.25s cubic-bezier(0.4, 0, 0.2, 1)');
    }

    // 面包屑和页脚显示设置通过 React 条件渲染处理，不需要 DOM 操作

    // 菜单布局设置通过 React 条件渲染处理，不需要 DOM 操作
  };

  useEffect(() => {
    loadSettings();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (settings.theme === 'auto') {
        applySettings(settings);
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // 只在设置发生变化时应用，避免初始化时的重复应用
  useEffect(() => {
    // 跳过初始化时的应用，因为loadSettings已经处理了
    if (settings !== defaultSettings) {
      applySettings(settings);
    }
  }, [settings.theme, settings.primaryColor, settings.borderRadius, settings.glassEffect, settings.compactMode, settings.animationEnabled]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      loadSettings,
      getCurrentDisplayTheme,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
