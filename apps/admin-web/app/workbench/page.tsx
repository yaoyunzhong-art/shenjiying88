import Link from 'next/link';
import { Suspense } from 'react';
import { WorkspaceBreadcrumb, DetailClosureBar, LoadingSkeleton, StatCard, Badge, type BadgeVariant } from '@m5/ui';
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../components/detail-workspace-registry';

/**
 * Workbench listing page — presents all 10 role workbenches grouped into three
 * functional categories: 门店角色 (in-store), 总部管理 (HQ), 运营支持 (ops/support).
 */
interface RoleCategory {
  key: string;
  title: string;
  roles: string[];
}

const roleCategories: RoleCategory[] = [
  { key: 'store', title: '🏪 门店现场角色', roles: ['STORE_MANAGER', 'GUIDE', 'CASHIER', 'WAREHOUSE', 'COACH'] },
  { key: 'hq', title: '🏢 总部管理角色', roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER'] },
  { key: 'ops', title: '⚙️ 运营支持角色', roles: ['OPERATIONS', 'FINANCE'] },
];

const roleBadgeMap: Record<string, BadgeVariant> = {
  PC: 'default',
  PAD: 'warning',
};

export default async function WorkbenchListPage() {
  const snapshot = await getAdminWorkbenchConsumerSnapshot();
  const { workbenches, governance } = snapshot;

  const workbenchByRole = new Map(workbenches.map((wb) => [wb.role, wb]));

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'workbench', detailLabel: '工作台目录' })}
      />

      <section
        style={{
          borderRadius: 24,
          padding: 28,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        }}
      >
        <h1 style={{ marginBottom: 8 }}>工作台目录</h1>
        <p style={{ marginTop: 0, color: '#cbd5e1', marginBottom: 24 }}>
          选择角色工作台，进入对应的业务管理模块。
        </p>

        {roleCategories.map((category) => {
          const visible = category.roles
            .map((role) => workbenchByRole.get(role))
            .filter(Boolean);

          if (visible.length === 0) return null;

          return (
            <div key={category.key} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>{category.title}</h2>
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                }}
              >
                {visible.map((wb) => {
                  if (!wb) return null;
                  return (
                    <Link
                      key={wb.role}
                      href={`/workbench/${wb.role.toLowerCase()}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <article
                        style={{
                          borderRadius: 16,
                          padding: 20,
                          background: 'rgba(15, 23, 42, 0.38)',
                          border: '1px solid rgba(148,163,184,0.18)',
                          transition: 'border-color .2s, background .2s',
                          height: '100%',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{wb.title}</div>
                          <Badge variant={roleBadgeMap[wb.channel] ?? 'default'}>
                            {wb.channel}
                          </Badge>
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: 14, marginBottom: 14 }}>
                          {wb.description}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          {wb.navItems.slice(0, 4).map((item) => (
                            <span
                              key={item.key}
                              style={{
                                fontSize: 12,
                                padding: '2px 10px',
                                borderRadius: 20,
                                background: 'rgba(148,163,184,0.15)',
                                color: '#94a3b8',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.label}
                            </span>
                          ))}
                          {wb.navItems.length > 4 && (
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              +{wb.navItems.length - 4}
                            </span>
                          )}
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 12 }}>
          <StatCard
            label="已接入工作台"
            value={workbenches.length}
            trend={{ value: `${roleCategories.reduce((acc, c) => acc + c.roles.length, 0)} 角色`, positive: true }}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>治理快照</div>
          <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>
            <span>待审批 {governance.summary.approvalsPending} / 高风险审计 {governance.summary.highRiskAudits} / top risks {governance.topRisks.length}</span>
            <br />
            <span>
              triage：{governance.alerts.slice(0, 3).map((a) => a.code).join(' / ')}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            borderRadius: 12,
            padding: 14,
            background: 'rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          交付模式：{snapshot.deliveryMode === 'api' ? '✨ 实时 API' : '📦 fallback 数据'}
        </div>
      </section>

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'workbench',
          detailId: '',
          extraLinks: [
            {
              key: 'pad',
              title: 'Pad 版工作台',
              subtitle: '查看 Pad 端 PWA 入口',
              href: '/pad',
            },
          ],
        })}
      />
    </main>
  );
}
