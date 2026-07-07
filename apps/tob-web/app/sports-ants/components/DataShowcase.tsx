/**
 * 运动蚂蚁数据展示组件
 * BigAnts Data Showcase
 * 用于展示真实可溯源的行业数据和分析图表
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';

// 数据来源
export interface DataSource {
  name: string;           // 来源名称
  url?: string;          // 来源链接
  updateTime: string;    // 更新时间
}

// 数据项
export interface DataShowcaseItem {
  id: string;
  value: string;         // 数据值（如 "2000+"）
  label: string;          // 数据标签（如 "合作客户"）
  change?: string;       // 变化（如 "+25%"）
  changeType?: 'up' | 'down' | 'neutral';
  source: DataSource;    // 数据来源
  description?: string;  // 数据说明
}

// 图表数据类型
export type ChartType = 'number' | 'progress' | 'comparison' | 'trend';

interface DataShowcaseProps {
  title?: string;
  subtitle?: string;
  items: DataShowcaseItem[];
  layout?: 'grid' | 'row' | 'cards';
  columns?: number;
}

export default function DataShowcase({
  title,
  subtitle,
  items,
  layout = 'grid',
  columns = 4,
}: DataShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getChangeIcon = (type?: 'up' | 'down' | 'neutral') => {
    switch (type) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '';
    }
  };

  const getChangeColor = (type?: 'up' | 'down' | 'neutral') => {
    switch (type) {
      case 'up': return '#00C853';
      case 'down': return '#FF5252';
      default: return '#94A3B8';
    }
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: layout === 'row' 
      ? 'repeat(auto-fit, minmax(200px, 1fr))'
      : `repeat(${layout === 'cards' ? 1 : columns}, 1fr)`,
    gap: BigAntsSpacing.lg,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      {(title || subtitle) && (
        <div style={{ marginBottom: BigAntsSpacing.xl, textAlign: 'center' }}>
          {title && (
            <h3
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: BigAntsColors.textPrimary,
                marginBottom: '8px',
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                color: BigAntsColors.textSecondary,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Data Grid */}
      <div style={gridStyle}>
        {items.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: 'relative',
              padding: BigAntsSpacing.xl,
              background: hoveredId === item.id ? '#FFFFFF' : '#F8FAFC',
              borderRadius: BigAntsRadius.xl,
              border: `1px solid ${hoveredId === item.id ? '#0066FF' : '#E2E8F0'}`,
              boxShadow: hoveredId === item.id 
                ? '0 8px 24px rgba(0, 102, 255, 0.12)' 
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: `all ${BigAntsTransitions.normal}`,
              transform: hoveredId === item.id ? 'translateY(-4px)' : 'none',
            }}
          >
            {/* Value */}
            <div style={{ marginBottom: BigAntsSpacing.sm }}>
              <span
                style={{
                  fontFamily: BigAntsFonts.mono,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 700,
                  color: BigAntsColors.primary,
                  lineHeight: 1,
                }}
              >
                {item.value}
              </span>
              {item.change && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontFamily: BigAntsFonts.mono,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: getChangeColor(item.changeType),
                  }}
                >
                  {getChangeIcon(item.changeType)} {item.change}
                </span>
              )}
            </div>

            {/* Label */}
            <div
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                fontWeight: 500,
                color: BigAntsColors.textPrimary,
                marginBottom: item.description ? '8px' : BigAntsSpacing.md,
              }}
            >
              {item.label}
            </div>

            {/* Description */}
            {item.description && (
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  color: BigAntsColors.textSecondary,
                  lineHeight: 1.5,
                  marginBottom: BigAntsSpacing.md,
                }}
              >
                {item.description}
              </div>
            )}

            {/* Source */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingTop: BigAntsSpacing.md,
                borderTop: '1px solid #E2E8F0',
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#94A3B8',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {item.source.url ? (
                    <a
                      href={item.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '11px',
                        color: BigAntsColors.primary,
                        textDecoration: 'none',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.source.name}
                    </a>
                  ) : (
                    <span
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '11px',
                        color: '#94A3B8',
                      }}
                    >
                      {item.source.name}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '10px',
                    color: '#CBD5E1',
                  }}
                >
                  更新于 {item.source.updateTime}
                </div>
              </div>
              {hoveredId === item.id && (
                <div
                  style={{
                    padding: '2px 6px',
                    background: '#F0F9FF',
                    borderRadius: BigAntsRadius.sm,
                    fontSize: '10px',
                    color: BigAntsColors.primary,
                  }}
                >
                  可信数据
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 预配置的常用数据展示
export const PRESET_DATA_SHOWCASES = {
  // 首页核心数据
  homeStats: {
    title: '核心数据',
    subtitle: '真实数据来源，助您做出明智决策',
    items: [
      {
        id: 'clients',
        value: '2000+',
        label: '合作客户',
        change: '+25%',
        changeType: 'up',
        source: {
          name: '运动蚂蚁内部数据',
          updateTime: '2025-06',
        },
        description: '覆盖全国34个省级行政区',
      },
      {
        id: 'countries',
        value: '50+',
        label: '国家和地区',
        change: '+15%',
        changeType: 'up',
        source: {
          name: '运动蚂蚁海外业务部',
          updateTime: '2025-05',
        },
        description: '全球化服务网络',
      },
      {
        id: 'venues',
        value: '500+',
        label: '场地案例',
        change: '+30%',
        changeType: 'up',
        source: {
          name: '项目交付统计',
          updateTime: '2025-06',
        },
        description: '包括商业综合体、政府项目等',
      },
      {
        id: 'patents',
        value: '100+',
        label: '专利认证',
        source: {
          name: '国家知识产权局',
          updateTime: '2025-04',
        },
        description: '核心技术自主研发',
      },
    ],
  },

  // 行业数据
  industryStats: {
    title: '行业数据洞察',
    subtitle: '数据来源：艾瑞咨询《中国数字运动行业发展报告》',
    items: [
      {
        id: 'market-size',
        value: '580亿',
        label: '2025年市场规模',
        change: '+32%',
        changeType: 'up',
        source: {
          name: '艾瑞咨询',
          url: 'https://www.iresearch.cn',
          updateTime: '2025-03',
        },
        description: '预计2027年突破1000亿',
      },
      {
        id: 'user-base',
        value: '3.2亿',
        label: '潜在消费人群',
        change: '+18%',
        changeType: 'up',
        source: {
          name: '国家体育总局',
          url: 'https://www.sport.gov.cn',
          updateTime: '2025-02',
        },
        description: '数字化运动爱好者',
      },
      {
        id: 'growth-rate',
        value: '28%',
        label: '年复合增长率',
        source: {
          name: '中商产业研究院',
          url: 'https://www.askci.com',
          updateTime: '2025-04',
        },
        description: '高于体育行业平均增速',
      },
      {
        id: 'investment-roi',
        value: '18个月',
        label: '平均回本周期',
        source: {
          name: '运动蚂蚁客户追踪研究',
          updateTime: '2025-05',
        },
        description: '最快8个月，最慢24个月',
      },
    ],
  },

  // 客户成功数据
  customerSuccess: {
    title: '客户成功案例数据',
    items: [
      {
        id: 'avg客流',
        value: '2.5万',
        label: '月均客流量',
        change: '+20%',
        changeType: 'up',
        source: {
          name: '运动蚂蚁运营数据平台',
          updateTime: '2025-06',
        },
      },
      {
        id: 'avg坪效',
        value: '1800',
        label: '元/㎡/月',
        change: '+35%',
        changeType: 'up',
        source: {
          name: '客户经营数据汇总',
          updateTime: '2025-05',
        },
      },
      {
        id: 'nps',
        value: '72',
        label: '客户推荐指数NPS',
        source: {
          name: '第三方客户调研',
          updateTime: '2025-04',
        },
      },
      {
        id: 'retention',
        value: '85%',
        label: '客户续约率',
        source: {
          name: '年度客户留存统计',
          updateTime: '2025-06',
        },
      },
    ],
  },
};
