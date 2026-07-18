'use client';

/**
 * 设备管理 - Equipment Management
 * 角色: 🏢总部管理 / 🛠️运维
 * 功能: 设备列表、状态筛选、概览统计
 * 设备类型: 扭蛋机/娃娃机/收银机/空调/音响/灯箱/闸机
 * 状态: 正常/维修中/待报废/已报废
 */

import { useState, useMemo, useCallback } from 'react';
import {
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  SearchFilterInput,
  DataTable,
  Pagination,
  usePagination,
  useSearchFilter,
  useSortedItems,
  EmptyState,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

/** 设备状态 */
export type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped';

/** 设备类型 */
export type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile';

/** 设备数据项 */
export interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  type: EquipmentType;
  store: string;
  supplier: string;
  purchaseDate: string;
  warrantyEnd: string;
  status: EquipmentStatus;
  note?: string;
}

// ---- 映射表 ----

const ET: Record<EquipmentType, string> = {
  capsule: '扭蛋机',
  claw: '娃娃机',
  cashier: '收银机',
  ac: '空调',
  speaker: '音响',
  lightbox: '灯箱',
  turnstile: '闸机',
};

const ES: Record<EquipmentStatus, { l: string; v: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  normal: { l: '正常', v: 'success' },
  maintaining: { l: '维修中', v: 'warning' },
  scrap_pending: { l: '待报废', v: 'danger' },
  scrapped: { l: '已报废', v: 'neutral' },
};

const STATUS_ORDER: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];

const EQUIPMENT_TAB_KEYS = ['ALL', 'normal', 'maintaining'] as const;
type EquipmentTabKey = (typeof EQUIPMENT_TAB_KEYS)[number];

// ---- 样本数据 ----

