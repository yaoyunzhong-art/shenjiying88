'use client';

import React from 'react';

// ── Types ──────────────────────────────────────────────
export type PointChangeType =
  | 'earn_purchase'
  | 'earn_signin'
  | 'earn_review'
  | 'earn_referral'
  | 'earn_promotion'
  | 'spend_redeem'
  | 'spend_upgrade'
  | 'expire'
  | 'admin_adjust';

export interface PointRecord {
  id: string;
  type: PointChangeType;
  amount: number;            // positive = earn, negative = spend/expire
  balanceAfter: number;
  description: string;
  createdAt: string;         // ISO-8601
  orderId?: string;
  expiredAt?: string;
}

export interface MemberPointHistoryProps {
  records: PointRecord[];
  totalPoints: number;
  totalEarnedThisMonth: number;
  totalSpentThisMonth: number;
  expiringSoon?: number;     // points expiring within 30 days
  className?: string;
  onFilterChange?: (filter: PointChangeType | 'all') => void;
  activeFilter?: PointChangeType | 'all';
  isLoading?: boolean;
}

// ── Helpers ────────────────────────────────────────────
const TYPE_LABELS: Record<PointChangeType, string> = {
  earn_purchase: '消费获得',
  earn_signin: '签到奖励',
  earn_review: '评价奖励',
  earn_referral: '推荐奖励',
  earn_promotion: '活动奖励',
  spend_redeem: '积分兑换',
  spend_upgrade: '等级升级',
  expire: '过期扣除',
  admin_adjust: '管理员调整',
};

const TYPE_BADGE_COLORS: Record<PointChangeType, string> = {
  earn_purchase: 'bg-green-100 text-green-800',
  earn_signin: 'bg-blue-100 text-blue-800',
  earn_review: 'bg-purple-100 text-purple-800',
  earn_referral: 'bg-pink-100 text-pink-800',
  earn_promotion: 'bg-yellow-100 text-yellow-800',
  spend_redeem: 'bg-red-100 text-red-800',
  spend_upgrade: 'bg-orange-100 text-orange-800',
  expire: 'bg-gray-100 text-gray-800',
  admin_adjust: 'bg-cyan-100 text-cyan-800',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatAmount(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

// ── Sub-components ─────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────
export function MemberPointHistory({
  records,
  totalPoints,
  totalEarnedThisMonth,
  totalSpentThisMonth,
  expiringSoon,
  className = '',
  onFilterChange,
  activeFilter = 'all',
  isLoading = false,
}: MemberPointHistoryProps) {
  const filterOptions: { key: PointChangeType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'earn_purchase', label: '消费获得' },
    { key: 'earn_signin', label: '签到' },
    { key: 'spend_redeem', label: '兑换' },
    { key: 'expire', label: '过期' },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="member-point-history-loading">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-4">
              <div className="h-3 w-16 rounded bg-gray-200" />
              <div className="mt-2 h-6 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const filteredRecords =
    activeFilter === 'all'
      ? records
      : records.filter((r) => r.type === activeFilter);

  return (
    <div className={`space-y-5 ${className}`} data-testid="member-point-history">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="当前积分" value={totalPoints.toLocaleString()} color="#2563eb" />
        <StatCard label="本月获得" value={`+${totalEarnedThisMonth.toLocaleString()}`} color="#16a34a" />
        <StatCard label="本月消耗" value={`-${totalSpentThisMonth.toLocaleString()}`} color="#dc2626" />
        {expiringSoon !== undefined && (
          <StatCard
            label="即将过期"
            value={expiringSoon > 0 ? `${expiringSoon.toLocaleString()} 分` : '无'}
            color={expiringSoon > 0 ? '#ea580c' : '#6b7280'}
          />
        )}
      </div>

      {/* Filters */}
      {onFilterChange && (
        <div className="flex flex-wrap gap-2" data-testid="point-filter-bar">
          {filterOptions.map((opt) => (
            <FilterTab
              key={opt.key}
              label={opt.label}
              active={activeFilter === opt.key}
              onClick={() => onFilterChange(opt.key)}
            />
          ))}
        </div>
      )}

      {/* Record List */}
      <div className="space-y-2" data-testid="point-record-list">
        {filteredRecords.length === 0 && (
          <div className="py-8 text-center text-gray-400">
            {activeFilter === 'all' ? '暂无积分记录' : '该类型暂无记录'}
          </div>
        )}
        {filteredRecords.map((record) => {
          const isEarn = record.amount > 0;
          return (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
              data-testid="point-record-row"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[record.type]}`}
                >
                  {TYPE_LABELS[record.type]}
                </span>
                <div>
                  <p className="text-sm text-gray-800">{record.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(record.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${isEarn ? 'text-green-600' : 'text-red-500'}`}
                  data-testid="point-amount"
                >
                  {formatAmount(record.amount)}
                </p>
                <p className="text-xs text-gray-400">余额 {record.balanceAfter.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MemberPointHistory;
