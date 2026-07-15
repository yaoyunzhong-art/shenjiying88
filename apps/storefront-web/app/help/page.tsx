'use client';

/**
 * 帮助中心 - Help Center
 * 增强: 三态(loading/error/empty) + 分类芯片 + 热门排行 + 全部展开/收起
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageShell, StatCard, StatusBadge, Tabs, SearchFilterInput } from '@m5/ui';

interface FaqItem { id: string; question: string; answer: string; category: string; tags: string[]; views: number; }
interface GuideItem { id: string; title: string; description: string; category: string; steps: number; estimatedTime: string; }

// 20 FAQs + 10 Guides
const ALL_FAQS: FaqItem[] = [
  { id:'F1', question:'如何创建新会员？', answer:'在会员管理页面点击"新增会员"，填写基本信息后保存。支持手动录入和批量导入。', category:'会员管理', tags:['会员','新增','注册'], views:350 },
  { id:'F2', question:'如何处理退款？', answer:'在订单管理找到订单，点击"退款"。支持全额/部分退款，需店长审批。', category:'收银', tags:['退款','订单','收银'], views:620 },
  { id:'F3', question:'如何查看设备状态？', answer:'进入设备管理页面，可查看所有设备实时状态(在线/离线/故障)。', category:'设备', tags:['设备','监控','维护'], views:280 },
  { id:'F4', question:'如何导出报表？', answer:'在报表页面选择数据维度，点击"导出"，支持PDF/Excel，自动发送至邮箱。', category:'报表', tags:['报表','导出','分析'], views:190 },
  { id:'F5', question:'如何调整排班？', answer:'在排班表页面直接拖拽员工到对应时段。系统自动检测冲突。', category:'人力资源', tags:['排班','员工','HR'], views:240 },
  { id:'F6', question:'如何进行库存盘点？', answer:'库存管理→盘点管理→新建盘点。系统自动记录实盘与系统数量差异。', category:'库存', tags:['盘点','库存','差异'], views:310 },
  { id:'F7', question:'如何创建促销活动？', answer:'营销管理→活动管理→创建活动。支持折扣/套餐/赠品/积分/秒杀。', category:'营销', tags:['营销','活动','促销'], views:450 },
  { id:'F8', question:'如何处理设备报修？', answer:'设备详情→创建维护工单。填写故障描述后提交，通知技术员。', category:'设备', tags:['维修','报修','设备'], views:180 },
  { id:'F9', question:'怎么查看营业数据？', answer:'门店数据分析页面可看到实时营收、客流、转化率，支持日/周/月趋势。', category:'运营', tags:['数据','分析','运营'], views:520 },
  { id:'F10', question:'如何修改门店信息？', answer:'门店设置页面可修改名称、地址、营业时间、支付方式。', category:'设置', tags:['门店','设置','配置'], views:160 },
  { id:'F11', question:'如何添加员工账号？', answer:'人力资源→新增员工，填写信息并分配角色权限，系统发送激活邮件。', category:'人力资源', tags:['员工','账号','权限'], views:205 },
  { id:'F12', question:'如何修改商品价格？', answer:'商品管理→编辑商品→修改售价。需店长权限，记录操作日志。', category:'商品', tags:['商品','价格','编辑'], views:330 },
  { id:'F13', question:'支持哪些支付方式？', answer:'微信支付、支付宝、银联卡、现金、会员余额、积分抵扣等，可在门店配置。', category:'收银', tags:['支付','收银','配置'], views:410 },
  { id:'F14', question:'如何设置会员等级？', answer:'会员→等级管理自定义等级，设置升级条件、积分倍率和专属权益。', category:'会员管理', tags:['会员','等级','权益'], views:270 },
  { id:'F15', question:'如何批量导入商品？', answer:'商品管理→批量导入，下载Excel模板填写后上传，支持多字段同时导入。', category:'商品', tags:['商品','导入','批量'], views:145 },
  { id:'F16', question:'如何查看操作日志？', answer:'系统管理→操作日志，按时间/操作人/类型筛选。日志保留180天。', category:'系统管理', tags:['日志','审计','安全'], views:120 },
  { id:'F17', question:'如何设置营业时间？', answer:'门店设置→营业时间配置每日时段，支持节假日特殊安排。', category:'设置', tags:['营业','时间','配置'], views:195 },
  { id:'F18', question:'如何处理会员投诉？', answer:'会员详情→投诉记录，填写类型和内容后自动创建工单，处理完需回访。', category:'客服', tags:['投诉','客服','回访'], views:230 },
  { id:'F19', question:'怎么设置满减活动？', answer:'营销管理→促销活动→满减活动，支持阶梯满减，可叠加会员折扣。', category:'营销', tags:['促销','满减','营销'], views:380 },
  { id:'F20', question:'如何查看员工考勤？', answer:'人力资源→考勤管理查看打卡记录、迟到统计，支持日/周/月报表导出。', category:'人力资源', tags:['考勤','员工','报表'], views:210 },
];

const GUIDES: GuideItem[] = [
  { id:'G1', title:'新员工入职指南', description:'创建员工账户与权限配置', category:'人力资源', steps:5, estimatedTime:'10分钟' },
  { id:'G2', title:'日结束对账流程', description:'每日营业结束后对账步骤', category:'收银', steps:6, estimatedTime:'15分钟' },
  { id:'G3', title:'设备巡检标准', description:'每日巡检标准操作流程', category:'设备', steps:8, estimatedTime:'20分钟' },
  { id:'G4', title:'会员投诉处理', description:'客户投诉的标准流程', category:'客服', steps:5, estimatedTime:'10分钟' },
  { id:'G5', title:'库存盘点操作', description:'月度盘点标准流程', category:'库存', steps:7, estimatedTime:'30分钟' },
  { id:'G6', title:'营销活动审批', description:'促销活动审批流程', category:'营销', steps:4, estimatedTime:'15分钟' },
  { id:'G7', title:'紧急事件处理', description:'火灾/盗窃等应急流程', category:'安全', steps:10, estimatedTime:'—' },
  { id:'G8', title:'会员管理系统操作', description:'会员查询/编辑/积分调整', category:'会员管理', steps:6, estimatedTime:'15分钟' },
  { id:'G9', title:'促销活动配置', description:'折扣/满减/赠品活动发布', category:'营销', steps:7, estimatedTime:'20分钟' },
  { id:'G10', title:'收银系统故障排查', description:'常见收银故障排除', category:'设备', steps:5, estimatedTime:'10分钟' },
];

const FAQ_CATEGORIES = Array.from(new Set(ALL_FAQS.map(f => f.category)));
const ALL_CAT = '全部';

function simulateFetch(): Promise<{ faqs: FaqItem[]; guides: GuideItem[] }> {
  return new Promise(resolve => setTimeout(() => resolve({ faqs: ALL_FAQS, guides: GUIDES }), 400 + Math.random() * 400));
}

const s = (l: number, w?: string) => ({ height: l, width: w ?? '100%', borderRadius: 6, background: 'rgba(148,163,184,0.1)', marginBottom: 6 });

function LoadingSkeleton() {
  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={s(28, '140px')} /><div style={{ ...s(14, '240px'), marginBottom: 24 }} />
        <div style={{ height: 42, borderRadius: 10, background: 'rgba(148,163,184,0.08)', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>{[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 32, borderRadius: 20, background: 'rgba(148,163,184,0.08)' }} />)}</div>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ ...s(16, `${40 + i * 15}%`) }} /><div style={s(12, '60%')} />
          </div>
        ))}
      </div>
    </main>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>❌</div>
        <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>帮助中心加载失败</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重新加载</button>
      </div>
    </main>
  );
}

export default function HelpCenterPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'faq' | 'guides' | 'support'>('faq');
  const [catFilter, setCatFilter] = useState(ALL_CAT);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    simulateFetch().then(d => { if (!cancelled) { setFaqs(d.faqs); setGuides(d.guides); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message ?? '加载失败'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const toggleExpand = useCallback((id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const expandAll = useCallback(() => setExpanded(new Set(faqs.map(f => f.id))), [faqs]);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const filteredFaqs = useMemo(() => faqs.filter(f => (!search || f.question.includes(search) || f.answer.includes(search) || f.tags.some(t => t.includes(search))) && (catFilter === ALL_CAT || f.category === catFilter)), [faqs, search, catFilter]);
  const filteredGuides = useMemo(() => guides.filter(g => !search || g.title.includes(search) || g.description.includes(search)), [guides, search]);
  const hotQuestions = useMemo(() => [...faqs].sort((a, b) => b.views - a.views).slice(0, 5), [faqs]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  const isExp = (id: string) => expanded.has(id);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <PageShell title="📚 帮助中心" subtitle="常见问题 · 操作指南 · 技术支持">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="常见问题" value={faqs.length} />
          <StatCard label="操作指南" value={guides.length} />
          <StatCard label="最热问题" value={`${hotQuestions[0]?.views ?? 0}次`} />
          <StatCard label="覆盖分类" value={FAQ_CATEGORIES.length} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <SearchFilterInput value={search} onChange={setSearch} placeholder="搜索问题/指南/关键词..." />
          {search && <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>搜索结果：{tab === 'faq' ? `${filteredFaqs.length} 条FAQ` : `${filteredGuides.length} 条指南`}</div>}
        </div>
        <div style={{ marginBottom: 16 }}><Tabs items={[{key:'faq', label:`❓ 常见问题 (${faqs.length})`},{key:'guides',label:`📖 操作指南 (${guides.length})`},{key:'support',label:'🎫 提交工单'}]} activeKey={tab} onChange={t=>setTab(t as typeof tab)} variant="pills" /></div>

        {/* FAQ Tab */}
        {tab === 'faq' && <>
          {!search && <div style={{ borderRadius: 12, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)', padding: '14px 18px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#93c5fd' }}>🔥 热门问题 Top 5</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>按访问量排序</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hotQuestions.map((f, i) => (
                <button key={f.id} onClick={() => { setSearch(f.question); setCatFilter(ALL_CAT); setTab('faq'); }} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.4)', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>#{i + 1}</span> {f.question}
                </button>
              ))}
            </div>
          </div>}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[ALL_CAT, ...FAQ_CATEGORIES].map(cat => {
              const cnt = cat === ALL_CAT ? faqs.length : faqs.filter(f => f.category === cat).length;
              return <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: '4px 12px', borderRadius: 20, border: catFilter === cat ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(148,163,184,0.15)', background: catFilter === cat ? 'rgba(59,130,246,0.15)' : 'transparent', color: catFilter === cat ? '#93c5fd' : '#64748b', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>{cat}({cnt})</button>;
            })}
          </div>
          {filteredFaqs.length > 0 && <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12 }}>
            <button onClick={expandAll} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0 }}>全部展开</button>
            <button onClick={collapseAll} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>全部收起</button>
          </div>}
          <div style={{ display: 'grid', gap: 8 }}>
            {filteredFaqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🤷</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>没有找到相关问题</div>
                <div style={{ fontSize: 13 }}>{search ? '请尝试更换搜索关键词或分类' : '当前分类下暂无常见问题'}</div>
              </div>
            ) : filteredFaqs.map(f => {
              const open = isExp(f.id);
              return (
                <div key={f.id} style={{ borderRadius: 12, background: open ? 'rgba(30,41,59,0.9)' : 'rgba(15,23,42,0.3)', border: open ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                  <div onClick={() => toggleExpand(f.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>❓ {f.question}</span>
                      <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 10 }}>{f.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{f.views}次浏览</span>
                      <span style={{ color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {open && <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 8 }}>{f.answer}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{f.tags.map(t => <span key={t} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: 11 }}>{t}</span>)}</div>
                  </div>}
                </div>
              );
            })}
          </div>
        </>}

        {/* Guides Tab */}
        {tab === 'guides' && <div style={{ display: 'grid', gap: 10 }}>
          {filteredGuides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📖</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>没有找到操作指南</div>
              <div style={{ fontSize: 13 }}>请尝试其他搜索关键词</div>
            </div>
          ) : filteredGuides.map(g => (
            <div key={g.id} style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>📖 {g.title}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{g.description}</div></div>
                <div style={{ textAlign: 'right' }}><StatusBadge label={g.category} variant='info' size="sm" /><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{g.steps}步 · {g.estimatedTime}</div></div>
              </div>
            </div>
          ))}
        </div>}

        {/* Support Tab */}
        {tab === 'support' && <section style={{ borderRadius: 16, padding: 24, background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(148,163,184,0.18)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>提交技术工单</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>标题</div><input placeholder="简要描述问题" style={inputStyle} /></div>
            <div><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>分类</div><select style={{ ...inputStyle, appearance: 'none' }}><option>系统故障</option><option>功能问题</option><option>数据问题</option><option>权限问题</option><option>建议优化</option></select></div>
            <div><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>详细描述</div><textarea rows={5} placeholder="详细描述问题或建议..." style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} /></div>
            <div><div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>截图（可选）</div><div style={{ padding: '20px', borderRadius: 8, border: '1px dashed rgba(148,163,184,0.2)', textAlign: 'center', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>📎 点击上传附件</div></div>
            <button style={btnStyle('#3b82f6','#93c5fd','14px','12px 24px')}>📤 提交工单</button>
          </div>
        </section>}
      </PageShell>
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.4)', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnStyle = (bg: string, color: string, fs: string, pad: string): React.CSSProperties => ({ borderRadius: 10, padding: pad, background: `${bg}22`, color, border: 'none', cursor: 'pointer', fontSize: fs, fontWeight: 600, width: 'fit-content' });
