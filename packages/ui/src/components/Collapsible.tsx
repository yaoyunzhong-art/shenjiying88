'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface CollapsibleProps {
  /** 标题内容 */
  title: React.ReactNode;
  /** 子内容 */
  children: React.ReactNode;
  /** 是否默认展开 */
  defaultOpen?: boolean;
  /** 受控展开状态 */
  open?: boolean;
  /** 展开/折叠回调 */
  onOpenChange?: (open: boolean) => void;
  /** 标题右侧额外操作区 */
  extra?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 展开/折叠动画时长(ms)，0 表示无动画 */
  animationDuration?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义展开图标，默认 ▲/▼ */
  expandIcon?: React.ReactNode;
  /** 是否隐藏展开图标 */
  hideExpandIcon?: boolean;
}

/**
 * Collapsible — 可折叠内容面板
 *
 * 支持受控/非受控模式、动画过渡、标题额外操作区。
 */
export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  extra,
  className,
  style,
  animationDuration = 300,
  disabled = false,
  expandIcon,
  hideExpandIcon = false,
}) => {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? controlledOpen! : internalOpen;
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [disabled, isOpen, isControlled, onOpenChange]);

  const containerStyle: React.CSSProperties = {
    ...style,
    overflow: 'hidden',
    transition: animationDuration > 0 ? `max-height ${animationDuration}ms ease` : undefined,
    maxHeight: isOpen ? contentHeight : 0,
  };

  const icon = expandIcon ?? (isOpen ? '▲' : '▼');

  return (
    <div className={className} style={{ ...style }}>
      {/* 标题栏 */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: '4px',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {extra}
          {!hideExpandIcon && (
            <span
              style={{
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
                fontSize: 12,
              }}
            >
              {icon}
            </span>
          )}
        </div>
      </div>
      {/* 折叠内容区 */}
      <div ref={contentRef} style={containerStyle}>
        <div style={{ padding: '8px 12px' }}>{children}</div>
      </div>
    </div>
  );
};

export default Collapsible;
