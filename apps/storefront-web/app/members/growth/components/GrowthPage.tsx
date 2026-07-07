/**
 * GrowthPage — 会员成长值列表页组件 (Client-side compatible)
 * 含搜索/筛选/分页功能
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';

/* ── 类型定义 ── */

type GrowthSource =
  | 'consumption'
  | 'checkin'
  | 'referral'
  | 'activity'
  | 'evaluate'
  | 'other';

interface GrowthRecord {
  id: string;
  memberName: string;
  memberPhone: string;
  memberTier: string;
  source: GrowthSource;
  points: number;
  balance: number;
  remark: string;
  createdAt: string;
  storeName: string;
}

/* ── 常量 ── */

const SOURCE_LABEL: Record<GrowthSource, string> = {
  consumption: '消费获得',
  checkin: '每日签到',
  referral: '推荐奖励',
  activity: '活动奖励',
  evaluate: '评价奖励',
  other: '其他',
};

const SOURCE_COLORS: Record<GrowthSource, string> = {
  consumption: '#3b82f6',
  checkin: '#10b981',
  referral: '#f59e0b',
  activity: '#8b5cf6',
  evaluate: '#ec4899',
  other: '#6b7280',
};

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Mock 数据 (可被外部注入覆盖) ── */

export function generateMockRecords(count = 30): GrowthRecord[] {
  const sources: GrowthSource[] = ['consumption', 'checkin', 'referral', 'activity', 'evaluate', 'other'];
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
  const stores = ['总店', '望京店', '国贸店', '三里屯店', '中关村店', '西单店'];
  const tiers = ['钻石会员', '黄金会员', '银卡会员', '铜卡会员', '普通会员'];
  const remarks = [
    '普通消费积分',
    '每日签到奖励',
    '推荐好友注册',
    '周年庆活动奖励',
    '评价订单奖励',
    '系统补发',
  ];

  const records: GrowthRecord[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const source = sources[i % sources.length]!;
    const pointValues = [50, 100, 200, 500, 20, 10][i % 6]!;
    records.push({
      id: `growth-${i + 1}`,
      memberName: names[i % names.length]!,
      memberPhone: `138${String(10000000 + i).slice(0, 8)}`,
      memberTier: tiers[i % tiers.length]!,
      source,
      points: source === 'consumption' ? pointValues * 3 : pointValues,
      balance: (i + 1) * 100,
      remark: remarks[i % remarks.length]!,
      createdAt: new Date(now - i * 86400000).toISOString(),
      storeName: stores[i % stores.length]!,
    });
  }
  return records;
}

/* ── Props ── */

export interface GrowthPageProps {
  records: GrowthRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/* ── Component ── */

export function GrowthPage({ records, total, page, pageSize }: GrowthPageProps) {
  const safeRecords = records ?? [];
  const mockRecords = useMemo(() => (safeRecords.length === 0 ? generateMockRecords() : safeRecords), [safeRecords]);

  // 搜索与筛选状态
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<GrowthSource | ''>('');
  const [tierFilter, setTierFilter] = useState('');

  const safePageSize = pageSize > 0 ? pageSize : 20;
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize] = useState(safePageSize);

