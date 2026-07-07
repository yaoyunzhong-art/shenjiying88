/**
 * EPC+O全流程服务页
 * 服务链路展示 + 项目案例 + 定制方案申请
 */

import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const SERVICE_STEPS = [
  {
    step: 1,
    title: '场地评估',
    description: '专业团队实地考察，评估场地条件、客流情况及周边竞争态势',
    duration: '1-3天',
    icon: '🔍',
  },
  {
    step: 2,
    title: '方案设计',
    description: '基于评估结果，定制化设计空间布局、动线规划、视觉系统',
    duration: '3-7天',
    icon: '✏️',
  },
  {
    step: 3,
    title: '工程施工',
    description: '自有施工团队标准化作业，严格把控工期与质量',
    duration: '15-45天',
    icon: '🏗️',
  },
  {
    step: 4,
    title: '设备供应',
    description: '一站式配置智能设备、软件系统、道具软装',
    duration: '与施工同步',
    icon: '🎛️',
  },
  {
    step: 5,
    title: '运营支持',
    description: '持续提供培训指导、营销策划、供应链对接等运营赋能',
    duration: '长期陪伴',
    icon: '📈',
  },
];

const CASE_STUDIES = [
  {
    id: '1',
    clientName: '华润万象城',
    location: '深圳',
    type: '数字运动体验馆',
    scale: '2000㎡',
    duration: '60天',
    description: '在其商业综合体内打造了首批数字运动体验空间，融合科技与运动，客流提升35%',
    tags: ['数字运动', '商业综合体', '标杆案例'],
  },
  {
    id: '2',
    clientName: '中粮大悦城',
    location: '北京',
    type: '智慧零售空间',
    scale: '1500㎡',
    duration: '45天',
    description: '全新智慧零售空间，整合线上线下资源，打造沉浸式购物体验',
    tags: ['智慧零售', '新零售', '数字化转型'],
  },
  {
    id: '3',
    clientName: '龙湖天街',
    location: '上海',
    type: '主题娱乐区',
    scale: '3000㎡',
    duration: '75天',
    description: '室内主题娱乐区，引入多个互动体验项目，成为区域打卡圣地',
    tags: ['主题娱乐', '互动体验', '客流引擎'],
  },
];

const FAQ_DATA = [
  {
    question: 'EPC+O服务的适用场景有哪些？',
    answer: '适用于商业综合体、购物中心、社区商业、文旅景区、体育场馆等多种场景。无论是新建项目还是存量改造，我们都能提供全流程服务。',
  },
  {
    question: '项目周期一般多长？',
    answer: '根据项目规模和复杂程度，从场地评估到开业运营，一般需要2-6个月。具体周期可在初步沟通后提供详细评估。',
  },
  {
    question: '如何保证项目质量？',
    answer: '我们拥有自有施工团队和设备供应链，所有环节标准化管理，全程可视化监控，确保项目高质量交付。',
  },
  {
    question: '后续运营支持有哪些？',
    answer: '提供人员培训、营销策划、供应链对接、数据分析等全方位运营支持，还有专属客户经理7×24小时在线服务。',
  },
];

export default function EpcPage() {
  return (
    <>
      <SEOMeta
        title="EPC+O全流程服务 - 从规划到运营的一站式解决方案"
        description="神机营EPC+O全流程服务，提供场地评估、方案设计、工程施工、设备供应、运营支持的一站式服务。500+成功项目，98%客户满意度。"
        keywords={['EPC', '全流程服务', '空间打造', '商业综合体', '智慧零售']}
        type="website"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-blue-600 tracking-wider uppercase mb-4">
              EPC+O 全流程服务
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              从规划到运营
              <br />
              <span className="text-blue-600">一路相伴</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              专业的EPC+O全流程服务，涵盖场地评估、方案设计、工程施工、
              设备供应、运营支持，让您的项目从0到1无忧落地
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                获取定制方案
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                查看成功案例
              </Link>
            </div>
          </div>
        </section>

        {/* Service Process */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">五步成就精品项目</h2>
              <p className="text-xl text-gray-500">标准化流程，确保项目高质量交付</p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {SERVICE_STEPS.map((item) => (
                  <div key={item.step} className="relative">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                      <div className="absolute -top-4 left-6 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="text-4xl mb-4 pt-2">{item.icon}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-500 text-sm mb-3">{item.description}</p>
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">500+成功项目</h2>
              <p className="text-xl text-gray-500">覆盖商业综合体、社区商业、文旅景区等多元场景</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {CASE_STUDIES.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-6xl opacity-50">🏢</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{caseItem.clientName}</h3>
                      <span className="text-sm text-gray-400">{caseItem.location}</span>
                    </div>
                    <p className="text-blue-600 font-medium mb-3">{caseItem.type}</p>
                    <p className="text-gray-500 text-sm mb-4">{caseItem.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>规模: {caseItem.scale}</span>
                      <span>周期: {caseItem.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {caseItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <p className="text-5xl font-bold mb-2">500+</p>
                <p className="text-blue-100">成功项目</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">98%</p>
                <p className="text-blue-100">客户满意度</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">10+</p>
                <p className="text-blue-100">年行业经验</p>
              </div>
              <div>
                <p className="text-5xl font-bold mb-2">200+</p>
                <p className="text-blue-100">专业团队</p>
              </div>
            </div>
          </div>
        </section>

        {/* Conversion Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              开启您的项目之旅
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              立即提交项目需求，专业团队将在24小时内与您联系
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/contact"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                提交项目需求
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-full transition-all hover:shadow-md"
              >
                预约线下考察
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">联系我们</p>
              <ContactButtons
                phone="400-888-8888"
                email="epc@shenjiying.com"
                wechat="shenjiying888"
                layout="horizontal"
                size="lg"
              />
            </div>

            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">分享给更多人</p>
              <ShareButtons
                url="https://www.shenjiying.com/epc"
                title="神机营EPC+O全流程服务 - 从规划到运营的一站式解决方案"
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
