'use client';

/**
 * 品牌运营管理 - Brand Operations Admin Page
 * 角色: 🏢总部管理 / 📢营销
 * 功能: 品牌资产管理、活动管理、联名合作、模板管理
 */

import { useState, useMemo, useCallback } from 'react';
import { PageShell, StatCard, Tabs, SearchFilterInput, DataTable, Pagination, usePagination, useSearchFilter, useSortedItems, StatusBadge, type DataTableColumn, type DataTableSortConfig } from '@m5/ui';

// ── 类型 ───────────────────────────────────────────────────────────────────

type AssetType = 'logo' | 'banner' | 'video' | 'copy';
type CampaignStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'ended' | 'cancelled';
type CollabStatus = 'draft' | 'negotiating' | 'active' | 'ended' | 'terminated';
type PartnerGrade = 'platinum' | 'gold' | 'silver' | 'bronze';

interface BrandAsset { id: string; type: AssetType; name: string; active: boolean; url: string; createdAt: string; }
interface BrandCampaign { id: string; title: string; description: string; storeIds: string[]; status: CampaignStatus; startDate: string; endDate: string; createdBy: string; }
interface Collaboration { id: string; title: string; partner: { name: string; grade: PartnerGrade; contactName: string; }; type: string; status: CollabStatus; startDate: string; endDate: string; }

// ── 常量 ───────────────────────────────────────────────────────────────────

const ASSET_TYPES: Record<AssetType, string> = { logo: 'Logo', banner: 'Banner', video: '视频', copy: '文案' };
const CAMPAIGN_STATUS: Record<CampaignStatus, { l: string; v: 'default' | 'pending' | 'success' | 'warning' | 'error' }> = {
  draft: { l: '草稿', v: 'default' },
  pending_review: { l: '待审批', v: 'pending' },
  approved: { l: '已审批', v: 'success' },
  active: { l: '进行中', v: 'success' },
  ended: { l: '已结束', v: 'default' },
  cancelled: { l: '已取消', v: 'error' },
};
const COLLAB_STATUS: Record<CollabStatus, string> = { draft: '草稿', negotiating: '洽谈中', active: '合作中', ended: '已到期', terminated: '已终止' };
const PARTNER_GRADE: Record<PartnerGrade, { l: string; v: 'success' | 'pending' | 'warning' | 'default' }> = {
  platinum: { l: '铂金', v: 'success' },
  gold: { l: '黄金', v: 'pending' },
  silver: { l: '白银', v: 'warning' },
  bronze: { l: '青铜', v: 'default' },
};

// ── 模拟数据 ───────────────────────────────────────────────────────────────

const mockAssets: BrandAsset[] = [
  { id: 'A1', type: 'logo', name: '神机营主Logo', active: true, url: '/assets/logo-main.png', createdAt: '2026-01-15' },
  { id: 'A2', type: 'banner', name: '夏季Banner-1920x600', active: true, url: '/assets/banner-summer.jpg', createdAt: '2026-03-01' },
  { id: 'A3', type: 'video', name: '品牌宣传片', active: false, url: '/assets/brand-video.mp4', createdAt: '2026-02-10' },
  { id: 'A4', type: 'copy', name: '品牌Slogan集', active: true, url: '/assets/slogans.txt', createdAt: '2026-01-20' },
  { id: 'A5', type: 'banner', name: '秋季Banner', active: true, url: '/assets/banner-autumn.jpg', createdAt: '2026-04-15' },
];

const mockCampaigns: BrandCampaign[] = [
  { id: 'C1', title: '夏日狂欢季', description: '2026夏季全品牌促销活动', storeIds: ['s1','s2','s3'], status: 'active', startDate: '2026-07-01', endDate: '2026-08-31', createdBy: 'admin' },
  { id: 'C2', title: '中秋特惠', description: '中秋品牌联名推广', storeIds: ['s1','s4'], status: 'approved', startDate: '2026-09-10', endDate: '2026-09-30', createdBy: 'marketing' },
  { id: 'C3', title: '双十一预热', description: '双十一品牌活动-待审批', storeIds: ['s1','s2','s3','s4'], status: 'pending_review', startDate: '2026-10-20', endDate: '2026-11-11', createdBy: 'admin' },
  { id: 'C4', title: '冬季暖场', description: '冬季促销草案', storeIds: ['s2'], status: 'draft', startDate: '2026-12-01', endDate: '2026-12-31', createdBy: 'admin' },
];

const mockCollaborations: Collaboration[] = [
  { id: 'Co1', title: 'SEGA联名推广', partner: { name: 'SEGA', grade: 'platinum', contactName: '田中' }, type: 'co_branding', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'Co2', title: '可口可乐夏季联名', partner: { name: '可口可乐', grade: 'gold', contactName: '刘经理' }, type: 'joint_promotion', status: 'active', startDate: '2026-06-01', endDate: '2026-09-30' },
  { id: 'Co3', title: 'VR设备赞助合作', partner: { name: 'VR设备商', grade: 'silver', contactName: '王总' }, type: 'sponsorship', status: 'negotiating', startDate: '2026-09-01', endDate: '2027-08-31' },
];

// ── 辅助函数 ───────────────────────────────────────────────────────────────

function fm(a: number): string { return `¥${a.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`; }

const STATUS_DOT = { dot: true } as const;

// ── Page Component ─────────────────────────────────────────────────────────

