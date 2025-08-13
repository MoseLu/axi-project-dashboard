import React, { useState, useCallback } from 'react';
import ThemeTransition from './ThemeTransition';

interface ThemeTransitionManagerProps {
  children: React.ReactNode;
}

interface ThemeTransitionState {
  isVisible: boolean;
  oldTheme: 'light' | 'dark';
  newTheme: 'light' | 'dark';
}

export const ThemeTransitionManager: React.FC<ThemeTransitionManagerProps> = ({ children }) => {
  const [transitionState, setTransitionState] = useState<ThemeTransitionState>({
    isVisible: false,
    oldTheme: 'dark',
    newTheme: 'light',
  });

  const triggerThemeTransition = useCallback((oldTheme: 'light' | 'dark', newTheme: 'light' | 'dark') => {
    setTransitionState({
      isVisible: true,
      oldTheme,
      newTheme,
    });
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  // 暴露给全局使用的方法
  React.useEffect(() => {
    // 将触发方法挂载到全局对象上，供其他组件调用
    (window as any).triggerThemeTransition = triggerThemeTransition;
    
    return () => {
      delete (window as any).triggerThemeTransition;
    };
  }, [triggerThemeTransition]);

  return (
    <>
      {children}
      <ThemeTransition
        isVisible={transitionState.isVisible}
        oldTheme={transitionState.oldTheme}
        newTheme={transitionState.newTheme}
        onAnimationComplete={handleAnimationComplete}
      />
    </>
  );
};

export default ThemeTransitionManager;
