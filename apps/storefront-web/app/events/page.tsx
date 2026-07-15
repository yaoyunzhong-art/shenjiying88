'use client';

/**
 * 活动中心 — Events Page
 * 增强: 三态(loading/error/empty) + 热门排行 + 分类分析 + 倒计时 + 精选推荐
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageShell, StatCard, StatusBadge } from '@m5/ui';

interface EventItem { id: number; title: string; type: string; status: string; start: string; end: string; participants: number; prize: string; desc: string; banner: string; color: string; rating: number; }

const EVENTS: EventItem[] = [
  { id:1, title:'暑期狂欢·全民争霸赛', type:'竞赛', status:'进行中', start:'2026-07-01', end:'2026-08-31', participants:1286, prize:'¥10,000奖金+年卡', desc:'夏日最强电竞比赛！每周淘汰赛，月底总决赛。', banner:'🏆', color:'from-red-600/30', rating:4.9 },
  { id:2, title:'VR新游体验周', type:'体验', status:'即将开始', start:'2026-07-20', end:'2026-07-27', participants:0, prize:'免费体验券', desc:'最新VR射击大作抢先体验，前100名送限定皮肤。', banner:'🥽', color:'from-purple-600/30', rating:4.7 },
  { id:3, title:'亲子嘉年华·周末嗨翻天', type:'亲子', status:'进行中', start:'2026-07-06', end:'2026-08-15', participants:856, prize:'亲子套餐5折', desc:'周末气球射击、赛车挑战、积木搭建，全家一起玩！', banner:'🎪', color:'from-green-600/30', rating:4.8 },
  { id:4, title:'会员日双倍积分', type:'会员', status:'进行中', start:'2026-07-01', end:'2026-07-31', participants:3452, prize:'双倍积分', desc:'全场双倍积分！白金以上加赠500积分。', banner:'🎁', color:'from-yellow-600/30', rating:4.5 },
  { id:5, title:'开学季·学生特惠', type:'促销', status:'即将开始', start:'2026-08-20', end:'2026-09-10', participants:0, prize:'学生套餐¥58', desc:'学生证全场8折，三人同行一人免单！', banner:'📚', color:'from-blue-600/30', rating:4.6 },
  { id:6, title:'街机怀旧夜', type:'主题', status:'已结束', start:'2026-06-15', end:'2026-06-30', participants:423, prize:'限定徽章', desc:'经典街机全免费！拳皇97、街霸2、合金弹头。', banner:'🕹️', color:'from-gray-600/30', rating:4.3 },
  { id:7, title:'直播挑战赛', type:'竞赛', status:'已结束', start:'2026-06-01', end:'2026-06-30', participants:567, prize:'¥5,000奖金', desc:'抖音直播同步，全网观看量破50万！', banner:'📺', color:'from-orange-600/30', rating:4.4 },
  { id:8, title:'中秋节·团圆套餐', type:'促销', status:'即将开始', start:'2026-09-15', end:'2026-09-30', participants:0, prize:'团圆套餐¥188', desc:'4人游戏通票+月饼礼盒，早鸟价。', banner:'🥮', color:'from-amber-600/30', rating:4.2 },
  { id:9, title:'电竞女神邀请赛', type:'竞赛', status:'进行中', start:'2026-07-10', end:'2026-07-25', participants:432, prize:'¥3,000奖金+外设', desc:'女子电竞专场，展现巾帼风采！', banner:'👩‍🎮', color:'from-pink-600/30', rating:4.8 },
  { id:10, title:'夏日冰爽畅玩季', type:'促销', status:'进行中', start:'2026-07-05', end:'2026-08-30', participants:2100, prize:'冰饮畅饮券', desc:'消费满88元送冰饮券，满188元加赠游戏币20枚。', banner:'🧊', color:'from-cyan-600/30', rating:4.1 },
  { id:11, title:'音游挑战赛', type:'体验', status:'即将开始', start:'2026-08-01', end:'2026-08-15', participants:0, prize:'限定手环+周边', desc:'太鼓达人/舞萌DX/中二节奏全收录！', banner:'🎵', color:'from-teal-600/30', rating:4.6 },
  { id:12, title:'周末亲子烘焙工坊', type:'亲子', status:'已结束', start:'2026-06-10', end:'2026-06-25', participants:189, prize:'亲子烘焙套装', desc:'妈妈和孩子一起做蛋糕，寓教于乐。', banner:'🧁', color:'from-rose-600/30', rating:4.9 },
];

const TYPES = ['全部','竞赛','促销','体验','亲子','会员','主题'];
const STATUSES = ['全部','进行中','即将开始','已结束'];

function simulateFetch(): Promise<EventItem[]> {
  return new Promise(resolve => setTimeout(() => resolve([...EVENTS]), 400 + Math.random() * 400));
}

function calcDaysLeft(end: string): number {
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));
}

function statusOrder(s: string): number { return s === '进行中' ? 0 : s === '即将开始' ? 1 : 2; }

function LoadingSkeleton() {
  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ height: 28, width: 120, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 8 }} />
        <div style={{ height: 14, width: 180, borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: 'rgba(148,163,184,0.08)' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ height: 28, width: 50, borderRadius: 14, background: 'rgba(148,163,184,0.08)' }} />)}</div>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 120, borderRadius: 12, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }} />)}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    simulateFetch().then(d => { if (!cancelled) { setEvents(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message ?? '加载失败'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => events.filter(e =>
    (typeFilter === '全部' || e.type === typeFilter) &&
    (statusFilter === '全部' || e.status === statusFilter)
  ), [events, typeFilter, statusFilter]);

  // Sorted by status priority, then participants
  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || b.participants - a.participants), [filtered]);

  const stats = useMemo(() => ({
    active: events.filter(e => e.status === '进行中').length,
    upcoming: events.filter(e => e.status === '即将开始').length,
    ended: events.filter(e => e.status === '已结束').length,
    totalParticipants: events.reduce((s, e) => s + e.participants, 0),
  }), [events]);

  // Category analysis
  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => map.set(e.type, (map.get(e.type) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  // Top rated events
  const topRated = useMemo(() => [...events].sort((a, b) => b.rating - a.rating).slice(0, 3), [events]);

  // Featured active event
  const featured = useMemo(() => events.filter(e => e.status === '进行中').sort((a, b) => b.participants - a.participants)[0], [events]);

  const toggleExpand = useCallback((id: number) => setExpandedId(p => p === id ? null : id), []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: 48, background: '#0f172a', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>🎪</div>
        <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>活动中心加载失败</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重新加载</button>
      </div>
    );
  }

  return (
    <PageShell title="活动中心" subtitle="竞赛·促销·体验·亲子">
      <div className="p-4 space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="进行中" value={stats.active} trend={{ value: `+${stats.active}`, positive: stats.active > 0 }} />
          <StatCard label="即将开始" value={stats.upcoming} />
          <StatCard label="累计参与" value={stats.totalParticipants.toLocaleString()} trend={{ value: `+${stats.totalParticipants > 0 ? Math.round(stats.totalParticipants / 10) : 0}`, positive: true }} />
          <StatCard label="已结束" value={stats.ended} />
        </div>

        {/* 热门排行榜 */}
        <div className="rounded-lg bg-gradient-to-r from-amber-900/30 to-orange-900/20 border border-amber-700/30 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-amber-300">🔥 热度排行 Top 3</h3>
            <span className="text-xs text-gray-500">按评分排序</span>
          </div>
          <div className="flex gap-3">
            {topRated.map((e, i) => (
              <div key={e.id} className="flex-1 rounded-lg bg-gray-900/60 border border-gray-700/50 p-3 text-center">
                <div className="text-2xl mb-1">{e.banner}</div>
                <div className="text-xs text-white font-medium truncate">{e.title}</div>
                <div className="text-xs text-amber-400 mt-1">{'⭐'.repeat(Math.round(e.rating))}</div>
                <div className="text-xs text-gray-500 mt-1">{e.participants.toLocaleString()}人参与</div>
              </div>
            ))}
          </div>
        </div>

        {/* 精选推荐 - 最热门进行中活动 */}
        {featured && (
          <div className={`rounded-lg bg-gradient-to-r ${featured.color} to-gray-900/90 border border-yellow-500/40 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded">⭐ 精选推荐</span>
              <span className="text-xs text-gray-400">推荐理由：参与人数最多</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{featured.banner}</span>
              <div className="flex-1">
                <div className="text-lg font-bold text-white">{featured.title}</div>
                <div className="text-xs text-gray-400 mt-1">{featured.prize} · {featured.participants.toLocaleString()}人已参与</div>
              </div>
              {calcDaysLeft(featured.end) > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{calcDaysLeft(featured.end)}</div>
                  <div className="text-[10px] text-gray-500">天剩余</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 分类分析 */}
        <div className="flex gap-3">
          {typeStats.map(([type, count]) => (
            <div key={type} className="flex-1 text-center py-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-[10px] text-gray-500">{type}</div>
            </div>
          ))}
        </div>

        {/* 筛选按钮 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${statusFilter === s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* 活动列表 */}
        <div className="space-y-4">
          {sortedFiltered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-5xl">🔍</span>
              <p className="mt-2">没有找到符合条件的活动</p>
              <p className="text-xs text-gray-600 mt-1">尝试调整筛选条件</p>
            </div>
          ) : sortedFiltered.map(event => {
            const daysLeft = calcDaysLeft(event.end);
            const isExpanded = expandedId === event.id;
            return (
              <div key={event.id} className={`rounded-lg bg-gradient-to-r ${event.color} to-gray-900/90 border ${isExpanded ? 'border-blue-500/40' : 'border-gray-700/50'} overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{event.banner}</span>
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <span className="text-xs text-yellow-400">{'⭐'.repeat(Math.round(event.rating))}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-gray-700/50">{event.type}</span>
                        <StatusBadge label={event.status} variant={event.status === '进行中' ? 'info' : event.status === '即将开始' ? 'warning' : 'default'} />
                        <span>📅 {event.start} ~ {event.end}</span>
                        <span>👥 {event.participants.toLocaleString()}人参与</span>
                        {event.status === '进行中' && daysLeft > 0 && <span className="text-green-400">⏱ 剩余{daysLeft}天</span>}
                      </div>
                      <p className="text-sm font-medium text-yellow-400 mt-2">🎁 {event.prize}</p>
                    </div>
                    <button onClick={() => toggleExpand(event.id)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors">
                      {isExpanded ? '收起' : '详情'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-300 leading-relaxed">
                      <p>{event.desc}</p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">{event.status === '进行中' ? '立即参与' : event.status === '即将开始' ? '预约提醒' : '查看回顾'}</button>
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg">分享好友</button>
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg">加入日历</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
