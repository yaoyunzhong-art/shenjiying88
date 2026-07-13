// 👥 会员管理 · 会员信息/等级/积分/余额管理 (P-36 店A)
'use client';
import { useState, useCallback, useMemo } from 'react';
import { PageShell, Card, Row, Col, Statistic, Table, Tag, Button, Space, Input, 
         Modal, Form, Select, Drawer, Descriptions, Divider, Steps, message, 
         Tabs, Progress, Badge, Empty } from '@m5/ui';

// ─── 类型 ──────────────────────────────────────────────────────────

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
type MemberStatus = 'active' | 'inactive' | 'frozen';

interface Member {
  id: string; name: string; phone: string; tier: MemberTier;
  points: number; balance: number; totalSpent: number; totalVisits: number;
  lastVisit: string; createdAt: string; status: MemberStatus;
  birthday?: string; email?: string; tags?: string[];
  levelProgress?: number; nextLevelPoints?: number;
}

interface LevelConfig { key: MemberTier; label: string; color: string; minPoints: number; discount: number; upgradeMultiplier: number; }

// ─── 常量 ──────────────────────────────────────────────────────────

const LEVELS: LevelConfig[] = [
  { key: 'basic', label: '普通', color: '#64748b', minPoints: 0, discount: 0, upgradeMultiplier: 1 },
  { key: 'bronze', label: '铜卡', color: '#d97706', minPoints: 500, discount: 5, upgradeMultiplier: 1.2 },
  { key: 'silver', label: '银卡', color: '#94a3b8', minPoints: 2000, discount: 10, upgradeMultiplier: 1.5 },
  { key: 'gold', label: '黄金', color: '#fbbf24', minPoints: 5000, discount: 15, upgradeMultiplier: 2 },
  { key: 'diamond', label: '钻石', color: '#a78bfa', minPoints: 10000, discount: 20, upgradeMultiplier: 3 },
];

const TIER_COLORS = Object.fromEntries(LEVELS.map(l => [l.key, l.color])) as Record<string, string>;
const TIER_NAMES = Object.fromEntries(LEVELS.map(l => [l.key, l.label])) as Record<string, string>;

// ─── Mock数据 ──────────────────────────────────────────────────────

const MOCK_MEMBERS: Member[] = Array.from({ length: 48 }, (_, i) => {
  const tiers: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  const tier = tiers[i % 5];
  const lev = LEVELS.find(l => l.key === tier)!;
  const nextLev = LEVELS[LEVELS.indexOf(lev) + 1];
  return {
    id: `M${String(i + 1).padStart(3, '0')}`,
    name: ['张明','李芳','王强','赵丽','刘伟','陈静','杨磊','黄敏','周杰','吴雪','徐明','孙燕','马超','朱婷','胡华','郭丽','林杰','何静','高飞','罗欣','梁峰','宋婷','唐杰','韩菲','曹鹏','邓娟','许峰','彭芳','苏磊','潘婷'][i % 30],
    phone: `13${['8','9','7','6','5','4','3','2'][i % 8]}****${String(1000 + i).slice(1)}`,
    tier,
    points: tier === 'diamond' ? 12000 + i * 100 : tier === 'gold' ? 6200 + i * 80 : tier === 'silver' ? 2800 + i * 50 : tier === 'bronze' ? 800 + i * 30 : 100 + i * 10,
    balance: Math.floor(Math.random() * 2000),
    totalSpent: tier === 'diamond' ? 40000 + i * 500 : tier === 'gold' ? 18000 + i * 300 : tier === 'silver' ? 8000 + i * 200 : tier === 'bronze' ? 3000 + i * 100 : 500 + i * 50,
    totalVisits: Math.floor(5 + Math.random() * 95),
    lastVisit: `2026-07-${String(1 + (i % 13)).padStart(2, '0')}`,
    createdAt: `2026-${String(3 + (i % 4)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    status: i < 40 ? 'active' : i < 44 ? 'inactive' : 'frozen',
    birthday: i % 3 === 0 ? `19${80 + i % 20}-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}` : undefined,
    email: i % 2 === 0 ? `member${i + 1}@example.com` : undefined,
    tags: i % 4 === 0 ? ['VIP','高频'] : i % 4 === 1 ? ['新客'] : i % 4 === 2 ? ['沉默'] : undefined,
    levelProgress: nextLev ? Math.min(100, ((tier === 'diamond' ? 12000 : tier === 'gold' ? 6200 : 2800) - lev.minPoints) / (nextLev.minPoints - lev.minPoints) * 100) : 100,
    nextLevelPoints: nextLev?.minPoints,
  };
});

const DASHBOARD = { total: MOCK_MEMBERS.length, active: MOCK_MEMBERS.filter(m => m.status === 'active').length, newThisMonth: 48, active7d: 356, totalPoints: MOCK_MEMBERS.reduce((s, m) => s + m.points, 0), totalBalance: MOCK_MEMBERS.reduce((s, m) => s + m.balance, 0) };

// ─── 子组件 ────────────────────────────────────────────────────────

function LevelTag({ tier }: { tier: MemberTier }) {
  return <Tag style={{ color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}40`, background: `${TIER_COLORS[tier]}15` }}>{TIER_NAMES[tier]}</Tag>;
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; color: string }> = {
    active: { label: '正常', color: '#34d399' },
    inactive: { label: '流失', color: '#94a3b8' },
    frozen: { label: '冻结', color: '#f87171' },
  };
  const s = map[status];
  return <Badge status="processing" color={s.color} text={s.label} />;
}

