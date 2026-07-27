'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { MemberTiersPageSnapshot } from './member-tiers-data';

export default function MemberTiersClient({ snapshot }: { snapshot: MemberTiersPageSnapshot }) {
  const router = useRouter();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTiers = useMemo(
    () =>
      snapshot.tiers.filter((item) =>
        [item.name, item.key, item.benefits.join(' ')].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, snapshot.tiers]
  );

  

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="等级列表" />
      <PageShell title="会员等级列表" subtitle="查看等级配置、积分门槛和会员覆盖。">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索等级名称、标识或权益" style={{ ...inputStyle(false), maxWidth: 320 }} />
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </SubmitButton>
          <SubmitButton variant="primary" onClick={() => router.push('/members/tiers/new')}>
            新建等级
          </SubmitButton>
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>等级</th>
              <th style={thStyle}>标识</th>
              <th style={thStyle}>积分区间</th>
              <th style={thStyle}>会员数</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiers.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.key}</td>
                <td style={tdStyle}>{item.minPoints.toLocaleString()} - {item.maxPoints.toLocaleString()}</td>
                <td style={tdStyle}>{item.memberCount.toLocaleString()}</td>
                <td style={tdStyle}>
                  <SubmitButton variant="secondary" onClick={() => router.push(`/members/tiers/${item.key}`)}>
                    查看详情
                  </SubmitButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageShell>
    </div>
  );
}

const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: CSSProperties = { textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.18)' };
const tdStyle: CSSProperties = { padding: '12px', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
