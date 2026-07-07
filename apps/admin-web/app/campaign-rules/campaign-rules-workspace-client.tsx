'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  DataTable,
  Pagination,
  SearchFilterInput,
  Select,
  StatusBadge,
  type DataTableColumn,
} from '@m5/ui';
import type { CampaignDecisionRule, CampaignRulesWorkspace } from '../campaign-rules-view-model';

interface CampaignRulesWorkspaceClientProps {
  workspace: CampaignRulesWorkspace;
}

const STATUS_LABELS: Record<string, string> = {
  passed: '启用',
  failed: '停用',
  warning: '待审',
  pending: '草稿',
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'passed', label: '启用' },
  { value: 'failed', label: '停用' },
  { value: 'warning', label: '待审' },
  { value: 'pending', label: '草稿' },
];

const columns: DataTableColumn<CampaignDecisionRule>[] = [
  { key: 'name', header: '规则名称', sortable: true },
  { key: 'description', header: '描述' },
  {
    key: 'status',
    header: '状态',
    render: (row) => {
      const status = row.status as string;
      return (
        <Badge variant={status === 'passed' ? 'success' : status === 'failed' ? 'error' : status === 'warning' ? 'warning' : 'neutral'}>
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      );
    },
  },
  { key: 'priority', header: '优先级', sortable: true },
  { key: 'hitCount', header: '命中次数', sortable: true },
  {
    key: 'enabled',
    header: '启用',
    render: (row) => (
      <StatusBadge
        label={row.enabled ? '启用' : '停用'}
        variant={row.enabled ? 'success' : 'neutral'}
      />
    ),
  },
  { key: 'updatedAt', header: '更新时间', sortable: true },
];

export default function CampaignRulesWorkspaceClient({
  workspace,
}: CampaignRulesWorkspaceClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRules = useMemo(() => {
    let rules = workspace.rules;

    if (search.trim()) {
      const q = search.toLowerCase();
      rules = rules.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      rules = rules.filter((r) => (r.status as string) === statusFilter);
    }

    return rules;
  }, [workspace.rules, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRules = filteredRules.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchFilterInput
            placeholder="搜索规则名称或描述…"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={handleStatusFilter}
          placeholder="全部状态"
        />
      </div>

      <DataTable
        columns={columns}
        data={pagedRules}
        emptyText="没有找到符合条件的营销规则"
        rowKey={(row) => row.id}
      />

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={filteredRules.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
