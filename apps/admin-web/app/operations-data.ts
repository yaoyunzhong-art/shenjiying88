import {
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
} from '@m5/ui';

export const adminRuntimeOperationsRoute = {
  href: '/operations',
  detailHrefBase: '/operations',
  backHref: '/operations',
  title: '治理操作中心',
  description: '统一查看审批执行、密钥轮换、运行时重放等高风险动作的治理记录。',
  emptyTitle: '治理操作不存在',
  emptyMessage: (operationId: string) => `治理操作 ${operationId} 不存在`,
} as const;

export const adminRuntimeOperationsPreset = runtimeOperationListDemoPresets.admin;
export const adminRuntimeOperationDetails = runtimeOperationDetailDemoPresets.admin;
