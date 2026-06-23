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
import {
  buildIdentityAccessPermissionDetailHref,
  buildIdentityAccessRoleDetailHref
} from '@m5/types';
import {
  buildIdentityAccessSessionDeepLinks,
  type IdentityAccessSessionDetailDelivery
} from '../../../identity-access-detail-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface IdentityAccessSessionDetailClientProps {
  snapshot: IdentityAccessSessionDetailDelivery;
}

const VALIDATION_LABEL: Record<'allowed' | 'denied', string> = {
  allowed: '已通过',
  denied: '已拒绝'
};

const VALIDATION_VARIANT: Record<'allowed' | 'denied', 'success' | 'danger'> = {
  allowed: 'success',
  denied: 'danger'
};

const CHECK_LABEL: Record<'role' | 'permission' | 'tenant-scope', string> = {
  role: '角色',
  permission: '权限',
  'tenant-scope': '租户作用域'
};

export default function IdentityAccessSessionDetailClient({
  snapshot
}: IdentityAccessSessionDetailClientProps) {
  if (snapshot.notFound) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <SessionBoard snapshot={snapshot} />;
}

function SessionBoard({ snapshot }: { snapshot: IdentityAccessSessionDetailDelivery }) {
  const links = buildIdentityAccessSessionDeepLinks(
    snapshot.session,
    snapshot.query,
    snapshot.matchedActorId ?? undefined
  );
  const { actions } = useDetailActions({
    workspace: 'identity-access',
    detailId: snapshot.session,
    record: snapshot.workspace
  });

  const roleColumns: DataTableColumn<{ name: string }>[] = [
    {
      key: 'role',
      title: 'Role',
      dataKey: 'name',
      render: (item) => (
        <Link
          href={buildIdentityAccessRoleDetailHref(item.name)}
          style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
        >
          {item.name}
        </Link>
      )
    }
  ];

  const permissionColumns: DataTableColumn<{ name: string }>[] = [
    {
      key: 'permission',
      title: 'Permission',
      dataKey: 'name',
      render: (item) => (
        <Link
          href={buildIdentityAccessPermissionDetailHref(item.name)}
          style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
        >
          {item.name}
        </Link>
      )
    }
  ];

  const ctx = snapshot.context;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'identity-access', detailLabel: snapshot.session })}
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
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Identity Session</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {snapshot.session}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>
              {ctx?.actor?.actorName ?? ctx?.actor?.actorId ?? '（未登录）'}
            </div>
          </div>
          <StatusBadge
            label={ctx?.authenticated ? '已认证' : '未认证'}
            variant={ctx?.authenticated ? 'success' : 'danger'}
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
        <PanelCard title="Actor 信息">
          <Row label="Actor ID" value={ctx?.actor?.actorId ?? '—'} />
          <Row label="Actor Name" value={ctx?.actor?.actorName ?? '—'} />
          <Row label="Actor Type" value={ctx?.actor?.actorType ?? '—'} />
          <Row label="Source" value={ctx?.actor?.source ?? '—'} />
          <Row label="Authenticated" value={ctx?.authenticated ? '是' : '否'} />
        </PanelCard>
        <PanelCard title="生效租户">
          <Row label="Tenant" value={ctx?.effectiveTenantId ?? '—'} />
          <Row label="Brand" value={ctx?.effectiveBrandId ?? '—'} />
          <Row label="Store" value={ctx?.effectiveStoreId ?? '—'} />
          <Row label="Market" value={ctx?.effectiveMarketCode ?? '—'} />
        </PanelCard>
        <PanelCard title="校验结果">
          {(['role', 'permission', 'tenant-scope'] as const).map((check) => {
            const result =
              check === 'role'
                ? snapshot.roleValidation
                : check === 'permission'
                  ? snapshot.permissionValidation
                  : snapshot.tenantScopeValidation;
            const label = result ? VALIDATION_LABEL[result.status] : '—';
            const variant = result ? VALIDATION_VARIANT[result.status] : 'neutral';
            return (
              <div
                key={check}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{CHECK_LABEL[check]}</span>
                <StatusBadge label={label} variant={variant} dot size="sm" />
              </div>
            );
          })}
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该会话在审计日志中的留痕（purpose=identity-session:${snapshot.session}）`,
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

      {ctx?.roles && ctx.roles.length > 0 ? (
        <DataTable
          title={`持有角色（${ctx.roles.length}）`}
          columns={roleColumns}
          items={ctx.roles.map((name) => ({ name }))}
          rowKey={(item) => item.name}
          striped
          compact
        />
      ) : null}

      {ctx?.permissions && ctx.permissions.length > 0 ? (
        <DataTable
          title={`持有权限（${ctx.permissions.length}）`}
          columns={permissionColumns}
          items={ctx.permissions.map((name) => ({ name }))}
          rowKey={(item) => item.name}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: IdentityAccessSessionDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'identity-access', detailLabel: snapshot.session || '未找到' })}
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到会话 {snapshot.session || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前身份上下文中没有匹配该 session 的 actor。
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
