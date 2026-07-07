/**
 * 咨询落地页
 * 统一咨询表单 + 联系方式
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import SEOMeta from '../components/seo/SEOMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShareButtons from '../components/social/ShareButtons';

const COOPERATION_TYPES = [
  { value: 'product', label: '产品销售合作' },
  { value: 'epc', label: 'EPC+O全流程服务' },
  { value: 'digital-sports', label: '数字运动合作' },
  { value: 'franchise', label: '招商加盟' },
  { value: 'supply', label: '供应链合作' },
  { value: 'brand', label: '品牌合作' },
  { value: 'other', label: '其他合作' },
];

const SERVICE_CHANNELS = [
  {
    name: '商务热线',
    value: '400-888-8888',
    desc: '7×24小时服务',
    icon: '📞',
  },
  {
    name: '企业微信',
    value: 'shenjiying888',
    desc: '添加好友咨询',
    icon: '💬',
  },
  {
    name: '商务邮箱',
    value: 'business@shenjiying.com',
    desc: '24小时内回复',
    icon: '📧',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    cooperationType: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟提交
    setSubmitted(true);
  };

  return (
    <>
      <SEOMeta
        title="联系我们 - 专业团队在线服务"
        description="联系神机营商务团队，获取产品报价、投资方案、加盟政策等详细信息。7×24小时客服热线，企业微信在线咨询。"
        keywords={['联系我们', '商务合作', '客服热线', '咨询表单']}
        type="website"
      />

      <div className="min-h-screen bg-white">
        <Header />

        {/* Page Header */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">联系我们</h1>
            <p className="text-xl text-gray-500">
              专业团队随时为您服务，期待与您携手合作
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">联系方式</h2>
                <div className="space-y-6">
                  {SERVICE_CHANNELS.map((channel) => (
                    <div
                      key={channel.name}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <span className="text-2xl">{channel.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{channel.name}</p>
                        <p className="text-blue-600">{channel.value}</p>
                        <p className="text-gray-400 text-sm">{channel.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-2">商务合作</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    欢迎有合作意向的企业客户、加盟商、投资人联系咨询
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/products"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      产品销售
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href="/epc"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      EPC服务
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href="/franchise"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      招商加盟
                    </Link>
                  </div>
                </div>

                {/* Share */}
                <div className="mt-8">
                  <p className="text-sm text-gray-500 mb-3">分享给更多人</p>
                  <ShareButtons
                    url="https://www.shenjiying.com/contact"
                    title="联系神机营 - 专业团队在线服务"
                    platforms={['wechat', 'weibo', 'douyin', 'linkedin', 'twitter']}
                    layout="horizontal"
                  />
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                  {!submitted ? (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        提交合作咨询
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              企业名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                              placeholder="请输入企业名称"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              联系人 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="contactPerson"
                              value={formData.contactPerson}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                              placeholder="请输入联系电话"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              合作类型
                            </label>
                            <select
                              name="cooperationType"
                              value={formData.cooperationType}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                            >
                              <option value="">请选择合作类型</option>
                              {COOPERATION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            需求描述
                          </label>
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                            placeholder="请详细描述您的合作需求，我们将尽快与您联系..."
                          />
                        </div>

                        <div className="pt-4">
                          <button
                            type="submit"
                            className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
                          >
                            提交咨询
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="w-10 h-10 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        提交成功！
                      </h2>
                      <p className="text-gray-500 mb-8">
                        感谢您的咨询，专业团队将在24小时内与您联系
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          onClick={() => setSubmitted(false)}
                          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full transition"
                        >
                          继续填写
                        </button>
                        <Link
                          href="/"
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition"
                        >
                          返回首页
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
