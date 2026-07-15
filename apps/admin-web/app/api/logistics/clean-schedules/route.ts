import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.LOGISTICS_API_BASE || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = request.headers.get('x-tenant-id') || searchParams.get('tenantId') || 'default';
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assigneeId');

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (assigneeId) qs.set('assigneeId', assigneeId);

  const url = `${API_BASE}/logistics/clean-schedules?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = request.headers.get('x-tenant-id') || body?.tenantId || 'default';

  const url = `${API_BASE}/logistics/clean-schedules`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: 'create failed' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
