/**
 * 三级独立配置 - 服务端加载页
 *
 * 复用 packages/ui/three-level-config 提供的类型与常量 (WORKBENCH_CARDS /
 * CATEGORY_LABELS / SENSITIVITY_LABELS / SENSITIVITY_COLORS),通过
 * @m5/sdk.getTenantWorkbenchConfigs 真实拉取 W-S / W-T / W-B 三个工作台
 * 的生效配置,再交给客户端组件做 tab 切换 / 编辑 / 回滚。
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import {
  ApiClient,
  getDefaultApiBaseUrl,
  type TenantConfigEffective,
  type TenantConfigWorkbenchCode,
} from '@m5/sdk';
import ThreeLevelConfigClient from './three-level-config-client';

const FALLBACK_TENANT_ID = 'tenant-demo';

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

export interface WorkbenchSnapshot {
  code: TenantConfigWorkbenchCode;
  title: string;
  description: string;
  level: 'store' | 'tenant' | 'brand';
  items: TenantConfigEffective[];
  total: number;
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

async function loadWorkbench(code: TenantConfigWorkbenchCode, level: 'store' | 'tenant' | 'brand', title: string, description: string): Promise<WorkbenchSnapshot> {
  const client = createClient();
  try {
    const data = await client.getTenantWorkbenchConfigs(code, undefined, { cache: 'no-store' });
    return {
      code,
      title,
      description,
      level,
      items: data.items ?? [],
      total: data.total ?? 0,
      deliveryMode: 'api',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      code,
      title,
      description,
      level,
      items: [],
      total: 0,
      deliveryMode: 'fallback',
      error,
    };
  }
}

export const dynamic = 'force-dynamic';

export default async function ThreeLevelConfigPage() {
  const [ws, wt, wb] = await Promise.all([
    loadWorkbench('W-S', 'store', '门店工作台 (W-S)', '门店操作员日常配置:POS/打印/会员签到'),
    loadWorkbench('W-T', 'tenant', '租户工作台 (W-T)', '连锁租户管理:会员体系/营销/库存/AI'),
    loadWorkbench('W-B', 'brand', '品牌工作台 (W-B)', '品牌方管控:合规/计费/品牌标准'),
  ]);

  const snapshot = { ws, wt, wb };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="三级独立配置"
        subtitle="租户/品牌/门店三级工作台配置,考虑继承链 + 字段级脱敏。支持批量编辑与版本回滚。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={6} label="加载三级配置..." />}>
          <ThreeLevelConfigClient snapshot={snapshot} tenantId={FALLBACK_TENANT_ID} />
        </Suspense>
      </PageShell>
    </main>
  );
}
