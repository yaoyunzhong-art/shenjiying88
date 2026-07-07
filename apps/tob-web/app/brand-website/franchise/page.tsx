/**
 * 招商加盟合作页 - Franchise Page
 * 三类合作模式，投资回报、合作政策
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const COOPERATION_MODES = [
  {
    id: 'franchise',
    icon: '🏪',
    title: '特许加盟',
    subtitle: '城市独家保护',
    color: '#0071e3',
    features: [
      { label: '加盟费', value: '一次性5万 + 年费1万' },
      { label: '区域保护', value: '核心城市1家/非核心2-3家' },
      { label: '抽佣比例', value: '阶梯式5%/3%/2%' },
      { label: '培训支持', value: '40节视频课 + 3天线下训练营' },
      { label: '物料供应', value: '总部统一配送，成本价供应' },
      { label: '营销支持', value: '总部统一投放，区域联动' },
    ],
    suitable: '有零售经验、有合适店面的创业者',
  },
  {
    id: 'joint_venture',
    icon: '🤝',
    title: '合资联营',
    subtitle: '共担风险共享收益',
    color: '#34c759',
    features: [
      { label: '投资占比', value: '我方60%，合作方40%' },
      { label: '收益分成', value: '按投资比例分配' },
      { label: '运营管理', value: '双方共同参与' },
      { label: '退出机制', value: '3年后可原价回购' },
      { label: '品牌使用', value: '完全授权' },
      { label: '资源支持', value: '全品类供应链支持' },
    ],
    suitable: '有资金实力、寻求长期稳定回报的企业',
  },
  {
    id: 'brand_license',
    icon: '📜',
    title: '品牌授权',
    subtitle: '轻资产运营模式',
    color: '#af52de',
    features: [
      { label: '授权费', value: '年费2万起（按品类）' },
      { label: '品牌使用', value: '神机营品牌授权' },
      { label: '供货渠道', value: '我可提供，我可协助' },
      { label: '质量管控', value: 'AI视觉10%抽检' },
      { label: '月度审计', value: '确保品牌一致性' },
      { label: '营销联动', value: '可参与全国营销活动' },
    ],
    suitable: '已有成熟渠道、想借用品牌的企业',
  },
];

const FAQ_DATA = [
  {
    question: '加盟费是多少？',
    answer: '特许加盟模式一次性加盟费5万元 plus 年费1万元。合资联营和品牌授权费用根据具体合作方案而定，请联系客服获取详细报价。',
  },
  {
    question: '需要有哪些资质或经验？',
    answer: '不需要特定行业经验。我们提供完整的培训体系和运营支持。您需要具备一定的资金实力和商业资源，欢迎有创业激情和服务意识的合作伙伴。',
  },
  {
    question: '投资回报周期一般是多久？',
    answer: '根据已开业门店的平均数据，投资回报周期约6-12个月，具体受选址、运营能力等因素影响。我们提供详细的投资回报测算。',
  },
  {
    question: '区域保护政策是怎样的？',
    answer: '特许加盟模式下，核心城市实行独家保护，非核心城市根据市场容量允许开设2-3家，确保投资者的市场空间。',
  },
];

export default function FranchisePage() {
  const [selectedMode, setSelectedMode] = useState('franchise');
  const currentMode = COOPERATION_MODES.find((m) => m.id === selectedMode)!;

  return (
    <>
      <SEOMeta
        title="招商加盟 - 三类合作模式灵活选择"
        description="神机营招商加盟，特许加盟/合资联营/品牌授权三种合作模式灵活选择。0加盟费，全程扶持，6-12个月回本。"
        keywords={['招商加盟', '特许加盟', '合资联营', '品牌授权', '创业投资']}
        type="website"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-200 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-pink-200 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-purple-600 tracking-wider uppercase mb-4">
              招商加盟
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              三种合作模式
              <br />
              <span className="text-purple-600">灵活选择</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              无论您是初次创业还是寻求转型升级，
              我们都能为您提供最适合的合作模式
            </p>

            {/* Mode Selector */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {COOPERATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-6 py-3 font-medium rounded-full transition-all ${
                    selectedMode === mode.id
                      ? 'text-white shadow-lg'
                      : 'border-2 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: selectedMode === mode.id ? mode.color : '#d1d5db',
                    background: selectedMode === mode.id ? mode.color : 'transparent',
                  }}
                >
                  {mode.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Mode Detail */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left - Features */}
              <div>
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-6"
                  style={{ background: `${currentMode.color}15` }}
                >
                  {currentMode.icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentMode.title}</h2>
                <p className="text-lg font-medium mb-8" style={{ color: currentMode.color }}>
                  {currentMode.subtitle}
                </p>

                <div className="space-y-4">
                  {currentMode.features.map((feature) => (
                    <div
                      key={feature.label}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-500">{feature.label}</span>
                      <span className="font-medium text-gray-900">{feature.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">适合对象</p>
                  <p className="text-gray-700">{currentMode.suitable}</p>
                </div>
              </div>

              {/* Right - Application Form */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  申请{currentMode.title}
                </h3>
                <p className="text-gray-500 mb-6">填写表单，专业团队将在24小时内与您联系</p>

                <div className="space-y-4">
                  {['企业名称', '联系人', '联系电话', '所在城市'].map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  ))}

                  <textarea
                    placeholder="简单描述您的合作意向"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />

                  <button
                    className="w-full py-4 text-white font-medium rounded-full transition-all hover:shadow-lg"
                    style={{ background: currentMode.color }}
                  >
                    提交申请
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Stats */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">投资回报预估</h2>
              <p className="text-gray-400">基于已开业门店的平均数据</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { value: '6-12', unit: '个月', label: '平均回本周期' },
                { value: '30%+', unit: '', label: '年均投资回报率' },
                { value: '85%', unit: '', label: '门店存活率' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
                >
                  <p className="text-5xl font-bold mb-2">
                    {stat.value}
                    <span className="text-xl text-gray-400 ml-1">{stat.unit}</span>
                  </p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              开启您的创业之旅
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              立即提交申请，获取专属投资方案
            </p>

            <Link
              href="/contact"
              className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              立即申请
            </Link>

            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">联系我们</p>
              <ContactButtons
                phone="400-888-8888"
                email="franchise@shenjiying.com"
                wechat="shenjiying888"
                layout="horizontal"
                size="lg"
              />
            </div>

            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
              <ShareButtons
                url="https://www.shenjiying.com/franchise"
                title="神机营招商加盟 - 三类合作模式灵活选择"
                platforms={['wechat', 'weibo', 'douyin', 'linkedin', 'twitter']}
                layout="horizontal"
              />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
