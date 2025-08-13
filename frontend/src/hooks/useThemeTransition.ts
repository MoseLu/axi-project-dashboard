import { useCallback } from 'react';

export interface ThemeTransitionOptions {
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * 主题切换动画Hook
 * 提供便捷的主题切换动画触发方法
 */
export const useThemeTransition = () => {
  /**
   * 触发主题切换动画
   * @param oldTheme 旧主题
   * @param newTheme 新主题
   * @param options 动画选项
   */
  const triggerTransition = useCallback((
    oldTheme: 'light' | 'dark',
    newTheme: 'light' | 'dark',
    options: ThemeTransitionOptions = {}
  ) => {
    // 检查是否支持动画
    if (typeof window === 'undefined') return;
    
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // 如果用户偏好减少动画，直接切换主题
      return;
    }

    // 触发全局动画
    if ((window as any).triggerThemeTransition) {
      (window as any).triggerThemeTransition(oldTheme, newTheme);
    }
  }, []);

  /**
   * 检查是否支持主题切换动画
   */
  const isSupported = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // 检查是否支持CSS transform和transition
    const supportsTransform = CSS.supports('transform', 'scale(1)');
    const supportsTransition = CSS.supports('transition', 'all 0.3s');
    
    return supportsTransform && supportsTransition;
  }, []);

  /**
   * 获取动画性能指标
   */
  const getPerformanceMetrics = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    return {
      supportsGPU: 'WebGLRenderingContext' in window,
      supportsCSSVariables: CSS.supports('color', 'var(--test)'),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      devicePixelRatio: window.devicePixelRatio,
    };
  }, []);

  return {
    triggerTransition,
    isSupported,
    getPerformanceMetrics,
  };
};

export default useThemeTransition;
