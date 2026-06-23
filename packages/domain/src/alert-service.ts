import type { FoundationAlert, FoundationAlertFilter, PaginatedResponse } from './service-types';

// Mock alert data for development
const MOCK_ALERTS: FoundationAlert[] = Array.from({ length: 25 }, (_, i) => ({
  id: `alert-${i + 1}`,
  title: `Alert ${i + 1}: ${['CPU usage spike', 'Memory threshold exceeded', 'Disk space low', 'Service timeout', 'Connection refused'][i % 5]}`,
  description: `Detailed description for alert ${i + 1}. This alert was triggered by monitoring system.`,
  severity: (['info', 'warning', 'error', 'error', 'warning'][i % 5]) as FoundationAlert['severity'],
  status: (['open', 'acknowledged', 'resolved', 'open', 'acknowledged'][i % 5]) as FoundationAlert['status'],
  source: (['monitoring', 'logging', 'tracing', 'security', 'infrastructure'] as const)[i % 5]!, 
  owner: i % 3 === 0 ? undefined : `user-${i % 5}`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  updatedAt: new Date(Date.now() - i * 1800000).toISOString(),
}));

export async function fetchAlerts(
  filter?: FoundationAlertFilter & { page?: number; pageSize?: number }
): Promise<PaginatedResponse<FoundationAlert>> {
  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 10;

  let filtered = [...MOCK_ALERTS];

  if (filter?.severity) {
    const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
    filtered = filtered.filter((a) => severities.includes(a.severity));
  }
  if (filter?.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    filtered = filtered.filter((a) => statuses.includes(a.status));
  }
  if (filter?.source) {
    filtered = filtered.filter((a) => a.source === filter.source);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function fetchAlertById(id: string): Promise<FoundationAlert | undefined> {
  return MOCK_ALERTS.find((a) => a.id === id);
}

export async function acknowledgeAlert(id: string): Promise<FoundationAlert> {
  const alert = MOCK_ALERTS.find((a) => a.id === id);
  if (!alert) throw new Error(`Alert ${id} not found`);
  return { ...alert, status: 'acknowledged', updatedAt: new Date().toISOString() };
}

export async function resolveAlert(id: string): Promise<FoundationAlert> {
  const alert = MOCK_ALERTS.find((a) => a.id === id);
  if (!alert) throw new Error(`Alert ${id} not found`);
  return { ...alert, status: 'resolved', updatedAt: new Date().toISOString() };
}
