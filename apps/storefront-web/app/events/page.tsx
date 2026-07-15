'use client';

/**
 * 活动中心 — Events Page
 * 增强: 三态(loading/error/empty) + 热门排行 + 分类分析 + 倒计时 + 精选推荐 + 统计面板
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageShell, StatCard, StatusBadge } from '@m5/ui';

/* ── 类型 ── */
interface EventItem { id: number; title: string; type: string; status: string; start: string; end: string; participants: number; prize: string; desc: string; banner: string; color: string; rating: number; location?: string; }

/* ── Mock 数据 ── */
const EVENTS: EventItem[] = [
  { id:1, title:'暑期狂欢·全民争霸赛', type:'竞赛', status:'进行中', start:'2026-07-01', end:'2026-08-31', participants:1286, prize:'¥10,000奖金+年卡', desc:'夏日最强电竞比赛！每周淘汰赛，月底总决赛。', banner:'🏆', color:'from-red-600/30', rating:4.9, location:'旗舰店' },
  { id:2, title:'VR新游体验周', type:'体验', status:'即将开始', start:'2026-07-20', end:'2026-07-27', participants:0, prize:'免费体验券', desc:'最新VR射击大作抢先体验，前100名送限定皮肤。', banner:'🥽', color:'from-purple-600/30', rating:4.7, location:'旗舰店' },
  { id:3, title:'亲子嘉年华·周末嗨翻天', type:'亲子', status:'进行中', start:'2026-07-06', end:'2026-08-15', participants:856, prize:'亲子套餐5折', desc:'周末气球射击、赛车挑战、积木搭建，全家一起玩！', banner:'🎪', color:'from-green-600/30', rating:4.8, location:'旗舰店' },
  { id:4, title:'会员日双倍积分', type:'会员', status:'进行中', start:'2026-07-01', end:'2026-07-31', participants:3452, prize:'双倍积分', desc:'全场双倍积分！白金以上加赠500积分。', banner:'🎁', color:'from-yellow-600/30', rating:4.5, location:'全部门店' },
  { id:5, title:'开学季·学生特惠', type:'促销', status:'即将开始', start:'2026-08-20', end:'2026-09-10', participants:0, prize:'学生套餐¥58', desc:'学生证全场8折，三人同行一人免单！', banner:'📚', color:'from-blue-600/30', rating:4.6, location:'全部门店' },
  { id:6, title:'街机怀旧夜', type:'主题', status:'已结束', start:'2026-06-15', end:'2026-06-30', participants:423, prize:'限定徽章', desc:'经典街机全免费！拳皇97、街霸2、合金弹头。', banner:'🕹️', color:'from-gray-600/30', rating:4.3, location:'旗舰店' },
  { id:7, title:'直播挑战赛', type:'竞赛', status:'已结束', start:'2026-06-01', end:'2026-06-30', participants:567, prize:'¥5,000奖金', desc:'抖音直播同步，全网观看量破50万！', banner:'📺', color:'from-orange-600/30', rating:4.4, location:'线上' },
  { id:8, title:'中秋节·团圆套餐', type:'促销', status:'即将开始', start:'2026-09-15', end:'2026-09-30', participants:0, prize:'团圆套餐¥188', desc:'4人游戏通票+月饼礼盒，早鸟价。', banner:'🥮', color:'from-amber-600/30', rating:4.2, location:'全部门店' },
  { id:9, title:'电竞女神邀请赛', type:'竞赛', status:'进行中', start:'2026-07-10', end:'2026-07-25', participants:432, prize:'¥3,000奖金+外设', desc:'女子电竞专场，展现巾帼风采！', banner:'👩‍🎮', color:'from-pink-600/30', rating:4.8, location:'旗舰店' },
  { id:10, title:'夏日冰爽畅玩季', type:'促销', status:'进行中', start:'2026-07-05', end:'2026-08-30', participants:2100, prize:'冰饮畅饮券', desc:'消费满88元送冰饮券，满188元加赠游戏币20枚。', banner:'🧊', color:'from-cyan-600/30', rating:4.1, location:'全部门店' },
  { id:11, title:'音游挑战赛', type:'体验', status:'即将开始', start:'2026-08-01', end:'2026-08-15', participants:0, prize:'限定手环+周边', desc:'太鼓达人/舞萌DX/中二节奏全收录！', banner:'🎵', color:'from-teal-600/30', rating:4.6, location:'旗舰店' },
  { id:12, title:'周末亲子烘焙工坊', type:'亲子', status:'已结束', start:'2026-06-10', end:'2026-06-25', participants:189, prize:'亲子烘焙套装', desc:'妈妈和孩子一起做蛋糕，寓教于乐。', banner:'🧁', color:'from-rose-600/30', rating:4.9, location:'旗舰店' },
  { id:13, title:'周年庆特惠月', type:'促销', status:'进行中', start:'2026-07-15', end:'2026-08-15', participants:789, prize:'周年限定礼盒', desc:'门店周年庆全场8.8折，满额即送限定周边！', banner:'🎉', color:'from-red-600/30', rating:4.7, location:'全部门店' },
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

/* ── Loading 骨架 ── */
function LoadingSkeleton() {
  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ height: 28, width: 120, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 8 }} />
        <div style={{ height: 14, width: 180, borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: 'rgba(148,163,184,0.08)' }} />)}
        </div>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 120, borderRadius: 12, marginBottom: 10, background: 'rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }} />)}
      </div>
    </div>
  );
}

