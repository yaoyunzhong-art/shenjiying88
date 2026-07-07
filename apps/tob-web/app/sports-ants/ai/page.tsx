/**
 * 运动蚂蚁AI赋能中心页面
 * BigAnts AI Empowerment Center
 * 展示AI驱动的个性化推荐、智能客服、转化分析能力
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
import ConversionAnalytics from '../components/ConversionAnalytics';
import DataShowcase, { PRESET_DATA_SHOWCASES } from '../components/DataShowcase';
import { USER_PERSONAS } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';
import { conversionService } from '../lib/conversion-service';

// AI功能配置
const AI_FEATURES = [
  {
    id: 'personalized-recommendation',
    name: '个性化内容推荐',
    icon: '🎯',
    color: '#0066FF',
    description: '基于用户浏览轨迹和兴趣标签，实时推送匹配的业务内容、解决方案与案例资料，实现千人千面的内容触达',
    metrics: {
      matchRate: '90%+',
      label: '推荐匹配度',
    },
    capabilities: [
      '用户行为实时追踪与分析',
      '多维度兴趣标签提取',
      '智能内容匹配算法',
      '动态页面个性化渲染',
    ],
    scene: '用户进入官网后，系统自动识别其身份标签（如：连锁投资者、首次创业），推送对应人群的解决方案和成功案例',
  },
  {
    id: 'ai-customer-service',
    name: 'AI智能客服',
    icon: '💬',
    color: '#00C853',
    description: '7×24小时在线的AI智能咨询客服，支持业务咨询实时响应、常见问题精准解答、合作需求初步收集与分发',
    metrics: {
      matchRate: '98%+',
      label: '问题解答准确率',
    },
    capabilities: [
      '自然语言理解与意图识别',
      '多轮对话与上下文记忆',
      'CRM线索自动收集',
      '智能转人工判定',
    ],
    scene: '客户咨询合作模式、ROI测算、设备选型等问题，AI客服即时响应并收集联系方式，转交人工跟进',
  },
  {
    id: 'conversion-analytics',
    name: '转化数据分析',
    icon: '📊',
    color: '#FF6B00',
    description: 'AI驱动的转化数据分析系统，自动识别全链路转化节点优化空间，输出页面迭代、内容优化的可落地方向',
    metrics: {
      matchRate: '95%+',
      label: '综合响应准确率',
    },
    capabilities: [
      '桑德斯三步法漏斗追踪',
      '页面热点与用户路径分析',
      '流失节点智能识别',
      '迭代建议自动生成',
    ],
    scene: '运营团队可实时查看各转化阶段的流失率、停留时长、点击热图，系统自动输出优化建议报告',
  },
];

// 智能推荐场景
const RECOMMENDATION_SCENARIOS = [
  {
    persona: USER_PERSONAS['chain-investor'],
    scene: '某连锁商业地产公司总监浏览官网',
    triggers: ['多次查看商业综合体案例', '浏览EPC服务页面'],
    recommendation: {
      title: '为您推荐：商业地产增值解决方案',
      items: [
        { type: 'case', text: '万达广场2000㎡数字运动馆完整复盘' },
        { type: 'solution', text: '商业综合体数字运动区选址研究报告' },
        { type: 'saas', text: '神机营多门店管理系统演示' },
      ],
    },
  },
  {
    persona: USER_PERSONAS['first-time-entrepreneur'],
    scene: '首次创业者浏览官网',
    triggers: ['查看合作开店模式', '使用ROI计算器'],
    recommendation: {
      title: '为您推荐：轻资产创业解决方案',
      items: [
        { type: 'case', text: '某三线城市创业者的从0到1之路' },
        { type: 'calculator', text: '投资回报计算器 - 首付40%启动方案' },
        { type: 'guide', text: '数字运动馆开店全流程指南' },
      ],
    },
  },
  {
    persona: USER_PERSONAS['government-project'],
    scene: '政府项目负责人浏览官网',
    triggers: ['查看招投标案例', '了解EPC+O服务'],
    recommendation: {
      title: '为您推荐：政府项目EPC+O解决方案',
      items: [
        { type: 'case', text: '某地级市政府5000㎡公共体育设施案例' },
        { type: 'qualification', text: '运动蚂蚁企业资质与成功案例' },
        { type: 'service', text: '政府项目EPC+O全流程服务介绍' },
      ],
    },
  },
];

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<'recommendation' | 'analytics' | 'showcase'>('recommendation');
  const [activeScenario, setActiveScenario] = useState(0);

  // 追踪Tab切换
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    conversionService.trackCTAClick('ai', `tab_${tab}`);
  };

  // 追踪场景切换
  const handleScenarioChange = (index: number) => {
    setActiveScenario(index);
    conversionService.trackCTAClick('ai', `scenario_${index}`);
  };

  const handleScheduleDemo = async () => {
    conversionService.trackCTAClick('ai', 'cta_demo');
  };

  return (
    <>
      <SEOMeta
        title="AI赋能中心 - 神机营SaaS智能系统"
        description="运动蚂蚁AI赋能中心，基于神机营SaaS系统的个性化推荐、智能客服、转化分析能力，助力企业实现智能化运营和高效转化。"
        keywords={['AI客服', '个性化推荐', '转化分析', '神机营SaaS', '智能运营', '运动蚂蚁AI']}
        type="website"
      />

      <ConversionTracker page="ai-empowerment" />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero Section */}
        <section
          style={{
            paddingTop: '120px',
            paddingBottom: '80px',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(0, 102, 255, 0.1)',
                border: '1px solid rgba(0, 102, 255, 0.3)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ fontSize: '13px', color: '#0066FF' }}>
                神机营SaaS系统 · AI赋能模块
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: '16px',
              }}
            >
              AI赋能中心
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                maxWidth: '700px',
                margin: '0 auto',
                marginBottom: '32px',
              }}
            >
              深度整合人工智能技术，驱动客户体验提升与业务转化增长
            </p>

            {/* 三大AI能力 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '1000px',
                margin: '0 auto',
              }}
            >
              {AI_FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  style={{
                    padding: '24px',
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: `1px solid ${feature.color}20`,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: `${feature.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      marginBottom: '16px',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    {feature.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#666666',
                      lineHeight: 1.6,
                      marginBottom: '16px',
                    }}
                  >
                    {feature.description}
                  </p>
                  <div
                    style={{
                      padding: '12px',
                      background: `${feature.color}10`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '24px', fontWeight: 700, color: feature.color }}>
                      {feature.metrics.matchRate}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666666' }}>{feature.metrics.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 功能详情Tab */}
        <section style={{ padding: '0 24px 60px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Tab Headers */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '40px',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'recommendation', label: '个性化推荐', icon: '🎯' },
                { id: 'analytics', label: '转化分析', icon: '📊' },
                { id: 'showcase', label: '数据支撑', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#0066FF' : 'transparent'}`,
                    color: activeTab === tab.id ? '#0066FF' : '#666666',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'recommendation' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    智能推荐引擎
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666666' }}>
                    基于用户浏览轨迹、业务标签自动推送匹配内容，实现千人千面
                  </p>
                </div>

                {/* 推荐场景切换 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {RECOMMENDATION_SCENARIOS.map((scenario, idx) => (
                    <button
                      key={scenario.persona.id}
                      onClick={() => handleScenarioChange(idx)}
                      style={{
                        padding: '8px 16px',
                        background: activeScenario === idx ? scenario.persona.color : '#F8FAFC',
                        color: activeScenario === idx ? '#FFFFFF' : '#666666',
                        border: `1px solid ${activeScenario === idx ? scenario.persona.color : '#E2E8F0'}`,
                        borderRadius: '9999px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {scenario.persona.icon} {scenario.persona.name}
                    </button>
                  ))}
                </div>

                {/* 场景详情 */}
                {(() => {
                  const scenario = RECOMMENDATION_SCENARIOS[activeScenario];
                  if (!scenario) return null;
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '32px',
                      }}
                    >
                      {/* 左侧：用户画像 */}
                      <div
                        style={{
                          padding: '24px',
                          background: '#F8FAFC',
                          borderRadius: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              background: `${scenario.persona.color}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '28px',
                            }}
                          >
                            {scenario.persona.icon}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A2E' }}>
                              {scenario.persona.name}
                            </h4>
                            <p style={{ fontSize: '12px', color: '#666666' }}>{scenario.persona.subtitle}</p>
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '12px', color: '#666666', marginBottom: '8px' }}>用户行为触发：</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {scenario.triggers.map((trigger) => (
                              <span
                                key={trigger}
                                style={{
                                  padding: '4px 10px',
                                  background: '#FFFFFF',
                                  color: '#0066FF',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                }}
                              >
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 右侧：推荐内容 */}
                      <div
                        style={{
                          padding: '24px',
                          background: '#FFFFFF',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>
                          {scenario.recommendation.title}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {scenario.recommendation.items.map((item, idx) => {
                            const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
                              case: { icon: '🏆', color: '#FF6B00', label: '案例' },
                              solution: { icon: '📋', color: '#0066FF', label: '方案' },
                              saas: { icon: '☁️', color: '#00C853', label: 'SaaS' },
                              calculator: { icon: '🧮', color: '#8B5CF6', label: '工具' },
                              guide: { icon: '📚', color: '#00BCD4', label: '指南' },
                              qualification: { icon: '🏅', color: '#FFB800', label: '资质' },
                              service: { icon: '🤝', color: '#E91E63', label: '服务' },
                            };
                            const config = typeConfig[item.type] ?? typeConfig['case'];
                            if (!config) return null;
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px 16px',
                                  background: `${config.color}10`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                }}
                              >
                                <span style={{ fontSize: '20px' }}>{config.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '13px', color: '#1A1A2E', fontWeight: 500 }}>
                                    {item.text}
                                  </p>
                                </div>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    background: config.color,
                                    color: '#FFFFFF',
                                    fontSize: '10px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {config.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    转化数据分析仪表板
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666666' }}>
                    桑德斯三步法全链路追踪，自动识别优化空间
                  </p>
                </div>

                <ConversionAnalytics />

                {/* 数据说明 */}
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px 24px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>ℹ️</span>
                  <p style={{ fontSize: '13px', color: '#666666' }}>
                    以上为示例数据，实际数据请登录神机营SaaS管理后台查看。系统会定期输出《官网转化数据复盘报告》，支撑季度迭代优化。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'showcase' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    数据支撑体系
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666666' }}>
                    所有对外数据均标注来源、更新时间，确保可信度
                  </p>
                </div>

                <DataShowcase
                  title={PRESET_DATA_SHOWCASES.homeStats.title}
                  subtitle={PRESET_DATA_SHOWCASES.homeStats.subtitle}
                  items={PRESET_DATA_SHOWCASES.homeStats.items as any}
                  columns={4}
                />

                <div style={{ marginTop: '40px' }}>
                  <DataShowcase
                    title={PRESET_DATA_SHOWCASES.industryStats.title}
                    subtitle={PRESET_DATA_SHOWCASES.industryStats.subtitle}
                    items={PRESET_DATA_SHOWCASES.industryStats.items as any}
                    columns={4}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SaaS功能融合 */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
                神机营SaaS AI模块
              </h2>
              <p style={{ fontSize: '14px', color: '#666666' }}>
                AI能力深度融入十大功能模块，全程赋能业务运营
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {Object.entries(SAAS_FEATURES).map(([id, feature]) => (
                <div
                  key={id}
                  style={{
                    padding: '16px',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'rgba(0, 200, 83, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      margin: '0 auto 12px',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A2E' }}>{feature.name}</p>
                  <p style={{ fontSize: '11px', color: '#666666', marginTop: '4px' }}>
                    {feature.description.slice(0, 30)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 24px', textAlign: 'center', background: '#1A1A2E' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
            }}
          >
            预约AI功能演示
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '32px',
            }}
          >
            专业团队为您演示神机营SaaS系统如何赋能您的业务
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sports-ants/contact?source=ai-demo"
              onClick={handleScheduleDemo}
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
              预约演示
            </Link>
            <Link
              href="/sports-ants/products"
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
              了解产品
            </Link>
          </div>
        </section>

        <FloatingContact />

        <ExitIntentPopup delaySeconds={15} />

        <Footer />
      </div>
    </>
  );
}
