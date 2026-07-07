// ============================================================
//  门店绩效数据类型 & 工厂函数
// ============================================================

/** 时段销售数据 (小时级别) */
export interface HourlySalesRecord {
  hour: string;   // "08:00", "09:00" ...
  sales: number;
  orders: number;
}

/** 品类表现 */
export interface CategoryPerformance {
  category: string;
  revenue: number;
  salesCount: number;
  targetAchievement: number; // %
}

/** 周绩效汇总 */
export interface WeeklyPerformance {
  dailyRevenue: number[];
  dailyOrders: number[];
  dailyCustomers: number[];
}

/** 门店绩效汇总 */
export interface StorePerformanceData {
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  avgOrderValue: number;
  revenueGrowth: number;     // %
  orderGrowth: number;       // %
  completionRate: number;    // % 任务完成率
  satisfactionScore: number; // 0-100 满意度
  hourlySales: HourlySalesRecord[];
  categoryPerformance: CategoryPerformance[];
  weekly: WeeklyPerformance;
}

// ============================================================
//  工厂函数
// ============================================================

export function makeHourlySales(overrides?: Partial<HourlySalesRecord>): HourlySalesRecord {
  return { hour: '10:00', sales: 5200, orders: 28, ...overrides };
}

export function makeCategoryPerf(overrides?: Partial<CategoryPerformance>): CategoryPerformance {
  return { category: '生鲜', revenue: 18500, salesCount: 96, targetAchievement: 92, ...overrides };
}

export function makeWeeklyPerf(overrides?: Partial<WeeklyPerformance>): WeeklyPerformance {
  return {
    dailyRevenue: [45200, 48900, 51200, 47800, 58260, 61500, 53100],
    dailyOrders: [180, 210, 198, 205, 247, 260, 222],
    dailyCustomers: [145, 170, 162, 158, 195, 210, 178],
    ...overrides,
  };
}

export function makeStorePerformanceData(overrides?: Partial<StorePerformanceData>): StorePerformanceData {
  return {
    todayRevenue: 58260.00,
    todayOrders: 247,
    todayCustomers: 195,
    avgOrderValue: 235.87,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    completionRate: 78,
    satisfactionScore: 92,
    hourlySales: [
      { hour: '08:00', sales: 3200, orders: 18 },
      { hour: '09:00', sales: 4800, orders: 25 },
      { hour: '10:00', sales: 5200, orders: 28 },
      { hour: '11:00', sales: 6800, orders: 36 },
      { hour: '12:00', sales: 9100, orders: 42 },
      { hour: '13:00', sales: 7400, orders: 35 },
      { hour: '14:00', sales: 5600, orders: 29 },
      { hour: '15:00', sales: 6100, orders: 34 },
    ],
    categoryPerformance: [
      { category: '生鲜', revenue: 18500, salesCount: 96, targetAchievement: 92 },
      { category: '饮料', revenue: 12300, salesCount: 78, targetAchievement: 105 },
      { category: '零食', revenue: 9800, salesCount: 52, targetAchievement: 88 },
      { category: '日用品', revenue: 8760, salesCount: 45, targetAchievement: 76 },
      { category: '熟食', revenue: 6900, salesCount: 38, targetAchievement: 95 },
    ],
    weekly: makeWeeklyPerf(),
    ...overrides,
  };
}
