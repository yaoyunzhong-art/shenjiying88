'use client';

/**
 * 门店设备管理详情页 - Store Device Management
 * 角色: 🔧安监管理 / 🎮导玩员
 * 功能: 查看门店设备清单、状态监控、维护记录、远程操作
 */

import { useState, useMemo, useCallback, use } from 'react';

import {
  DataTable,
  DetailActionBar,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  Tabs,
  FilterChips,
  usePagination,
  useSearchFilter,
  useSortedItems,
  CopyToClipboard,
  InfoRow,
  StatCard,
  DetailClosureBar,
  WorkspaceBreadcrumb,
  type FilterChip,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';
import { useEffect } from 'react';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

// ---- 类型定义 ----

type DeviceType = 'arcade' | 'pos' | 'screen' | 'printer' | 'router' | 'camera' | 'sensor' | 'server' | 'tablet' | 'other';
type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error' | 'pending';
type MaintenancePriority = 'critical' | 'high' | 'medium' | 'low';

interface DeviceItem {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  serialNumber: string;
  status: DeviceStatus;
  ipAddress: string;
  location: string;
  installDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  warrantyExpiry: string;
  uptime: string;
  temperature: number;
  errorCount: number;
  maintenancePriority: MaintenancePriority;
  notes: string;
  firmwareVersion: string;
  lastPing: string;
}

interface MaintenanceRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'inspection' | 'repair' | 'replacement' | 'upgrade' | 'cleaning';
  date: string;
  technician: string;
  cost: number;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  description: string;
  parts: string[];
  nextDate: string | null;
}

// ---- 常量 ----

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  arcade: '游戏机',
  pos: '收银机',
  screen: '显示屏',
  printer: '打印机',
  router: '路由器',
  camera: '摄像头',
  sensor: '传感器',
  server: '服务器',
  tablet: '平板',
  other: '其他',
};

const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  arcade: '🕹️',
  pos: '💳',
  screen: '🖥️',
  printer: '🖨️',
  router: '📡',
  camera: '📷',
  sensor: '🔍',
  server: '🖥️',
  tablet: '📱',
  other: '🔧',
};

const DEVICE_STATUS_MAP: Record<DeviceStatus, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' | 'info' }> = {
  online: { label: '在线', variant: 'success' },
  offline: { label: '离线', variant: 'neutral' },
  maintenance: { label: '维护中', variant: 'warning' },
  error: { label: '故障', variant: 'danger' },
  pending: { label: '待安装', variant: 'info' },
};

const MAINTENANCE_PRIORITY_MAP: Record<MaintenancePriority, { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  critical: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'neutral' },
  low: { label: '低', variant: 'success' },
};

const MAINTENANCE_TYPE_LABELS: Record<MaintenanceRecord['type'], string> = {
  inspection: '巡检',
  repair: '维修',
  replacement: '更换',
  upgrade: '升级',
  cleaning: '清洁',
};

const MAINTENANCE_STATUS_MAP: Record<MaintenanceRecord['status'], { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }> = {
  completed: { label: '已完成', variant: 'success' },
  'in-progress': { label: '进行中', variant: 'warning' },
  scheduled: { label: '已计划', variant: 'neutral' },
  cancelled: { label: '已取消', variant: 'danger' },
};

// ---- Mock 数据生成 ----

