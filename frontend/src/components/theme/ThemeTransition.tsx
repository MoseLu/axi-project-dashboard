import React, { useEffect, useRef, useState } from 'react';
import './ThemeTransition.css';

interface ThemeTransitionProps {
  isVisible: boolean;
  onAnimationComplete: () => void;
  oldTheme: 'light' | 'dark';
  newTheme: 'light' | 'dark';
}

const ThemeTransition: React.FC<ThemeTransitionProps> = ({
  isVisible,
  onAnimationComplete,
  oldTheme,
  newTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'animating' | 'complete'>('idle');

  useEffect(() => {
    if (isVisible && animationState === 'idle') {
      setAnimationState('animating');
      
      // 开始动画
      const container = containerRef.current;
      if (container) {
        // 设置初始状态 - 从右上角开始
        container.style.transform = 'scale(0)';
        container.style.opacity = '1';
        
        // 使用 requestAnimationFrame 确保动画流畅
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // 开始圆弧扩散动画 - 以右上角为圆心，半径逐渐增大
            container.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            // 计算需要扩展到左下角的缩放倍数
            const scale = Math.max(window.innerWidth, window.innerHeight) / 50; // 50是初始圆圈的半径
            container.style.transform = `scale(${scale})`;
            
            // 动画完成后清理
            setTimeout(() => {
              setAnimationState('complete');
              onAnimationComplete();
            }, 800);
          });
        });
      }
    } else if (!isVisible && animationState === 'complete') {
      // 重置状态
      setAnimationState('idle');
      const container = containerRef.current;
      if (container) {
        container.style.transition = 'none';
        container.style.transform = 'scale(0)';
        container.style.opacity = '0';
      }
    }
  }, [isVisible, animationState, onAnimationComplete]);

  if (!isVisible && animationState === 'idle') {
    return null;
  }

  return (
    <div className="theme-transition-overlay">
      <div
        ref={containerRef}
        className={`theme-transition-container ${oldTheme}-to-${newTheme}`}
        style={{
          transform: 'scale(0)',
          opacity: animationState === 'idle' ? '0' : '1',
        }}
      >
        {/* 旧主题 - 左侧圆弧 */}
        <div className="theme-transition-circle old-theme" />
        {/* 新主题 - 右侧圆弧 */}
        <div className="theme-transition-circle new-theme" />
      </div>
    </div>
  );
};

export default ThemeTransition;
