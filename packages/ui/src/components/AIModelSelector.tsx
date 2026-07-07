'use client';

import React, { useMemo, useState } from 'react';

// ==================== 类型定义 ====================

export type AIModelCapability = 'chat' | 'vision' | 'code' | 'reasoning' | 'embedding';

export type AIModelPricingTier = 'budget' | 'standard' | 'premium';

export interface AIModelOption {
  /** 模型唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 提供商 */
  provider: string;
  /** 能力标签 */
  capabilities: AIModelCapability[];
  /** 定价层级 */
  pricingTier: AIModelPricingTier;
  /** 每 1K 输入 tokens 价格 (USD) */
  inputPricePer1K: number;
  /** 每 1K 输出 tokens 价格 (USD) */
  outputPricePer1K: number;
  /** 平均延迟 ms */
  avgLatencyMs: number;
  /** 上下文窗口 */
  contextWindow: number;
  /** 是否推荐 */
  recommended?: boolean;
  /** 当前是否可用 */
  available: boolean;
  /** 简要描述 */
  description?: string;
}

export interface AIModelSelectorProps {
  /** 模型列表 */
  models: AIModelOption[];
  /** 当前选中模型 ID */
  value?: string;
  /** 选择回调 */
  onChange?: (modelId: string) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 视图模式 */
  variant?: 'compact' | 'detailed';
}

// ==================== 默认颜色主题 ====================

const TIER_COLORS: Record<AIModelPricingTier, string> = {
  budget: '#52c41a',
  standard: '#1677ff',
  premium: '#722ed1',
};

const TIER_LABELS: Record<AIModelPricingTier, string> = {
  budget: '经济型',
  standard: '标准型',
  premium: '旗舰型',
};

const CAPABILITY_LABELS: Record<AIModelCapability, string> = {
  chat: '对话',
  vision: '视觉',
  code: '代码',
  reasoning: '推理',
  embedding: '向量',
};

// ==================== 组件内联样式 ====================

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.2)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  background: 'rgba(15, 23, 42, 0.3)',
};

const selectedItemStyle: React.CSSProperties = {
  ...itemStyle,
  borderColor: '#1677ff',
  background: 'rgba(22, 119, 255, 0.1)',
  boxShadow: '0 0 0 1px rgba(22, 119, 255, 0.3)',
};

const disabledItemStyle: React.CSSProperties = {
  ...itemStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
};

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: '#e2e8f0',
};

const providerStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
};

const tagStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '2px 6px',
  borderRadius: 4,
  fontWeight: 500,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 10,
  background: '#1677ff',
  color: '#fff',
  fontWeight: 600,
};

const metricStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  display: 'flex',
  gap: 12,
};

const metricValueStyle: React.CSSProperties = {
  color: '#e2e8f0',
  fontWeight: 500,
};

const radioDotStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '2px solid rgba(148, 163, 184, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const radioDotSelectedStyle: React.CSSProperties = {
  ...radioDotStyle,
  borderColor: '#1677ff',
};

const radioDotInnerStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#1677ff',
};

// ==================== 组件 ====================

export function AIModelSelector({
  models,
  value,
  onChange,
  loading = false,
  disabled = false,
  className,
  variant = 'detailed',
}: AIModelSelectorProps) {
  const selectedModel = useMemo(
    () => models.find((m) => m.id === value),
    [models, value],
  );

  if (loading) {
    return (
      <div style={containerStyle} className={className}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              ...itemStyle,
              cursor: 'default',
              opacity: 0.5,
              animation: 'pulse 1.5s infinite',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'rgba(148,163,184,0.2)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 14,
                  width: '40%',
                  background: 'rgba(148,163,184,0.15)',
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: '60%',
                  background: 'rgba(148,163,184,0.1)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.3; } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {!selectedModel && models.length > 0 && (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0' }}>
          请选择一个 AI 模型
        </div>
      )}
      {models.map((model) => {
        const isSelected = model.id === value;
        const isDisabled = disabled || !model.available;
        const style = isSelected
          ? selectedItemStyle
          : isDisabled
            ? disabledItemStyle
            : itemStyle;

        return (
          <div
            key={model.id}
            style={style}
            onClick={() => {
              if (!isDisabled && onChange) {
                onChange(model.id);
              }
            }}
            onMouseEnter={(e) => {
              if (!isDisabled && !isSelected) {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(148, 163, 184, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDisabled && !isSelected) {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(148, 163, 184, 0.2)';
              }
            }}
          >
            {/* 单选指示器 */}
            <div style={isSelected ? radioDotSelectedStyle : radioDotStyle}>
              {isSelected && <div style={radioDotInnerStyle} />}
            </div>

            {/* 主要内容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={nameStyle}>{model.name}</span>
                <span style={providerStyle}>{model.provider}</span>
                {model.recommended && <span style={badgeStyle}>推荐</span>}
                <span
                  style={{
                    ...tagStyle,
                    background: `${TIER_COLORS[model.pricingTier]}20`,
                    color: TIER_COLORS[model.pricingTier],
                  }}
                >
                  {TIER_LABELS[model.pricingTier]}
                </span>
              </div>

              {variant === 'detailed' && (
                <>
                  {/* 能力标签 */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        style={{
                          ...tagStyle,
                          background: 'rgba(148, 163, 184, 0.12)',
                          color: '#cbd5e1',
                        }}
                      >
                        {CAPABILITY_LABELS[cap]}
                      </span>
                    ))}
                  </div>

                  {/* 指标对比 */}
                  <div style={metricStyle}>
                    <span>
                      上下文: <span style={metricValueStyle}>{(model.contextWindow / 1000).toFixed(0)}K</span>
                    </span>
                    <span>
                      延迟: <span style={metricValueStyle}>{model.avgLatencyMs}ms</span>
                    </span>
                    <span>
                      输入: <span style={metricValueStyle}>${model.inputPricePer1K.toFixed(4)}/1K</span>
                    </span>
                    <span>
                      输出: <span style={metricValueStyle}>${model.outputPricePer1K.toFixed(4)}/1K</span>
                    </span>
                  </div>

                  {model.description && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {model.description}
                    </div>
                  )}
                </>
              )}

              {variant === 'compact' && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {(model.contextWindow / 1000).toFixed(0)}K ctx · {model.avgLatencyMs}ms · $
                  {model.inputPricePer1K.toFixed(4)}/${model.outputPricePer1K.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {models.length === 0 && !loading && (
        <div
          style={{
            ...itemStyle,
            cursor: 'default',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          暂无可用 AI 模型
        </div>
      )}
    </div>
  );
}
