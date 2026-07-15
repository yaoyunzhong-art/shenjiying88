import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.LOGISTICS_API_BASE || 'http://localhost:3001';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const tenantId = request.headers.get('x-tenant-id') || body?.tenantId || 'default';
  const id = params.id;

  const url = `${API_BASE}/logistics/clean-schedules/${encodeURIComponent(id)}/assign-area`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: 'assign area failed' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
