'use client';

import React, { useState, useCallback } from 'react';
import { Input, InputProps } from './Input';

// ==================== 类型定义 ====================

/** PasswordInput 组件属性 */
export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** 初始是否显示密码 */
  defaultVisible?: boolean;
  /** 显示/隐藏切换按钮的 aria-label */
  toggleLabel?: string;
}

// ==================== 样式常量 ====================

const TOGGLE_BUTTON_STYLE: React.CSSProperties = {
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 6px',
  fontSize: 16,
  lineHeight: 1,
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  transition: 'color 0.15s',
};

// ==================== 图标组件 ====================

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ==================== PasswordInput 组件 ====================

/**
 * PasswordInput — 密码输入框组件。
 *
 * 基于 Input 组件，增加密码显示/隐藏切换功能。
 * 支持所有 Input 的 props（placeholder、disabled、error 等）。
 *
 * @example
 * <PasswordInput
 *   label="密码"
 *   placeholder="请输入密码"
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 */
export function PasswordInput({
  defaultVisible = false,
  toggleLabel,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  const handleToggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  const toggleAriaLabel = toggleLabel ?? (visible ? '隐藏密码' : '显示密码');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        style={{
          ...inputProps.style,
          paddingRight: 40,
        }}
      />
      <button
        type="button"
        aria-label={toggleAriaLabel}
        title={toggleAriaLabel}
        style={TOGGLE_BUTTON_STYLE}
        onClick={handleToggle}
        tabIndex={-1}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}
