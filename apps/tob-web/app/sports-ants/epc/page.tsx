/**
 * 运动蚂蚁EPC+O全流程服务页面 - 重构版
 * BigAnts EPC+O Service Page - Enhanced
 * 包含招投标项目承接能力展示
 */

'use client';

import React, { useState } from 'react';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import PageTransition, { FadeInSection } from '../components/PageTransition';
import { conversionService } from '../lib/conversion-service';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';
import { USER_PERSONAS } from '../lib/user-personas';

// EPC六阶段（增强版）
const EPC_STAGES = [
  {
    step: '01',
    title: '需求沟通',
    icon: '📋',
    description: '深入了解您的场地情况、预算规模、目标客群和经营预期',
    deliverables: ['需求确认书', '场地勘察报告', '商圈分析报告', '初步方案建议'],
    timeline: '1-3天',
    saasFeature: 'site-selection',
    saasBenefit: 'AI选址系统精准评估',
    image: '/images/epc/project-planning.jpg',
  },
  {
    step: '02',
    title: '方案设计',
    icon: '📐',
    description: '由专业设计团队提供完整的空间规划、动线设计、3D效果图和投资回报测算',
    deliverables: ['CAD平面布局图', '3D效果图', '动线规划图', '投资回报测算表'],
    timeline: '3-7天',
    saasFeature: 'space-planning',
    saasBenefit: '3D空间规划工具快速出图',
    image: '/images/epc/venue-planning.jpg',
  },
  {
    step: '03',
    title: '商务签约',
    icon: '✍️',
    description: '明确双方权益，签订正式合同，确定设备清单、交付标准和付款方式',
    deliverables: ['商务合同', '设备清单', '交付标准', '项目推进表'],
    timeline: '1-3天',
    saasFeature: 'roi-calculator',
    saasBenefit: 'ROI计算器确保投资透明',
    image: '/images/epc/project-planning.jpg',
  },
  {
    step: '04',
    title: '生产采购',
    icon: '🏭',
    description: '自有工厂生产，品质可控，物流配送到场',
    deliverables: ['设备生产中', '品质检验报告', '物流配送单', '到货验收单'],
    timeline: '15-30天',
    saasFeature: 'equipment-monitor',
    saasBenefit: 'IoT监控全流程可视化',
    image: '/images/about/factory.jpg',
  },
  {
    step: '05',
    title: '工程施工',
    icon: '🔧',
    description: '专业施工团队进场，设备安装调试，员工培训',
    deliverables: ['施工进度表', '设备安装单', '系统调试报告', '培训签到表'],
    timeline: '15-30天',
    saasFeature: 'multi-store',
    saasBenefit: '多门店管理系统统一管控',
    image: '/images/epc/installation-team.jpg',
  },
  {
    step: '06',
    title: '运营支持',
    icon: '🚀',
    description: '开业活动策划，持续运营指导，内容更新推送，设备维护支持',
    deliverables: ['开业活动方案', '运营手册', '月度经营报告', '设备维护记录'],
    timeline: '长期',
    saasFeature: 'operations-dashboard',
    saasBenefit: '运营数据看板实时追踪',
    image: '/images/epc/completed-venue.jpg',
  },
];

// 招投标项目类型
const TENDER_TYPES = [
  {
    id: 'government-sports',
    icon: '🏛️',
    title: '政府公共体育设施',
    description: '社区体育中心、城市健身广场、公共体育场等政府主导项目',
    requirements: ['政府招标资质', 'EPC总包能力', '运营配套方案', '售后服务保障'],
    color: '#0066FF',
    image: '/images/solutions/government-sports.jpg',
  },
  {
    id: 'culture-tourism',
    icon: '🏯',
    title: '文旅景区项目',
    description: '旅游景区、主题公园、文旅小镇等体验升级项目',
    requirements: ['文旅融合经验', '差异化方案', '引流效果证明', '运营培训能力'],
    color: '#FF6B00',
    image: '/images/solutions/culture-tourism.jpg',
  },
  {
    id: 'smart-city',
    icon: '🌆',
    title: '智慧城市项目',
    description: '智慧社区、数字体育公园、城市更新等综合项目',
    requirements: ['智慧城市资质', '系统集成能力', '数据对接经验', '长期运维能力'],
    color: '#8B5CF6',
    image: '/images/scenes/digital-sports-center.jpg',
  },
  {
    id: 'school-sports',
    icon: '🏫',
    title: '学校体育设施',
    description: '校园体育设施、青少年体育培训基地等项目',
    requirements: ['教育行业经验', '安全标准认证', '培训课程体系', '资金申请经验'],
    color: '#00C853',
    image: '/images/solutions/school-sports.jpg',
  },
];

