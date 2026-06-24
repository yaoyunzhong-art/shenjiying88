'use client';

import Link from 'next/link';
import {
  StatusBadge,
  type DataTableColumn,
  DataTable,
  DetailActionBar,
  DetailClosureBar,
  WorkspaceBreadcrumb,
  type DetailClosureLink
} from '@m5/ui';
import { buildIdentityAccessRoleDetailHref } from '@m5/types';
import {
  buildIdentityAccessRoleDeepLinks,
  type IdentityAccessRoleDetailDelivery
} from '../../../identity-access-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface IdentityAccessRoleDetailClientProps {
  snapshot: IdentityAccessRoleDetailDelivery;
}

const VALIDATION_LABEL: Record<'allowed' | 'denied', string> = {
  allowed: '已通过',
  denied: '已拒绝'
};

export default function IdentityAccessRoleDetailClient({
  snapshot
}: IdentityAccessRoleDetailClientProps) {
  if (snapshot.notFound) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <RoleBoard snapshot={snapshot} />;
}

function RoleBoard({ snapshot }: { snapshot: IdentityAccessRoleDetailDelivery }) {
  const links = buildIdentityAccessRoleDeepLinks(
    snapshot.role,
    snapshot.query,
    snapshot.workspace.context.actor?.actorId
  );
  const { actions } = useDetailActions({
    workspace: 'identity-access',
    detailId: snapshot.role,
    record: snapshot.workspace
  });

  const roleColumns: DataTableColumn<{ role: string; active: boolean }>[] = [
    {
      key: 'role',
      title: 'Role',
      dataKey: 'role',
      render: (item) => (
        <Link
          href={buildIdentityAccessRoleDetailHref(item.role)}
          style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
        >
          {item.role}
        </Link>
      )
    },
    {
      key: 'active',
      title: '持有',
      render: (item) => (
        <StatusBadge
          label={item.active ? '当前 actor 持有' : '当前 actor 未持有'}
          variant={item.active ? 'success' : 'neutral'}
          dot
          size="sm"
        />
      )
    }
  ];

  const validation = snapshot.validation;
  const validationLabel = validation ? VALIDATION_LABEL[validation.status] : '—';
  const enforcement = validation?.authorization?.enforcedBy ?? [];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'identity-access', detailLabel: snapshot.role })}
      />
      <div
        style={{
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: 12,
          padding: 18,
          background: 'rgba(15,23,42,0.6)',
          color: '#e2e8f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Identity Role</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {snapshot.role}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>
              当前 actor {snapshot.workspace.context.actor?.actorId ?? '（未登录）'}
            </div>
          </div>
          <StatusBadge
            label={snapshot.hasRole ? '当前 actor 已持有' : '当前 actor 未持有'}
            variant={snapshot.hasRole ? 'success' : 'neutral'}
            dot
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
          Delivery: {snapshot.deliveryMode} · 生成时间 {new Date(snapshot.generatedAt).toLocaleString('zh-CN')}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        <PanelCard title="角色校验">
          <Row label="Role" value={snapshot.role} />
          <Row label="Status" value={validationLabel} />
          <Row label="Check" value={validation?.check ?? '—'} />
          <Row label="Target Tenant" value={validation?.targetTenantId ?? '—'} />
          <Row label="Enforcement" value={enforcement.length > 0 ? enforcement.join(', ') : '—'} />
          <Row label="Permission Matched" value={validation?.authorization?.permissionMatched === undefined ? '—' : validation.authorization.permissionMatched ? '是' : '否'} />
          <Row label="Tenant Scope Matched" value={validation?.authorization?.tenantScopeMatched === undefined ? '—' : validation.authorization.tenantScopeMatched ? '是' : '否'} />
        </PanelCard>
        <PanelCard title="当前 actor 上下文">
          <Row label="Authenticated" value={snapshot.workspace.context.authenticated ? '是' : '否'} />
          <Row label="Effective Tenant" value={snapshot.workspace.context.effectiveTenantId ?? '—'} />
          <Row label="Effective Brand" value={snapshot.workspace.context.effectiveBrandId ?? '—'} />
          <Row label="Effective Store" value={snapshot.workspace.context.effectiveStoreId ?? '—'} />
          <Row label="Effective Market" value={snapshot.workspace.context.effectiveMarketCode ?? '—'} />
          <Row label="Roles Count" value={`${snapshot.actorRoles.length}`} />
          <Row label="Permissions Count" value={`${snapshot.actorPermissions.length}`} />
        </PanelCard>
        <PanelCard title="查询上下文">
          <Row label="Tenant" value={snapshot.query.tenantId ?? '—'} />
          <Row label="Brand" value={snapshot.query.brandId ?? '—'} />
          <Row label="Store" value={snapshot.query.storeId ?? '—'} />
          <Row label="Market" value={snapshot.query.marketCode ?? '—'} />
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该角色在审计日志中的留痕（purpose=identity-role:${snapshot.role}）`,
            context: 'focused source+purpose',
            href: links.auditHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: '回到 Foundation 总览查看 identity-access 模块健康度',
            context: '聚焦模块 drilldown',
            href: links.foundationHref
          },
          {
            key: 'workspace',
            title: '身份访问工作台',
            subtitle: '返回身份访问总览，切换租户/品牌/门店维度',
            context: '回到总览',
            href: links.workspaceHref
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />

      {snapshot.actorRoles.length > 0 ? (
        <DataTable
          title={`当前 actor 的所有角色（${snapshot.actorRoles.length}）`}
          columns={roleColumns}
          items={snapshot.actorRoles.map((role) => ({ role, active: true }))}
          rowKey={(item) => item.role}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: IdentityAccessRoleDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'identity-access', detailLabel: snapshot.role || '未找到' })}
      />
      <div
        style={{
          border: '1px solid rgba(248,113,113,0.4)',
          borderRadius: 12,
          padding: 18,
          background: 'rgba(127,29,29,0.25)',
          color: '#fecaca'
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到角色 {snapshot.role || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前身份上下文中没有匹配该 role 的条目。
        </div>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回身份访问工作台',
            subtitle: '查看所有角色与权限',
            href: '/identity-access'
          }
        ]}
      />
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 16,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#cbd5f5', fontFamily: 'monospace', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// DeepLinkCard has been removed in favor of <DetailClosureBar> from @m5/ui.
