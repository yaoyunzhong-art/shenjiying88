/**
 * storefront-web - 成长值页面
 * Next.js App Router, 'use client', 暗色主题
 */

'use client';

import { useState, useEffect } from 'react';
import { PageShell, StatCard } from '@m5/ui';

const GROWTH_TOTAL = 18750;
const GROWTH_WEEK = 320;

const GROWTH_TASKS = [
  { name: '每日签到', points: 10, interval: '每天', status: 'done', icon: '📅' },
  { name: '到店消费', points: 50, interval: '每次', status: 'done', icon: '🎮' },
  { name: '评价游戏', points: 20, interval: '每款', status: 'todo', icon: '⭐' },
  { name: '参与比赛', points: 100, interval: '每周', status: 'todo', icon: '🏆' },
  { name: '邀请好友', points: 200, interval: '每人', status: 'done', icon: '👥' },
  { name: '购买套餐', points: 80, interval: '每次', status: 'todo', icon: '🎟️' },
  { name: '分享动态', points: 15, interval: '每天', status: 'done', icon: '📱' },
  { name: '成为会员', points: 500, interval: '一次性', status: 'done', icon: '💳' },
];

const MILESTONES = [
  { name: '新人上路', points: 100, reward: '新人礼包', achieved: true },
  { name: '游戏达人', points: 1000, reward: '达人徽章', achieved: true },
  { name: '百战勇士', points: 5000, reward: '免费体验券×2', achieved: true },
  { name: '城市精英', points: 10000, reward: '精英会员卡', achieved: true },
  { name: '超级玩家', points: 25000, reward: '全年8折券', achieved: false, progress: 75 },
  { name: '传说级', points: 50000, reward: '传说礼盒+荣誉墙', achieved: false, progress: 37 },
  { name: '殿堂级', points: 100000, reward: '终身免费+定制奖杯', achieved: false, progress: 18 },
];

const WEEKLY_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  week: `W${String(22 + i).padStart(2, '0')}`,
  growth: [280, 310, 290, 340, 300, 320, 350, 310, 330, 320, 300, GROWTH_WEEK][i]!,
  tasks: [5, 6, 5, 7, 5, 6, 7, 5, 6, 6, 5, 5][i]!,
}));

const MAX_GROWTH_PER_WEEK = 500;

export default function GrowthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (loading) return <PageShell title="成长值" subtitle="升级·任务·里程碑"><div className="text-center py-16 text-gray-500">加载中...</div></PageShell>;
  if (error) return <PageShell title="成长值" subtitle="升级·任务·里程碑"><div className="text-center py-16 text-red-400">数据获取失败: {error}</div></PageShell>;
  // 暂无数据判断：成长任务数据为空时显示
  if (GROWTH_TASKS.length === 0) return <PageShell title="成长值" subtitle="升级·任务·里程碑"><div className="text-center py-16 text-gray-500">暂无数据</div></PageShell>;

  return (
    <PageShell title="成长值" subtitle="升级·任务·里程碑">
      <div className="grid gap-4 p-4">
        {/* 成长值卡片 */}
        <div className="rounded-lg bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 border border-blue-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">总成长值</p>
              <p className="text-4xl font-bold text-white mt-1">{GROWTH_TOTAL.toLocaleString()}</p>
              <p className="text-sm text-green-400 mt-1">📈 本周 +{GROWTH_WEEK}</p>
            </div>
            <div className="text-right">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 flex items-center justify-center">
                <div>
                  <p className="text-2xl font-bold text-blue-400">{Math.round(GROWTH_TOTAL / 50000 * 100)}%</p>
                  <p className="text-[10px] text-gray-500">目标进度</p>
                </div>
              </div>
            </div>
          </div>
          {/* 周进度条 */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>本周成长进度</span>
              <span>{GROWTH_WEEK}/{MAX_GROWTH_PER_WEEK}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${GROWTH_WEEK / MAX_GROWTH_PER_WEEK * 100}%` }} />
            </div>
          </div>
        </div>

        {/* 本周任务 */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">📋 本周成长任务</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GROWTH_TASKS.map(task => (
              <div key={task.name} className={`flex items-center gap-3 p-3 rounded-lg border ${task.status === 'done' ? 'bg-green-900/20 border-green-700/30' : 'bg-gray-800/50 border-gray-700/50'}`}>
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">{task.name}</p>
                    {task.status === 'done' && <span className="text-xs text-green-400">✅ 已完成</span>}
                  </div>
                  <p className="text-xs text-gray-500">+{task.points}成长值 · {task.interval}</p>
                </div>
                {task.status === 'todo' && (
                  <button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    去完成
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 里程碑 */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">🏅 成长里程碑</h3>
          <div className="space-y-2">
            {MILESTONES.map((m, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${m.achieved ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-800/50 border-gray-700/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${m.achieved ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                  {m.achieved ? '✅' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${m.achieved ? 'text-green-400' : 'text-gray-400'}`}>{m.name}</p>
                    <span className="text-xs text-gray-600">≥{m.points.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500">奖励: {m.reward}</p>
                  {m.progress !== undefined && (
                    <div className="mt-1 h-1.5 bg-gray-700 rounded-full w-full max-w-xs">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  )}
                </div>
                {m.achieved && <span className="text-xs text-green-500">🎉 已达成</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 周成长历史 */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showHistory ? '收起' : '展开'}近12周成长历史
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {WEEKLY_HISTORY.map(w => (
                <div key={w.week} className="flex items-center gap-3 p-2 rounded bg-gray-800/30">
                  <span className="w-12 text-xs text-gray-500">{w.week}</span>
                  <div className="flex-1 h-4 bg-gray-700 rounded">
                    <div className="h-full bg-blue-500/60 rounded" style={{ width: `${w.growth / MAX_GROWTH_PER_WEEK * 100}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs text-gray-400">{w.growth}</span>
                  <span className="w-8 text-xs text-gray-600">{w.tasks}任务</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
