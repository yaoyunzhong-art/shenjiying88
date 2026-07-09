'use client';

import React from 'react';

export interface SectionHeaderAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'default' | 'text';
}

export interface SectionHeaderProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 右侧操作区 */
  actions?: SectionHeaderAction[];
  /** 是否有边框 */
  bordered?: boolean;
  /** 是否显示加载中骨架 */
  loading?: boolean;
  /** 自定义右侧区域 (覆盖 actions) */
  extra?: React.ReactNode;
  /** 类名 */
  className?: string;
  /** 样式 */
  style?: React.CSSProperties;
  /** 测试 id */
  'data-testid'?: string;
}

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  fontSize: 13,
  lineHeight: '20px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#fff',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const primaryBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  border: '1px solid #1677ff',
  background: '#1677ff',
  color: '#fff',
};

const textBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  border: 'none',
  background: 'transparent',
  color: '#1677ff',
};

const disabledBtnStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  bordered = true,
  loading = false,
  extra,
  className,
  style,
  'data-testid': testId,
}) => {
  const variantStyle = (variant?: string): React.CSSProperties => {
    if (variant === 'primary') return primaryBtnStyle;
    if (variant === 'text') return textBtnStyle;
    return actionBtnStyle;
  };

  return (
    <div
      className={className}
      data-testid={testId}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: bordered ? '1px solid #f0f0f0' : 'none',
        marginBottom: 16,
        ...style,
      }}
    >
      {/* 标题区 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <div>
            <div
              style={{
                width: 140,
                height: 22,
                borderRadius: 4,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            {subtitle && (
              <div
                style={{
                  width: 200,
                  height: 16,
                  borderRadius: 4,
                  marginTop: 6,
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            )}
          </div>
        ) : (
          <>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                lineHeight: '24px',
                color: '#1f2937',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  lineHeight: '20px',
                  color: '#9ca3af',
                }}
              >
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>

      {/* 操作区 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
        {extra
          ? extra
          : actions?.map((action) => {
              const base = variantStyle(action.variant);
              return (
                <button
                  key={action.key}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  style={{
                    ...base,
                    ...(action.disabled ? disabledBtnStyle : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!action.disabled && action.variant !== 'primary' && action.variant !== 'text') {
                      (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!action.disabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = base.background as string;
                    }
                  }}
                >
                  {action.icon && <span style={{ display: 'inline-flex' }}>{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
