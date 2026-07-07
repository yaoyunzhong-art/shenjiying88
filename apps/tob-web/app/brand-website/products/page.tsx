/**
 * 产品销售业务页
 * 全品类产品矩阵展示 + 合作政策 + 报价申请
 */

import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const PRODUCT_CATEGORIES = [
  {
    id: 'food',
    name: '食品饮料',
    icon: '🍎',
    description: '休闲食品、进口零食、饮料乳品、生鲜水果',
    products: ['精品零食', '进口食品', '鲜榨果汁', '低温乳制品'],
  },
  {
    id: 'daily',
    name: '日用百货',
    icon: '🧴',
    description: '家居清洁、个人护理、纸品湿巾、厨卫用品',
    products: ['清洁用品', '个护产品', '纸巾湿巾', '厨房神器'],
  },
  {
    id: 'beauty',
    name: '美妆护肤',
    icon: '💄',
    description: '护肤彩妆、面膜眼膜、男士护理、母婴用品',
    products: ['护肤套装', '彩妆单品', '母婴用品', '男士护理'],
  },
  {
    id: 'digital',
    name: '数码电器',
    icon: '📱',
    description: '手机配件、智能家居、厨房电器、生活电器',
    products: ['手机配件', '智能音箱', '小家电', '生活电器'],
  },
  {
    id: 'fashion',
    name: '服饰箱包',
    icon: '👜',
    description: '时尚女装、品质男装、儿童服装、精品箱包',
    products: ['潮流女装', '商务男装', '儿童服饰', '品牌箱包'],
  },
  {
    id: 'sports',
    name: '运动户外',
    icon: '⚽',
    description: '运动鞋服、健身器材、户外装备、体育用品',
    products: ['运动鞋服', '健身器材', '户外装备', '体育用品'],
  },
];

const POLICIES = [
  {
    title: '源头直供',
    description: '对接千家知名品牌厂商，省去中间环节，价格更优',
    icon: '🏭',
  },
  {
    title: '品质保障',
    description: '严格的供应商准入机制，所有商品正品保证，假一赔十',
    icon: '✅',
  },
  {
    title: '全品类覆盖',
    description: '10000+SKU，涵盖生活全场景，一站式采购更便捷',
    icon: '📦',
  },
  {
    title: '配送时效',
    description: '全国仓储网络覆盖，48小时急速达，订单实时追踪',
    icon: '🚚',
  },
  {
    title: '专属服务',
    description: '一对一专属客户经理，7×24小时在线，售后无忧',
    icon: '💬',
  },
  {
    title: '灵活账期',
    description: '优质客户享受月结服务，资金周转更灵活',
    icon: '💳',
  },
];

const FAQ_DATA = [
  {
    question: '起订量是多少？',
    answer: '根据不同品类和合作模式，起订量要求不同。具体请与专属客户经理沟通，我们可以为您提供灵活的采购方案。',
  },
  {
    question: '如何保证商品品质？',
    answer: '我们建立了严格的供应商准入机制，所有商品均从品牌方或授权经销商采购，全程可溯源，并提供假一赔十的品质承诺。',
  },
  {
    question: '配送范围和时效？',
    answer: '全国主要城市均可配送，重点城市支持48小时急速达。偏远地区配送时效可能略有差异，请咨询客服。',
  },
  {
    question: '支持哪些结算方式？',
    answer: '支持线上支付、银行转账、月结等多种结算方式。优质客户可享受先货后款的账期服务。',
  },
];

export default function ProductsPage() {
  return (
    <>
      <SEOMeta
        title="产品销售 - 全品类供应链解决方案"
        description="神机营提供全品类产品供应链服务，涵盖食品饮料、日用百货、美妆护肤等十大品类，源头直供、品质保障、48小时配送。"
        keywords={['产品销售', '供应链', '食品饮料', '日用百货', '批发', '一件代发']}
        type="product"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-blue-600 tracking-wider uppercase mb-4">
              全品类供应链平台
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              万千好物 一站购齐
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              汇聚10000+优质品牌，涵盖食品饮料、日用百货、美妆护肤等全品类，
              为您提供一站式供应链解决方案
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                获取产品报价
              </Link>
              <Link
                href="/supply-chain"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                了解更多合作模式
              </Link>
            </div>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">十大品类 全场景覆盖</h2>
              <p className="text-xl text-gray-500">满足消费者日常生活全方位需求</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PRODUCT_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="group bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
                >
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-500 mb-4">{category.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.products.map((product) => (
                      <span
                        key={product}
                        className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cooperation Policies */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">六大合作保障</h2>
              <p className="text-xl text-gray-500">全方位赋能您的商业发展</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {POLICIES.map((policy) => (
                <div
                  key={policy.title}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{policy.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{policy.title}</h3>
                  <p className="text-gray-500 text-sm">{policy.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              开启您的供应链升级之旅
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              专业团队将在24小时内为您提供定制化方案和优惠报价
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/contact"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                申请产品报价
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                对接销售团队
              </Link>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">或通过以下方式联系我们</p>
              <ContactButtons
                phone="400-888-8888"
                email="product@shenjiying.com"
                wechat="shenjiying888"
                layout="horizontal"
                size="lg"
              />
            </div>

            {/* Share */}
            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
              <ShareButtons
                url="https://www.shenjiying.com/products"
                title="神机营产品销售 - 全品类供应链解决方案"
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
