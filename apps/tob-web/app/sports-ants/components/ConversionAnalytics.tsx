/**
 * 运动蚂蚁转化数据分析组件
 * BigAnts Conversion Analytics
 * 桑德斯三步法各阶段转化率监测
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';

// 转化漏斗阶段
export interface ConversionStage {
  id: string;
  name: string;            // 阶段名称
  icon: string;            // 图标
  visitors: number;         // 当前阶段人数
  conversionRate: number;   // 到下一阶段的转化率
  dropOffRate: number;      // 流失率
  avgTimeSpent: string;     // 平均停留时间
}

// 页面热点数据
export interface PageHotspot {
  id: string;
  name: string;             // 热点名称
  clicks: number;           // 点击次数
  conversionRate: number;   // 转化率
  position: { x: number; y: number }; // 位置百分比
}

// 优化建议
export interface OptimizationSuggestion {
  id: string;
  type: 'high' | 'medium' | 'low';  // 优先级
  title: string;                     // 建议标题
  description: string;                // 建议描述
  potentialImpact: string;            // 潜在影响
  effort: 'high' | 'medium' | 'low'; // 实施难度
}

interface ConversionAnalyticsProps {
  className?: string;
}

// 模拟数据（实际项目中应从API获取）
const MOCK_STAGES: ConversionStage[] = [
  {
    id: 'awareness',
    name: '痛点认知',
    icon: '👁️',
    visitors: 10000,
    conversionRate: 35,
    dropOffRate: 65,
    avgTimeSpent: '1分30秒',
  },
  {
    id: 'value',
    name: '价值锚定',
    icon: '💡',
    visitors: 3500,
    conversionRate: 42,
    dropOffRate: 58,
    avgTimeSpent: '3分45秒',
  },
  {
    id: 'decision',
    name: '自主决策',
    icon: '⚖️',
    visitors: 1470,
    conversionRate: 28,
    dropOffRate: 72,
    avgTimeSpent: '2分20秒',
  },
  {
    id: 'action',
    name: '行动转化',
    icon: '🎯',
    visitors: 412,
    conversionRate: 100,
    dropOffRate: 0,
    avgTimeSpent: '1分10秒',
  },
];

const MOCK_HOTSPOTS: PageHotspot[] = [
  { id: 'hero-cta', name: 'Hero CTA按钮', clicks: 2847, conversionRate: 28.5, position: { x: 50, y: 85 } },
  { id: 'business-card-1', name: '数字产品卡片', clicks: 1923, conversionRate: 19.2, position: { x: 25, y: 45 } },
  { id: 'business-card-2', name: 'EPC服务卡片', clicks: 1654, conversionRate: 16.5, position: { x: 75, y: 45 } },
  { id: 'solution-cta', name: '解决方案CTA', clicks: 1432, conversionRate: 14.3, position: { x: 50, y: 65 } },
  { id: 'case-study', name: '案例中心入口', clicks: 987, conversionRate: 9.9, position: { x: 30, y: 75 } },
];

const MOCK_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: 'sug-1',
    type: 'high',
    title: '优化Hero区域CTA按钮',
    description: '当前Hero CTA按钮的转化率为28.5%，高于行业平均水平，但仍有提升空间。建议增加紧迫感文案，如"限时优惠"或"前50名享折扣"',
    potentialImpact: '+15%转化率',
    effort: 'low',
  },
  {
    id: 'sug-2',
    type: 'high',
    title: '增加EPC服务页的信任背书',
    description: 'EPC服务页的流失率较高(72%)，建议增加政府项目案例、客户证言和资质证书展示',
    potentialImpact: '-20%流失率',
    effort: 'medium',
  },
  {
    id: 'sug-3',
    type: 'medium',
    title: '案例中心增加筛选功能',
    description: '用户反馈难以找到与自己情况相似的案例，建议增加按行业、规模、投资预算筛选的功能',
    potentialImpact: '+25%案例页停留时间',
    effort: 'medium',
  },
  {
    id: 'sug-4',
    type: 'low',
    title: '优化移动端导航',
    description: '移动端用户的流失率比PC端高15%，建议优化移动端导航结构，增加底部悬浮咨询栏',
    potentialImpact: '+10%移动端转化',
    effort: 'high',
  },
];

export default function ConversionAnalytics({ className }: ConversionAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'funnel' | 'hotspots' | 'suggestions'>('funnel');

  // 计算总转化率
  const firstStage = MOCK_STAGES[0];
  const lastStage = MOCK_STAGES[MOCK_STAGES.length - 1];
  const totalConversionRate = firstStage && lastStage ? (lastStage.visitors / firstStage.visitors * 100) : 0;

  return (
    <div
      className={className}
      style={{
        background: BigAntsColors.white,
        borderRadius: BigAntsRadius.xl,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${BigAntsSpacing.lg} ${BigAntsSpacing.xl}`,
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: BigAntsRadius.md,
              background: `${BigAntsColors.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            📊
          </div>
          <div>
            <h3
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '16px',
                fontWeight: 600,
                color: BigAntsColors.textPrimary,
                marginBottom: '2px',
              }}
            >
              转化数据分析
            </h3>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '12px',
                color: BigAntsColors.textSecondary,
              }}
            >
              桑德斯三步法 · 全链路追踪
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Overall Conversion Rate */}
          <div
            style={{
              padding: '6px 12px',
              background: `${BigAntsColors.primary}10`,
              borderRadius: BigAntsRadius.md,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: BigAntsFonts.mono,
                fontSize: '20px',
                fontWeight: 700,
                color: BigAntsColors.primary,
              }}
            >
              {totalConversionRate.toFixed(1)}%
            </div>
            <div
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '10px',
                color: BigAntsColors.textSecondary,
              }}
            >
              总转化率
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid #E2E8F0',
              borderRadius: BigAntsRadius.md,
              fontSize: '12px',
              color: BigAntsColors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isExpanded ? '收起' : '展开详情'}
            <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          padding: `0 ${BigAntsSpacing.xl}`,
        }}
      >
        {[
          { id: 'funnel', label: '转化漏斗', icon: '�漏斗' },
          { id: 'hotspots', label: '页面热点', icon: '🔥' },
          { id: 'suggestions', label: '优化建议', icon: '💡' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: `${BigAntsSpacing.md} ${BigAntsSpacing.lg}`,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? BigAntsColors.primary : 'transparent'}`,
              color: activeTab === tab.id ? BigAntsColors.primary : BigAntsColors.textSecondary,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: `all ${BigAntsTransitions.fast}`,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: BigAntsSpacing.xl }}>
        {/* Funnel View */}
        {activeTab === 'funnel' && (
          <div>
            {/* Funnel Stages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {MOCK_STAGES.map((stage, index) => {
                const width = 100 - index * 15;
                return (
                  <div key={stage.id} style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      {/* Icon and Name */}
                      <div
                        style={{
                          width: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{stage.icon}</span>
                        <span
                          style={{
                            fontFamily: BigAntsFonts.chinese,
                            fontSize: '13px',
                            fontWeight: 500,
                            color: BigAntsColors.textPrimary,
                          }}
                        >
                          {stage.name}
                        </span>
                      </div>

                      {/* Bar */}
                      <div
                        style={{
                          flex: 1,
                          height: '40px',
                          background: '#F1F5F9',
                          borderRadius: BigAntsRadius.md,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            width: `${width}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primary}CC 100%)`,
                            borderRadius: BigAntsRadius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '12px',
                            transition: 'width 0.5s ease-out',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: BigAntsFonts.mono,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#FFFFFF',
                            }}
                          >
                            {stage.visitors.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div
                        style={{
                          width: '150px',
                          display: 'flex',
                          gap: '16px',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontFamily: BigAntsFonts.mono,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#00C853',
                            }}
                          >
                            {stage.conversionRate}%
                          </div>
                          <div
                            style={{
                              fontFamily: BigAntsFonts.chinese,
                              fontSize: '10px',
                              color: BigAntsColors.textSecondary,
                            }}
                          >
                            转化率
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontFamily: BigAntsFonts.mono,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#FF5252',
                            }}
                          >
                            {stage.dropOffRate}%
                          </div>
                          <div
                            style={{
                              fontFamily: BigAntsFonts.chinese,
                              fontSize: '10px',
                              color: BigAntsColors.textSecondary,
                            }}
                          >
                            流失率
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Spent */}
                    <div
                      style={{
                        marginLeft: '136px',
                        marginTop: '4px',
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '11px',
                        color: '#94A3B8',
                      }}
                    >
                      平均停留: {stage.avgTimeSpent}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hotspots View */}
        {activeTab === 'hotspots' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {MOCK_HOTSPOTS.map((hotspot) => (
                <div
                  key={hotspot.id}
                  style={{
                    padding: BigAntsSpacing.md,
                    background: '#F8FAFC',
                    borderRadius: BigAntsRadius.md,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '13px',
                        fontWeight: 500,
                        color: BigAntsColors.textPrimary,
                      }}
                    >
                      {hotspot.name}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        background: `${BigAntsColors.primary}15`,
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: BigAntsColors.primary,
                      }}
                    >
                      {hotspot.position.x}%, {hotspot.position.y}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div
                        style={{
                          fontFamily: BigAntsFonts.mono,
                          fontSize: '16px',
                          fontWeight: 600,
                          color: BigAntsColors.textPrimary,
                        }}
                      >
                        {hotspot.clicks.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '10px',
                          color: BigAntsColors.textSecondary,
                        }}
                      >
                        点击次数
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: BigAntsFonts.mono,
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#00C853',
                        }}
                      >
                        {hotspot.conversionRate}%
                      </div>
                      <div
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '10px',
                          color: BigAntsColors.textSecondary,
                        }}
                      >
                        转化率
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions View */}
        {activeTab === 'suggestions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_SUGGESTIONS.map((suggestion) => (
              <div
                key={suggestion.id}
                style={{
                  padding: BigAntsSpacing.lg,
                  background: '#F8FAFC',
                  borderRadius: BigAntsRadius.md,
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${
                    suggestion.type === 'high' ? '#FF5252' :
                    suggestion.type === 'medium' ? '#FFB800' : '#94A3B8'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: suggestion.type === 'high' ? '#FF525215' : 
                                   suggestion.type === 'medium' ? '#FFB80015' : '#94A3B815',
                        color: suggestion.type === 'high' ? '#FF5252' : 
                               suggestion.type === 'medium' ? '#FFB800' : '#94A3B8',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '4px',
                        marginRight: '8px',
                      }}
                    >
                      {suggestion.type === 'high' ? '高优' : suggestion.type === 'medium' ? '中优' : '低优'}
                    </span>
                    <span
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: BigAntsColors.textPrimary,
                      }}
                    >
                      {suggestion.title}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      background: suggestion.effort === 'high' ? '#FF525215' : 
                                 suggestion.effort === 'medium' ? '#FFB80015' : '#00C85315',
                      color: suggestion.effort === 'high' ? '#FF5252' : 
                             suggestion.effort === 'medium' ? '#FFB800' : '#00C853',
                      fontSize: '10px',
                      fontWeight: 500,
                      borderRadius: '4px',
                    }}
                  >
                    难度: {suggestion.effort === 'high' ? '高' : suggestion.effort === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: BigAntsColors.textSecondary,
                    lineHeight: 1.6,
                    marginBottom: '8px',
                  }}
                >
                  {suggestion.description}
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: '#00C85315',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#00C853',
                    fontWeight: 500,
                  }}
                >
                  📈 潜在影响: {suggestion.potentialImpact}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {isExpanded && (
        <div
          style={{
            padding: `${BigAntsSpacing.md} ${BigAntsSpacing.xl}`,
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '11px',
              color: '#94A3B8',
            }}
          >
            数据更新时间: 2025-07-04 10:30 | 数据来源: 神机营SaaS分析系统
          </span>
          <a
            href="/sports-ants/analytics"
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: BigAntsColors.primary,
              textDecoration: 'none',
            }}
          >
            查看完整报告 →
          </a>
        </div>
      )}
    </div>
  );
}
