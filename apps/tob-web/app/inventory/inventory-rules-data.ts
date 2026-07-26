import { MOCK_SKUS, MOCK_STORE_STATS, MOCK_TRANSFERS } from './inventory-data';

export type InventoryRuleStatus = 'active' | 'paused' | 'draft';

export interface InventoryRuleItem {
  id: string;
  name: string;
  scenario: string;
  trigger: string;
  action: string;
  owner: string;
  status: InventoryRuleStatus;
  lastReviewedAt: string;
  evidence: string;
}

export interface InventoryRulesSnapshot {
  deliveryMode: 'fallback';
  generatedAt: string;
  rules: InventoryRuleItem[];
  lowStockCount: number;
  outOfStockCount: number;
  pendingTransferCount: number;
  storeCount: number;
  error: string;
}

export const INVENTORY_RULES: InventoryRuleItem[] = [
  {
    id: 'inv-rule-001',
    name: '低库存自动补货',
    scenario: '核心 SKU 安全水位治理',
    trigger: '当 SKU 库存低于 safetyStock 时触发',
    action: '自动生成补货建议并标记采购待办',
    owner: '供应链运营',
    status: 'active',
    lastReviewedAt: '2026-07-24T10:00:00.000Z',
    evidence: 'inventory-data.ts -> MOCK_SKUS safetyStock',
  },
  {
    id: 'inv-rule-002',
    name: '跨店调拨审批门槛',
    scenario: '门店缺货与库存平衡',
    trigger: '当调拨成本超过 5000 元时需二级审批',
    action: '转入区域仓控审批队列',
    owner: '区域仓控',
    status: 'active',
    lastReviewedAt: '2026-07-23T16:30:00.000Z',
    evidence: 'inventory-data.ts -> MOCK_TRANSFERS totalCost',
  },
  {
    id: 'inv-rule-003',
    name: '盘点差异复核',
    scenario: '门店盘点误差防逃逸',
    trigger: '盘点差异绝对值 >= 3 时触发',
    action: '要求 24 小时内复核并提交说明',
    owner: '门店经理',
    status: 'paused',
    lastReviewedAt: '2026-07-22T09:20:00.000Z',
    evidence: 'inventory detail snapshot -> inventory check difference aggregation',
  },
  {
    id: 'inv-rule-004',
    name: '新品上架安全库存初始化',
    scenario: '新增商品冷启动',
    trigger: '新增商品进入待运营态',
    action: '初始化门店样板 SKU 与安全库存模板',
    owner: '品牌运营',
    status: 'draft',
    lastReviewedAt: '2026-07-21T14:10:00.000Z',
    evidence: 'inventory page -> 新增商品表单结构占位',
  },
];

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export async function loadInventoryRulesSnapshot(): Promise<InventoryRulesSnapshot> {
  return {
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    rules: cloneValue(INVENTORY_RULES),
    lowStockCount: MOCK_SKUS.filter((sku) => sku.stock > 0 && sku.stock < sku.safetyStock).length,
    outOfStockCount: MOCK_SKUS.filter((sku) => sku.stock === 0).length,
    pendingTransferCount: MOCK_TRANSFERS.filter((transfer) => transfer.status === 'pending').length,
    storeCount: MOCK_STORE_STATS.length,
    error: '当前规则页展示本地库存治理规则样本，规则来源与统计均为 fallback 只读快照。',
  };
}
