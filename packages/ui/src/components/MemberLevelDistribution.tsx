'use client';

import React from 'react';

// ==================== 类型定义 ====================

export interface MemberLevel {
  /** 等级名称 */
  name: string;
  /** 会员数量 */
  count: number;
  /** 等级颜色 */
  color?: string;
}

export interface MemberLevelDistributionProps {
  /** 会员等级数据 */
  data: MemberLevel[];
  /** 组件宽度 */
  width?: number;
  /** 组件高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 是否显示数值 */
  showValues?: boolean;
  /** 是否显示百分比 */
  showPercentage?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
}

// ==================== 默认调色板 ====================

const DEFAULT_LEVEL_COLORS = [
  '#f59e0b', // 黄金 - 黄金会员
  '#8b5cf6', // 紫色 - 钻石会员
  '#3b82f6', // 蓝色 - 铂金会员
  '#22c55e', // 绿色 - 金卡会员
  '#6b7280', // 灰色 - 银卡会员
  '#ef4444', // 红色 - 普通会员
  '#06b6d4', // 青色
  '#ec4899', // 粉色
];

// ==================== 组件 ====================

export const MemberLevelDistribution: React.FC<MemberLevelDistributionProps> = ({
  data,
  width = 600,
  height = 280,
  title = '会员等级分布',
  showValues = true,
  showPercentage = true,
  className = '',
  emptyText = '暂无会员数据',
}) => {
  // 空状态
  if (!data || data.length === 0) {
    return (
      <div
        className={`member-level-distribution member-level-distribution--empty ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ color: '#9ca3af', fontSize: 14 }}>{emptyText}</span>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...data.map(d => d.count));

  const barAreaHeight = height - 60; // 留出标题和标签空间
  const barWidth = Math.max(20, Math.min(60, (width - 80) / data.length - 12));
  const gap = (width - 60 - barWidth * data.length) / (data.length + 1);

  return (
    <div
      className={`member-level-distribution ${className}`}
      style={{
        width,
        height,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '16px 20px',
        background: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题 */}
      {title && (
        <div
          className="member-level-distribution__title"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 12,
            lineHeight: '20px',
          }}
        >
          {title}
        </div>
      )}

      {/* 图表区域 */}
      <div
        className="member-level-distribution__chart"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: `${gap}px`,
          paddingBottom: 4,
          position: 'relative',
        }}
        role="img"
        aria-label={`${title}: ${data.map(d => `${d.name} ${d.count}人`).join(', ')}`}
      >
        {data.map((item, index) => {
          const barHeight = total > 0 ? (item.count / maxCount) * barAreaHeight : 0;
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
          const color = item.color || DEFAULT_LEVEL_COLORS[index % DEFAULT_LEVEL_COLORS.length];

          return (
            <div
              key={item.name}
              className="member-level-distribution__bar-group"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: barWidth,
              }}
            >
              {/* 数值标签 */}
              {showValues && (
                <span
                  className="member-level-distribution__value"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.count}
                </span>
              )}

              {/* 柱子 */}
              <div
                className="member-level-distribution__bar"
                style={{
                  width: barWidth,
                  height: Math.max(2, barHeight),
                  background: color,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                  minHeight: item.count > 0 ? 4 : 0,
                }}
                title={`${item.name}: ${item.count}人${showPercentage ? ` (${percentage}%)` : ''}`}
              />

              {/* 百分比标签 */}
              {showPercentage && (
                <span
                  className="member-level-distribution__percentage"
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {percentage}%
                </span>
              )}

              {/* 等级名称 */}
              <span
                className="member-level-distribution__label"
                style={{
                  fontSize: 12,
                  color: '#4b5563',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  maxWidth: barWidth,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 总计 */}
      <div
        className="member-level-distribution__total"
        style={{
          fontSize: 12,
          color: '#9ca3af',
          textAlign: 'right',
          marginTop: 4,
        }}
      >
        总计: {total} 人
      </div>
    </div>
  );
};

export default MemberLevelDistribution;
