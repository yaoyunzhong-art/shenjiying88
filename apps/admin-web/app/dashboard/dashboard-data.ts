export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeDevices: number;
  totalDevices: number;
  currentCustomers: number;
  pendingAlerts: number;
  completionRate: number;
  avgVisitDuration: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  weeklyGrowth: number;
  customerSatisfaction: number;
}

export interface DashboardSnapshotDelivery {
  deliveryMode: 'mock';
  stats: DashboardStats;
  generatedAt: string;
}

async function loadDashboardStats(): Promise<DashboardStats> {
  return {
    todayRevenue: 12580,
    todayOrders: 86,
    activeDevices: 42,
    totalDevices: 48,
    currentCustomers: 23,
    pendingAlerts: 3,
    completionRate: 78,
    avgVisitDuration: 45,
    monthlyRevenue: 312800,
    monthlyOrders: 2460,
    weeklyGrowth: 8.5,
    customerSatisfaction: 92,
  };
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshotDelivery> {
  const stats = await loadDashboardStats();
  return {
    deliveryMode: 'mock',
    stats,
    generatedAt: new Date().toISOString(),
  };
}
