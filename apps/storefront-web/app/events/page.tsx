'use client';

import { useState } from 'react';
import { PageShell, StatCard, StatusBadge } from '@m5/ui';

const DUMMY_EVENTS = [
  { id: 1, title: '暑期狂欢·全民争霸赛', type: '竞赛', status: '进行中', start: '2026-07-01', end: '2026-08-31', participants: 1286, prize: '¥10,000奖金+年卡', desc: '夏日最强电竞比赛，等你来挑战！每周淘汰赛，月底总决赛。', banner: '🏆', color: 'from-red-600/30' },
  { id: 2, title: 'VR新游体验周', type: '体验', status: '即将开始', start: '2026-07-20', end: '2026-07-27', participants: 0, prize: '免费体验券', desc: '最新VR射击大作抢先体验，前100名送限定皮肤。', banner: '🥽', color: 'from-purple-600/30' },
  { id: 3, title: '亲子嘉年华·周末嗨翻天', type: '亲子', status: '进行中', start: '2026-07-06', end: '2026-08-15', participants: 856, prize: '亲子套餐5折', desc: '周末亲子活动：气球射击、赛车挑战、积木搭建，全家一起玩！', banner: '🎪', color: 'from-green-600/30' },
  { id: 4, title: '会员日双倍积分', type: '会员', status: '进行中', start: '2026-07-01', end: '2026-07-31', participants: 3452, prize: '双倍积分', desc: '会员日全场双倍积分！持白金卡以上额外加赠500积分。', banner: '🎁', color: 'from-yellow-600/30' },
  { id: 5, title: '开学季·学生特惠', type: '促销', status: '即将开始', start: '2026-08-20', end: '2026-09-10', participants: 0, prize: '学生套餐¥58', desc: '凭学生证享全场8折，三人同行一人免单！', banner: '📚', color: 'from-blue-600/30' },
  { id: 6, title: '街机怀旧夜', type: '主题', status: '已结束', start: '2026-06-15', end: '2026-06-30', participants: 423, prize: '限定徽章', desc: '经典街机游戏全免费开放！拳皇97、街霸2、合金弹头。', banner: '🕹️', color: 'from-gray-600/30' },
  { id: 7, title: '直播挑战赛', type: '竞赛', status: '已结束', start: '2026-06-01', end: '2026-06-30', participants: 567, prize: '¥5,000奖金', desc: '抖音直播同步，全网观看量破50万！', banner: '📺', color: 'from-orange-600/30' },
  { id: 8, title: '中秋节·团圆套餐', type: '促销', status: '即将开始', start: '2026-09-15', end: '2026-09-30', participants: 0, prize: '团圆套餐¥188', desc: '中秋家庭套餐：4人游戏通票+月饼礼盒，提前预约享早鸟价。', banner: '🥮', color: 'from-amber-600/30' },
];

const TYPES = ['全部', '竞赛', '促销', '体验', '亲子', '会员', '主题'];
const STATUSES = ['全部', '进行中', '即将开始', '已结束'];

export default function EventsPage() {
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = DUMMY_EVENTS.filter(e =>
    (typeFilter === '全部' || e.type === typeFilter) &&
    (statusFilter === '全部' || e.status === statusFilter)
  );

  const activeEvents = DUMMY_EVENTS.filter(e => e.status === '进行中').length;
  const upcomingEvents = DUMMY_EVENTS.filter(e => e.status === '即将开始').length;
  const totalParticipants = DUMMY_EVENTS.reduce((s, e) => s + e.participants, 0);
  const endedEvents = DUMMY_EVENTS.filter(e => e.status === '已结束').length;

  return (
    <PageShell title="活动中心" subtitle="竞赛·促销·体验">
      <div className="p-4 space-y-4">
        {/* 统计 */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="进行中" value={activeEvents} change="+2" trend="up" />
          <StatCard title="即将开始" value={upcomingEvents} change="" />
          <StatCard title="累计参与" value={totalParticipants.toLocaleString()} change="+856" trend="up" />
          <StatCard title="已结束" value={endedEvents} change="" />
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >{t}</button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* 活动列表 */}
        <div className="space-y-4">
          {filtered.map(event => (
            <div
              key={event.id}
              className={`rounded-lg bg-gradient-to-r ${event.color} to-gray-900/90 border border-gray-700/50 overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{event.banner}</span>
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="px-2 py-0.5 rounded bg-gray-700/50">{event.type}</span>
                      <StatusBadge status={
                        event.status === '进行中' ? 'info' : event.status === '即将开始' ? 'warning' : 'default'
                      }>{event.status}</StatusBadge>
                      <span>📅 {event.start} ~ {event.end}</span>
                      <span>👥 {event.participants.toLocaleString()}人参与</span>
                    </div>
                    <p className="text-sm font-medium text-yellow-400 mt-2">🎁 {event.prize}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors"
                  >
                    {expandedId === event.id ? '收起' : '详情'}
                  </button>
                </div>
                {expandedId === event.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed">
                    <p>{event.desc}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">立即参与</button>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg">分享</button>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg">加入日历</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="text-5xl">🔍</span>
              <p className="mt-2">没有找到符合条件的活动</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
