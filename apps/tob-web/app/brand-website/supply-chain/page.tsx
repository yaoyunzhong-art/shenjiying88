/**
 * 供应链与品牌合作页 - Supply Chain Page
 * 供应链能力展示、品牌合作案例
 */

import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const SUPPLY_CHAIN_FEATURES = [
  {
    title: '全品类覆盖',
    description: '涵盖食品、饮料、日用品、电子、服装等20+品类，满足企业多样化采购需求',
    icon: '📦',
  },
  {
    title: '全球采购网络',
    description: '整合国内外500+优质供应商资源，确保产品品质与价格竞争力',
    icon: '🌐',
  },
  {
    title: '智能库存管理',
    description: '实时库存监控、智能补货提醒、库存周转率优化，降低库存成本',
    icon: '📊',
  },
  {
    title: '高效物流配送',
    description: '覆盖50+城市的物流网络，48小时极速达，支持冷链配送',
    icon: '🚚',
  },
  {
    title: '品质溯源保障',
    description: '从源头到终端的全流程品控，扫码即可查看产品溯源信息',
    icon: '🔍',
  },
  {
    title: '专属客服支持',
    description: '7×24小时专属顾问，1对1服务，快速响应您的需求',
    icon: '💬',
  },
];

const BRAND_PARTNERS = [
  { id: 'huarun', name: '华润', category: '综合零售' },
  { id: 'zhongliang', name: '中粮', category: '食品饮料' },
  { id: 'wanda', name: '万达', category: '商业地产' },
  { id: 'shunfeng', name: '顺丰', category: '物流配送' },
  { id: 'suning', name: '苏宁', category: '零售连锁' },
  { id: 'yonghui', name: '永辉', category: '生鲜零售' },
  { id: 'hualian', name: '华联', category: '连锁超市' },
  { id: 'dairunfa', name: '大润发', category: '综合零售' },
];

const FAQ_DATA = [
  {
    question: '供货渠道有哪些优势？',
    answer: '我们整合了国内外500+优质供应商资源，跳过中间环节直接对接品牌方或一级经销商，确保价格优势和品质保障。',
  },
  {
    question: '配送范围和时效？',
    answer: '覆盖全国50+重点城市，主城区48小时极速达。偏远地区配送时效可能略有差异，具体可咨询客服。',
  },
  {
    question: '如何保证商品品质？',
    answer: '我们建立了严格的供应商准入机制，所有商品全程可溯源。同时采用AI视觉技术进行抽检，确保品质一致性。',
  },
  {
    question: '支持哪些结算方式？',
    answer: '支持线上支付、银行转账、月结等多种结算方式。优质客户可享受先货后款的账期服务。',
  },
];

export default function SupplyChainPage() {
  return (
    <>
      <SEOMeta
        title="供应链合作 - 全链路供应链解决方案"
        description="神机营供应链服务，全品类覆盖、全球采购网络、智能库存管理、高效物流配送。500+品牌合作伙伴，一站式采购更便捷。"
        keywords={['供应链', '供货渠道', '品牌合作', '采购', '物流配送']}
        type="website"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-green-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-green-200 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-200 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-green-600 tracking-wider uppercase mb-4">
              供应链合作
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              强大供应链
              <br />
              <span className="text-green-600">赋能商业伙伴</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              整合全球优质供应链资源，为企业客户提供
              一站式采购、物流、仓储等全链路服务
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: '500+', label: '优质供应商' },
                { value: '20+', label: '产品品类' },
                { value: '50+', label: '覆盖城市' },
                { value: '48h', label: '极速配送' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-3xl font-bold text-green-600">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">全链路供应链服务</h2>
              <p className="text-xl text-gray-500">从采购到配送，提供一站式全流程服务支持</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUPPLY_CHAIN_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center text-2xl mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Partners */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">品牌合作伙伴</h2>
              <p className="text-xl text-gray-500">500+ 企业客户的信任之选</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BRAND_PARTNERS.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-white rounded-xl p-6 text-center border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {partner.name[0]}
                  </div>
                  <p className="font-bold text-gray-900 mb-1">{partner.name}</p>
                  <p className="text-sm text-gray-400">{partner.category}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              开启供应链合作
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              立即提交合作申请，获取专属供应链解决方案
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/contact"
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                申请合作对接
              </Link>
              <Link
                href="/products"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                查看产品列表
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">联系我们</p>
              <ContactButtons
                phone="400-888-8888"
                email="supply@shenjiying.com"
                wechat="shenjiying888"
                layout="horizontal"
                size="lg"
              />
            </div>

            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
              <ShareButtons
                url="https://www.shenjiying.com/supply-chain"
                title="神机营供应链合作 - 全链路供应链解决方案"
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