// 服务保障
const GUARANTEES = [
  {
    title: '源头生产制造商',
    description: '掌握核心技术的专业设计研发部门，所有产品自主生产，品质可控',
    icon: '🏭',
    color: '#0066FF',
  },
  {
    title: '自主研发体系',
    description: '为整个行业开发解决方案，针对产品痛点提供有效解决方案',
    icon: '💡',
    color: '#FF6B00',
  },
  {
    title: '专业场地设计',
    description: '专业设计团队，现场巡检测量，根据项目要求规划设计方案',
    icon: '📐',
    color: '#00C853',
  },
  {
    title: '准时交付保障',
    description: '工期保障，延期赔付，确保项目按时开业',
    icon: '⏰',
    color: '#FFB800',
  },
  {
    title: '现场安装培训',
    description: '产品工程师进行现场安装调试，并提供操作培训',
    icon: '🎓',
    color: '#8B5CF6',
  },
  {
    title: '强大售后支持',
    description: '设备自带一年免费保修，技术人员随时待命，4小时响应',
    icon: '🛡️',
    color: '#00BCD4',
  },
];

export default function EPCPage() {
  const [activeTab, setActiveTab] = useState<'epc' | 'tender'>('epc');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactPhone: '',
    projectType: '',
    budget: '',
    area: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 追踪Tab切换
  const handleTabChange = (tab: 'epc' | 'tender') => {
    setActiveTab(tab);
    conversionService.trackCTAClick('epc', `tab_${tab}`);
  };

  // 追踪阶段点击
  const handleStageClick = (step: string) => {
    conversionService.trackCTAClick('epc', `stage_${step}`);
  };

  // 追踪招投标类型点击
  const handleTenderTypeClick = (tenderId: string) => {
    conversionService.trackCTAClick('epc', `tender_${tenderId}`);
  };

  // 追踪服务保障点击
  const handleGuaranteeClick = (index: number) => {
    conversionService.trackCTAClick('epc', `guarantee_${index}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      conversionService.trackCTAClick('epc', 'form_submit');
      await conversionService.submitEPCConsult({
        companyName: formData.companyName,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        projectType: formData.projectType,
        budget: formData.budget,
        area: formData.area,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('EPC consult error:', error);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="EPC+O全流程服务 - 从规划到运营的一站式解决方案"
        description="运动蚂蚁EPC+O全流程服务，提供从场地规划、设备采购、施工建设到运营管理的全方位一站式解决方案。同时承接政府公共体育设施、文旅景区等大型项目招投标。"
        keywords={['EPC+O', '全流程服务', '一站式解决方案', '招投标', '政府项目', '运动蚂蚁']}
        type="website"
      />

      <PageTransition>
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
              backgroundImage: 'url(/images/epc/project-planning.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.15,
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 100%)',
            }} />
            <FadeInSection>
              {/* Tab Switcher */}
              <div
                style={{
                  display: 'inline-flex',
                  gap: '4px',
                  padding: '4px',
                  background: '#F1F5F9',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}
              >
                <button
                  onClick={() => handleTabChange('epc')}
                  style={{
                    padding: '10px 24px',
                    background: activeTab === 'epc' ? '#0066FF' : 'transparent',
                    color: activeTab === 'epc' ? '#FFFFFF' : '#666666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  EPC+O全流程服务
                </button>
                <button
                  onClick={() => handleTabChange('tender')}
                  style={{
                    padding: '10px 24px',
                    background: activeTab === 'tender' ? '#8B5CF6' : 'transparent',
                    color: activeTab === 'tender' ? '#FFFFFF' : '#666666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  招投标项目承接
                </button>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                {activeTab === 'epc' ? (
                  <>
                    EPC+O
                    <br />
                    <span style={{ color: '#0066FF' }}>全流程一站式服务</span>
                  </>
                ) : (
                  <>
                    招投标项目
                    <br />
                    <span style={{ color: '#8B5CF6' }}>EPC+O全模式承接</span>
                  </>
                )}
              </h1>
              <p
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  maxWidth: '800px',
                  margin: '0 auto',
                  lineHeight: 1.8,
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                {activeTab === 'epc'
                  ? '从规划设计到运营管理，运动蚂蚁提供全流程一站式服务，让您的投资更省心、省力、省钱'
                  : '拥有丰富的政府公共体育设施、文旅景区、智慧城市等大型项目承接经验，提供设计-采购-施工+运营全模式服务'}
              </p>
            </FadeInSection>
          </section>

          {/* EPC Section */}
          {activeTab === 'epc' && (
            <>
              {/* Six Stage Process */}
              <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <FadeInSection>
                    <h2
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      六阶段全程服务
                    </h2>
                    <p
                      style={{
                        fontSize: '16px',
                        color: '#666666',
                        textAlign: 'center',
                        marginBottom: '48px',
                      }}
                    >
                      每一步都有神机营SaaS系统赋能
                    </p>
                  </FadeInSection>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    {EPC_STAGES.map((stage, index) => (
                      <FadeInSection key={stage.step} delay={index * 50}>
                        <div
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '16px',
                            padding: '24px',
                            position: 'relative',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStageClick(stage.step)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0066FF';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 102, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {/* SaaS Badge */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              padding: '4px 8px',
                              background: `${SAAS_FEATURES[stage.saasFeature as keyof typeof SAAS_FEATURES]?.icon === '📍' ? '#00C853' : '#0066FF'}15`,
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ fontSize: '12px' }}>
                              {SAAS_FEATURES[stage.saasFeature as keyof typeof SAAS_FEATURES]?.icon}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#00C853',
                                fontWeight: 500,
                              }}
                            >
                              SaaS
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              marginBottom: '16px',
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: '#0066FF',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 700,
                              }}
                            >
                              {stage.step}
                            </div>
                            <div>
                              <h3
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 700,
                                  color: '#1A1A2E',
                                }}
                              >
                                {stage.title}
                              </h3>
                              <p
                                style={{
                                  fontSize: '12px',
                                  color: '#0066FF',
                                }}
                              >
                                ⏱ {stage.timeline}
                              </p>
                            </div>
                          </div>

                          <p
                            style={{
                              fontSize: '14px',
                              color: '#666666',
                              lineHeight: 1.6,
                              marginBottom: '16px',
                            }}
                          >
                            {stage.description}
                          </p>

                          {/* SaaS Benefit */}
                          <div
                            style={{
                              padding: '8px 12px',
                              background: '#00C85310',
                              border: '1px solid #00C85330',
                              borderRadius: '6px',
                              marginBottom: '16px',
                              fontSize: '12px',
                              color: '#00C853',
                            }}
                          >
                            ☁️ {stage.saasBenefit}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            {stage.deliverables.map((item) => (
                              <span
                                key={item}
                                style={{
                                  padding: '2px 8px',
                                  background: '#F1F5F9',
                                  color: '#666666',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </FadeInSection>
                    ))}
                  </div>
                </div>
              </section>

              {/* Target Personas */}
              <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A2E', marginBottom: '24px' }}>
                    适合选择EPC+O服务的客户
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {['first-time-entrepreneur', 'chain-investor', 'government-project', 'traditional-entertainment'].map((personaId) => {
                      const persona = USER_PERSONAS[personaId as keyof typeof USER_PERSONAS];
                      if (!persona) return null;
                      return (
                        <div
                          key={personaId}
                          style={{
                            padding: '10px 20px',
                            background: `${persona.color}15`,
                            border: `1px solid ${persona.color}40`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{persona.icon}</span>
                          <span style={{ fontSize: '14px', color: persona.color, fontWeight: 500 }}>
                            {persona.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Tender Section */}
          {activeTab === 'tender' && (
            <>
              {/* Tender Types */}
              <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <FadeInSection>
                    <h2
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      招投标项目类型
                    </h2>
                    <p
                      style={{
                        fontSize: '16px',
                        color: '#666666',
                        textAlign: 'center',
                        marginBottom: '48px',
                      }}
                    >
                      我们具备承接各类大型政府及文旅项目的能力
                    </p>
                  </FadeInSection>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    {TENDER_TYPES.map((tender) => (
                      <FadeInSection key={tender.id}>
                        <div
                          style={{
                            background: '#FFFFFF',
                            border: `2px solid ${tender.color}30`,
                            borderRadius: '16px',
                            padding: '24px',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleTenderTypeClick(tender.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = `0 12px 32px ${tender.color}20`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '16px',
                              background: `${tender.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                              marginBottom: '16px',
                            }}
                          >
                            {tender.icon}
                          </div>
                          <h3
                            style={{
                              fontSize: '20px',
                              fontWeight: 700,
                              color: '#1A1A2E',
                              marginBottom: '8px',
                            }}
                          >
                            {tender.title}
                          </h3>
                          <p
                            style={{
                              fontSize: '14px',
                              color: '#666666',
                              lineHeight: 1.6,
                              marginBottom: '16px',
                            }}
                          >
                            {tender.description}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#999999', fontWeight: 500 }}>
                              投标要求
                            </span>
                            {tender.requirements.map((req) => (
                              <div
                                key={req}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  color: '#666666',
                                }}
                              >
                                <span style={{ color: tender.color }}>✓</span>
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </FadeInSection>
                    ))}
                  </div>
                </div>
              </section>

              {/* Qualifications */}
              <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A2E', marginBottom: '32px' }}>
                    资质与能力
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'EPC总包资质', value: '✅' },
                      { label: 'ISO9001认证', value: '✅' },
                      { label: '高新企业认证', value: '✅' },
                      { label: '100+专利技术', value: '✅' },
                      { label: '政府项目经验', value: '50+' },
                      { label: '成功案例覆盖', value: '30+省市' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: '16px 24px',
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          textAlign: 'center',
                          minWidth: '140px',
                        }}
                      >
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#0066FF', marginBottom: '4px' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666666' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Guarantees */}
          <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <FadeInSection>
                <h2
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  八大服务保障
                </h2>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#666666',
                    textAlign: 'center',
                    marginBottom: '48px',
                  }}
                >
                  选择运动蚂蚁，选择放心
                </p>
              </FadeInSection>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {GUARANTEES.map((guarantee, index) => (
                  <FadeInSection key={guarantee.title} delay={index * 50}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '20px',
                        background: '#FAFAFA',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onClick={() => handleGuaranteeClick(index)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F0F0F0';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FAFAFA';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `${guarantee.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          flexShrink: 0,
                        }}
                      >
                        {guarantee.icon}
                      </div>
                      <div>
                        <h4
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1A1A2E',
                            marginBottom: '4px',
                          }}
                        >
                          {guarantee.title}
                        </h4>
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#666666',
                            lineHeight: 1.5,
                          }}
                        >
                          {guarantee.description}
                        </p>
                      </div>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section style={{ padding: '80px 24px', background: '#0066FF' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <FadeInSection>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    {activeTab === 'epc' ? '预约EPC服务咨询' : '获取招投标方案'}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    我们的专业顾问将在1小时内与您联系
                  </p>
                </div>

                {submitted ? (
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '40px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A2E', marginBottom: '8px' }}>
                      提交成功！
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666666' }}>
                      我们的顾问将在1小时内联系您，请保持电话畅通
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '32px',
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        name="companyName"
                        placeholder="公司/项目名称"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <input
                        type="text"
                        name="contactName"
                        placeholder="联系人"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="tel"
                        name="contactPhone"
                        placeholder="联系电话"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: formData.projectType ? '#1A1A2E' : '#999',
                          outline: 'none',
                        }}
                      >
                        <option value="">项目类型</option>
                        <option value="epc">EPC+O服务</option>
                        <option value="government">政府公共体育</option>
                        <option value="tourism">文旅景区</option>
                        <option value="smart-city">智慧城市</option>
                        <option value="other">其他</option>
                      </select>
                      <input
                        type="text"
                        name="budget"
                        placeholder="预算范围（如：100-500万）"
                        value={formData.budget}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <textarea
                      name="area"
                      placeholder="请描述您的场地情况或项目需求..."
                      value={formData.area}
                      onChange={handleInputChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                        marginBottom: '16px',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: '#0066FF',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? '提交中...' : '立即提交'}
                    </button>
                  </form>
                )}
              </FadeInSection>
            </div>
          </section>

          <FloatingContact />
          <ExitIntentPopup delaySeconds={10} />
          <Footer />
        </div>
      </PageTransition>
    </>
  );
}
