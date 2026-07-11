'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  Dialog,
  FormField,
  FormSubmitFeedback,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  SubmitButton,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  useToast,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MOCK_MEMBER_CARDS,
  MEMBER_CARD_TYPE_MAP,
  MEMBER_CARD_STATUS_MAP,
  type MemberCard,
} from '../../members-data';

// ---- 样式工具 ----

function cardTypeColor(type: MemberCard['cardType']): string {
  const colors: Record<string, string> = {
    physical: '#86efac',
    virtual: '#93c5fd',
    digital: '#fde68a',
  };
  return colors[type] ?? '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---- 发行卡片类型 ----

interface IssueCardFormData {
  memberId: string;
  memberName: string;
  cardType: MemberCard['cardType'];
  designatedStore: string;
  pointsMultiplier: number;
  notes: string;
}

interface IssueCardErrors {
  memberId?: string;
  memberName?: string;
  cardType?: string;
}

const DEFAULT_ISSUE_FORM: IssueCardFormData = {
  memberId: '',
  memberName: '',
  cardType: 'virtual',
  designatedStore: '',
  pointsMultiplier: 1.0,
  notes: '',
};

// ---- 页面 ----

export default function MemberCardsPage() {
  const router = useRouter();
  const toast = useToast();

  const [cards, setCards] = useState<MemberCard[]>(MOCK_MEMBER_CARDS);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueCardFormData>(DEFAULT_ISSUE_FORM);
  const [issueErrors, setIssueErrors] = useState<IssueCardErrors>({});
  const [isIssuing, setIsIssuing] = useState(false);

  // 搜索
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(
    cards,
    ['cardNumber', 'memberName', 'designatedStore', 'id'] as (keyof MemberCard)[]
  );

  // 筛选
  const typeFiltered = useMemo(
    () => (typeFilter === 'ALL' ? filteredItems : filteredItems.filter((c) => c.cardType === typeFilter)),
    [filteredItems, typeFilter]
  );
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? typeFiltered : typeFiltered.filter((c) => c.status === statusFilter)),
    [typeFiltered, statusFilter]
  );

  const sortableFields = useMemo<(keyof MemberCard)[]>(
    () => ['cardNumber', 'memberName', 'cardType', 'status', 'balance', 'issuedAt', 'expiresAt'] as (keyof MemberCard)[],
    []
  );

  // 列定义
  const columns: DataTableColumn<MemberCard>[] = useMemo(
    () => [
      {
        key: 'cardNumber',
        title: '卡号',
        dataKey: 'cardNumber',
        sortable: true,
        render: (item) => (
          <span
            onClick={() => router.push(`/members/cards/${item.id}`)}
            style={{
              color: '#93c5fd',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {item.cardNumber}
          </span>
        ),
      },
      {
        key: 'memberName',
        title: '持卡人',
        dataKey: 'memberName',
        sortable: true,
        render: (item) => (
          <span
            onClick={() => router.push(`/members/${item.memberId}`)}
            style={{ color: '#e2e8f0', cursor: 'pointer' }}
          >
            {item.memberName}
          </span>
        ),
      },
      {
        key: 'cardType',
        title: '卡类型',
        sortable: true,
        sortValue: (item) => item.cardType,
        render: (item) => {
          const info = MEMBER_CARD_TYPE_MAP[item.cardType];
          return (
            <span
              style={{
                fontSize: 12,
                padding: '2px 10px',
                borderRadius: 999,
                background: `${cardTypeColor(item.cardType)}18`,
                color: cardTypeColor(item.cardType),
                fontWeight: 500,
              }}
            >
              {info.label}
            </span>
          );
        },
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (item) => item.status,
        render: (item) => {
          const s = MEMBER_CARD_STATUS_MAP[item.status];
          return <StatusBadge label={s.label} variant={s.variant as 'success' | 'warning' | 'danger' | 'neutral'} size="sm" />;
        },
      },
      {
        key: 'balance',
        title: '余额',
        dataKey: 'balance',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ fontWeight: 600, color: '#fbbf24' }}>
            {formatCurrency(item.balance)}
          </span>
        ),
      },
      {
        key: 'pointsMultiplier',
        title: '积分倍率',
        dataKey: 'pointsMultiplier',
        sortable: true,
        align: 'center',
        render: (item) => `${item.pointsMultiplier}x`,
      },
      {
        key: 'linkedWechat',
        title: '关联微信',
        align: 'center',
        render: (item) =>
          item.linkedWechat ? (
            <span style={{ color: '#86efac' }}>✓</span>
          ) : (
            <span style={{ color: '#64748b' }}>—</span>
          ),
      },
      {
        key: 'designatedStore',
        title: '指定门店',
        dataKey: 'designatedStore',
        sortable: true,
        render: (item) => item.designatedStore ?? <span style={{ color: '#64748b' }}>不限</span>,
      },
      {
        key: 'expiresAt',
        title: '过期时间',
        dataKey: 'expiresAt',
        sortable: true,
        render: (item) => {
          if (!item.expiresAt) return <span style={{ color: '#64748b' }}>永久</span>;
          return formatDate(item.expiresAt);
        },
      },
    ],
    [router]
  );

  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });
  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);
  const pageItems = pagination.paginate(sortedItems);

  useMemo(() => {
    pagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, statusFilter]);

  // 统计
  const stats = useMemo(
    () => ({
      total: cards.length,
      active: cards.filter((c) => c.status === 'active').length,
      physical: cards.filter((c) => c.cardType === 'physical').length,
      totalBalance: cards.reduce((sum, c) => sum + c.balance, 0),
    }),
    [cards]
  );

  // 验证发行表单
  const validateIssueForm = useCallback((data: IssueCardFormData): IssueCardErrors => {
    const errs: IssueCardErrors = {};
    if (!data.memberId.trim()) errs.memberId = '会员ID不能为空';
    if (!data.memberName.trim()) errs.memberName = '持卡人姓名不能为空';
    return errs;
  }, []);

  // 发行卡片
  const handleIssueCard = useCallback(async () => {
    const errs = validateIssueForm(issueForm);
    if (Object.keys(errs).length > 0) {
      setIssueErrors(errs);
      return;
    }

    setIsIssuing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newCard: MemberCard = {
        id: `card-${String(Date.now()).slice(-5)}`,
        memberId: issueForm.memberId.trim(),
        memberName: issueForm.memberName.trim(),
        cardNumber: `VIP-${String(Date.now()).slice(-8)}`,
        cardType: issueForm.cardType,
        status: 'active',
        issuedAt: new Date().toISOString().slice(0, 10),
        activatedAt: null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        balance: 0,
        pointsMultiplier: issueForm.pointsMultiplier,
        designatedStore: issueForm.designatedStore.trim() || null,
        linkedWechat: false,
        notes: issueForm.notes.trim() || '',
      };

      setCards((prev) => [...prev, newCard]);
      toast.success(`会员卡 ${newCard.cardNumber} 发行成功`);
      setIssueDialogOpen(false);
      setIssueForm(DEFAULT_ISSUE_FORM);
      setIssueErrors({});
    } catch {
      toast.error('卡片发行失败，请稍后重试');
    } finally {
      setIsIssuing(false);
    }
  }, [issueForm, toast, validateIssueForm]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员卡管理"
        subtitle="管理所有会员卡，包括虚拟卡、实体卡和数字卡的发行、状态管理和余额查看"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>卡片总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>正常卡片</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.active}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>实体卡</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#86efac' }}>
              {stats.physical}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总余额</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
              {formatCurrency(stats.totalBalance)}
            </div>
          </div>
        </div>

        {/* 顶部操作栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, maxWidth: 320 }}>
            <SearchFilterInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="搜索卡号、持卡人、门店..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tabs
              items={[
                { key: 'ALL', label: '全部类型', count: cards.length },
                ...(['physical', 'virtual', 'digital'] as const).map((t) => ({
                  key: t,
                  label: MEMBER_CARD_TYPE_MAP[t].label,
                  count: cards.filter((c) => c.cardType === t).length,
                })),
              ]}
              activeKey={typeFilter}
              onChange={setTypeFilter}
              variant="pills"
              size="sm"
            />
            <Tabs
              items={[
                { key: 'ALL', label: '全部状态', count: typeFiltered.length },
                ...(['active', 'frozen', 'expired', 'cancelled'] as const).map((s) => ({
                  key: s,
                  label: MEMBER_CARD_STATUS_MAP[s].label,
                  count: typeFiltered.filter((c) => c.status === s).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={setStatusFilter}
              variant="pills"
              size="sm"
            />
            <SubmitButton
              variant="primary"
              onClick={() => setIssueDialogOpen(true)}
            >
              + 发行新卡
            </SubmitButton>
          </div>
        </div>

        {/* 数据表格 */}
        <DataTable
          title={`会员卡（共 ${sortedItems.length} 张）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </PageShell>

      {/* ---- 发行卡片弹窗 ---- */}
      {issueDialogOpen && (
        <Dialog
          open
          onClose={() => {
            setIssueDialogOpen(false);
            setIssueForm(DEFAULT_ISSUE_FORM);
            setIssueErrors({});
          }}
          title="发行新会员卡"
        >
          <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div data-field="memberId">
                <FormField label="会员 ID" required error={issueErrors.memberId}>
                  <input
                    type="text"
                    value={issueForm.memberId}
                    onChange={(e) => {
                      setIssueForm((prev) => ({ ...prev, memberId: e.target.value }));
                      setIssueErrors((prev) => {
                        const next = { ...prev };
                        delete next.memberId;
                        return next;
                      });
                    }}
                    disabled={isIssuing}
                    style={inputStyle(!!issueErrors.memberId)}
                    placeholder="例如: m001"
                  />
                </FormField>
              </div>
              <div data-field="memberName">
                <FormField label="持卡人姓名" required error={issueErrors.memberName}>
                  <input
                    type="text"
                    value={issueForm.memberName}
                    onChange={(e) => {
                      setIssueForm((prev) => ({ ...prev, memberName: e.target.value }));
                      setIssueErrors((prev) => {
                        const next = { ...prev };
                        delete next.memberName;
                        return next;
                      });
                    }}
                    disabled={isIssuing}
                    style={inputStyle(!!issueErrors.memberName)}
                    placeholder="例如: 张三"
                  />
                </FormField>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <FormField label="卡片类型">
                <select
                  value={issueForm.cardType}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, cardType: e.target.value as MemberCard['cardType'] }))}
                  disabled={isIssuing}
                  style={{ ...inputStyle(false), minHeight: 40 }}
                >
                  <option value="virtual">虚拟卡</option>
                  <option value="physical">实体卡</option>
                  <option value="digital">数字卡</option>
                </select>
              </FormField>
              <FormField label="积分倍率">
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={issueForm.pointsMultiplier}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, pointsMultiplier: Number(e.target.value) }))}
                  disabled={isIssuing}
                  style={inputStyle(false)}
                />
              </FormField>
            </div>
            <div>
              <FormField label="指定门店" helper="选填，不填则不限门店">
                <input
                  type="text"
                  value={issueForm.designatedStore}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, designatedStore: e.target.value }))}
                  disabled={isIssuing}
                  style={inputStyle(false)}
                  placeholder="例如: 朝阳大悦城旗舰店"
                />
              </FormField>
            </div>
            <div>
              <FormField label="备注" helper="选填">
                <textarea
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={isIssuing}
                  style={{ ...inputStyle(false), minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="输入备注信息"
                />
              </FormField>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              onClick={() => {
                setIssueDialogOpen(false);
                setIssueForm(DEFAULT_ISSUE_FORM);
                setIssueErrors({});
              }}
              style={dialogBtnStyle('secondary')}
            >
              取消
            </button>
            <SubmitButton
              loading={isIssuing}
              onClick={() => void handleIssueCard()}
              variant="primary"
            >
              {isIssuing ? '发行中...' : '确认发行'}
            </SubmitButton>
          </div>
        </Dialog>
      )}
    </main>
  );
}

// ---- 样式 ----

function dialogBtnStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  return {
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    border: '1px solid transparent',
    background: variant === 'primary'
      ? 'rgba(59,130,246,0.16)'
      : 'rgba(148,163,184,0.1)',
    borderColor: variant === 'primary'
      ? 'rgba(96,165,250,0.3)'
      : 'rgba(148,163,184,0.2)',
    color: variant === 'primary' ? '#dbeafe' : '#94a3b8',
  };
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
