/**
 * 品牌官网首页
 * 苹果风格B2B官网
 */

import Link from 'next/link';
import SEOMeta, { OrganizationJSONLD } from './components/seo/SEOMeta';
import ShareButtons from './components/social/ShareButtons';
import ContactButtons from './components/social/ContactButtons';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import BusinessSection from './components/BusinessSection';
import AdvantageGrid from './components/AdvantageGrid';
import CaseShowcase from './components/CaseShowcase';
import FixedCTA from './components/FixedCTA';

const BUSINESS_CARDS = [
  {
    id: 'product',
    title: '产品销售',
    subtitle: '全品类供应链产品矩阵',
    description: '涵盖食品、饮料、日用品等全品类产品，提供一站式采购解决方案',
    icon: '📦',
    features: ['源头直供', '品质保障', '全品类覆盖', '配送时效'],
    ctaText: '了解产品详情',
    ctaLink: '/products',
    highlights: ['1000+SKU', '48h达'],
  },
  {
    id: 'epc',
    title: 'EPC+O全流程服务',
    subtitle: '从规划到运营的一站式服务',
    description: '提供场地评估、方案设计、工程施工、设备供应、运营支持的全流程服务',
    icon: '🏗️',
    features: ['专业团队', '全流程覆盖', '定制化方案', '成功案例'],
    ctaText: '了解更多',
    ctaLink: '/epc',
    highlights: ['500+项目', '98%满意度'],
  },
  {
    id: 'digital-sports',
    title: '数字运动潮玩馆',
    subtitle: '沉浸式运动娱乐体验',
    description: '打造集运动、科技、娱乐于一体的新型数字运动空间',
    icon: '🎮',
    features: ['科技赋能', '多人互动', '多元场景', '运营支持'],
    ctaText: '探索馆型',
    ctaLink: '/digital-sports',
    highlights: ['日均客流1000+', '投资回报周期短'],
  },
  {
    id: 'franchise',
    title: '招商加盟',
    subtitle: '三类合作模式灵活选择',
    description: '特许加盟、合资联营、品牌授权三大合作模式，支持创业梦想',
    icon: '🤝',
    features: ['低门槛', '高回报', '全程扶持', '品牌赋能'],
    ctaText: '立即咨询',
    ctaLink: '/franchise',
    highlights: ['0加盟费', 'ROI 200%+'],
  },
];

const ADVANTAGES = [
  {
    title: '供应链优势',
    description: '深耕行业10年+，整合优质供应链资源，提供极具竞争力的产品价格',
  },
  {
    title: '专业团队',
    description: '200+行业专家，涵盖运营、技术、策划等领域，提供全方位支持',
  },
  {
    title: '品牌赋能',
    description: '神机营品牌背书，全媒体营销支持，助力合作伙伴快速建立市场影响力',
  },
  {
    title: '服务体系',
    description: '7×24小时客服响应，标准化服务流程，确保合作伙伴无忧经营',
  },
  {
    title: '技术驱动',
    description: '自研SaaS管理系统，智能化运营工具，提升管理效率50%+',
  },
  {
    title: '资源共享',
    description: '全国资源网络，跨区域联动，为合作伙伴拓展无限商机',
  },
];

const CASES = [
  {
    id: '1',
    clientName: '华润万象',
    logo: '/cases/huarun.png',
    description: '在其全国100+门店成功部署数字运动解决方案，月均客流提升35%',
    tags: ['数字运动', 'EPC+O'],
  },
  {
    id: '2',
    clientName: '中粮大悦城',
    logo: '/cases/dayang.png',
    description: '引入全套供应链产品解决方案，采购成本降低22%，运营效率提升40%',
    tags: ['供应链', '产品销售'],
  },
  {
    id: '3',
    clientName: '龙湖天街',
    logo: '/cases/longfor.png',
    description: '合作打造首批数字运动潮玩馆旗舰店，成为区域商业地标',
    tags: ['数字运动', '品牌授权'],
  },
  {
    id: '4',
    clientName: '万达广场',
    logo: '/cases/wanda.png',
    description: '全国50+项目深度合作，涵盖产品供应、运营支持等多元化服务',
    tags: ['全品类合作', '长期战略'],
  },
];

export default function HomePage() {
  return (
    <>
      <SEOMeta
        title="神机营 - 智能科技解决方案专家"
        description="神机营是专业的智能科技服务平台，提供EPC+O全流程服务、数字运动、招商加盟等多元化解决方案。汇聚200+行业专家，服务500+企业客户。"
        keywords={['神机营', '智能科技', 'EPC服务', '数字运动', '招商加盟', '供应链']}
        type="website"
      />
      <OrganizationJSONLD />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        <main>
          <HeroSection />

          <BusinessSection {...({ cards: BUSINESS_CARDS } as any)} />

          <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-sm font-medium text-blue-600 tracking-wider uppercase mb-3">
                  核心优势
                </h2>
                <h3 className="text-4xl font-bold text-gray-900">
                  为什么选择神机营
                </h3>
                <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                  十年深耕，匠心服务，成为企业值得信赖的合作伙伴
                </p>
              </div>

              <AdvantageGrid advantages={ADVANTAGES} />
            </div>
          </section>

          <CaseShowcase cases={CASES} />

          {/* 转化区域 */}
          <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                开启您的商业新篇章
              </h2>
              <p className="text-xl text-gray-500 mb-10">
                无论您是寻求供应链合作，还是希望打造数字运动空间，<br />
                神机营专业团队将为您提供一站式解决方案
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  立即咨询合作
                </Link>
                <Link
                  href="/franchise"
                  className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
                >
                  了解更多加盟政策
                </Link>
              </div>

              {/* 联系方式 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
                <p className="text-sm text-gray-500 mb-4">或通过以下方式联系我们</p>
                <ContactButtons
                  phone="400-888-8888"
                  email="business@shenjiying.com"
                  wechat="shenjiying888"
                  layout="horizontal"
                  size="lg"
                />
              </div>

              {/* 分享 */}
              <div className="mt-12">
                <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
                <ShareButtons
                  url="https://www.shenjiying.com"
                  title="神机营 - 智能科技解决方案专家"
                  platforms={['wechat', 'weibo', 'douyin', 'linkedin', 'twitter']}
                  layout="horizontal"
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
