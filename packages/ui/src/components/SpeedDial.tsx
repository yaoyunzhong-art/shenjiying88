'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeedDialAction {
  /** 操作唯一标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 图标 (emoji 或 SVG 字符串) */
  icon: string;
  /** 点击回调 */
  onClick: () => void;
  /** 是否危险操作（红色高亮） */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface SpeedDialProps {
  /** 主按钮图标 */
  icon?: string;
  /** 操作列表 */
  actions: SpeedDialAction[];
  /** 展开方向：上/下/左/右，默认 up */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 按钮大小，默认 md */
  size?: 'sm' | 'md' | 'lg';
  /** 距离底部/顶部偏移 (px)，默认 24 */
  offset?: number;
  /** 距离右侧偏移 (px)，默认 24 */
  offsetRight?: number;
  /** 是否固定在右下角，默认 true */
  fixed?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

const SIZE_MAP: Record<string, { btn: number; icon: number }> = {
  sm: { btn: 36, icon: 16 },
  md: { btn: 48, icon: 20 },
  lg: { btn: 56, icon: 24 },
};

const DIRECTION_MAP: Record<string, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function SpeedDial({
  icon = '⚡',
  actions,
  direction = 'up',
  size = 'md',
  offset = 24,
  offsetRight = 24,
  fixed = true,
  style,
  className,
}: SpeedDialProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dims = SIZE_MAP[size]!;
  const dirVec = DIRECTION_MAP[direction]!;

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    // 延迟绑定避免当前点击即关闭
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [open, close]);

  // 计算每个 action 的位置
  const gap = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;

  const actionStyle = (_idx: number): React.CSSProperties => {
    if (!open) return { opacity: 0, transform: 'scale(0.5)', pointerEvents: 'none' };
    const dist = (_idx + 1) * (dims.btn + gap);
    const x = dirVec.x * dist;
    const y = dirVec.y * dist;
    return {
      opacity: 1,
      transform: 'scale(1)',
      transition: `all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${_idx * 30}ms`,
      position: 'absolute',
      // 从主按钮位置偏移
      [direction === 'up' || direction === 'down' ? 'left' : 'top']: '50%',
      [direction === 'up' || direction === 'down' ? 'top' : 'left']: '50%',
      transformOrigin: 'center center',
      // 用 translate 偏移到正确位置
    };
  };

  const wrapperBase: React.CSSProperties = {
    position: fixed ? 'fixed' : 'absolute',
    bottom: direction === 'up' || direction === 'left' ? offset : undefined,
    top: direction === 'down' || direction === 'right' ? offset : undefined,
    right: offsetRight,
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...style,
  };

  // 为了精确控制，使用坐标变换
  const getButtonAbsoluteStyle = (idx: number): React.CSSProperties => {
    const dist = (idx + 1) * (dims.btn + gap);
    const xOff = dirVec.x * dist;
    const yOff = dirVec.y * dist;
    return {
      position: 'absolute',
      transition: `all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 40}ms`,
      opacity: open ? 1 : 0,
      transform: open ? 'translate(0, 0) scale(1)' : `translate(${-xOff * 0.3}px, ${-yOff * 0.3}px) scale(0.3)`,
      pointerEvents: open ? 'auto' : 'none' as React.CSSProperties['pointerEvents'],
    };
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...wrapperBase,
        width: dims.btn,
        height: dims.btn,
        // 使用相对定位让子元素相对于此定位
      }}
    >
      {/* 主按钮 */}
      <button
        onClick={toggle}
        aria-label={open ? '收起快捷操作' : '展开快捷操作'}
        aria-expanded={open}
        style={{
          width: dims.btn,
          height: dims.btn,
          borderRadius: '50%',
          border: 'none',
          background: open ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: dims.icon,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          position: 'relative',
          zIndex: 10,
          lineHeight: 1,
        }}
      >
        {open ? '✕' : icon}
      </button>

      {/* 子按钮容器 */}
      <div
        style={{
          position: 'absolute',
          // 以主按钮中心为锚点
          top: dims.btn / 2,
          left: dims.btn / 2,
          pointerEvents: 'none' as React.CSSProperties['pointerEvents'],
        }}
      >
        {actions.map((action, idx) => (
          <div key={action.key} style={getButtonAbsoluteStyle(idx)}>
            <button
              onClick={() => {
                if (action.disabled) return;
                action.onClick();
                close();
              }}
              disabled={action.disabled}
              title={action.label}
              aria-label={action.label}
              style={{
                width: dims.btn,
                height: dims.btn,
                borderRadius: '50%',
                border: 'none',
                background: action.danger ? '#ef4444' : action.disabled ? '#e5e7eb' : '#1f2937',
                color: action.disabled ? '#9ca3af' : 'white',
                fontSize: dims.icon,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease',
                lineHeight: 1,
                position: 'relative',
              }}
            >
              {action.icon}
            </button>
            {/* Tooltip 标签 */}
            <div
              style={{
                position: 'absolute',
                whiteSpace: 'nowrap',
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                pointerEvents: 'none',
                // 标签位置
                [direction === 'up' || direction === 'down' ? 'left' : 'top']: '50%',
                [direction === 'up' ? 'bottom' : direction === 'down' ? 'top' : '']: dims.btn + 4,
                [direction === 'left' ? 'left' : direction === 'right' ? 'right' : '']: dims.btn + 4,
                transform: 'translateY(-50%)',
                opacity: open ? 1 : 0,
                transition: `opacity 0.2s ease ${idx * 40 + 100}ms`,
              }}
            >
              {action.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
