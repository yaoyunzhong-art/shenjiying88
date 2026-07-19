import { type NextRequest, NextResponse } from 'next/server';
import { buildLogisticsForwardHeaders } from '../proxy';

const API_BASE = process.env.LOGISTICS_API_BASE || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = request.headers.get('x-tenant-id') || searchParams.get('tenantId') || 'default';
  const status = searchParams.get('status');
  const equipmentId = searchParams.get('equipmentId');

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (equipmentId) qs.set('equipmentId', equipmentId);

  const url = `${API_BASE}/logistics/inspections?${qs.toString()}`;
  const res = await fetch(url, {
    headers: buildLogisticsForwardHeaders(request, {
      tenantId,
      contentType: 'application/json',
    }),
  });
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = request.headers.get('x-tenant-id') || body?.tenantId || 'default';

  const url = `${API_BASE}/logistics/inspections`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildLogisticsForwardHeaders(request, {
      tenantId,
      contentType: 'application/json',
    }),
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: 'create failed' }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
