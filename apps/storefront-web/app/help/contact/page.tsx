'use client';

import { useState } from 'react';
import { PageShell } from '@m5/ui';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', type: 'suggestion', content: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <PageShell title="联系我们" subtitle="客服·反馈·合作">
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 联系信息 */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3">📞 客服热线</h3>
            <p className="text-2xl font-bold text-blue-400">400-888-8888</p>
            <p className="text-xs text-gray-500 mt-1">周一至周日 09:00-22:00</p>
          </div>

          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3">💬 在线客服</h3>
            <p className="text-sm text-gray-400">微信公众号/小程序内在线客服</p>
            <p className="text-sm text-gray-400 mt-1">在线时间: 09:00-22:00</p>
            <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              联系在线客服
            </button>
          </div>

          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3">📧 电子邮箱</h3>
            <p className="text-sm text-blue-400">support@shenjiying.com</p>
            <p className="text-xs text-gray-500 mt-1">工作日24小时内回复</p>
          </div>

          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-3">📍 总部地址</h3>
            <p className="text-sm text-gray-400">上海市浦东新区张江高科技园区</p>
            <p className="text-xs text-gray-500 mt-1">来访请提前预约</p>
          </div>
        </div>

        {/* 意见反馈 */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4">📝 意见反馈</h3>

          {submitted ? (
            <div className="text-center py-12">
              <span className="text-5xl">✅</span>
              <p className="text-green-400 mt-3 font-medium">提交成功！</p>
              <p className="text-sm text-gray-500 mt-1">感谢您的反馈，我们会尽快处理</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">姓名</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="您的姓名"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">手机号</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="用于联系您"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">反馈类型</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="suggestion">改进建议</option>
                  <option value="bug">问题反馈</option>
                  <option value="complaint">投诉</option>
                  <option value="cooperation">商务合作</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">详细说明</label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="请详细描述您的问题或建议..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                提交反馈
              </button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