  // 过滤逻辑
  const filteredRecords = useMemo(() => {
    return mockRecords.filter((r) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !r.memberName.toLowerCase().includes(q) &&
          !r.memberPhone.includes(q) &&
          !r.remark.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (sourceFilter && r.source !== sourceFilter) return false;
      if (tierFilter && r.memberTier !== tierFilter) return false;
      return true;
    });
  }, [mockRecords, searchText, sourceFilter, tierFilter]);

  // 分页
  const totalFiltered = filteredRecords.length;
  const totalPages = Math.ceil(totalFiltered / currentPageSize);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return filteredRecords.slice(start, start + currentPageSize);
  }, [filteredRecords, currentPage, currentPageSize]);

  // 重置
  const handleReset = useCallback(() => {
    setSearchText('');
    setSourceFilter('');
    setTierFilter('');
    setCurrentPage(1);
  }, []);

  // 统计摘要
  const totalPoints = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + r.points, 0),
    [filteredRecords],
  );

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📈 会员成长值</h1>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          data-testid="stat-total-records"
          style={{
            borderRadius: 12,
            padding: '14px 20px',
            background: 'rgba(15,23,42,0.38)',
            border: '1px solid rgba(148,163,184,0.18)',
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>总记录数</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalFiltered}</div>
        </div>
        <div
          data-testid="stat-total-points"
          style={{
            borderRadius: 12,
            padding: '14px 20px',
            background: 'rgba(15,23,42,0.38)',
            border: '1px solid rgba(148,163,184,0.18)',
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>总成长值</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
            {totalPoints.toLocaleString()}
          </div>
        </div>
        <div
          data-testid="stat-avg-points"
          style={{
            borderRadius: 12,
            padding: '14px 20px',
            background: 'rgba(15,23,42,0.38)',
            border: '1px solid rgba(148,163,184,0.18)',
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>平均成长值</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
            {totalFiltered > 0 ? Math.round(totalPoints / totalFiltered).toLocaleString() : 0}
          </div>
        </div>
      </div>

      {/* 搜索/筛选工具栏 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          data-testid="search-input"
          type="text"
          placeholder="搜索会员名/手机号/备注…"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            minWidth: 240,
          }}
        />
        <select
          data-testid="source-filter"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as GrowthSource | '');
            setCurrentPage(1);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          <option value="">全部来源</option>
          {(Object.entries(SOURCE_LABEL) as [GrowthSource, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          data-testid="tier-filter"
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          <option value="">全部等级</option>
          <option value="钻石会员">钻石会员</option>
          <option value="黄金会员">黄金会员</option>
          <option value="银卡会员">银卡会员</option>
          <option value="铜卡会员">铜卡会员</option>
          <option value="普通会员">普通会员</option>
        </select>
        <button
          data-testid="search-btn"
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <button
          data-testid="reset-btn"
          onClick={handleReset}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重置
        </button>
      </div>

      {/* 记录数 */}
      <div style={{ marginBottom: 12, fontSize: 14, color: '#6b7280' }}>
        共 <strong data-testid="total-count">{totalFiltered}</strong> 条成长值记录
      </div>

      {/* 成长值表格 */}
      <table
        data-testid="growth-table"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              会员
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              等级
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              来源
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              成长值
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              当前余额
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              备注
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              门店
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              时间
            </th>
          </tr>
        </thead>
        <tbody>
          {pagedRecords.map((record) => (
            <tr
              key={record.id}
              data-testid={`growth-row-${record.id}`}
              style={{ borderBottom: '1px solid #e5e7eb' }}
            >
              <td style={{ padding: '10px 12px', fontSize: 14 }}>
                <div>{record.memberName}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{record.memberPhone}</div>
              </td>
              <td style={{ padding: '10px 12px', fontSize: 14 }}>{record.memberTier}</td>
              <td style={{ padding: '10px 12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    backgroundColor: SOURCE_COLORS[record.source] || '#6b7280',
                  }}
                >
                  {SOURCE_LABEL[record.source]}
                </span>
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: record.points > 0 ? '#10b981' : '#6b7280',
                }}
              >
                {record.points > 0 ? `+${record.points}` : record.points}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 14 }}>{record.balance.toLocaleString()}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>{record.remark}</td>
              <td style={{ padding: '10px 12px', fontSize: 13 }}>{record.storeName}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                {formatDate(record.createdAt)}
              </td>
            </tr>
          ))}
          {pagedRecords.length === 0 && (
            <tr>
              <td
                colSpan={8}
                style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
              >
                暂无成长值记录
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 分页 */}
      <div
        data-testid="pagination"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          fontSize: 14,
        }}
      >
        <button
          data-testid="page-prev"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            backgroundColor: currentPage <= 1 ? '#f3f4f6' : '#fff',
            color: currentPage <= 1 ? '#d1d5db' : '#374151',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          上一页
        </button>
        <span data-testid="page-info">
          第 {currentPage} / {totalPages || 1} 页
        </span>
        <button
          data-testid="page-next"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            backgroundColor: currentPage >= totalPages ? '#f3f4f6' : '#fff',
            color: currentPage >= totalPages ? '#d1d5db' : '#374151',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          下一页
        </button>
        <span style={{ color: '#9ca3af' }}>
          每页 {currentPageSize} 条
        </span>
      </div>
    </div>
  );
}
