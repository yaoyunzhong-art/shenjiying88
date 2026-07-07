/**
 * 运动蚂蚁决策资源中心页面
 * BigAnts Decision Resources Center
 * 为客户提供自主决策支持的完整资源库
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import ConversionTracker from '../components/ConversionTracker';
import DataShowcase, { PRESET_DATA_SHOWCASES } from '../components/DataShowcase';
import { BigAntsTransitions } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

// 资源类型
type ResourceType = 'report' | 'calculator' | 'case-study' | 'faq' | 'guide' | 'template';

// 资源项
interface ResourceItem {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  icon: string;
  href?: string;
  downloadUrl?: string;
  readTime?: string;
  publishDate?: string;
  tags?: string[];
}

// 资源分类
interface ResourceCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  resources: ResourceItem[];
}

// 资源分类完整数据
const RESOURCE_CATEGORIES_FULL: ResourceCategoryData[] = [
  {
    id: 'industry-data',
    name: '行业数据报告',
    icon: '📊',
    color: '#0066FF',
    description: '权威行业数据，助您了解市场趋势',
    resources: [
      {
        id: 'report-1',
        type: 'report' as const,
        title: '2025中国数字运动行业发展白皮书',
        description: '全面分析数字运动行业市场规模、竞争格局、发展趋势，基于500+项目数据',
        icon: '📄',
        href: '/resources/reports/digital-sports-2025',
        readTime: '15分钟',
        publishDate: '2025-06-15',
        tags: ['行业报告', '市场规模', '趋势分析'],
      },
      {
        id: 'report-2',
        type: 'report' as const,
        title: '商业综合体数字运动区选址研究报告',
        description: '基于500+案例的选址数据分析，提供最佳位置建议和人流规律研究',
        icon: '📄',
        href: '/resources/reports/site-selection-analysis',
        readTime: '10分钟',
        publishDate: '2025-05-20',
        tags: ['选址研究', '商业分析', '数据报告'],
      },
      {
        id: 'report-3',
        type: 'report' as const,
        title: '数字运动馆投资回报分析报告',
        description: '不同城市、不同面积项目的投资回报周期详细测算，含敏感性分析',
        icon: '📄',
        href: '/resources/reports/roi-analysis',
        readTime: '12分钟',
        publishDate: '2025-04-10',
        tags: ['投资分析', 'ROI', '回报测算'],
      },
      {
        id: 'report-4',
        type: 'report' as const,
        title: 'Z世代消费行为研究报告',
        description: '深度分析25岁以下消费群体的运动娱乐偏好和消费习惯',
        icon: '📄',
        href: '/resources/reports/gen-z-consumption',
        readTime: '18分钟',
        publishDate: '2025-03-28',
        tags: ['消费者研究', 'Z世代', '行为分析'],
      },
    ],
  },
  {
    id: 'tools',
    name: '决策工具',
    icon: '🧮',
    color: '#00C853',
    description: '在线工具助您快速评估项目可行性',
    resources: [
      {
        id: 'calc-1',
        type: 'calculator' as const,
        title: '投资回报计算器',
        description: '输入您的预算、面积、预期客流，快速测算回本周期和盈利模型',
        icon: '🧮',
        href: '/sports-ants/roi-calculator',
        tags: ['ROI计算', '投资分析', '必备工具'],
      },
      {
        id: 'calc-2',
        type: 'calculator' as const,
        title: '选址评估工具',
        description: '输入位置信息，AI智能评估该点位的商业潜力评分',
        icon: '📍',
        href: '/sports-ants/site-evaluator',
        tags: ['选址评估', 'AI评分', '位置分析'],
      },
      {
        id: 'calc-3',
        type: 'calculator' as const,
        title: '设备配置推荐',
        description: '根据您的场地面积和目标客群，智能推荐最佳设备组合',
        icon: '🎮',
        href: '/sports-ants/device-recommender',
        tags: ['设备选型', '智能推荐', '组合方案'],
      },
      {
        id: 'calc-4',
        type: 'calculator' as const,
        title: '竞争分析工具',
        description: '分析区域内竞争对手情况，制定差异化竞争策略',
        icon: '🔍',
        href: '/sports-ants/competition-analyzer',
        tags: ['竞争分析', '市场定位', '策略制定'],
      },
    ],
  },
  {
    id: 'case-studies',
    name: '案例研究',
    icon: '🏆',
    color: '#FF6B00',
    description: '成功案例深度解析，复制成功经验',
    resources: [
      {
        id: 'case-1',
        type: 'case-study' as const,
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
        type: 'case-study' as const,
        title: '某三线城市创业者的从0到1之路',
        description: '80后首次创业，150㎡门店，首年盈利50万，详细创业复盘',
        icon: '🚀',
        href: '/sports-ants/cases/startup-story',
        readTime: '15分钟',
        publishDate: '2025-02-28',
        tags: ['创业故事', '小面积', '首次创业'],
      },
      {
        id: 'case-3',
        type: 'case-study' as const,
        title: '政府公共体育中心EPC+O项目案例',
        description: '某地级市政府5000㎡公共体育设施，从招标到运营全流程',
        icon: '🏛️',
        href: '/sports-ants/cases/government-epc',
        readTime: '25分钟',
        publishDate: '2025-01-20',
        tags: ['政府项目', 'EPC+O', '5000㎡'],
      },
      {
        id: 'case-4',
        type: 'case-study' as const,
        title: '文旅景区沉浸式体验项目案例',
        description: '某5A级景区数字运动项目，游客停留时间提升150%',
        icon: '🎢',
        href: '/sports-ants/cases/tourism-project',
        readTime: '18分钟',
        publishDate: '2024-12-15',
        tags: ['文旅景区', '沉浸式', '体验升级'],
      },
    ],
  },
  {
    id: 'knowledge',
    name: '知识中心',
    icon: '📚',
    color: '#8B5CF6',
    description: '入门指南和常见问题解答',
    resources: [
      {
        id: 'faq-1',
        type: 'faq' as const,
        title: '数字运动馆投资常见20问',
        description: '涵盖选址、装修、设备、运营等各方面的常见问题解答',
        icon: '❓',
        href: '/sports-ants/faq/investment',
        tags: ['新手必看', '常见问题', '投资指南'],
      },
      {
        id: 'guide-1',
        type: 'guide' as const,
        title: '数字运动馆开店全流程指南',
        description: '从项目启动到开业运营的完整步骤清单，附时间节点',
        icon: '📋',
        href: '/sports-ants/guides/startup-guide',
        readTime: '30分钟',
        publishDate: '2025-06-01',
        tags: ['开店指南', '全流程', '步骤清单'],
      },
      {
        id: 'template-1',
        type: 'template' as const,
        title: '商业计划书模板',
        description: '数字运动馆项目商业计划书标准模板，可直接下载使用',
        icon: '📝',
        downloadUrl: '/downloads/business-plan-template.docx',
        tags: ['商业计划书', '模板下载', '可编辑'],
      },
      {
        id: 'guide-2',
        type: 'guide' as const,
        title: '设备选型完全指南',
        description: '如何根据场地、客群、预算选择最合适的设备组合',
        icon: '🎯',
        href: '/sports-ants/guides/device-selection',
        readTime: '25分钟',
        publishDate: '2025-05-15',
        tags: ['设备选型', '采购指南', '配置方案'],
      },
    ],
  },
];

// FAQ数据
const FAQ_DATA = [
  {
    category: '投资与成本',
    questions: [
      {
        q: '投资数字运动馆需要多少钱？',
        a: '根据项目规模和合作模式不同，投资金额也有所差异：单台设备约5-15万，标准门店约30-80万，大型场馆约100-300万。我们提供灵活的融资方案，最低首付40%即可启动。',
      },
      {
        q: '场地需要多大面积？',
        a: '根据项目类型不同：单台设备约10-30㎡，标准门店约100-300㎡，大型场馆500㎡以上。我们提供专业场地规划服务，确保空间利用最大化。',
      },
      {
        q: '设备多久回本？',
        a: '根据已运营数据，平均回本周期为12-18个月。实际回本时间取决于选址、运营能力、客流量等因素。我们会提供详细的盈利测算报告。',
      },
      {
        q: '需要多少人员运营？',
        a: '标准门店（200-300㎡）通常需要3-5名运营人员。我们提供全套运营培训课程，涵盖设备操作、客户服务、营销推广等内容。',
      },
    ],
  },
  {
    category: '合作模式',
    questions: [
      {
        q: '三种合作模式的区别是什么？',
        a: '直营门店：由总部全额投资开设门店，适合优质商业体快速布局；联营门店：双方共同出资，按投资比例分配收益；合作开店：合作伙伴首付40%启动，总部提供设备、选址、装修、运营全流程支持。',
      },
      {
        q: '加盟费是多少？',
        a: '我们采用0加盟费模式，仅收取设备和服务费用。具体费用根据项目规模、合作模式、设备配置等因素综合确定。',
      },
      {
        q: '合同期是多长？',
        a: '标准合作期限为5年，期满可续约。对于联营和直营模式，合同条款可根据实际情况进一步协商。',
      },
    ],
  },
  {
    category: '服务与支持',
    questions: [
      {
        q: '售后服务有哪些？',
        a: '我们提供：一年免费保修、7×24小时技术支持、设备工程师现场安装调试、操作培训、软件内容定期更新、定期巡检服务等。',
      },
      {
        q: '设备出现问题怎么办？',
        a: '设备出现问题时，您可以通过400客服热线、微信客服或SaaS系统在线报修。我们的目标是在4小时内给出解决方案，24小时内上门服务。',
      },
      {
        q: '神机营SaaS系统如何使用？',
        a: '神机营SaaS系统提供网页端和手机APP两种访问方式。系统涵盖设备监控、内容更新、会员管理、营销工具、数据分析等功能模块，我们提供全程培训和技术支持。',
      },
    ],
  },
];

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState('industry-data');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const currentCategory = RESOURCE_CATEGORIES_FULL.find((c) => c.id === activeCategory);

  // 追踪分类切换
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    conversionService.trackCTAClick('resources', `category_${categoryId}`);
  };

  // 追踪资源点击
  const handleResourceClick = (resourceId: string) => {
    conversionService.trackDecisionResourceView(resourceId);
    conversionService.trackCTAClick('resources', `resource_${resourceId}`);
  };

  // 追踪FAQ展开
  const handleFaqToggle = (faqKey: string) => {
    const newExpanded = expandedFaq === faqKey ? null : faqKey;
    setExpandedFaq(newExpanded);
    if (newExpanded) {
      conversionService.trackCTAClick('resources', `faq_expand_${faqKey}`);
    }
  };

  return (
    <>
      <SEOMeta
        title="决策资源中心 - 行业报告、计算工具、成功案例"
        description="运动蚂蚁决策资源中心，提供行业数据报告、投资回报计算器、成功案例研究等决策支持资源，助您做出明智的商业决策。"
        keywords={['决策资源', '行业报告', '投资分析', '成功案例', 'ROI计算器', '开店指南']}
        type="website"
      />

      <ConversionTracker page="resources" />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero Section */}
        <section
          style={{
            position: 'relative',
            paddingTop: '120px',
            paddingBottom: '60px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {/* 背景图片 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/resources/roi-calculator.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 100%)',
          }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '16px',
              }}
            >
              决策资源中心
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '600px',
                margin: '0 auto',
                marginBottom: '32px',
              }}
            >
              真实数据、专业报告、成功案例，为您的投资决策提供全方位支撑
            </p>

            {/* 核心数据 */}
            <div
              style={{
                display: 'inline-flex',
                gap: '32px',
                padding: '16px 32px',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              {[
                { value: '500+', label: '场地案例' },
                { value: '2000+', label: '合作伙伴' },
                { value: '60+', label: '款产品设备' },
                { value: '100+', label: '专利认证' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#0066FF' }}>{stat.value}</p>
                  <p style={{ fontSize: '13px', color: '#666666' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 资源分类Tab */}
        <section style={{ padding: '0 24px 40px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}
            >
              {RESOURCE_CATEGORIES_FULL.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: activeCategory === category.id ? category.color : '#F8FAFC',
                    color: activeCategory === category.id ? '#FFFFFF' : '#666666',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 资源列表 */}
        <section style={{ padding: '40px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* 分类标题 */}
            {currentCategory && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '32px' }}>{currentCategory.icon}</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E' }}>
                    {currentCategory.name}
                  </h2>
                </div>
                <p style={{ fontSize: '14px', color: '#666666', marginLeft: '44px' }}>
                  {currentCategory.description}
                </p>
              </div>
            )}

            {/* 资源卡片 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px',
              }}
            >
              {currentCategory?.resources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleResourceClick(resource.id)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: `all ${BigAntsTransitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = currentCategory.color;
                    e.currentTarget.style.boxShadow = `0 8px 24px ${currentCategory.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: `${currentCategory.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0,
                      }}
                    >
                      {resource.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1A1A2E',
                          marginBottom: '4px',
                        }}
                      >
                        {resource.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#666666',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {resource.description}
                      </p>
                    </div>
                  </div>

                  {/* Meta信息 */}
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

                  {/* 操作按钮 */}
                  <div style={{ marginTop: '16px' }}>
                    {resource.downloadUrl ? (
                      <a
                        href={resource.downloadUrl}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: currentCategory.color,
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '8px',
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
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'transparent',
                          border: `1px solid ${currentCategory.color}`,
                          color: currentCategory.color,
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '8px',
                          textDecoration: 'none',
                        }}
                      >
                        查看详情 →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 行业数据支撑 */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
                📊 行业数据洞察
              </h2>
              <p style={{ fontSize: '14px', color: '#666666' }}>
                所有数据均标注来源和更新时间，确保可信度
              </p>
            </div>

            <DataShowcase
              title={PRESET_DATA_SHOWCASES.industryStats.title}
              subtitle={PRESET_DATA_SHOWCASES.industryStats.subtitle}
              items={PRESET_DATA_SHOWCASES.industryStats.items as any}
              columns={4}
            />
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '60px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
                ❓ 常见问题
              </h2>
              <p style={{ fontSize: '14px', color: '#666666' }}>
                关于投资数字运动馆，您可能想了解的问题
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {FAQ_DATA.map((faq) => (
                <div
                  key={faq.category}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 24px',
                      background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E' }}>
                      {faq.category}
                    </h3>
                  </div>

                  <div style={{ padding: '8px 0' }}>
                    {faq.questions.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderBottom: idx < faq.questions.length - 1 ? '1px solid #F1F5F9' : 'none',
                        }}
                      >
                        <button
                          onClick={() => handleFaqToggle(`${faq.category}-${idx}`)}
                          style={{
                            width: '100%',
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          <span style={{ fontSize: '15px', fontWeight: 500, color: '#1A1A2E' }}>
                            {item.q}
                          </span>
                          <span
                            style={{
                              fontSize: '18px',
                              color: '#999999',
                              transform: expandedFaq === `${faq.category}-${idx}` ? 'rotate(45deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          >
                            +
                          </span>
                        </button>

                        {expandedFaq === `${faq.category}-${idx}` && (
                          <div
                            style={{
                              padding: '0 24px 16px',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '14px',
                                color: '#666666',
                                lineHeight: 1.7,
                              }}
                            >
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 24px', background: '#1A1A2E', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            需要更多帮助？
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '32px',
            }}
          >
            我们的专业顾问随时为您提供一对一咨询
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sports-ants/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 40px',
                background: '#0066FF',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '9999px',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(0, 102, 255, 0.3)',
              }}
            >
              立即咨询
            </Link>
            <Link
              href="/sports-ants/franchise"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 40px',
                background: 'transparent',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                textDecoration: 'none',
              }}
            >
              查看加盟方案
            </Link>
          </div>
        </section>

        <FloatingContact />

        <ExitIntentPopup delaySeconds={10} />

        <Footer />
      </div>
    </>
  );
}
