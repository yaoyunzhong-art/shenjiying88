'use client';

import React from 'react';
import { Spinner } from './Spinner';
import type { SpinnerSize, SpinnerVariant } from './Spinner';

// ---- 类型 ----

type OverlayMode = 'fullscreen' | 'block' | 'inline';

interface LoadingOverlayProps {
  /** 是否可见 */
  visible: boolean;
  /** 覆盖模式 */
  mode?: OverlayMode;
  /** 加载提示文字 */
  label?: string;
  /** 子元素（block 模式下遮罩覆盖的内容） */
  children?: React.ReactNode;
  /** Spin 尺寸 */
  spinnerSize?: SpinnerSize;
  /** Spin 变体 */
  spinnerVariant?: SpinnerVariant;
  /** 遮罩透明度 0–1 */
  opacity?: number;
  /** 自定义样式 */
  className?: string;
  style?: React.CSSProperties;
}

// ---- 样式常量 ----

const MODE_STYLES: Record<OverlayMode, React.CSSProperties> = {
  fullscreen: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
  },
  block: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
  },
  inline: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
  },
};

const OVERLAY_BG = 'rgba(255, 255, 255, 0.72)';

// ---- 组件 ----

function LoadingOverlay({
  visible,
  mode = 'block',
  label,
  children,
  spinnerSize = 'lg',
  spinnerVariant = 'primary',
  opacity = 0.72,
  className,
  style,
}: LoadingOverlayProps) {
  if (!visible) {
    // inline 模式不可见时直接返回 null，其它模式渲染内容
    if (mode === 'inline') return null;
    return <>{children}</>;
  }

  const overlayStyle: React.CSSProperties = {
    ...MODE_STYLES[mode],
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: mode !== 'inline' ? `rgba(255, 255, 255, ${opacity})` : 'transparent',
    ...style,
  };

  const spinner = (
    <Spinner size={spinnerSize} variant={spinnerVariant} label={label} />
  );

  if (mode === 'fullscreen' || mode === 'inline') {
    return (
      <div
        className={className}
        role="alert"
        aria-busy={visible}
        style={overlayStyle}
      >
        {spinner}
      </div>
    );
  }

  // block 模式：在子元素上叠加遮罩
  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {children}
      <div
        role="alert"
        aria-busy={visible}
        style={{
          ...overlayStyle,
          backdropFilter: 'blur(1px)',
        }}
      >
        {spinner}
      </div>
    </div>
  );
}

export { LoadingOverlay };
export type { LoadingOverlayProps, OverlayMode };
