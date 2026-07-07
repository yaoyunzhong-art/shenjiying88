'use client';

import React from 'react';

export interface EmptyProps {
  /** 空状态描述文案 */
  description?: string;
  /** 自定义空状态图标 */
  image?: React.ReactNode;
  /** 额外的操作区域（按钮等） */
  children?: React.ReactNode;
  /** 外层容器样式 */
  style?: React.CSSProperties;
  /** 外层容器类名 */
  className?: string;
}

const DEFAULT_IMAGE = (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="8" width="48" height="6" rx="3" fill="#d9d9d9" />
    <rect x="8" y="24" width="64" height="40" rx="4" fill="#f0f0f0" />
    <rect x="20" y="32" width="16" height="16" rx="8" fill="#d9d9d9" />
    <rect x="44" y="34" width="20" height="4" rx="2" fill="#d9d9d9" />
    <rect x="44" y="42" width="14" height="4" rx="2" fill="#d9d9d9" />
    <circle cx="28" cy="40" r="6" fill="#e6e6e6" />
  </svg>
);

export const Empty: React.FC<EmptyProps> = ({
  description = '暂无数据',
  image,
  children,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
        textAlign: 'center',
        ...style,
      }}
    >
      <div style={{ marginBottom: 16, lineHeight: 0 }}>
        {image ?? DEFAULT_IMAGE}
      </div>
      {description && (
        <div style={{ color: '#999', fontSize: 14, lineHeight: '22px' }}>
          {description}
        </div>
      )}
      {children && (
        <div style={{ marginTop: 16 }}>{children}</div>
      )}
    </div>
  );
};
