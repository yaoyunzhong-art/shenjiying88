// P-31 租户管理代理层 - 租户列表/统计/操作
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, createProxyHandler } from '../_proxy/utils';

const TENANT_API = `${API_BASE_URL}/tenant`;

// GET /api/tenants - 获取租户列表（通过 lifecycle 查询活跃/暂停等）
export const GET = createProxyHandler(
  `${TENANT_API}/lifecycle/active`,
  'GET',
  ['status', 'plan', 'page', 'limit', 'search']
);

// POST /api/tenants - 初始化租户生命周期
export const POST = createProxyHandler(`${TENANT_API}/lifecycle/init`, 'POST');

// ─── 租户状态操作子路由 ───

// POST /api/tenants/suspend - 暂停租户
export async function POST_SUSPEND(request: NextRequest) {
  const body = await request.json();
  const { tenantId, reason, actorId, note } = body;
  const url = `${TENANT_API}/lifecycle/suspend`;
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId, reason, actorId, note }),
      cache: 'no-store',
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'proxy failed' },
      { status: 502 },
    );
  }
}

// POST /api/tenants/reactivate - 恢复租户
export async function POST_REACTIVATE(request: NextRequest) {
  const body = await request.json();
  const { tenantId, actorId, note } = body;
  const url = `${TENANT_API}/lifecycle/reactivate`;
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId, actorId, note }),
      cache: 'no-store',
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'proxy failed' },
      { status: 502 },
    );
  }
}

// GET /api/tenants/stats - 租户统计
export async function GET_STATS() {
  try {
    const [activeRes, suspendedRes] = await Promise.all([
      fetch(`${TENANT_API}/lifecycle/active`, { cache: 'no-store' }),
      fetch(`${TENANT_API}/lifecycle/suspended`, { cache: 'no-store' }),
    ]);
    const active = await activeRes.json();
    const suspended = await suspendedRes.json();
    return NextResponse.json({
      data: {
        total: (active.data?.length ?? 0) + (suspended.data?.length ?? 0),
        active: active.data?.length ?? 0,
        suspended: suspended.data?.length ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'proxy failed' },
      { status: 502 },
    );
  }
}
