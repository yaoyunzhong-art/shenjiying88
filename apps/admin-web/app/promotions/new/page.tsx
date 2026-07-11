'use client';

import { useState } from 'react';
import { PageShell } from '@m5/ui';

const PROMO_TYPES = ['折扣促销', '满减活动', '买赠活动', '会员专享', '限时秒杀', '新人专享'];
const STORE_SCOPE = ['全部门店', '指定门店', '指定区域'];

const PLACEHOLDER_PROMOS = [
  { id: 1, name: '暑期8折狂欢', type: '折扣促销', status: '进行中', start: '2026-07-01', end: '2026-08-31', discount: '8折', scope: '全部门店' },
  { id: 2, name: '满200减50', type: '满减活动', status: '已结束', start: '2026-06-01', end: '2026-06-30', discount: '满200减50', scope: '全部门店' },
  { id: 3, name: '新人首单5折', type: '新人专享', status: '进行中', start: '2026-07-01', end: '2026-12-31', discount: '5折', scope: '全部门店' },
];

export default function NewPromotionPage() {
  const [form, setForm] = useState({
    name: '',
    type: '折扣促销',
    startDate: '',
    endDate: '',
    discount: '',
    scope: '全部门店',
    stores: '',
    description: '',
    limitPerUser: '1',
    status: 'draft',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <PageShell title="新建促销活动" subtitle="创建和管理促销活动">
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {submitted && (
            <div className="rounded-lg bg-green-900/30 border border-green-600/40 p-4 text-green-400 text-sm">
              ✅ 促销活动已保存！
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 基本信息 */}
            <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5 space-y-4">
              <h3 className="text-white font-bold">基本信息</h3>

              <div>
                <label className="block text-sm text-gray-400 mb-1">活动名称 *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="如：暑期8折狂欢"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">活动类型 *</label>
                  <select
                    value={form.type}
                    onChange={e => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                  >
                    {PROMO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">活动状态</label>
                  <select
                    value={form.status}
                    onChange={e => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                  >
                    <option value="draft">草稿</option>
                    <option value="active">立即发布</option>
                    <option value="scheduled">定时发布</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">开始日期 *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={e => handleChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">结束日期 *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={e => handleChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </div>

            {/* 优惠设置 */}
            <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5 space-y-4">
              <h3 className="text-white font-bold">优惠设置</h3>

              <div>
                <label className="block text-sm text-gray-400 mb-1">优惠内容 *</label>
                <input
                  required
                  value={form.discount}
                  onChange={e => handleChange('discount', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="如：8折 / 满200减50 / 买一送一"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">活动描述</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="活动的详细信息、使用条件等"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">每人限领次数</label>
                  <select
                    value={form.limitPerUser}
                    onChange={e => handleChange('limitPerUser', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                  >
                    {[1, 2, 3, 5, 10, 99].map(n => <option key={n} value={n}>{n === 99 ? '不限' : `${n}次`}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 适用范围 */}
            <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5 space-y-4">
              <h3 className="text-white font-bold">适用范围</h3>

              <div className="flex gap-4">
                {STORE_SCOPE.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={form.scope === s}
                      onChange={() => handleChange('scope', s)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-300">{s}</span>
                  </label>
                ))}
              </div>

              {form.scope === '指定门店' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">选择门店</label>
                  <select multiple className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white h-24">
                    <option>深圳旗舰店</option>
                    <option>北京朝阳店</option>
                    <option>上海浦东店</option>
                    <option>广州天河店</option>
                  </select>
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                保存并发布
              </button>
              <button
                type="button"
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
              >
                保存为草稿
              </button>
              <button
                type="button"
                className="px-4 py-2.5 bg-gray-800 text-gray-500 text-sm rounded-lg hover:text-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>

        {/* 预览/提示 */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4">
            <h4 className="text-sm font-medium text-white mb-2">💡 提示</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 活动名称不可超过30字</li>
              <li>• 折扣力度建议控制在5-9折</li>
              <li>• 开始日期不能早于今天</li>
              <li>• 结束日期必须晚于开始日期</li>
              <li>• 发布后24小时内可修改</li>
              <li>• 请确保活动内容合规</li>
            </ul>
          </div>

          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4">
            <h4 className="text-sm font-medium text-white mb-2">📋 近期活动</h4>
            <div className="space-y-2">
              {PLACEHOLDER_PROMOS.map(p => (
                <div key={p.id} className="p-2 rounded bg-gray-900/50">
                  <p className="text-xs text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{p.type} · {p.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
