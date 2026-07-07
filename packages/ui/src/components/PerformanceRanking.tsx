'use client';

import React from 'react';

export type RankingItem = {
  /** 排名 */
  rank: number;
  /** 用户/门店/导购 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 头像 URL */
  avatar?: string;
  /** 业绩数值 */
  value: number;
  /** 业绩单位 */
  unit?: string;
  /** 环比变化百分比，正数上升，负数下降 */
  changePercent?: number;
  /** 额外标签 */
  tag?: string;
  /** 标签颜色 */
  tagColor?: string;
};

export interface PerformanceRankingProps {
  /** 排行数据 */
  data: RankingItem[];
  /** 排行榜标题 */
  title?: string;
  /** 是否显示冠亚季军特殊样式，默认 true */
  showMedal?: boolean;
  /** 数量上限，默认 10 */
  limit?: number;
  /** 值的标签（如"销售额"、"积分"） */
  valueLabel?: string;
  /** 空状态描述 */
  emptyText?: string;
  /** 样式类 */
  className?: string;
}

const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const MEDAL_COLORS: Record<number, string> = {
  1: '#ffd700',
  2: '#c0c0c0',
  3: '#cd7f32',
};

function formatValue(v: number): string {
  if (v >= 10_000) return (v / 10_000).toFixed(1).replace(/\.0$/, '') + '万';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}

export function PerformanceRanking({
  data,
  title,
  showMedal = true,
  limit = 10,
  valueLabel,
  emptyText = '暂无排行数据',
  className,
}: PerformanceRankingProps) {
  const displayData = data.slice(0, limit);

  if (displayData.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#999',
          fontSize: 14,
        }}
        className={className}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      className={className}
    >
      {title && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {title}
        </div>
      )}

      {valueLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 12,
            color: '#999',
            marginBottom: 4,
            paddingRight: 4,
          }}
        >
          {valueLabel}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displayData.map((item) => {
          const isMedal = showMedal && item.rank >= 1 && item.rank <= 3;
          const medalIcon = isMedal ? MEDAL_ICONS[item.rank] : null;
          const medalColor = isMedal ? MEDAL_COLORS[item.rank] : null;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: isMedal ? `${medalColor}0D` : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              {/* 排名 */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {medalIcon ? (
                  <span style={{ fontSize: 18 }}>{medalIcon}</span>
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#666',
                    }}
                  >
                    {item.rank}
                  </span>
                )}
              </div>

              {/* 头像 */}
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: medalColor || '#e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: medalColor ? '#fff' : '#999',
                    flexShrink: 0,
                  }}
                >
                  {item.name.charAt(0)}
                </div>
              )}

              {/* 名称 */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={item.name}
              >
                {item.name}
              </div>

              {/* 标签 */}
              {item.tag && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: item.tagColor || '#f0f5ff',
                    color: item.tagColor ? '#fff' : '#1677ff',
                    flexShrink: 0,
                  }}
                >
                  {item.tag}
                </span>
              )}

              {/* 变化 */}
              {item.changePercent !== undefined && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    flexShrink: 0,
                    color: item.changePercent >= 0 ? '#52c41a' : '#f5222d',
                  }}
                >
                  {item.changePercent >= 0 ? '+' : ''}
                  {item.changePercent}%
                </span>
              )}

              {/* 数值 */}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  flexShrink: 0,
                  minWidth: 60,
                  textAlign: 'right',
                }}
              >
                {formatValue(item.value)}
                {item.unit ? (
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#999', marginLeft: 2 }}>
                    {item.unit}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
