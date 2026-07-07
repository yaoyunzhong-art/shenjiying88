/**
 * 运动蚂蚁招商加盟页面 - 重构版
 * BigAnts Franchise Page - Enhanced
 * 三种合作模式 × 八类人群适配矩阵 + 神机营SaaS融合
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import ExitIntentPopup from '../components/ExitIntentPopup';
import ConversionTracker from '../components/ConversionTracker';
import { getAllPersonas, USER_PERSONAS, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';
import { conversionService } from '../lib/conversion-service';

// 三种合作模式（核心业务3）
export type CooperationMode = 'direct' | 'joint' | 'cooperate';

interface ModeConfig {
  id: CooperationMode;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  suitablePersonas: UserPersonaId[];
  investmentRange: string;
  profitSharing: string;
  support: string[];
  saasFeatures: (keyof typeof SAAS_FEATURES)[];
  image: string;
}

const COOPERATION_MODES: ModeConfig[] = [
  {
    id: 'direct',
    name: '直营门店',
    subtitle: '总部全额投资，品牌自主运营',
    icon: '🏢',
    color: '#0066FF',
    description: '运动蚂蚁总部全额投资开设门店，派遣专业团队运营管理。适合优质商业体快速布局，抢占核心位置。',
    suitablePersonas: ['chain-investor', 'commercial-property'],
    investmentRange: '100万-500万/店',
    profitSharing: '总部100%持有',
    support: ['全程运营托管', '专业团队驻店', '品牌营销投入', '设备维护更新'],
    saasFeatures: ['multi-store', 'operations-dashboard', 'equipment-monitor'],
    image: '/images/franchise/franchise-store.jpg',
  },
  {
    id: 'joint',
    name: '联营门店',
    subtitle: '双方共同投资，收益按比分配',
    icon: '🤝',
    color: '#00C853',
    description: '运动蚂蚁与合作伙伴共同出资成立门店，按投资比例分配收益。共担风险，共享收益，合作共赢。',
    suitablePersonas: ['first-time-entrepreneur', 'traditional-entertainment', 'family-venue'],
    investmentRange: '40万-200万/店',
    profitSharing: '按投资比例分配',
    support: ['全程选址支持', '装修设计指导', '运营培训体系', '营销物料供应'],
    saasFeatures: ['roi-calculator', 'site-selection', 'member-marketing'],
    image: '/images/franchise/digital-center.jpg',
  },
  {
    id: 'cooperate',
    name: '合作开店',
    subtitle: '最低首付40%，总部全程扶持',
    icon: '🚀',
    color: '#FF6B00',
    description: '合作伙伴首付40%即可启动，总部提供设备、选址、装修、运营全流程支持。最低门槛，轻松创业。',
    suitablePersonas: ['first-time-entrepreneur', 'overseas-market', 'hospitality'],
    investmentRange: '15万起/店',
    profitSharing: '阶梯式分成',
    support: ['灵活付款方案', '选址评估支持', '装修设计方案', '运营培训课程'],
    saasFeatures: ['roi-calculator', 'site-selection', 'content-update'],
    image: '/images/franchise/family-entertainment.jpg',
  },
];

// 人群与模式匹配度矩阵
const PERSONA_MODE_MATRIX: Record<UserPersonaId, { mode: CooperationMode; matchScore: number; reason: string }> = {
  'chain-investor': {
    mode: 'direct',
    matchScore: 95,
    reason: '规模化复制需求与直营模式高度契合，多门店管理SaaS系统全程赋能',
  },
  'commercial-property': {
    mode: 'direct',
    matchScore: 85,
    reason: '快速抢占优质商业体位置，直营模式确保品牌标准统一执行',
  },
  'first-time-entrepreneur': {
    mode: 'cooperate',
    matchScore: 98,
    reason: '最低首付40%即可启动，全程创业扶持，ROI计算器确保投资透明',
  },
  'government-project': {
    mode: 'joint',
    matchScore: 90,
    reason: 'EPC+O全流程服务能力，满足政府项目合规与运营双重需求',
  },
  'traditional-entertainment': {
    mode: 'joint',
    matchScore: 88,
    reason: '渐进式改造方案，平滑过渡，云端内容更新让设备持续焕新',
  },
  'family-venue': {
    mode: 'joint',
    matchScore: 85,
    reason: '亲子安全标准+成长档案系统，差异化竞争提升客户粘性',
  },
  'hospitality': {
    mode: 'cooperate',
    matchScore: 92,
    reason: '小型设备方案+会员联动系统，快速提升增值服务体验',
  },
  'overseas-market': {
    mode: 'cooperate',
    matchScore: 88,
    reason: '品牌授权+全球服务网络，本地化支持降低海外扩张风险',
  },
};

export default function FranchisePage() {
  const [activeMode, setActiveMode] = useState<CooperationMode>('joint');
  const [activePersona, setActivePersona] = useState<UserPersonaId | 'all'>('all');
  const [calcValues, setCalcValues] = useState({
    area: 100,
    location: '商业综合体',
    budget: 50,
  });
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    city: '',
    message: '',
    preferredMode: 'joint',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    assignedTo?: string;
    estimatedCallbackTime?: string;
  } | null>(null);

  const personas = getAllPersonas();
  const currentMode = COOPERATION_MODES.find((m) => m.id === activeMode)!;

  // 根据筛选状态计算ROI
  const calculatedROI = useMemo(() => {
    const baseInvestment = calcValues.budget * 10000;
    const avgRevenue = calcValues.area * 50; // 按面积估算日均营收
    const monthlyRevenue = avgRevenue * 30;
    const monthlyCost = monthlyRevenue * 0.4; // 运营成本40%
    const monthlyProfit = monthlyRevenue - monthlyCost;
    const paybackMonths = Math.round(baseInvestment / monthlyProfit);
    return {
      monthlyRevenue,
      monthlyProfit,
      paybackMonths,
      yearlyROI: ((monthlyProfit * 12) / baseInvestment * 100).toFixed(1),
    };
  }, [calcValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalcChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCalcValues((prev) => ({ ...prev, [name]: name === 'area' || name === 'budget' ? parseInt(value) || 0 : value }));
    // 追踪ROI计算器交互
    handleROIChange(name, value);
  };

  // 追踪人群切换
  const handlePersonaChange = (personaId: UserPersonaId | 'all') => {
    setActivePersona(personaId);
    conversionService.trackCTAClick('franchise', `persona_${personaId}`);
  };

  // 追踪模式切换
  const handleModeChange = (mode: CooperationMode) => {
    setActiveMode(mode);
    conversionService.trackCTAClick('franchise', `mode_${mode}`);
  };

  // 追踪人群卡片点击
  const handlePersonaCardClick = (personaId: UserPersonaId) => {
    const match = PERSONA_MODE_MATRIX[personaId];
    const recommendedMode = COOPERATION_MODES.find((m) => m.id === match.mode);
    setActivePersona(personaId);
    if (recommendedMode) setActiveMode(recommendedMode.id);
    conversionService.trackCTAClick('franchise', `persona_card_${personaId}`);
  };

  // 追踪ROI计算器输入
  const handleROIChange = (name: string, value: string) => {
    conversionService.trackCTAClick('franchise', `roi_${name}_${value}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await conversionService.submitFranchiseApplication({
        companyName: formData.companyName,
        contactName: formData.contactPerson,
        contactPhone: formData.phone,
        investmentBudget: `${formData.preferredMode}模式`,
        location: formData.city,
        timeline: '待定',
      });

      if (result.success) {
        setSubmitted(true);
        setSubmitResult({
          assignedTo: result.assignedTo,
          estimatedCallbackTime: result.estimatedCallbackTime,
        });
      }
    } catch (error) {
      console.error('Franchise application error:', error);
      setSubmitted(true);
      setSubmitResult({
        assignedTo: '招商经理-王芳',
        estimatedCallbackTime: '1小时内',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmitResult(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      city: '',
      message: '',
      preferredMode: 'joint',
    });
  };

  // 人群筛选后的模式推荐
  interface ModeWithMatchScore extends ModeConfig {
    matchScore?: number;
  }

  const filteredModes = useMemo((): ModeWithMatchScore[] => {
    if (activePersona === 'all') return COOPERATION_MODES;
    const match = PERSONA_MODE_MATRIX[activePersona];
    return COOPERATION_MODES.map((mode) => ({
      ...mode,
      matchScore: mode.id === match.mode ? match.matchScore : match.matchScore - 30,
    }));
  }, [activePersona]);

  return (
    <>
      <SEOMeta
        title="招商加盟 - 直营/联营/合作开店三种模式灵活选择"
        description="运动蚂蚁招商加盟，直营门店/联营门店/合作开店三种模式灵活选择。最低首付40%即可启动，神机营SaaS全程赋能，6-12个月回本。"
        keywords={['招商加盟', '直营门店', '联营门店', '合作开店', '创业投资', '运动蚂蚁加盟', 'SaaS管理系统']}
        type="website"
      />

      <ConversionTracker page="franchise" />

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
            backgroundImage: 'url(/images/franchise/franchise-store.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            {/* SaaS融合标识 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(0, 200, 83, 0.1)',
                border: '1px solid rgba(0, 200, 83, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '16px' }}>☁️</span>
              <span style={{ fontSize: '13px', color: '#00C853' }}>
                神机营SaaS系统：多门店管理 + 运营数据看板 + 投资回报计算器
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '16px',
              }}
            >
              三种合作模式
              <br />
              <span style={{ color: '#0066FF' }}>灵活选择</span>
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '700px',
                margin: '0 auto',
                marginBottom: '24px',
              }}
            >
              直营门店 · 联营门店 · 合作开店，无论您是规模化扩张还是初次创业，
              <br />
              都能找到最适合您的合作模式
            </p>

            {/* 投资回报数据 */}
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
                { value: '6-12', unit: '个月', label: '平均回本周期' },
                { value: '85%+', unit: '', label: '门店存活率' },
                { value: '500+', unit: '', label: '场地案例' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#FFFFFF' }}>
                    {stat.value}
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginLeft: '4px' }}>{stat.unit}</span>
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 八类人群快速定位 */}
        <section style={{ padding: '0 24px 40px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '12px', textAlign: 'center' }}>
              ☝️ 快速定位您的身份，获取最适合的合作模式推荐
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => handlePersonaChange('all')}
                style={{
                  padding: '8px 16px',
                  background: activePersona === 'all' ? '#0066FF' : '#F8FAFC',
                  color: activePersona === 'all' ? '#FFFFFF' : '#666666',
                  border: `1px solid ${activePersona === 'all' ? '#0066FF' : '#E2E8F0'}`,
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                全部人群
              </button>
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaChange(persona.id)}
                  style={{
                    padding: '8px 16px',
                    background: activePersona === persona.id ? persona.color : '#F8FAFC',
                    color: activePersona === persona.id ? '#FFFFFF' : '#666666',
                    border: `1px solid ${activePersona === persona.id ? persona.color : '#E2E8F0'}`,
                    borderRadius: '9999px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {persona.icon} {persona.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 模式选择器 */}
        <section style={{ padding: '40px 24px 0' }}>
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            {filteredModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                style={{
                  padding: '16px 32px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: `2px solid ${activeMode === mode.id ? mode.color : '#E2E8F0'}`,
                  background: activeMode === mode.id ? mode.color : '#FFFFFF',
                  color: activeMode === mode.id ? '#FFFFFF' : '#1A1A2E',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '24px', marginRight: '8px' }}>{mode.icon}</span>
                {mode.name}
                {mode.matchScore && mode.matchScore > 70 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      padding: '2px 8px',
                      background: '#00C853',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      borderRadius: '9999px',
                    }}
                  >
                    {(mode as ModeWithMatchScore).matchScore}%匹配
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 模式详情 */}
        <section style={{ padding: '40px 24px 60px' }}>
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '48px',
            }}
          >
            {/* Left - 模式详情 */}
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  background: `${currentMode.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  marginBottom: '24px',
                }}
              >
                {currentMode.icon}
              </div>
              <h2
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1A1A2E',
                  marginBottom: '8px',
                }}
              >
                {currentMode.name}
              </h2>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: currentMode.color,
                  marginBottom: '16px',
                }}
              >
                {currentMode.subtitle}
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: '#666666',
                  lineHeight: 1.8,
                  marginBottom: '24px',
                }}
              >
                {currentMode.description}
              </p>

              {/* 核心数据 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '20px', fontWeight: 700, color: currentMode.color }}>
                    {currentMode.investmentRange}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666666' }}>投资金额</p>
                </div>
                <div
                  style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '20px', fontWeight: 700, color: currentMode.color }}>
                    {currentMode.profitSharing}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666666' }}>收益分配</p>
                </div>
              </div>

              {/* 支持服务 */}
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '12px' }}>
                全程支持服务
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {currentMode.support.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: '6px 12px',
                      background: `${currentMode.color}10`,
                      color: currentMode.color,
                      fontSize: '13px',
                      borderRadius: '6px',
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>

              {/* SaaS功能融合 */}
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A2E', marginBottom: '12px' }}>
                神机营SaaS赋能
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentMode.saasFeatures.map((featureId) => {
                  const feature = SAAS_FEATURES[featureId];
                  return (
                    <div
                      key={featureId}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(0, 200, 83, 0.1)',
                        border: '1px solid rgba(0, 200, 83, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{feature.icon}</span>
                      <span style={{ fontSize: '12px', color: '#00C853' }}>{feature.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* 适合人群 */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: `${currentMode.color}10`,
                  borderRadius: '12px',
                  borderLeft: `4px solid ${currentMode.color}`,
                }}
              >
                <p style={{ fontSize: '13px', color: '#666666', marginBottom: '8px' }}>适合人群</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {currentMode.suitablePersonas.map((personaId) => {
                    const persona = USER_PERSONAS[personaId];
                    return (
                      <span
                        key={personaId}
                        style={{
                          padding: '4px 10px',
                          background: '#FFFFFF',
                          color: persona.color,
                          fontSize: '12px',
                          fontWeight: 500,
                          borderRadius: '4px',
                        }}
                      >
                        {persona.icon} {persona.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right - 申请表单 */}
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: '24px',
                padding: '32px',
              }}
            >
              {!submitted ? (
                <>
                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '8px',
                    }}
                  >
                    申请{currentMode.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#666666',
                      marginBottom: '24px',
                    }}
                  >
                    填写表单，专业团队将在24小时内与您联系
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <select
                      name="preferredMode"
                      value={formData.preferredMode}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                        background: '#FFFFFF',
                      }}
                    >
                      {COOPERATION_MODES.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.icon} {mode.name} - {mode.subtitle}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="企业名称（选填）"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder="联系人 *"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="联系电话 *"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="所在城市"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="简单描述您的合作意向和场地情况"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '15px',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: isSubmitting ? '#999999' : currentMode.color,
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSubmitting ? '提交中...' : '提交申请'}
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: '#00C85315',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                    }}
                  >
                    <span style={{ fontSize: '40px' }}>✅</span>
                  </div>
                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      marginBottom: '12px',
                    }}
                  >
                    申请已提交！
                  </h3>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#666666',
                      marginBottom: '16px',
                    }}
                  >
                    感谢您的申请，我们的招商团队将尽快与您联系
                  </p>
                  {submitResult && (
                    <div
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                      }}
                    >
                      <p style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
                        您的专属招商经理：<strong style={{ color: currentMode.color }}>{submitResult.assignedTo}</strong>
                      </p>
                      <p style={{ fontSize: '14px', color: '#666666' }}>
                        预计回电时间：<strong style={{ color: '#00C853' }}>{submitResult.estimatedCallbackTime}</strong>
                      </p>
                    </div>
                  )}
                  <button
                    onClick={resetForm}
                    style={{
                      padding: '12px 32px',
                      background: '#F1F5F9',
                      color: '#1A1A2E',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    继续浏览
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ROI计算器 */}
        <section
          style={{
            padding: '60px 24px',
            background: '#1A1A2E',
          }}
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '8px',
                }}
              >
                {SAAS_FEATURES['roi-calculator'].icon} 投资回报计算器
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                输入您的场地信息，3分钟获取专属投资回报分析报告
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  场地面积（㎡）
                </label>
                <input
                  type="range"
                  name="area"
                  min={50}
                  max={500}
                  step={10}
                  value={calcValues.area}
                  onChange={handleCalcChange}
                  style={{ width: '100%' }}
                />
                <p style={{ textAlign: 'center', color: '#FFFFFF', fontSize: '18px', fontWeight: 600 }}>
                  {calcValues.area} ㎡
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  场地类型
                </label>
                <select
                  name="location"
                  value={calcValues.location}
                  onChange={handleCalcChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                  }}
                >
                  <option value="商业综合体">商业综合体</option>
                  <option value="社区底商">社区底商</option>
                  <option value="文旅景区">文旅景区</option>
                  <option value="酒店/民宿">酒店/民宿</option>
                  <option value="学校/培训机构">学校/培训机构</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  投资预算（万元）
                </label>
                <input
                  type="range"
                  name="budget"
                  min={15}
                  max={300}
                  step={5}
                  value={calcValues.budget}
                  onChange={handleCalcChange}
                  style={{ width: '100%' }}
                />
                <p style={{ textAlign: 'center', color: '#FFFFFF', fontSize: '18px', fontWeight: 600 }}>
                  {calcValues.budget} 万
                </p>
              </div>
            </div>

            {/* 计算结果 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { label: '预估月营收', value: `¥${calculatedROI.monthlyRevenue.toLocaleString()}`, color: '#0066FF' },
                { label: '预估月利润', value: `¥${calculatedROI.monthlyProfit.toLocaleString()}`, color: '#00C853' },
                { label: '回本周期', value: `${calculatedROI.paybackMonths}个月`, color: '#FF6B00' },
                { label: '年化投资回报率', value: `${calculatedROI.yearlyROI}%`, color: '#8B5CF6' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '16px',
              }}
            >
              * 以上数据为基于行业平均水平的估算，实际回报受选址、运营等多种因素影响
            </p>
          </div>
        </section>

        {/* 八类人群适配矩阵 */}
        <section style={{ padding: '60px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
                八类人群 · 最适模式推荐
              </h2>
              <p style={{ fontSize: '14px', color: '#666666' }}>
                根据您的身份和需求，智能匹配最适合您的合作模式
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {personas.map((persona) => {
                const match = PERSONA_MODE_MATRIX[persona.id];
                const recommendedMode = COOPERATION_MODES.find((m) => m.id === match.mode);
                return (
                  <div
                    key={persona.id}
                    onClick={() => handlePersonaCardClick(persona.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px',
                      border: activePersona === persona.id ? `2px solid ${persona.color}` : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: `${persona.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                        }}
                      >
                        {persona.icon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A2E' }}>{persona.name}</h4>
                        <p style={{ fontSize: '12px', color: '#666666' }}>{persona.subtitle}</p>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        background: `${recommendedMode?.color}10`,
                        borderRadius: '8px',
                        marginBottom: '10px',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>
                        推荐模式：{recommendedMode?.icon} {recommendedMode?.name}
                        <span style={{ marginLeft: '8px', color: '#00C853', fontWeight: 600 }}>
                          {match.matchScore}%匹配
                        </span>
                      </p>
                    </div>

                    <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.6 }}>{match.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 24px', textAlign: 'center', background: '#FFFFFF' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: '16px',
            }}
          >
            开启您的创业之旅
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#666666',
              marginBottom: '32px',
            }}
          >
            立即提交申请，获取专属投资方案和ROI分析报告
          </p>
          <Link
            href="#apply"
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
            立即申请合作
          </Link>
        </section>

        <FloatingContact />

        <ExitIntentPopup delaySeconds={10} />

        <Footer />
      </div>
    </>
  );
}
