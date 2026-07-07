/**
 * 5端自适应布局组件 (V9 需求 1 · V10 Day 3)
 *
 * 支持: PC / H5 / APP / Pad / 小程序
 * 特性: 响应式断点 + 设备检测 + 自适应布局
 */

'use client';

// 微信小程序 JS-SDK 全局变量声明
// 仅在微信小程序环境中存在，Web 端无此变量
declare const wx: any | undefined;

import React, { createContext, useContext, useEffect, useState } from 'react';

export type DeviceType = 'pc' | 'h5' | 'app' | 'pad' | 'miniapp';

export interface DeviceInfo {
  type: DeviceType;
  width: number;
  height: number;
  isTouch: boolean;
  isMobile: boolean;
  pixelRatio: number;
}

interface AdaptiveContextValue {
  device: DeviceInfo;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  is: Record<DeviceType, boolean>;
}

const AdaptiveContext = createContext<AdaptiveContextValue | null>(null);

// 断点定义 (px)
const BREAKPOINTS = {
  xs: 0,    // 小程序/小屏手机
  sm: 375,  // 标准手机
  md: 768,  // 大屏手机/小Pad
  lg: 1024, // Pad/小PC
  xl: 1280, // 标准PC
  xxl: 1600,// 大屏PC
} as const;

function detectDeviceType(width: number, userAgent: string): DeviceType {
  // 小程序环境检测
  if (typeof wx !== 'undefined' || /miniprogram|micromessenger/i.test(userAgent)) {
    return 'miniapp';
  }
  
  // APP环境检测 (React Native)
  if (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative') {
    return width >= 768 ? 'pad' : 'app';
  }
  
  // Pad检测
  if (width >= 768 && width < 1024) {
    return 'pad';
  }
  
  // H5/PC区分
  if (width < 1024) {
    return 'h5';
  }
  
  return 'pc';
}

function getBreakpoint(width: number): AdaptiveContextValue['breakpoint'] {
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

export function useAdaptive(): AdaptiveContextValue {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used within AdaptiveProvider');
  }
  return context;
}

export function useDevice(): DeviceInfo {
  return useAdaptive().device;
}

interface AdaptiveProviderProps {
  children: React.ReactNode;
  /** 强制指定设备类型(用于SSR/测试) */
  forceDevice?: DeviceType;
  /** 初始窗口宽度(用于SSR) */
  initialWidth?: number;
}

export function AdaptiveProvider({
  children,
  forceDevice,
  initialWidth,
}: AdaptiveProviderProps) {
  const [device, setDevice] = useState<DeviceInfo>(() => {
    const width = initialWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    const type = forceDevice ?? detectDeviceType(width, userAgent);
    
    return {
      type,
      width,
      height,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isMobile: type === 'h5' || type === 'app' || type === 'miniapp',
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    };
  });

  useEffect(() => {
    if (forceDevice) return; // 强制指定时不监听
    
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const type = detectDeviceType(width, navigator.userAgent);
      
      setDevice(prev => ({
        ...prev,
        type,
        width,
        height,
        isMobile: type === 'h5' || type === 'app' || type === 'miniapp',
      }));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [forceDevice]);

  const breakpoint = getBreakpoint(device.width);
  
  const value: AdaptiveContextValue = {
    device,
    breakpoint,
    is: {
      pc: device.type === 'pc',
      h5: device.type === 'h5',
      app: device.type === 'app',
      pad: device.type === 'pad',
      miniapp: device.type === 'miniapp',
    },
  };

  return (
    <AdaptiveContext.Provider value={value}>
      {children}
    </AdaptiveContext.Provider>
  );
}

// ============ 辅助组件 ============

interface ShowProps {
  /** 在哪些设备显示 */
  on?: DeviceType[];
  /** 在哪些设备隐藏 */
  off?: DeviceType[];
  children: React.ReactNode;
}

/** 条件渲染组件(基于设备类型) */
export function Show({ on, off, children }: ShowProps) {
  const { device } = useAdaptive();
  
  const shouldShow = () => {
    if (off?.includes(device.type)) return false;
    if (on && !on.includes(device.type)) return false;
    return true;
  };
  
  return shouldShow() ? <>{children}</> : null;
}
