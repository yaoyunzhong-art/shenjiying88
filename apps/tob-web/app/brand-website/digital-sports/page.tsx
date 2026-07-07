/**
 * 数字运动潮玩馆页
 * 馆型规划 + 运营支持 + 团队对接
 */

import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const VENUE_TYPES = [
  {
    id: 'standard',
    name: '标准潮玩馆',
    scale: '300-500㎡',
    investment: '50-100万',
    ROI: '18-24个月',
    features: [
      '6-10个互动体验区',
      '日均客流300-500人',
      '适合社区商业配套',
      '快速部署标准方案',
    ],
    icon: '🎮',
  },
  {
    id: 'premium',
    name: '旗舰潮玩馆',
    scale: '500-1000㎡',
    investment: '100-300万',
    ROI: '12-18个月',
    features: [
      '12-20个体验区',
      '日均客流800-1500人',
      '适合购物中心主力店',
      '全流程定制化服务',
    ],
    icon: '🚀',
  },
  {
    id: 'theme',
    name: '主题潮玩馆',
    scale: '1000㎡+',
    investment: '300万+',
    ROI: '12个月内',
    features: [
      '20+个体验区',
      '日均客流2000人+',
      '适合文旅景区/地标项目',
      'IP深度定制合作',
    ],
    icon: '🏆',
  },
];

const OPERATION_SUPPORT = [
  {
    title: '选址支持',
    description: '专业团队协助评估选址，客流分析、竞品调研、投资回报测算',
    icon: '📍',
  },
  {
    title: '培训赋能',
    description: '系统化培训课程，涵盖运营管理、营销推广、客户服务全流程',
    icon: '📚',
  },
  {
    title: '营销支持',
    description: '全年营销日历、节假日活动策划、社交媒体运营指导',
    icon: '📣',
  },
  {
    title: '供应链保障',
    description: '稳定供货渠道、灵活采购方案、库存管理支持',
    icon: '📦',
  },
  {
    title: '技术护航',
    description: '设备运维保障、系统升级迭代、数据分析报表',
    icon: '🔧',
  },
  {
    title: '会员运营',
    description: 'CRM系统支持、会员营销工具、积分体系设计',
    icon: '💳',
  },
];

const FAQ_DATA = [
  {
    question: '建设一个数字运动潮玩馆需要多长时间？',
    answer: '根据馆型大小和定制化程度，从选址到开业，标准馆约2-3个月，旗舰馆3-5个月，主题馆需要5-8个月。我们会提供全程项目管理和进度追踪。',
  },
  {
    question: '投资回报周期一般是多久？',
    answer: '不同馆型回报周期不同：标准馆18-24个月，旗舰馆12-18个月，主题馆12个月内。具体回报受选址、运营能力等因素影响，我们提供详细的投资回报测算。',
  },
  {
    question: '需要有哪些资质或经验？',
    answer: '不需要特定行业经验。我们提供完整的培训体系和运营支持。您需要具备一定的资金实力和商业资源，欢迎有创业激情和服务意识的合作伙伴。',
  },
  {
    question: '设备和技术维护如何保障？',
    answer: '我们提供设备两年质保，终身维护服务。技术团队7×24小时在线支持，系统远程诊断，重大问题48小时内到场处理。',
  },
];

export default function DigitalSportsPage() {
  return (
    <>
      <SEOMeta
        title="数字运动潮玩馆 - 沉浸式运动娱乐新体验"
        description="神机营数字运动潮玩馆，融合科技与运动，打造新一代沉浸式运动娱乐空间。标准馆/旗舰馆/主题馆多种方案，0加盟费全程扶持。"
        keywords={['数字运动', '潮玩馆', '运动娱乐', '沉浸式体验', '体育科技', '投资创业']}
        type="product"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-purple-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-200 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-200 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-purple-600 tracking-wider uppercase mb-4">
              数字运动潮玩馆
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              运动 + 科技 + 娱乐
              <br />
              <span className="text-purple-600">潮玩新体验</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              融合AR/VR、体感交互、AI对战等前沿科技，
              打造新一代沉浸式运动娱乐空间，引领线下消费新潮流
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                获取投资方案
              </Link>
              <Link
                href="/franchise"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                了解更多加盟政策
              </Link>
            </div>
          </div>
        </section>

        {/* Venue Types */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">三种馆型 灵活选择</h2>
              <p className="text-xl text-gray-500">根据您的投资预算和场地条件，定制最优方案</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {VENUE_TYPES.map((venue) => (
                <div
                  key={venue.id}
                  className="relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:border-purple-100 transition-all duration-300"
                >
                  <div className="text-5xl mb-4">{venue.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h3>
                  <div className="flex gap-4 mb-6 text-sm">
                    <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full">
                      {venue.scale}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full">
                      ROI {venue.ROI}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">投资预算: {venue.investment}</p>
                  <ul className="space-y-2">
                    {venue.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operation Support */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">六大运营支持</h2>
              <p className="text-xl text-gray-500">全程扶持，让您无忧经营</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPERATION_SUPPORT.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <p className="text-5xl font-bold mb-2">200+</p>
                <p className="text-purple-100">开业场馆</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">1000万+</p>
                <p className="text-purple-100">累计服务人次</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">15个月</p>
                <p className="text-purple-100">平均回本周期</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">85%</p>
                <p className="text-purple-100">续约率</p>
              </div>
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              开启您的潮玩事业
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              立即联系，获取专属投资方案和盈利测算
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/contact"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                获取投资方案
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                预约实地考察
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">联系我们</p>
              <ContactButtons
                phone="400-888-8888"
                email="sports@shenjiying.com"
                wechat="shenjiying888"
                layout="horizontal"
                size="lg"
              />
            </div>

            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
              <ShareButtons
                url="https://www.shenjiying.com/digital-sports"
                title="神机营数字运动潮玩馆 - 运动+科技+娱乐的潮玩新体验"
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
