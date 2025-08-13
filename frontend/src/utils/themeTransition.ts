/**
 * 主题切换动画工具
 * 提供全局的主题切换动画功能，实现以右上角为圆心，半径逐渐增大的第三象限圆弧效果
 */

export interface ThemeTransitionConfig {
  duration?: number;
  easing?: string;
  origin?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface ThemeColors {
  light: string;
  dark: string;
}

class ThemeTransitionManager {
  private overlay: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private isAnimating = false;
  private config: Required<ThemeTransitionConfig> = {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    origin: 'top-right',
  };

  constructor(config?: Partial<ThemeTransitionConfig>) {
    this.config = { ...this.config, ...config };
    this.init();
  }

  private init() {
    // 创建动画容器
    this.createOverlay();
  }

  private createOverlay() {
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'theme-transition-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;

    // 创建动画容器 - 以右上角为原点
    this.container = document.createElement('div');
    this.container.className = 'theme-transition-container';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      transform-origin: top right;
      will-change: transform;
    `;

    this.overlay.appendChild(this.container);
  }

  /**
   * 触发主题切换动画
   * @param oldTheme 旧主题
   * @param newTheme 新主题
   * @param colors 主题颜色配置
   */
  public trigger(
    oldTheme: 'light' | 'dark',
    newTheme: 'light' | 'dark',
    colors?: Partial<ThemeColors>
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }

      // 检查用户偏好
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        resolve();
        return;
      }

      this.isAnimating = true;

      // 设置主题颜色
      const defaultColors: ThemeColors = {
        light: '#ffffff',
        dark: '#000000',
      };
      const themeColors = { ...defaultColors, ...colors };

      // 创建圆弧元素
      this.createCircles(oldTheme, newTheme, themeColors);

      // 添加到DOM
      if (!this.overlay!.parentNode) {
        document.body.appendChild(this.overlay!);
      }

      // 开始动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.startAnimation(resolve);
        });
      });
    });
  }

  private createCircles(oldTheme: 'light' | 'dark', newTheme: 'light' | 'dark', colors: ThemeColors) {
    if (!this.container) return;

    // 清空现有内容
    this.container.innerHTML = '';

    // 创建旧主题圆圈 - 左侧圆弧
    const oldCircle = document.createElement('div');
    oldCircle.className = 'theme-transition-circle old-theme';
    oldCircle.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${oldTheme === 'dark' ? colors.dark : colors.light};
      z-index: 2;
      clip-path: polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%);
    `;

    // 创建新主题圆圈 - 右侧圆弧
    const newCircle = document.createElement('div');
    newCircle.className = 'theme-transition-circle new-theme';
    newCircle.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${newTheme === 'dark' ? colors.dark : colors.light};
      z-index: 1;
      clip-path: polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%);
    `;

    this.container.appendChild(oldCircle);
    this.container.appendChild(newCircle);
  }

  private startAnimation(resolve: () => void) {
    if (!this.container) return;

    // 设置初始状态 - 从右上角开始
    this.container.style.transform = 'scale(0)';
    this.container.style.opacity = '1';

    // 开始圆弧扩散动画 - 以右上角为圆心，半径逐渐增大
    this.container.style.transition = `transform ${this.config.duration}ms ${this.config.easing}`;
    
    // 计算需要扩展到左下角的缩放倍数
    const scale = Math.max(window.innerWidth, window.innerHeight) / 50; // 50是初始圆圈的半径
    this.container.style.transform = `scale(${scale})`;

    // 动画完成后清理
    setTimeout(() => {
      this.cleanup();
      this.isAnimating = false;
      resolve();
    }, this.config.duration);
  }

  private cleanup() {
    if (this.container) {
      this.container.style.transition = 'none';
      this.container.style.transform = 'scale(0)';
      this.container.style.opacity = '0';
    }

    // 延迟移除DOM元素
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 100);
  }

  /**
   * 销毁实例
   */
  public destroy() {
    this.cleanup();
    this.overlay = null;
    this.container = null;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ThemeTransitionConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// 创建全局实例
let globalThemeTransition: ThemeTransitionManager | null = null;

/**
 * 获取全局主题切换实例
 */
export const getThemeTransition = (config?: Partial<ThemeTransitionConfig>): ThemeTransitionManager => {
  if (!globalThemeTransition) {
    globalThemeTransition = new ThemeTransitionManager(config);
  }
  return globalThemeTransition;
};

/**
 * 触发主题切换动画
 */
export const triggerThemeTransition = async (
  oldTheme: 'light' | 'dark',
  newTheme: 'light' | 'dark',
  colors?: Partial<ThemeColors>
): Promise<void> => {
  const transition = getThemeTransition();
  return transition.trigger(oldTheme, newTheme, colors);
};

/**
 * 销毁全局实例
 */
export const destroyThemeTransition = (): void => {
  if (globalThemeTransition) {
    globalThemeTransition.destroy();
    globalThemeTransition = null;
  }
};

/**
 * 检查是否支持主题切换动画
 */
export const isThemeTransitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const supportsTransform = CSS.supports('transform', 'scale(1)');
  const supportsTransition = CSS.supports('transition', 'all 0.3s');
  const supportsClipPath = CSS.supports('clip-path', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)');
  
  return supportsTransform && supportsTransition && supportsClipPath;
};

/**
 * 获取动画性能指标
 */
export const getThemeTransitionMetrics = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    supportsGPU: 'WebGLRenderingContext' in window,
    supportsCSSVariables: CSS.supports('color', 'var(--test)'),
    supportsTransform: CSS.supports('transform', 'scale(1)'),
    supportsTransition: CSS.supports('transition', 'all 0.3s'),
    supportsClipPath: CSS.supports('clip-path', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    devicePixelRatio: window.devicePixelRatio,
  };
};

export default ThemeTransitionManager;
