'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageShell, StatCard, Tabs, StatusBadge } from '@m5/ui';

const EVENT_DATA: Record<string, typeof DUMMY_EVENTS[0] & { rules: string[]; schedule: { time: string; activity: string }[] }> = {};

const DUMMY_EVENTS = [
  { id: 1, title: '暑期狂欢·全民争霸赛', type: '竞赛', status: '进行中', start: '2026-07-01', end: '2026-08-31', participants: 1286, prize: '¥10,000奖金+年卡', desc: '夏日最强电竞比赛！每周淘汰赛，月底总决赛。', banner: '🏆', color: 'from-red-600/30' },
  { id: 2, title: 'VR新游体验周', type: '体验', status: '即将开始', start: '2026-07-20', end: '2026-07-27', participants: 0, prize: '免费体验券', desc: '最新VR射击大作抢先体验。', banner: '🥽', color: 'from-purple-600/30' },
  { id: 3, title: '亲子嘉年华', type: '亲子', status: '进行中', start: '2026-07-06', end: '2026-08-15', participants: 856, prize: '亲子5折套餐', desc: '周末亲子气球射击/赛车/积木。', banner: '🎪', color: 'from-green-600/30' },
  { id: 4, title: '会员日双倍积分', type: '会员', status: '进行中', start: '2026-07-01', end: '2026-07-31', participants: 3452, prize: '双倍积分', desc: '会员双倍积分，白金以上加赠500。', banner: '🎁', color: 'from-yellow-600/30' },
  { id: 5, title: '开学季·学生特惠', type: '促销', status: '即将开始', start: '2026-08-20', end: '2026-09-10', participants: 0, prize: '学生套餐¥58', desc: '学生证8折，三人同行一人免单。', banner: '📚', color: 'from-blue-600/30' },
  { id: 6, title: '街机怀旧夜', type: '主题', status: '已结束', start: '2026-06-15', end: '2026-06-30', participants: 423, prize: '限定徽章', desc: '经典街机免费。', banner: '🕹️', color: 'from-gray-600/30' },
  { id: 7, title: '直播挑战赛', type: '竞赛', status: '已结束', start: '2026-06-01', end: '2026-06-30', participants: 567, prize: '¥5,000奖金', desc: '抖音同步直播。', banner: '📺', color: 'from-orange-600/30' },
  { id: 8, title: '中秋团圆套餐', type: '促销', status: '即将开始', start: '2026-09-15', end: '2026-09-30', participants: 0, prize: '团圆套餐¥188', desc: '中秋4人通票+月饼早鸟价。', banner: '🥮', color: 'from-amber-600/30' },
];

const SCHEDULES: Record<string, { time: string; activity: string }[]> = {
  '1': [
    { time: '每周六 14:00', activity: '海选赛（线上）' },
    { time: '每周六 18:00', activity: '晋级赛（线下）' },
    { time: '每月最后周日 20:00', activity: '月决赛（直播）' },
    { time: '08-31 20:00', activity: '总决赛·冠军之夜' },
  ],
  '2': [
    { time: '07-20 10:00', activity: '开幕·首批体验官入场' },
    { time: '07-20~07-26 全天', activity: '自由体验' },
    { time: '07-27 20:00', activity: '闭幕·抽奖活动' },
  ],
};

const RULES: Record<string, string[]> = {
  '1': [
    '参赛者需在报名截止前完成线上注册',
    '每人限参加一个赛区，不可跨区报名',
    '比赛采用BO3赛制，决赛BO5',
    '禁止使用外挂及违规插件，违规者取消资格',
    '最终解释权归主办方所有',
  ],
  '2': [
    '体验时长限30分钟/人/次',
    '需提前在APP预约时间段',
    '体验结束后填写反馈问卷赠送积分',
    '12岁以下儿童需家长陪同',
  ],
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string || '1';
  const event = DUMMY_EVENTS.find(e => e.id === Number(id));
  const [activeTab, setActiveTab] = useState('overview');

  if (!event) {
    return (
      <PageShell title="活动未找到" subtitle="404">
        <div className="p-12 text-center text-gray-500">
          <p className="text-5xl mb-3">🔍</p>
          <p>找不到该活动</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">返回</button>
        </div>
      </PageShell>
    );
  }

  const statusColor = event.status === '进行中' ? 'info' : event.status === '即将开始' ? 'warning' : 'default';
  const schedule = SCHEDULES[id] || [];
  const rules = RULES[id] || [];

  return (
    <PageShell title={event.title} subtitle={event.type}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className={`rounded-lg bg-gradient-to-r ${event.color} to-gray-900/90 border border-gray-700/50 p-6`}>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{event.banner}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                <StatusBadge status={statusColor}>{event.status}</StatusBadge>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                <span>📅 {event.start} ~ {event.end}</span>
                <span>👥 {event.participants.toLocaleString()}人参与</span>
                <span>🎁 {event.prize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard title="总参与" value={event.participants.toLocaleString()} change="" />
          <StatCard title="奖金/奖品" value={event.prize.split('+')[0]} change="" />
          <StatCard title="剩余天数" value={(() => {
            const days = Math.ceil((new Date(event.end).getTime() - Date.now()) / 86400000);
            return days > 0 ? `${days}天` : '已结束';
          })()} change="" />
          <StatCard title="热度" value={event.participants > 1000 ? '🔥火爆' : event.participants > 500 ? '🔥热门' : '一般'} change="" />
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'overview', label: '活动介绍' },
            { id: 'schedule', label: '赛程安排' },
            { id: 'rules', label: '活动规则' },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'overview' && (
          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold mb-3">📝 活动简介</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{event.desc}</p>
            <div className="mt-6 flex gap-3">
              <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                {event.status === '进行中' ? '立即参与' : event.status === '即将开始' ? '预约提醒' : '查看回顾'}
              </button>
              <button className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg">分享好友</button>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold mb-3">📅 日程安排</h3>
            {schedule.length > 0 ? (
              <div className="space-y-3">
                {schedule.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
                      {i < schedule.length - 1 && <div className="w-px flex-1 bg-gray-700" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-blue-400">{s.time}</p>
                      <p className="text-sm text-gray-300">{s.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无详细日程安排</p>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-5">
            <h3 className="text-white font-bold mb-3">📋 活动规则</h3>
            {rules.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="text-sm text-gray-300">{r}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">暂无详细规则说明</p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