function generateDevices(): DeviceItem[] {
  const locations = ['一楼大厅', '二楼夹层', '收银台', '监控室', '服务器间', '入口处', '休息区', '走廊', '仓库'];
  const deviceTemplates: Array<{ name: string; type: DeviceType; model: string }> = [
    { name: '收银终端', type: 'pos', model: 'POS-9000X' },
    { name: '主显示屏', type: 'screen', model: 'LED-75HDR' },
    { name: '街机-拳皇', type: 'arcade', model: 'ARC-KOF-XV' },
    { name: '街机-赛车', type: 'arcade', model: 'ARC-RACING-3' },
    { name: '街机-射击', type: 'arcade', model: 'ARC-SHOOTING-V2' },
    { name: '篮球机', type: 'arcade', model: 'ARC-HOOP-MAX' },
    { name: '娃娃机(大)', type: 'arcade', model: 'CLAW-LARGE-V3' },
    { name: '娃娃机(小)', type: 'arcade', model: 'CLAW-MINI-V2' },
    { name: '打印机', type: 'printer', model: 'PRN-THERMAL-300' },
    { name: '主路由器', type: 'router', model: 'RT-AC8900' },
    { name: '监控摄像头1', type: 'camera', model: 'CAM-4K-360' },
    { name: '监控摄像头2', type: 'camera', model: 'CAM-4K-360' },
    { name: '监控摄像头3', type: 'camera', model: 'CAM-4K-360' },
    { name: '温湿度传感器', type: 'sensor', model: 'SNS-TEMP-HUM' },
    { name: '客流传感器', type: 'sensor', model: 'SNS-FLOW-V2' },
    { name: '服务器', type: 'server', model: 'SRV-EDGE-128' },
    { name: '收银平板', type: 'tablet', model: 'TAB-POS-PRO' },
    { name: '导览屏', type: 'screen', model: 'LED-55INFO' },
    { name: '门禁控制器', type: 'other', model: 'ACC-CONTROL-M2' },
    { name: '空气质量传感器', type: 'sensor', model: 'SNS-AIR-Q5' },
  ];

  const statuses: DeviceStatus[] = ['online', 'online', 'online', 'online', 'online', 'offline', 'maintenance', 'error', 'online', 'online', 'pending'];

  return deviceTemplates.map((tpl, idx) => {
    const installOffset = Math.floor(Math.random() * 365);
    const installDate = new Date(2025, 0, 1 + installOffset);
    const lastMaintOffset = Math.floor(Math.random() * 90);
    const lastMaintenance = new Date(Date.now() - lastMaintOffset * 86400000);
    const nextMaintOffset = 30 + Math.floor(Math.random() * 60);
    const nextMaintenance = new Date(Date.now() + nextMaintOffset * 86400000);
    const warrantyOffset = 180 + Math.floor(Math.random() * 365);
    const warrantyExpiry = new Date(Date.now() + warrantyOffset * 86400000);
    const uptimeHours = Math.floor(Math.random() * 720);
    const temperature = 35 + Math.floor(Math.random() * 25);
    const priorities: MaintenancePriority[] = ['critical', 'high', 'medium', 'low'];

    return {
      id: `DEV-${String(idx + 1).padStart(3, '0')}`,
      name: tpl.name,
      type: tpl.type,
      model: tpl.model,
      serialNumber: `SN-${tpl.type.toUpperCase()}-${String(1000 + idx)}`,
      status: statuses[idx % statuses.length],
      ipAddress: `192.168.1.${100 + idx}`,
      location: locations[idx % locations.length]!,
      installDate: installDate.toISOString().split('T')[0],
      lastMaintenance: lastMaintenance.toISOString().split('T')[0],
      nextMaintenance: nextMaintenance.toISOString().split('T')[0],
      warrantyExpiry: warrantyExpiry.toISOString().split('T')[0],
      uptime: `${uptimeHours}h ${Math.floor(Math.random() * 60)}m`,
      temperature: temperature,
      errorCount: statuses[idx % statuses.length] === 'error' ? 3 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 3),
      maintenancePriority: statuses[idx % statuses.length] === 'error' ? 'critical' : priorities[Math.floor(Math.random() * 4)],
      notes: '',
      firmwareVersion: `v2.${1 + Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
      lastPing: new Date(Date.now() - Math.floor(Math.random() * 300) * 1000).toISOString(),
    };
  });
}

function generateMaintenanceRecords(deviceIds: string[]): MaintenanceRecord[] {
  const types: MaintenanceRecord['type'][] = ['inspection', 'repair', 'replacement', 'upgrade', 'cleaning'];
  const statuses: MaintenanceRecord['status'][] = ['completed', 'completed', 'completed', 'completed', 'in-progress', 'scheduled'];
  const technicians = ['张三', '李四', '王五', '赵六', '陈七', '设备供应商'];
  const partsList = ['螺丝包', '电源适配器', '散热风扇', '显示屏面板', '按键模组', '主板', '传感器模块', '线缆套装'];
  const records: MaintenanceRecord[] = [];

  for (let i = 0; i < 45; i++) {
    const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
    const device = generateDevicesStatic()[deviceIds.indexOf(deviceId)] as DeviceItem | undefined;
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(Date.now() - daysAgo * 86400000);
    const nextDays = Math.random() > 0.5 ? Math.floor(Math.random() * 60) : null;

    records.push({
      id: `MR-${String(i + 1).padStart(3, '0')}`,
      deviceId,
      deviceName: device?.name ?? deviceId,
      type: types[Math.floor(Math.random() * types.length)]!,
      date: date.toISOString().split('T')[0],
      technician: technicians[Math.floor(Math.random() * technicians.length)]!,
      cost: Math.floor(Math.random() * 5000) + 100,
      status: statuses[Math.floor(Math.random() * statuses.length)]!,
      description: `${MAINTENANCE_TYPE_LABELS[types[Math.floor(Math.random() * types.length)]!]}操作 - 例行检查`,
      parts: [partsList[Math.floor(Math.random() * partsList.length)]!],
      nextDate: nextDays ? new Date(Date.now() + nextDays * 86400000).toISOString().split('T')[0] : null,
    });
  }

  // Sort by date desc
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

// Cache for device list
let deviceList: DeviceItem[] | null = null;
let maintenanceList: MaintenanceRecord[] | null = null;

function generateDevicesStatic(): DeviceItem[] {
  if (!deviceList) deviceList = generateDevices();
  return deviceList;
}

function generateMaintenanceStatic(): MaintenanceRecord[] {
  if (!maintenanceList) maintenanceList = generateMaintenanceRecords(generateDevicesStatic().map(d => d.id));
  return maintenanceList;
}

// ---- 列定义 ----

function buildDeviceColumns(
  onRowClick: (item: DeviceItem) => void
): DataTableColumn<DeviceItem>[] {
  return [
    {
      key: 'name',
      title: '设备名称',
      dataKey: 'name',
      sortable: true,
      render: (item: DeviceItem) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {DEVICE_TYPE_ICONS[item.type]} {item.name}
        </span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item: DeviceItem) => item.type,
      render: (item: DeviceItem) => DEVICE_TYPE_LABELS[item.type],
    },
    {
      key: 'model',
      title: '型号',
      dataKey: 'model',
      sortable: true,
    },
    {
      key: 'serialNumber',
      title: '序列号',
      dataKey: 'serialNumber',
      render: (item: DeviceItem) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {item.serialNumber}
          <CopyToClipboard text={item.serialNumber} size="sm" iconOnly />
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: DeviceItem) => item.status,
      render: (item: DeviceItem) => {
        const s = DEVICE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'location',
      title: '位置',
      dataKey: 'location',
      sortable: true,
    },
    {
      key: 'temperature',
      title: '温度(°C)',
      dataKey: 'temperature',
      sortable: true,
      align: 'right',
      render: (item: DeviceItem) => (
        <span style={{ color: item.temperature > 55 ? '#ef4444' : item.temperature > 45 ? '#eab308' : '#22c55e' }}>
          {item.temperature}°C
        </span>
      ),
    },
    {
      key: 'uptime',
      title: '运行时长',
      dataKey: 'uptime',
      sortable: true,
      align: 'right',
    },
    {
      key: 'nextMaintenance',
      title: '下次维护',
      dataKey: 'nextMaintenance',
      sortable: true,
      render: (item: DeviceItem) => {
        const days = Math.ceil((new Date(item.nextMaintenance).getTime() - Date.now()) / 86400000);
        const isOverdue = days < 0;
        return (
          <span style={{ color: isOverdue ? '#ef4444' : days < 7 ? '#eab308' : '#94a3b8' }}>
            {item.nextMaintenance}
            {isOverdue ? ' (已逾期)' : days < 7 ? ` (${days}天后)` : ''}
          </span>
        );
      },
    },
    {
      key: 'maintenancePriority',
      title: '维护优先级',
      sortable: true,
      sortValue: (item: DeviceItem) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[item.maintenancePriority];
      },
      render: (item: DeviceItem) => {
        const p = MAINTENANCE_PRIORITY_MAP[item.maintenancePriority];
        return <StatusBadge label={p.label} variant={p.variant} size="sm" />;
      },
    },
    {
      key: 'errorCount',
      title: '错误次数',
      dataKey: 'errorCount',
      sortable: true,
      align: 'right',
      render: (item: DeviceItem) => (
        <span style={{ color: item.errorCount > 5 ? '#ef4444' : item.errorCount > 0 ? '#eab308' : '#22c55e' }}>
          {item.errorCount}
        </span>
      ),
    },
  ];
}

function buildMaintenanceColumns(): DataTableColumn<MaintenanceRecord>[] {
  return [
    {
      key: 'date',
      title: '日期',
      dataKey: 'date',
      sortable: true,
    },
    {
      key: 'deviceName',
      title: '设备',
      dataKey: 'deviceName',
      sortable: true,
    },
    {
      key: 'type',
      title: '类型',
      sortable: true,
      sortValue: (item: MaintenanceRecord) => item.type,
      render: (item: MaintenanceRecord) => MAINTENANCE_TYPE_LABELS[item.type],
    },
    {
      key: 'technician',
      title: '技术员',
      dataKey: 'technician',
      sortable: true,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      sortValue: (item: MaintenanceRecord) => item.status,
      render: (item: MaintenanceRecord) => {
        const s = MAINTENANCE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'cost',
      title: '费用(元)',
      dataKey: 'cost',
      sortable: true,
      align: 'right',
      render: (item: MaintenanceRecord) => `¥${item.cost.toLocaleString()}`,
    },
    {
      key: 'description',
      title: '描述',
      dataKey: 'description',
      sortable: false,
      render: (item: MaintenanceRecord) => (
        <span style={{ color: '#94a3b8', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.description}
        </span>
      ),
    },
  ];
}

// ---- 设备详情面板 ----

function DeviceDetailPanel({ device, onClose }: { device: DeviceItem; onClose: () => void }) {
  const statusInfo = DEVICE_STATUS_MAP[device.status];
  const priorityInfo = MAINTENANCE_PRIORITY_MAP[device.maintenancePriority];
  const records = generateMaintenanceStatic().filter(r => r.deviceId === device.id).slice(0, 5);

  return (
    <section
      style={{
        borderRadius: 16,
        padding: 24,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{DEVICE_TYPE_ICONS[device.type]}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{device.name}</h2>
              <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 14 }}>
                {device.model} · {device.serialNumber}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="md" dot />
          <StatusBadge label={priorityInfo.label} variant={priorityInfo.variant} size="md" />
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            关闭
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <InfoRow label="IP地址" value={device.ipAddress} />
        <InfoRow label="位置" value={device.location} />
        <InfoRow label="固件版本" value={device.firmwareVersion} />
        <InfoRow label="安装日期" value={device.installDate} />
        <InfoRow label="运行时长" value={device.uptime} />
        <InfoRow label="温度" value={`${device.temperature}°C`} />
        <InfoRow label="错误次数" value={String(device.errorCount)} />
        <InfoRow label="上次Ping" value={new Date(device.lastPing).toLocaleString('zh-CN')} />
        <InfoRow label="最后维护" value={device.lastMaintenance} />
        <InfoRow label="下次维护" value={device.nextMaintenance} />
        <InfoRow label="保修到期" value={device.warrantyExpiry} />
        <InfoRow label="状态" value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />} />
      </div>

      {device.notes && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>备注</div>
          <div style={{ fontSize: 14, color: '#e2e8f0' }}>{device.notes}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          style={{
            borderRadius: 10, padding: '10px 18px',
            background: 'rgba(59,130,246,0.14)', color: '#93c5fd',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          🔄 重启设备
        </button>
        <button
          style={{
            borderRadius: 10, padding: '10px 18px',
            background: 'rgba(245,158,11,0.14)', color: '#fbbf24',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          📋 创建维护工单
        </button>
        <button
          style={{
            borderRadius: 10, padding: '10px 18px',
            background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          🗑️ 退役设备
        </button>
      </div>

      {records.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>最近维护记录</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>日期</th>
                <th style={thStyle}>类型</th>
                <th style={thStyle}>技术员</th>
                <th style={thStyle}>费用</th>
                <th style={thStyle}>状态</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.date}</td>
                  <td style={tdStyle}>{MAINTENANCE_TYPE_LABELS[r.type]}</td>
                  <td style={tdStyle}>{r.technician}</td>
                  <td style={tdStyle}>¥{r.cost.toLocaleString()}</td>
                  <td style={tdStyle}>
                    <StatusBadge label={MAINTENANCE_STATUS_MAP[r.status].label} variant={MAINTENANCE_STATUS_MAP[r.status].variant} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---- 统计卡片 ----

function computeStats(devices: DeviceItem[]) {
  return {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    error: devices.filter(d => d.status === 'error').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
    criticalPriority: devices.filter(d => d.maintenancePriority === 'critical').length,
    highTemp: devices.filter(d => d.temperature > 50).length,
    avgTemperature: Math.round(devices.reduce((s, d) => s + d.temperature, 0) / devices.length),
    uptimeRate: Math.round((devices.filter(d => d.status === 'online').length / devices.length) * 100),
    byType: devices.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

// ---- 主页面组件 ----

export default function StoreDevicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const devices = useMemo(() => generateDevicesStatic(), []);
  const maintenanceRecords = useMemo(() => generateMaintenanceStatic(), []);
  const stats = useMemo(() => computeStats(devices), [devices]);

  // 搜索
  const searchFields = useMemo<(keyof DeviceItem)[]>(() => ['name', 'model', 'serialNumber', 'location', 'ipAddress'], []);
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(devices, searchFields);

  // 类型筛选
  const allTypes = useMemo(() => [...new Set(devices.map(d => d.type))], [devices]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const typeFiltered = useMemo(
    () => (typeFilter === 'ALL' ? filteredItems : filteredItems.filter(d => d.type === typeFilter)),
    [filteredItems, typeFilter]
  );
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? typeFiltered : typeFiltered.filter(d => d.status === statusFilter)),
    [typeFiltered, statusFilter]
  );

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const handleRowClick = useCallback((item: DeviceItem) => setSelectedDevice(item), []);
  const columns = useMemo(() => buildDeviceColumns(handleRowClick), [handleRowClick]);
  const sortedItems = useSortedItems(statusFiltered, columns, sortConfig);

  // 分页
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 15, 20] });
  useEffect(() => { pagination.resetPage(); }, [searchTerm, typeFilter, statusFilter, pagination]);
  const pageItems = pagination.paginate(sortedItems);

  // 维护记录 - 准备最近的
  const recentMaintenance = useMemo(
    () => maintenanceRecords.filter(r => r.status === 'in-progress' || r.status === 'scheduled').slice(0, 8),
    [maintenanceRecords]
  );

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: '设备管理' })}
      />

      <PageShell
        title="门店设备管理"
        subtitle="实时监控门店所有设备的运行状态、维护计划与故障告警"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>设备总数</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>
              在线率: {stats.uptimeRate}% ({stats.online}/{stats.total})
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>故障设备</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.error}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#fca5a5' }}>
              维护中: {stats.maintenance} · 离线: {stats.offline}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>紧急优先级</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: '#f87171' }}>{stats.criticalPriority}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              需要立即处理
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均温度</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: stats.avgTemperature > 45 ? '#ef4444' : '#22c55e' }}>
              {stats.avgTemperature}°C
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#f97316' }}>
              高温设备: {stats.highTemp} 台
            </div>
          </div>
        </div>

        {selectedDevice && (
          <DeviceDetailPanel device={selectedDevice} onClose={() => setSelectedDevice(null)} />
        )}

        {/* 搜索与筛选 */}
        <div style={{ marginBottom: 12 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索设备名称/型号/序列号/位置..."
          />
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>设备类型</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: filteredItems.length },
                ...allTypes.map(t => ({
                  key: t,
                  label: `${DEVICE_TYPE_ICONS[t]} ${DEVICE_TYPE_LABELS[t]}`,
                  count: filteredItems.filter(d => d.type === t).length,
                })),
              ]}
              activeKey={typeFilter}
              onChange={(key) => setTypeFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>设备状态</div>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: typeFiltered.length },
                ...(['online', 'offline', 'error', 'maintenance', 'pending'] as DeviceStatus[]).map(s => ({
                  key: s,
                  label: DEVICE_STATUS_MAP[s].label,
                  count: typeFiltered.filter(d => d.status === s).length,
                })),
              ]}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key)}
              variant="pills"
              size="sm"
            />
          </div>
        </div>

        <FilterChips
          hint="已筛选："
          chips={[
            ...(typeFilter !== 'ALL'
              ? [{ key: 'type' as const, label: DEVICE_TYPE_LABELS[typeFilter as DeviceType] ?? typeFilter, tone: 'neutral' as FilterChip['tone'] }]
              : []),
            ...(statusFilter !== 'ALL'
              ? [{ key: 'status' as const, label: DEVICE_STATUS_MAP[statusFilter as DeviceStatus]?.label ?? statusFilter, tone: (DEVICE_STATUS_MAP[statusFilter as DeviceStatus]?.variant === 'danger' ? 'danger' : DEVICE_STATUS_MAP[statusFilter as DeviceStatus]?.variant === 'warning' ? 'warning' : 'neutral') as FilterChip['tone'] }]
              : []),
          ]}
          onRemove={(key) => {
            if (key === 'type') setTypeFilter('ALL');
            if (key === 'status') setStatusFilter('ALL');
          }}
          onClearAll={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
          size="sm"
          style={{ marginBottom: 8 }}
        />

        {/* 数据表格 */}
        <DataTable
          title={`设备列表（匹配 ${sortedItems.length} 条）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />

        {/* 维护计划 */}
        {recentMaintenance.length > 0 && (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginTop: 24,
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>维护计划</h2>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              待处理及已安排的维护工单 ({recentMaintenance.length})
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {recentMaintenance.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusBadge
                      label={MAINTENANCE_STATUS_MAP[r.status].label}
                      variant={MAINTENANCE_STATUS_MAP[r.status].variant}
                      size="sm"
                      dot
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.deviceName}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {MAINTENANCE_TYPE_LABELS[r.type]} · {r.date} · 技术员: {r.technician}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    ¥{r.cost.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 设备类型分布 */}
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginTop: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>设备类型分布</h2>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {(Object.entries(stats.byType) as [DeviceType, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{DEVICE_TYPE_ICONS[type]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{DEVICE_TYPE_LABELS[type]}</span>
                      <span style={{ fontSize: 14, color: '#94a3b8' }}>{count} 台</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(148,163,184,0.15)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(count / stats.total) * 100}%`,
                          borderRadius: 3,
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </PageShell>
    </main>
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: '#94a3b8',
  fontSize: 12,
  borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 13,
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
};