export default function BrandOperationsPage() {
  const [tab, setTab] = useState<'assets' | 'campaigns' | 'collaborations'>('campaigns');

  const stats = useMemo(() => ({
    assets: mockAssets.length,
    activeAssets: mockAssets.filter(a => a.active).length,
    campaigns: mockCampaigns.length,
    activeCampaigns: mockCampaigns.filter(c => c.status === 'active').length,
    collaborations: mockCollaborations.length,
    activeCollabs: mockCollaborations.filter(c => c.status === 'active').length,
  }), []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="品牌运营管理" subtitle={`${stats.assets}个素材 · ${stats.campaigns}个活动 · ${stats.collaborations}个合作`}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          <StatCard label="品牌素材" value={stats.assets} />
          <StatCard label="品牌活动" value={stats.campaigns} />
          <StatCard label="联名合作" value={stats.collaborations} />
        </div>

        <Tabs
          items={[
            { key: 'campaigns', label: '品牌活动' },
            { key: 'assets', label: '品牌素材' },
            { key: 'collaborations', label: '联名合作' },
          ]}
          activeKey={tab}
          onChange={(k) => setTab(k as any)}
        />

        {tab === 'campaigns' && <CampaignsTab campaigns={mockCampaigns} />}
        {tab === 'assets' && <AssetsTab assets={mockAssets} />}
        {tab === 'collaborations' && <CollaborationsTab collabs={mockCollaborations} />}
      </PageShell>
    </main>
  );
}

// ── Assets Tab ─────────────────────────────────────────────────────────────

function AssetsTab({ assets }: { assets: BrandAsset[] }) {
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(assets, ['name', 'type']);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const filtered = useMemo(() => {
    let items = filteredItems;
    if (typeFilter !== 'ALL') items = items.filter(a => a.type === typeFilter);
    if (activeFilter !== 'ALL') items = items.filter(a => String(a.active) === activeFilter);
    return items;
  }, [filteredItems, typeFilter, activeFilter]);

  const columns = useMemo((): DataTableColumn<BrandAsset>[] => [
    { key: 'name', title: '素材名称', dataKey: 'name', sortable: true },
    { key: 'type', title: '类型', sortable: true, render: a => ASSET_TYPES[a.type] },
    { key: 'active', title: '状态', sortable: true, render: a => <StatusBadge label={a.active ? '启用' : '停用'} variant={a.active ? 'success' : 'error'} size="sm" {...STATUS_DOT} /> },
    { key: 'createdAt', title: '创建时间', dataKey: 'createdAt', sortable: true },
  ], []);

  return (
    <div>
      <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索素材名称..." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="ALL">全部类型</option>
          {Object.entries(ASSET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} style={selectStyle}>
          <option value="ALL">全部状态</option>
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
      </div>
      <DataTable columns={columns} data={filtered} rowKey={r => r.id} />
    </div>
  );
}

// ── Campaigns Tab ──────────────────────────────────────────────────────────

function CampaignsTab({ campaigns }: { campaigns: BrandCampaign[] }) {
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(campaigns, ['title', 'description']);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const filtered = useMemo(() => {
    let items = filteredItems;
    if (statusFilter !== 'ALL') items = items.filter(c => c.status === statusFilter);
    return items;
  }, [filteredItems, statusFilter]);

  const columns = useMemo((): DataTableColumn<BrandCampaign>[] => [
    { key: 'title', title: '活动名称', dataKey: 'title', sortable: true, render: c => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{c.title}</span> },
    { key: 'status', title: '状态', sortable: true, render: c => <StatusBadge label={CAMPAIGN_STATUS[c.status].l} variant={CAMPAIGN_STATUS[c.status].v} size="sm" {...STATUS_DOT} /> },
    { key: 'stores', title: '关联门店', render: c => `${c.storeIds.length}家` },
    { key: 'startDate', title: '开始日期', dataKey: 'startDate', sortable: true },
    { key: 'endDate', title: '结束日期', dataKey: 'endDate', sortable: true },
    { key: 'createdBy', title: '创建人', dataKey: 'createdBy', sortable: true },
  ], []);

  return (
    <div>
      <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索活动名称..." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="ALL">全部状态</option>
          {Object.entries(CAMPAIGN_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={filtered} rowKey={r => r.id} />
    </div>
  );
}

// ── Collaborations Tab ─────────────────────────────────────────────────────

function CollaborationsTab({ collabs }: { collabs: Collaboration[] }) {
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(collabs, ['title', 'partner.name']);
  const columns = useMemo((): DataTableColumn<Collaboration>[] => [
    { key: 'title', title: '合作名称', dataKey: 'title', sortable: true, render: c => <span style={{ color: '#93c5fd', fontWeight: 600 }}>{c.title}</span> },
    { key: 'partnerName', title: '合作方', sortable: true, render: c => c.partner.name },
    { key: 'grade', title: '等级', sortable: true, render: c => <StatusBadge label={PARTNER_GRADE[c.partner.grade].l} variant={PARTNER_GRADE[c.partner.grade].v} size="sm" {...STATUS_DOT} /> },
    { key: 'status', title: '合作状态', sortable: true, render: c => COLLAB_STATUS[c.status] },
    { key: 'startDate', title: '开始日期', dataKey: 'startDate', sortable: true },
    { key: 'endDate', title: '结束日期', dataKey: 'endDate', sortable: true },
  ], []);

  return (
    <div>
      <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索合作名称或合作方..." />
      <DataTable columns={columns} data={filteredItems} rowKey={r => r.id} />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 13,
};
