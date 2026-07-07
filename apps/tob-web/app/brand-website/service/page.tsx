/**
 * 客户服务页
 * 全链路客户服务体系 + 需求提交
 */

import Link from 'next/link';
import SEOMeta, { FAQJSONLD } from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FixedCTA from '../components/FixedCTA';
import ContactButtons from '../components/social/ContactButtons';
import ShareButtons from '../components/social/ShareButtons';

const SERVICE_SYSTEMS = [
  {
    title: '售前咨询',
    description: '专业顾问团队为您提供一对一咨询服务，根据您的需求定制解决方案',
    icon: '💬',
    services: ['需求分析', '方案定制', '投资测算', '选址评估'],
  },
  {
    title: '售中执行',
    description: '项目经理全程跟进，确保每个环节高质量交付',
    icon: '🎯',
    services: ['进度追踪', '质量把控', '问题响应', '变更管理'],
  },
  {
    title: '售后赋能',
    description: '完善的售后体系，持续为您的业务增长赋能',
    icon: '🚀',
    services: ['培训支持', '营销赋能', '运营指导', '定期回访'],
  },
];

const SERVICE_CHANNELS = [
  {
    name: '客服热线',
    value: '400-888-8888',
    hours: '7×24小时',
    icon: '📞',
  },
  {
    name: '企业微信',
    value: 'shenjiying888',
    hours: '工作日 9:00-18:00',
    icon: '💬',
  },
  {
    name: '商务邮箱',
    value: 'business@shenjiying.com',
    hours: '24小时内回复',
    icon: '📧',
  },
  {
    name: '总部地址',
    value: '北京市朝阳区建国门外大街1号国贸中心',
    hours: '周一至周五 9:00-18:00',
    icon: '📍',
  },
];

const FAQ_DATA = [
  {
    question: '服务响应时间是多久？',
    answer: '我们承诺：紧急问题2小时内响应，普通问题4小时内响应，邮件类咨询24小时内回复。7×24小时客服热线随时为您服务。',
  },
  {
    question: '如何提交服务需求？',
    answer: '您可以通过官网联系表单、企业微信客服、电话热线等多种方式提交需求。您的专属客户经理将在24小时内与您联系。',
  },
  {
    question: '有专属客户经理吗？',
    answer: '是的每位合作客户都配有专属客户经理，提供一对一全程服务。从前期咨询到项目落地再到后续运营支持，始终如一。',
  },
  {
    question: '服务是收费的吗？',
    answer: '基础咨询服务免费。根据您选择的服务内容和合作模式，收费标准会有所不同。详情请咨询我们的客服团队。',
  },
];

export default function ServicePage() {
  return (
    <>
      <SEOMeta
        title="客户服务 - 全链路服务体系"
        description="神机营提供全链路客户服务体系，售前咨询、售中执行、售后赋能全程专业服务。7×24小时客服热线，一对一专属顾问。"
        keywords={['客户服务', '售后服务', '客服热线', '服务流程', '客户支持']}
        type="website"
      />
      <FAQJSONLD faqs={FAQ_DATA} />

      <div className="min-h-screen bg-white">
        <Header />
        <FixedCTA />

        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-200 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-blue-600 tracking-wider uppercase mb-4">
              全链路服务
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              始终如一
              <br />
              <span className="text-blue-600">全程相伴</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              从咨询到落地，从开业到运营，
              专业团队全程服务，让您的商业之旅无忧无虑
            </p>
          </div>
        </section>

        {/* Service System */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">全链路服务体系</h2>
              <p className="text-xl text-gray-500">覆盖商业全生命周期的专业服务</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SERVICE_SYSTEMS.map((system) => (
                <div
                  key={system.title}
                  className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-shadow"
                >
                  <div className="text-5xl mb-4">{system.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{system.title}</h3>
                  <p className="text-gray-500 mb-6">{system.description}</p>
                  <ul className="space-y-2">
                    {system.services.map((service) => (
                      <li key={service} className="flex items-center text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Channels */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">联系我们</h2>
              <p className="text-xl text-gray-500">多种渠道，随时为您服务</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICE_CHANNELS.map((channel) => (
                <div
                  key={channel.name}
                  className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-3">{channel.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{channel.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{channel.value}</p>
                  <p className="text-gray-400 text-sm">{channel.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Request Form */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">提交服务需求</h2>
              <p className="text-xl text-gray-500">填写表单，专业团队将在24小时内与您联系</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      企业名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="请输入企业名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系人 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="请输入联系人姓名"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="请输入联系电话"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      合作类型
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                      <option value="">请选择合作类型</option>
                      <option value="product">产品销售合作</option>
                      <option value="epc">EPC+O服务</option>
                      <option value="digital-sports">数字运动合作</option>
                      <option value="franchise">招商加盟</option>
                      <option value="supply">供应链合作</option>
                      <option value="other">其他咨询</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    需求描述
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="请详细描述您的需求..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    提交需求
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
