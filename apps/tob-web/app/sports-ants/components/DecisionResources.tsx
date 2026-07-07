/**
 * 运动蚂蚁决策资源中心
 * BigAnts Decision Resources Center
 * 为客户提供自主决策支持的资源库
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';

// 资源类型
export type ResourceType = 
  | 'report'        // 行业报告
  | 'calculator'    // 计算工具
  | 'case-study'   // 案例研究
  | 'faq'           // 常见问题
  | 'guide'        // 入门指南
  | 'template';     // 模板下载

// 资源项
export interface ResourceItem {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  icon: string;
  href?: string;
  downloadUrl?: string;      // 下载地址
  readTime?: string;         // 阅读时长
  publishDate?: string;      // 发布日期
  tags?: string[];           // 标签
}

// 资源分类
interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  resources: ResourceItem[];
}

// 决策资源数据
const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: 'industry-data',
    name: '行业数据报告',
    icon: '📊',
    description: '权威行业数据，助您了解市场趋势',
    resources: [
      {
        id: 'report-1',
        type: 'report',
        title: '2025中国数字运动行业发展白皮书',
        description: '全面分析数字运动行业市场规模、竞争格局、发展趋势',
        icon: '📄',
        href: '/resources/reports/digital-sports-2025',
        readTime: '15分钟',
        publishDate: '2025-06-15',
        tags: ['行业报告', '市场规模', '趋势分析'],
      },
      {
        id: 'report-2',
        type: 'report',
        title: '商业综合体数字运动区选址研究报告',
        description: '基于500+案例的选址数据分析，提供最佳位置建议',
        icon: '📄',
        href: '/resources/reports/site-selection-analysis',
        readTime: '10分钟',
        publishDate: '2025-05-20',
        tags: ['选址研究', '商业分析', '数据报告'],
      },
      {
        id: 'report-3',
        type: 'report',
        title: '数字运动馆投资回报分析报告',
        description: '不同城市、不同面积项目的投资回报周期详细测算',
        icon: '📄',
        href: '/resources/reports/roi-analysis',
        readTime: '12分钟',
        publishDate: '2025-04-10',
        tags: ['投资分析', 'ROI', '回报测算'],
      },
    ],
  },
  {
    id: 'tools',
    name: '决策工具',
    icon: '🧮',
    description: '在线工具助您快速评估项目可行性',
    resources: [
      {
        id: 'calc-1',
        type: 'calculator',
        title: '投资回报计算器',
        description: '输入您的预算、面积、预期客流，快速测算回本周期和盈利模型',
        icon: '🧮',
        href: '/sports-ants/roi-calculator',
        tags: ['ROI计算', '投资分析', '必备工具'],
      },
      {
        id: 'calc-2',
        type: 'calculator',
        title: '选址评估工具',
        description: '输入位置信息，AI智能评估该点位的商业潜力评分',
        icon: '📍',
        href: '/sports-ants/site-evaluator',
        tags: ['选址评估', 'AI评分', '位置分析'],
      },
      {
        id: 'calc-3',
        type: 'calculator',
        title: '设备配置推荐',
        description: '根据您的场地面积和目标客群，智能推荐最佳设备组合',
        icon: '🎮',
        href: '/sports-ants/device-recommender',
        tags: ['设备选型', '智能推荐', '组合方案'],
      },
    ],
  },
  {
    id: 'case-studies',
    name: '案例研究',
    icon: '🏆',
    description: '成功案例深度解析，复制成功经验',
    resources: [
      {
        id: 'case-1',
        type: 'case-study',
        title: '万达广场2000㎡数字运动馆完整复盘',
        description: '从选址到运营的完整复盘，月均客流3万+，回本周期8个月',
        icon: '🏬',
        href: '/sports-ants/cases/wanda-plaza',
        readTime: '20分钟',
        publishDate: '2025-03-15',
        tags: ['商业综合体', '2000㎡', '成功案例'],
      },
      {
        id: 'case-2',
        type: 'case-study',
        title: '某三线城市创业者的从0到1之路',
        description: '80后首次创业，150㎡门店，首年盈利50万',
        icon: '🚀',
        href: '/sports-ants/cases/startup-story',
        readTime: '15分钟',
        publishDate: '2025-02-28',
        tags: ['创业故事', '小面积', '首次创业'],
      },
      {
        id: 'case-3',
        type: 'case-study',
        title: '政府公共体育中心EPC+O项目案例',
        description: '某地级市政府5000㎡公共体育设施，从招标到运营全流程',
        icon: '🏛️',
        href: '/sports-ants/cases/government-epc',
        readTime: '25分钟',
        publishDate: '2025-01-20',
        tags: ['政府项目', 'EPC+O', '5000㎡'],
      },
    ],
  },
  {
    id: 'knowledge',
    name: '知识中心',
    icon: '📚',
    description: '入门指南和常见问题解答',
    resources: [
      {
        id: 'faq-1',
        type: 'faq',
        title: '数字运动馆投资常见20问',
        description: '涵盖选址、装修、设备、运营等各方面的常见问题解答',
        icon: '❓',
        href: '/sports-ants/faq/investment',
        tags: ['新手必看', '常见问题', '投资指南'],
      },
      {
        id: 'guide-1',
        type: 'guide',
        title: '数字运动馆开店全流程指南',
        description: '从项目启动到开业运营的完整步骤清单',
        icon: '📋',
        href: '/sports-ants/guides/startup-guide',
        readTime: '30分钟',
        tags: ['开店指南', '全流程', '步骤清单'],
      },
      {
        id: 'template-1',
        type: 'template',
        title: '商业计划书模板',
        description: '数字运动馆项目商业计划书标准模板，可直接下载使用',
        icon: '📝',
        downloadUrl: '/downloads/business-plan-template.docx',
        tags: ['商业计划书', '模板下载', '可编辑'],
      },
    ],
  },
];

// 资源类型配置
const RESOURCE_TYPE_CONFIG: Record<ResourceType, { label: string; color: string }> = {
  'report': { label: '报告', color: '#0066FF' },
  'calculator': { label: '工具', color: '#00C853' },
  'case-study': { label: '案例', color: '#FF6B00' },
  'faq': { label: 'FAQ', color: '#8B5CF6' },
  'guide': { label: '指南', color: '#00BCD4' },
  'template': { label: '模板', color: '#FFB800' },
};

interface DecisionResourcesProps {
  maxCategories?: number;    // 最大显示分类数
  maxResourcesPerCategory?: number;  // 每分类最大资源数
  activeCategory?: string;   // 当前选中的分类
  onCategoryChange?: (categoryId: string) => void;  // 分类切换回调
}

export default function DecisionResources({
  maxCategories,
  maxResourcesPerCategory = 3,
  activeCategory: controlledActiveCategory,
  onCategoryChange,
}: DecisionResourcesProps) {
  const [internalActiveCategory, setInternalActiveCategory] = useState(
    controlledActiveCategory || RESOURCE_CATEGORIES[0]?.id
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    RESOURCE_CATEGORIES.slice(0, 2).map(c => c.id)
  );

  const activeCategory = controlledActiveCategory || internalActiveCategory;

  const handleCategoryChange = (categoryId: string) => {
    setInternalActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const displayedCategories = maxCategories
    ? RESOURCE_CATEGORIES.slice(0, maxCategories)
    : RESOURCE_CATEGORIES;

  const currentCategoryData = RESOURCE_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div
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
          padding: `${BigAntsSpacing.xl} ${BigAntsSpacing['2xl']}`,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>📚</span>
          <div>
            <h3
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '20px',
                fontWeight: 700,
                color: BigAntsColors.textPrimary,
                marginBottom: '4px',
              }}
            >
              决策资源中心
            </h3>
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                color: BigAntsColors.textSecondary,
              }}
            >
              真实数据、专业报告、成功案例，助您自主决策
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: BigAntsSpacing.lg,
            flexWrap: 'wrap',
          }}
        >
          {displayedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: activeCategory === category.id ? '#0066FF' : '#F8FAFC',
                border: `1px solid ${activeCategory === category.id ? '#0066FF' : '#E2E8F0'}`,
                borderRadius: BigAntsRadius.full,
                color: activeCategory === category.id ? '#FFFFFF' : BigAntsColors.textSecondary,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span
                style={{
                  padding: '2px 6px',
                  background: activeCategory === category.id ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                  borderRadius: BigAntsRadius.sm,
                  fontSize: '11px',
                }}
              >
                {category.resources.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: BigAntsSpacing.xl }}>
        {currentCategoryData && (
          <>
            {/* Category Header */}
            <div style={{ marginBottom: BigAntsSpacing.lg }}>
              <h4
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: BigAntsColors.textPrimary,
                  marginBottom: '4px',
                }}
              >
                {currentCategoryData.icon} {currentCategoryData.name}
              </h4>
              <p
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: BigAntsColors.textSecondary,
                }}
              >
                {currentCategoryData.description}
              </p>
            </div>

            {/* Resources List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentCategoryData.resources
                .slice(0, maxResourcesPerCategory)
                .map((resource) => (
                  <div
                    key={resource.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: BigAntsSpacing.lg,
                      background: '#F8FAFC',
                      borderRadius: BigAntsRadius.lg,
                      border: '1px solid #E2E8F0',
                      transition: `all ${BigAntsTransitions.fast}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0066FF';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 102, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: BigAntsRadius.md,
                        background: `${RESOURCE_TYPE_CONFIG[resource.type].color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0,
                      }}
                    >
                      {resource.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h5
                          style={{
                            fontFamily: BigAntsFonts.chinese,
                            fontSize: '15px',
                            fontWeight: 600,
                            color: BigAntsColors.textPrimary,
                          }}
                        >
                          {resource.title}
                        </h5>
                        <span
                          style={{
                            padding: '2px 8px',
                            background: `${RESOURCE_TYPE_CONFIG[resource.type].color}15`,
                            color: RESOURCE_TYPE_CONFIG[resource.type].color,
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '4px',
                          }}
                        >
                          {RESOURCE_TYPE_CONFIG[resource.type].label}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '13px',
                          color: BigAntsColors.textSecondary,
                          lineHeight: 1.5,
                          marginBottom: '8px',
                        }}
                      >
                        {resource.description}
                      </p>

                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {resource.readTime && (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                            ⏱ {resource.readTime}
                          </span>
                        )}
                        {resource.publishDate && (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                            📅 {resource.publishDate}
                          </span>
                        )}
                        {resource.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: '2px 8px',
                              background: '#F1F5F9',
                              color: '#64748B',
                              fontSize: '11px',
                              borderRadius: '4px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ flexShrink: 0 }}>
                      {resource.downloadUrl ? (
                        <a
                          href={resource.downloadUrl}
                          download
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 16px',
                            background: RESOURCE_TYPE_CONFIG[resource.type].color,
                            color: '#FFFFFF',
                            fontFamily: BigAntsFonts.chinese,
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: BigAntsRadius.md,
                            textDecoration: 'none',
                          }}
                        >
                          ⬇ 下载
                        </a>
                      ) : (
                        <Link
                          href={resource.href || '#'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 16px',
                            background: 'transparent',
                            border: `1px solid ${RESOURCE_TYPE_CONFIG[resource.type].color}`,
                            color: RESOURCE_TYPE_CONFIG[resource.type].color,
                            fontFamily: BigAntsFonts.chinese,
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: BigAntsRadius.md,
                            textDecoration: 'none',
                          }}
                        >
                          查看 →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* View More */}
            <div style={{ textAlign: 'center', marginTop: BigAntsSpacing.xl }}>
              <Link
                href={`/sports-ants/resources?category=${currentCategoryData.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  background: 'transparent',
                  border: '1px solid #E2E8F0',
                  color: BigAntsColors.textSecondary,
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: BigAntsRadius.full,
                  textDecoration: 'none',
                  transition: `all ${BigAntsTransitions.fast}`,
                }}
              >
                查看全部 {currentCategoryData.resources.length} 个资源 →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
