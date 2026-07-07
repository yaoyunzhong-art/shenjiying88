'use client';

import React from 'react';

export type LabelSize = 'sm' | 'md' | 'lg';
export type LabelWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type LabelColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'muted';

export interface LabelProps {
  /** 标签文本 */
  children: React.ReactNode;
  /** 关联表单控件的 htmlFor */
  htmlFor?: string;
  /** 尺寸 */
  size?: LabelSize;
  /** 字重 */
  weight?: LabelWeight;
  /** 颜色主题 */
  color?: LabelColor;
  /** 是否必填（显示红色星号） */
  required?: boolean;
  /** 辅助说明文本 */
  hint?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

const sizeMap: Record<LabelSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

const weightMap: Record<LabelWeight, React.CSSProperties['fontWeight']> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const colorMap: Record<LabelColor, string> = {
  default: '#e2e8f0',
  primary: '#60a5fa',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  muted: '#94a3b8',
};

/**
 * Label — 标签组件。
 *
 * 与表单控件配合使用，支持必填标记、辅助文本、多种颜色主题。
 *
 * @example
 * // 必填标签
 * <Label htmlFor="name" required>姓名</Label>
 * <Input id="name" />
 *
 * @example
 * // 带辅助提示
 * <Label htmlFor="email" hint="将用于登录验证" color="primary">邮箱</Label>
 */
export function Label({
  children,
  htmlFor,
  size = 'md',
  weight = 'medium',
  color = 'default',
  required = false,
  hint,
  className,
  style,
}: LabelProps) {
  const fontSize = sizeMap[size];
  const fontWeight = weightMap[weight];
  const labelColor = colorMap[color];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
        ...style,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={{
          fontSize,
          fontWeight,
          color: labelColor,
          lineHeight: 1.5,
          userSelect: 'none',
          cursor: htmlFor ? 'pointer' : 'default',
          transition: 'color 0.15s',
        }}
      >
        {children}
        {required && (
          <span
            aria-label="必填"
            style={{
              color: '#f87171',
              marginLeft: 3,
              fontSize: fontSize * 1.1,
            }}
          >
            *
          </span>
        )}
      </label>

      {hint && (
        <span
          style={{
            fontSize: fontSize - 2,
            color: '#64748b',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