export const defaultEquipment: EquipmentItem[] = [
  { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal' },
  { id: 'E002', name: '娃娃机-B03', model: 'CLAW-Z2', type: 'claw', store: '门店-科技路', supplier: '世嘉', purchaseDate: '2024-06-01', warrantyEnd: '2026-05-31', status: 'normal' },
  { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining' },
  { id: 'E004', name: '中央空调-01', model: 'AC-M5', type: 'ac', store: '旗舰店-解放路', supplier: '格力', purchaseDate: '2023-05-10', warrantyEnd: '2028-05-09', status: 'normal' },
  { id: 'E005', name: '音响系统-S01', model: 'SPK-2000', type: 'speaker', store: '门店-科技路', supplier: 'JBL', purchaseDate: '2024-01-15', warrantyEnd: '2026-01-14', status: 'scrap_pending' },
  { id: 'E006', name: '灯箱-L02', model: 'LB-800', type: 'lightbox', store: '门店-中山路', supplier: '欧普照明', purchaseDate: '2024-09-01', warrantyEnd: '2026-08-31', status: 'normal' },
  { id: 'E007', name: '闸机-G01', model: 'GATE-100', type: 'turnstile', store: '旗舰店-解放路', supplier: '海康威视', purchaseDate: '2023-08-20', warrantyEnd: '2026-08-19', status: 'normal' },
  { id: 'E008', name: '扭蛋机-A02', model: 'GACHA-X2', type: 'capsule', store: '门店-中山路', supplier: '多美', purchaseDate: '2024-12-01', warrantyEnd: '2026-11-30', status: 'scrapped' },
];

// ---- 辅助函数 ----

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function warrantyColor(days: number): string {
  if (days < 0) return '#ef4444';
  if (days < 90) return '#eab308';
  return '#94a3b8';
}

// ---- 组件 ----

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(defaultEquipment);
  const [tabKey, setTabKey] = useState<EquipmentTabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  /** 刷新：重置为默认数据 */
  const handleRefresh = useCallback(() => {
    setEquipment([...defaultEquipment]);
  }, []);

  // ---- 统计 ----
  const stats = useMemo(() => {
    const total = equipment.length;
    const normal = equipment.filter((e) => e.status === 'normal').length;
    const maintaining = equipment.filter((e) => e.status === 'maintaining').length;
    const scrapPending = equipment.filter((e) => e.status === 'scrap_pending').length;
    return { total, normal, maintaining, scrapPending };
  }, [equipment]);

  // ---- Tab 筛选 ----
  const tabFiltered = useMemo(() => {
    if (tabKey === 'ALL') return equipment;
    return equipment.filter((e) => e.status === tabKey);
  }, [equipment, tabKey]);

  // ---- 搜索 ----
  const searchFields: (keyof EquipmentItem)[] = useMemo(
    () => ['name', 'model', 'type', 'store', 'supplier'],
    [],
  );
  const searchFiltered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return tabFiltered;
    return tabFiltered.filter((item) =>
      searchFields.some(
        (field) =>
          item[field] &&
          String(item[field]).toLowerCase().includes(q),
      ),
    );
  }, [tabFiltered, searchTerm, searchFields]);

  // ---- 排序 ----
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const columns: DataTableColumn<EquipmentItem>[] = useMemo(
    () => [
      {
        key: 'name',
        title: '设备名称',
        dataKey: 'name',
        sortable: true,
        render: (i) => (
          <span style={{ color: '#93c5fd', fontWeight: 600 }}>{i.name}</span>
        ),
      },
      {
        key: 'model',
        title: '型号',
        dataKey: 'model',
        sortable: true,
      },
      {
        key: 'type',
        title: '设备类型',
        sortable: true,
        sortValue: (i) => i.type,
        render: (i) => ET[i.type],
      },
      {
        key: 'store',
        title: '所属门店',
        dataKey: 'store',
        sortable: true,
      },
      {
        key: 'supplier',
        title: '供应商',
        dataKey: 'supplier',
        sortable: true,
      },
      {
        key: 'purchaseDate',
        title: '采购日期',
        dataKey: 'purchaseDate',
        sortable: true,
      },
      {
        key: 'warrantyEnd',
        title: '保修期',
        dataKey: 'warrantyEnd',
        sortable: true,
        render: (i) => {
          const days = daysUntil(i.warrantyEnd);
          const label = days < 0 ? '已过期' : days < 90 ? `剩${days}天` : i.warrantyEnd;
          return <span style={{ color: warrantyColor(days) }}>{label}</span>;
        },
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (i) => i.status,
        render: (i) => (
          <StatusBadge
            label={ES[i.status].l}
            variant={ES[i.status].v}
            size="sm"
            dot
          />
        ),
      },
    ],
    [],
  );

  const sorted = useSortedItems(searchFiltered, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 10 });
  const pageItems = pagination.paginate(sorted);

  // ---- Tab 构造 ----
  const tabCounts = useMemo(() => {
    const all = searchFiltered.length;
    const normal = searchFiltered.filter((e) => e.status === 'normal').length;
    const maintaining = searchFiltered.filter((e) => e.status === 'maintaining').length;
    return { ALL: all, normal, maintaining };
  }, [searchFiltered]);

  // ---- 空态 ----
  const isEmpty = equipment.length === 0;
  const isSearchNoResult = equipment.length > 0 && searchFiltered.length === 0;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell title="设备管理" subtitle={`${stats.total}台设备 · ${stats.normal}正常 · ${stats.maintaining}维修中 · ${stats.scrapPending}待报废`}>
        {/* 概览统计 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: 20,
          }}
        >
          <div style={card}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总设备数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#22c55e' }}>正常</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              {stats.normal}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#eab308' }}>维修中</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#eab308',
              }}
            >
              {stats.maintaining}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 13, color: '#f97316' }}>待报废</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#f97316',
              }}
            >
              {stats.scrapPending}
            </div>
          </div>
        </div>

        {/* 搜索 + 刷新 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索设备名称/型号/门店/供应商..."
            width={360}
          />
          <button
            onClick={handleRefresh}
            style={refreshBtn}
            title="刷新数据"
          >
            ⟳ 刷新
          </button>
        </div>

        {/* Tab 筛选: 全部 / 正常 / 维修中 */}
        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部', count: tabCounts.ALL },
              { key: 'normal', label: '正常', count: tabCounts.normal },
              { key: 'maintaining', label: '维修中', count: tabCounts.maintaining },
            ]}
            activeKey={tabKey}
            onChange={(k: string) => setTabKey(k as EquipmentTabKey)}
            variant="pills"
            size="sm"
          />
        </div>

        {/* 列表区域 */}
        {isEmpty ? (
          <EmptyState
            title="暂无设备数据"
            description="目前没有录入任何设备，点击刷新按钮恢复默认数据。"
          />
        ) : isSearchNoResult ? (
          <EmptyState
            title="未找到匹配设备"
            description="尝试修改筛选条件或关键词重新搜索。"
          />
        ) : (
          <>
            <DataTable
              title={`设备列表 (${sorted.length})`}
              columns={columns}
              items={pageItems}
              rowKey={(i) => i.id}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}

        {/* 操作提示 */}
        <div style={tipBox}>
          <strong style={{ color: '#e2e8f0' }}>💡 提示</strong>
          <br />
          设备状态由门店运维人员定期更新。待报废设备需提交报废审批单。
          保修期剩余不足90天的设备以黄色标记，已过保设备以红色标记。
        </div>
      </PageShell>
    </main>
  );
}

// ---- 内联样式 ----

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
};

const refreshBtn: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.4)',
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
};

const tipBox: React.CSSProperties = {
  marginTop: 24,
  padding: '8px 16px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(148,163,184,0.08)',
  fontSize: 12,
  color: '#94a3b8',
  lineHeight: 1.6,
};