/* ── 主组件 ── */
export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [locationFilter, setLocationFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    simulateFetch().then(d => { if (!cancelled) { setEvents(d); setLoading(false); } })
      .catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : '加载失败'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  /** 筛选 + 排序 */
  const filtered = useMemo(() => {
    let items = events.filter(e =>
      (typeFilter === '全部' || e.type === typeFilter) &&
      (statusFilter === '全部' || e.status === statusFilter) &&
      (locationFilter === '全部' || e.location === locationFilter)
    );
    return [...items].sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || b.participants - a.participants);
  }, [events, typeFilter, statusFilter, locationFilter]);

  /** 统计数据 */
  const stats = useMemo(() => ({
    active: events.filter(e => e.status === '进行中').length,
    upcoming: events.filter(e => e.status === '即将开始').length,
    ended: events.filter(e => e.status === '已结束').length,
    totalParticipants: events.reduce((s, e) => s + e.participants, 0),
    totalPrize: events.length,
  }), [events]);

  /** 类型分布 */
  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => map.set(e.type, (map.get(e.type) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  /** 热门排行 Top 3 */
  const topRated = useMemo(() => [...events].sort((a, b) => b.rating - a.rating).slice(0, 3), [events]);

  /** 精选活动 */
  const featured = useMemo(() => events.filter(e => e.status === '进行中').sort((a, b) => b.participants - a.participants)[0], [events]);

  /** 地点列表 */
  const locations = useMemo(() => {
    const set = new Set(events.map(e => e.location).filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [events]);

  const toggleExpand = useCallback((id: number) => setExpandedId(p => p === id ? null : id), []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>🎪</div>
        <div style={{ color: '#dc2626', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>活动中心加载失败</div>
        <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重新加载</button>
      </div>
    );
  }

  return (
    <PageShell title="活动中心" subtitle="竞赛·促销·体验·亲子">
      <div style={{ padding: 24 }}>
        {/* 页面标题 */}
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🎪 活动中心</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
          共 {events.length} 个活动 · {stats.active} 进行中 · {stats.upcoming} 即将开始 · 累计 {stats.totalParticipants.toLocaleString()} 人参与
        </p>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard label="进行中" value={stats.active} trend={{ value: `+${stats.active}`, positive: stats.active > 0 }} />
          <StatCard label="即将开始" value={stats.upcoming} />
          <StatCard label="累计参与" value={stats.totalParticipants.toLocaleString()} variant="info" />
          <StatCard label="已结束" value={stats.ended} />
        </div>

        {/* 分类分析 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {typeStats.map(([type, count]) => (
            <div key={type} style={{ flex: 1, minWidth: 60, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>{count}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{type}</div>
            </div>
          ))}
        </div>

        {/* 火热排行 */}
        <div style={{ marginBottom: 16, padding: 16, background: '#fefce8', borderRadius: 12, border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>🔥 热度排行 Top 3</h3>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>按评分排序</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {topRated.map((e, i) => (
              <div key={e.id} style={{ flex: 1, padding: 12, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{e.banner}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: '#f59e0b' }}>{'⭐'.repeat(Math.round(e.rating))}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{e.participants.toLocaleString()}人参与</div>
              </div>
            ))}
          </div>
        </div>

        {/* 精选推荐 */}
        {featured && (
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ padding: '2px 8px', background: '#f59e0b', color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>⭐ 精选推荐</span>
              <span style={{ fontSize: 11, color: '#92400e' }}>推荐理由：参与人数最多</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{featured.banner}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{featured.title}</div>
                <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>{featured.prize} · {featured.participants.toLocaleString()}人已参与</div>
              </div>
              {calcDaysLeft(featured.end) > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{calcDaysLeft(featured.end)}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>天剩余</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 筛选栏 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '5px 12px', fontSize: 12, borderRadius: 20, border: 'none',
                background: typeFilter === t ? '#2563eb' : '#f3f4f6',
                color: typeFilter === t ? '#fff' : '#6b7280', cursor: 'pointer',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '5px 12px', fontSize: 12, borderRadius: 20, border: 'none',
                background: statusFilter === s ? '#374151' : '#f3f4f6',
                color: statusFilter === s ? '#fff' : '#6b7280', cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12 }}>
            {locations.map(l => <option key={l} value={l}>{l} {l !== '全部' ? `(${events.filter(e => e.location === l).length})` : ''}</option>)}
          </select>
        </div>

        {/* 活动列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', borderRadius: 12, border: '1px dashed #d1d5db' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>没有找到符合条件的活动</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>尝试调整筛选条件</div>
            </div>
          ) : filtered.map(event => {
            const daysLeft = calcDaysLeft(event.end);
            const isExpanded = expandedId === event.id;
            return (
              <div key={event.id} style={{
                borderRadius: 12, overflow: 'hidden',
                border: isExpanded ? '1px solid #93c5fd' : '1px solid #e5e7eb',
              }}>
                <div style={{ padding: 16, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{event.banner}</span>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{event.title}</h3>
                        <span style={{ fontSize: 12, color: '#f59e0b' }}>{'⭐'.repeat(Math.round(event.rating))}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f3f4f6' }}>{event.type}</span>
                        <StatusBadge
                          variant={event.status === '进行中' ? 'info' : event.status === '即将开始' ? 'warning' : 'neutral'}
                          label={event.status}
                        />
                        <span>📅 {event.start} ~ {event.end}</span>
                        <span>👥 {event.participants.toLocaleString()}人</span>
                        {event.location && <span>📍 {event.location}</span>}
                        {event.status === '进行中' && daysLeft > 0 && <span style={{ color: '#059669', fontWeight: 600 }}>⏱ 剩余 {daysLeft} 天</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706', marginTop: 8 }}>🎁 {event.prize}</div>
                    </div>
                    <button onClick={() => toggleExpand(event.id)} style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff',
                      cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                    }}>{isExpanded ? '收起' : '详情'}</button>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{event.desc}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          {event.status === '进行中' ? '立即参与' : event.status === '即将开始' ? '预约提醒' : '查看回顾'}
                        </button>
                        <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                          分享好友
                        </button>
                        <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                          加入日历
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 脚注 */}
        <div style={{ marginTop: 16, padding: '10px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>📊 共 {filtered.length}/{events.length} 个活动</span>
          <span>🏆 {stats.active} 个活动正在进行中</span>
          <span>👥 总参与人次 {stats.totalParticipants.toLocaleString()}</span>
        </div>
      </div>
    </PageShell>
  );
}
