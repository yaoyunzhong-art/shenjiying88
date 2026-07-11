'use client';

import { useState } from 'react';
import { PageShell } from '@m5/ui';

const CATEGORIES = ['全部', '账号问题', '支付问题', '预约问题', '会员问题', '设备问题', '其他'];

const FAQ_DATA: Record<string, { q: string; a: string }[]> = {
  '账号问题': [
    { q: '如何注册账号？', a: '您可以通过手机号或微信快捷登录注册。打开APP点击"我的"→"登录/注册"，按提示操作即可，全程不超过30秒。' },
    { q: '忘记密码怎么办？', a: '在登录页面点击"忘记密码"，输入注册手机号，接收验证码后即可重置密码。如仍无法解决请联系在线客服。' },
    { q: '可以绑定多个手机号吗？', a: '一个账号只能绑定一个手机号。如需更换，可在"账号安全"中操作换绑。' },
    { q: '账号被盗怎么办？', a: '请立即联系客服冻结账号，并提供身份验证信息。客服会在24小时内处理并回复。' },
  ],
  '支付问题': [
    { q: '支持哪些支付方式？', a: '支持微信支付、支付宝、银联卡。部分门店支持现金充值。' },
    { q: '充值未到账怎么办？', a: '通常1分钟内到账。如超过5分钟未到账，请保留支付凭证截图联系客服处理。' },
    { q: '可以退款吗？', a: '未使用的充值金额可申请退款，已消费部分不可退。退款3-7个工作日原路返回。' },
    { q: '预付款如何使用？', a: '预付款可在所有门店通用，支持游戏币兑换、套餐购买、场地预约等消费场景。' },
  ],
  '预约问题': [
    { q: '如何预约场地？', a: '在"预约"页面选择日期、场地类型、时间段，确认后即可完成预约。建议提前30分钟到店。' },
    { q: '预约可以取消吗？', a: '开场前2小时可免费取消。2小时内取消将扣除预付款的20%作为违约金。' },
    { q: '预约迟到怎么办？', a: '预约保留15分钟，超时未到将自动取消并释放场地。建议提前5分钟到店。' },
    { q: '可以预约多人吗？', a: '支持团队预约（2-10人），在预约时选择人数即可。大型团建请联系门店客服。' },
  ],
  '会员问题': [
    { q: '会员等级如何提升？', a: '通过到店消费获取积分，积分累计提升等级。青铜→白银需1000分，白银→黄金需5000分。' },
    { q: '会员权益有哪些？', a: '不同等级享受不同权益，包括积分加速、生日礼包、优先排队、VIP通道、专属活动等。' },
    { q: '积分会过期吗？', a: '积分有效期为12个月，从获取之日起算。过期积分自动清零。' },
    { q: '如何查看我的积分？', a: '在"我的"→"会员中心"可查看当前积分、等级和积分明细。' },
  ],
  '设备问题': [
    { q: '游戏设备如何选择？', a: '到店后导玩员会为您推荐适合的游戏设备。您也可以查看设备列表中的介绍和评分。' },
    { q: '设备故障怎么办？', a: '如遇设备故障，请立即告知现场工作人员。我们会在10分钟内响应处理。' },
    { q: '可以自带设备吗？', a: '支持自带手柄和外设，需在入场时到服务台登记备案。' },
    { q: 'VR设备需要预约吗？', a: '热门VR设备建议提前预约，普通时段可以到店直接体验。' },
  ],
  '其他': [
    { q: '门店营业时间是？', a: '周一至周五 10:00-22:00，周末及节假日 09:00-23:00。各门店略有不同。' },
    { q: '可以举办生日派对吗？', a: '可以的！门店提供生日派对套餐，包含场地、游戏、餐饮服务，请提前3天预约。' },
    { q: '有停车场吗？', a: '大部分门店提供免费停车或合作停车场。具体请查看门店详情页。' },
    { q: '可以带宠物吗？', a: '为了安全和卫生，暂不支持携带宠物入场，导盲犬除外。' },
  ],
};

export default function FAQPage() {
  const [activeCat, setActiveCat] = useState('全部');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const allFAQs = activeCat === '全部'
    ? Object.entries(FAQ_DATA).flatMap(([cat, items]) => items.map(i => ({ ...i, cat })))
    : FAQ_DATA[activeCat]?.map(i => ({ ...i, cat: activeCat })) || [];

  const filtered = allFAQs.filter(
    item => item.q.includes(search) || item.a.includes(search) || item.cat.includes(search)
  );

  return (
    <PageShell title="常见问题" subtitle="快速找到答案">
      <div className="p-4 space-y-4">
        {/* 搜索 */}
        <div>
          <input
            type="text"
            placeholder="🔍 搜索问题..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-lg px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCat(cat); setExpanded(null); }}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                activeCat === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 问答列表 */}
        <div className="space-y-2">
          {filtered.map((faq, i) => {
            const key = `${faq.cat}-${i}`;
            const isOpen = expanded === key;
            return (
              <div
                key={key}
                className="rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1">
                    <span className="text-xs text-blue-400 mr-2">[{faq.cat}]</span>
                    <span className="text-sm text-white">{faq.q}</span>
                  </div>
                  <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-700/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">🔍</p>
              <p>没有找到相关问题</p>
              <p className="text-xs mt-1">试试换个关键词，或联系在线客服</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