function LevelProgress({ member }: { member: Member }) {
  if (!member.levelProgress || !member.nextLevelPoints) return <span style={{ color: '#64748b' }}>最高等级</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Progress percent={Math.round(member.levelProgress)} size="small" style={{ width: 80 }} />
      <span style={{ fontSize: 12, color: '#94a3b8' }}>距升级差{member.nextLevelPoints - member.points}分</span>
    </div>
  );
}

// ─── 主页面 ────────────────────────────────────────────────────────

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<MemberTier | ''>('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('list');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 过滤
  const filtered = useMemo(() => {
    let list = MOCK_MEMBERS;
    if (search) list = list.filter(m => m.name.includes(search) || m.phone.includes(search));
    if (tierFilter) list = list.filter(m => m.tier === tierFilter);
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    return list;
  }, [search, tierFilter, statusFilter]);

  const pagedData = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80,
      render: (v: string, r: Member) => <a onClick={() => setSelectedMember(r)} style={{ color: '#60a5fa', cursor: 'pointer' }}>{v}</a> },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '等级', dataIndex: 'tier', key: 'tier', width: 80, render: (v: MemberTier) => <LevelTag tier={v} /> },
    { title: '积分', dataIndex: 'points', key: 'points', width: 80, sorter: (a: Member, b: Member) => a.points - b.points, render: (v: number) => v.toLocaleString() },
    { title: '余额', dataIndex: 'balance', key: 'balance', width: 80, render: (v: number) => <span style={{ color: '#34d399' }}>¥{v.toLocaleString()}</span> },
    { title: '累计消费', dataIndex: 'totalSpent', key: 'totalSpent', width: 100, render: (v: number) => <span style={{ color: '#fbbf24' }}>¥{v.toLocaleString()}</span> },
    { title: '积分进度', key: 'progress', width: 160, render: (_: unknown, r: Member) => <LevelProgress member={r} /> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: MemberStatus) => <StatusBadge status={v} /> },
    { title: '最后到店', dataIndex: 'lastVisit', key: 'lastVisit', width: 100 },
    { title: '操作', key: 'actions', width: 180, render: (_: unknown, r: Member) => (
      <Space size="small">
        <Button size="small" onClick={() => { setSelectedMember(r); setShowPointsModal(true); }}>积分</Button>
        <Button size="small" onClick={() => { setSelectedMember(r); setShowBalanceModal(true); }}>余额</Button>
        <Button size="small" onClick={() => { setSelectedMember(r); }}>详情</Button>
      </Space>
    )},
  ];

  return (
    <PageShell>
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#f8fafc', margin: 0 }}>👥 会员管理</h2>
          <Space>
            <Button onClick={() => setShowLevelModal(true)}>等级配置</Button>
            <Button onClick={() => setShowImportModal(true)}>批量导入</Button>
            <Button type="primary" onClick={() => setShowCreateModal(true)}>新增会员</Button>
          </Space>
        </div>

        {/* Dashboard */}
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title="总会员" value={DASHBOARD.total} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="活跃(月度)" value={DASHBOARD.active} valueStyle={{ color: '#34d399' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="本月新增" value={DASHBOARD.newThisMonth} valueStyle={{ color: '#60a5fa' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="7天活跃" value={DASHBOARD.active7d} valueStyle={{ color: '#fbbf24' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="总积分" value={DASHBOARD.totalPoints.toLocaleString()} valueStyle={{ color: '#a78bfa' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title="总余额" value={`¥${DASHBOARD.totalBalance.toLocaleString()}`} valueStyle={{ color: '#34d399' }} /></Card></Col>
        </Row>

        {/* Tabs */}
        <Tabs activeKey={currentTab} onChange={setCurrentTab as any} items={[
          { key: 'list', label: '会员列表' },
          { key: 'levels', label: '等级分布' },
          { key: 'analytics', label: '数据分析' },
        ]} />

        {currentTab === 'list' && (
          <Card>
            {/* Filters */}
            <Space style={{ width: '100%', marginBottom: 16, flexWrap: 'wrap' }}>
              <Input.Search placeholder="搜索姓名/手机号" style={{ width: 280 }} value={search} onChange={e => setSearch(e.target.value)} />
              <Select style={{ width: 120 }} placeholder="全部等级" allowClear value={tierFilter || undefined} onChange={v => setTierFilter((v || '') as MemberTier | '')}>
                {LEVELS.map(l => <Select.Option key={l.key} value={l.key}>{l.label}</Select.Option>)}
              </Select>
              <Select style={{ width: 120 }} placeholder="全部状态" allowClear value={statusFilter || undefined} onChange={v => setStatusFilter((v || '') as MemberStatus | '')}>
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="inactive">流失</Select.Option>
                <Select.Option value="frozen">冻结</Select.Option>
              </Select>
              <Button onClick={() => { setSearch(''); setTierFilter(''); setStatusFilter(''); }}>重置</Button>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>共 {filtered.length} 条</span>
            </Space>
            {/* Table */}
            <Table dataSource={pagedData} columns={columns} rowKey="id" pagination={false} />
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
                <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
                <span style={{ color: '#94a3b8', lineHeight: '32px' }}>{page}/{totalPages}</span>
                <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</Button>
              </div>
            )}
          </Card>
        )}

        {currentTab === 'levels' && (
          <Card>
            <h3 style={{ color: '#f8fafc', marginBottom: 16 }}>会员等级分布</h3>
            <Row gutter={[16, 16]}>
              {LEVELS.map(l => {
                const count = MOCK_MEMBERS.filter(m => m.tier === l.key).length;
                const pct = (count / MOCK_MEMBERS.length * 100).toFixed(1);
                const next = LEVELS[LEVELS.indexOf(l) + 1];
                return (
                  <Col span={8} key={l.key}>
                    <Card size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Tag style={{ color: l.color, border: `1px solid ${l.color}40` }}>{l.label}</Tag>
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>{count} 人 ({pct}%)</span>
                      </div>
                      <Progress percent={parseInt(pct)} strokeColor={l.color} size="small" />
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
                        <span>积分≥{l.minPoints.toLocaleString()}</span>
                        <span>折扣 {l.discount}%</span>
                        <span>升级倍率 ×{l.upgradeMultiplier}</span>
                      </div>
                      {next && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>升级条件：累计积分≥{next.minPoints.toLocaleString()}</div>}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

        {currentTab === 'analytics' && (
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="上月新增趋势">
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <Empty description="图表组件接入中" />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="消费排行(TOP10)">
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {[...MOCK_MEMBERS].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10).map((m, i) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                      <span style={{ color: i < 3 ? '#fbbf24' : '#94a3b8' }}>#{i + 1} {m.name}</span>
                      <span style={{ color: '#fbbf24' }}>¥{m.totalSpent.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Space>

      {/* ─── Drawer: 会员详情 ───────────────────────────────── */}
      <Drawer title={`会员详情 - ${selectedMember?.name}`} placement="right" width={480} open={!!selectedMember} onClose={() => setSelectedMember(null)}>
        {selectedMember && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small">
              <Descriptions column={2} size="small" labelStyle={{ color: '#94a3b8' }}>
                <Descriptions.Item label="会员ID">{selectedMember.id}</Descriptions.Item>
                <Descriptions.Item label="等级"><LevelTag tier={selectedMember.tier} /></Descriptions.Item>
                <Descriptions.Item label="姓名">{selectedMember.name}</Descriptions.Item>
                <Descriptions.Item label="电话">{selectedMember.phone}</Descriptions.Item>
                <Descriptions.Item label="状态"><StatusBadge status={selectedMember.status} /></Descriptions.Item>
                <Descriptions.Item label="注册时间">{selectedMember.createdAt}</Descriptions.Item>
                <Descriptions.Item label="生日">{selectedMember.birthday || '未设置'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{selectedMember.email || '未设置'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Row gutter={16}>
              <Col span={8}><Card size="small"><Statistic title="积分" value={selectedMember.points.toLocaleString()} valueStyle={{ color: '#a78bfa', fontSize: 20 }} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="余额" value={`¥${selectedMember.balance.toLocaleString()}`} valueStyle={{ color: '#34d399', fontSize: 20 }} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="累计消费" value={`¥${selectedMember.totalSpent.toLocaleString()}`} valueStyle={{ color: '#fbbf24', fontSize: 20 }} /></Card></Col>
            </Row>
            <Card size="small" title="到店记录">
              <div style={{ fontSize: 13, color: '#94a3b8' }}>最后到店: {selectedMember.lastVisit}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>累计到店: {selectedMember.totalVisits}次</div>
            </Card>
            {selectedMember.tags && (
              <Card size="small" title="标签">
                <Space>{selectedMember.tags.map(t => <Tag key={t}>{t}</Tag>)}</Space>
              </Card>
            )}
            <Space>
              <Button onClick={() => setShowPointsModal(true)}>积分操作</Button>
              <Button onClick={() => setShowBalanceModal(true)}>余额操作</Button>
              <Button danger>冻结会员</Button>
            </Space>
          </Space>
        )}
      </Drawer>

      {/* ─── Modal: 积分操作 ──────────────────────────────────── */}
      <Modal title="积分操作" open={showPointsModal} onCancel={() => setShowPointsModal(false)} onOk={() => { message.success('积分操作成功'); setShowPointsModal(false); }} okText="确认">
        <Form layout="vertical">
          <Form.Item label="会员">{selectedMember?.name} ({selectedMember?.id})</Form.Item>
          <Form.Item label="当前积分">{selectedMember?.points.toLocaleString()}</Form.Item>
          <Form.Item label="操作类型"><Select defaultValue="add"><Select.Option value="add">增加</Select.Option><Select.Option value="deduct">减少</Select.Option></Select></Form.Item>
          <Form.Item label="数量"><Input prefix="分" type="number" placeholder="输入积分数量" /></Form.Item>
          <Form.Item label="原因"><Input.TextArea rows={2} placeholder="操作原因" /></Form.Item>
        </Form>
      </Modal>

      {/* ─── Modal: 余额操作 ──────────────────────────────────── */}
      <Modal title="余额操作" open={showBalanceModal} onCancel={() => setShowBalanceModal(false)} onOk={() => { message.success('余额操作成功'); setShowBalanceModal(false); }} okText="确认">
        <Form layout="vertical">
          <Form.Item label="会员">{selectedMember?.name}</Form.Item>
          <Form.Item label="当前余额">¥{selectedMember?.balance.toLocaleString()}</Form.Item>
          <Form.Item label="操作类型"><Select defaultValue="add"><Select.Option value="add">充值</Select.Option><Select.Option value="deduct">扣减</Select.Option></Select></Form.Item>
          <Form.Item label="金额"><Input prefix="¥" type="number" placeholder="输入金额" /></Form.Item>
          <Form.Item label="原因"><Input.TextArea rows={2} placeholder="操作原因" /></Form.Item>
        </Form>
      </Modal>

      {/* ─── Modal: 新增会员 ──────────────────────────────────── */}
      <Modal title="新增会员" open={showCreateModal} onCancel={() => setShowCreateModal(false)} onOk={() => { message.success('会员创建成功'); setShowCreateModal(false); }} okText="创建" width={520}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="姓名" required><Input placeholder="会员姓名" /></Form.Item></Col>
            <Col span={12}><Form.Item label="手机号" required><Input placeholder="手机号" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="初始等级"><Select defaultValue="basic">{LEVELS.map(l => <Select.Option key={l.key} value={l.key}>{l.label}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item label="生日"><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item label="邮箱"><Input placeholder="邮箱地址" /></Form.Item>
          <Form.Item label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>

      {/* ─── Modal: 批量导入 ──────────────────────────────────── */}
      <Modal title="批量导入会员" open={showImportModal} onCancel={() => setShowImportModal(false)} onOk={() => { message.success('导入任务已提交'); setShowImportModal(false); }} okText="开始导入" width={480}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>支持 CSV / Excel 文件，请按模板格式填写</div>
          <div style={{ border: '2px dashed #334155', borderRadius: 8, padding: 32, textAlign: 'center', background: '#0f172a' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
            <div style={{ color: '#94a3b8' }}>拖拽文件到此处，或<Button size="small" type="link">点击上传</Button></div>
          </div>
          <Button type="link" style={{ padding: 0 }}>下载导入模板</Button>
          <div style={{ color: '#64748b', fontSize: 12 }}>历史导入记录可在"导入管理"中查看</div>
        </Space>
      </Modal>

      {/* ─── Modal: 等级配置 ──────────────────────────────────── */}
      <Modal title="会员等级配置" open={showLevelModal} onCancel={() => setShowLevelModal(false)} onOk={() => { message.success('等级配置已保存'); setShowLevelModal(false); }} okText="保存" width={600}>
        <Steps current={1} style={{ marginBottom: 16 }} items={[{ title: '铜卡', description: '≥500分' }, { title: '银卡', description: '≥2,000分' }, { title: '黄金', description: '≥5,000分' }, { title: '钻石', description: '≥10,000分' }]} />
        <Form layout="vertical">
          {LEVELS.filter(l => l.key !== 'basic').map(l => (
            <Card key={l.key} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16} align="middle">
                <Col span={4}><LevelTag tier={l.key as MemberTier} /></Col>
                <Col span={6}><Form.Item label="升级积分" initial={l.minPoints}><Input type="number" /></Form.Item></Col>
                <Col span={6}><Form.Item label="折扣(%)" initial={l.discount}><Input type="number" /></Form.Item></Col>
                <Col span={6}><Form.Item label="升级倍率" initial={l.upgradeMultiplier}><Input type="number" step={0.1} /></Form.Item></Col>
              </Row>
            </Card>
          ))}
        </Form>
      </Modal>
    </PageShell>
  );
}
