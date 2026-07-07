// ── Types ───────────────────────────────────────────────────────────────────

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error' | 'maintenance';
export type DeviceCategory = 'pos' | 'printer' | 'scanner' | 'display' | 'network' | 'camera' | 'iot';
export type DeviceFilter = 'all' | DeviceStatus;

export interface DeviceItem {
  id: string;
  name: string;
  category: DeviceCategory;
  status: DeviceStatus;
  storeId: string;
  storeName: string;
  ip: string;
  lastHeartbeat: string;
  uptime: string;
  firmware: string;
  alerts: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  pos: 'POS 收银机',
  printer: '打印机',
  scanner: '扫码枪',
  display: '显示屏',
  network: '网络设备',
  camera: '摄像头',
  iot: 'IoT 传感器',
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  warning: '警告',
  error: '故障',
  maintenance: '维护中',
};

export const DEVICE_STATUS_COLORS: Record<DeviceStatus, string> = {
  online: '#059669',
  offline: '#6b7280',
  warning: '#d97706',
  error: '#dc2626',
  maintenance: '#7c3aed',
};

export const DEVICE_STATUS_SEVERITY: Record<DeviceStatus, number> = {
  online: 0,
  maintenance: 1,
  warning: 2,
  offline: 3,
  error: 4,
};

export const FILTER_OPTIONS: { value: DeviceFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
  { value: 'warning', label: '警告' },
  { value: 'error', label: '故障' },
  { value: 'maintenance', label: '维护中' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function sortDevicesBySeverity(devices: DeviceItem[]): DeviceItem[] {
  return [...devices].sort(
    (a, b) => DEVICE_STATUS_SEVERITY[b.status] - DEVICE_STATUS_SEVERITY[a.status],
  );
}

export function filterDevices(
  devices: DeviceItem[],
  statusFilter: DeviceFilter,
  searchTerm: string,
): DeviceItem[] {
  let result = devices;
  if (statusFilter !== 'all') {
    result = result.filter((d) => d.status === statusFilter);
  }
  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.storeName.toLowerCase().includes(term) ||
        d.ip.toLowerCase().includes(term) ||
        DEVICE_CATEGORY_LABELS[d.category].toLowerCase().includes(term),
    );
  }
  return result;
}

export function computeStats(devices: DeviceItem[]) {
  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const error = devices.filter((d) => d.status === 'error').length;
  const warning = devices.filter((d) => d.status === 'warning').length;
  const healthRate = total > 0 ? Math.round((online / total) * 100) : 0;
  return { total, online, offline, error, warning, healthRate };
}

// ── Mock Data ───────────────────────────────────────────────────────────────

export function generateMockDevices(count = 25): DeviceItem[] {
  const stores = ['旗舰店', '天河店', '南山店', '福田店', '宝安店'];
  const categories: DeviceCategory[] = ['pos', 'printer', 'scanner', 'display', 'network', 'camera', 'iot'];
  const statuses: DeviceStatus[] = ['online', 'offline', 'warning', 'error', 'maintenance'];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length]!;
    return {
      id: `DEV-${String(i + 1).padStart(4, '0')}`,
      name: `设备 ${i + 1}`,
      category: categories[i % categories.length]!,
      status,
      storeId: `S-${(i % stores.length) + 1}`,
      storeName: stores[i % stores.length]!,
      ip: `192.168.${Math.floor(i / 255)}.${(i % 255) + 1}`,
      lastHeartbeat: new Date(Date.now() - i * 60000).toISOString(),
      uptime: `${Math.floor(Math.random() * 720) + 1}h`,
      firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
      alerts: status === 'error' ? Math.floor(Math.random() * 5) + 1 : 0,
    };
  });
}
