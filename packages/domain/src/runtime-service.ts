import type { RuntimeOperation, RuntimeReceipt, PaginatedResponse } from './service-types';

const MOCK_OPERATIONS: RuntimeOperation[] = Array.from({ length: 20 }, (_, i) => ({
  id: `op-${i + 1}`,
  type: (['deploy', 'rollback', 'scale', 'restart', 'config-update'] as const)[i % 5]!,
  status: (['pending', 'running', 'completed', 'completed', 'failed'][i % 5]) as RuntimeOperation['status'],
  targetId: `service-${(i % 4) + 1}`,
  createdAt: new Date(Date.now() - i * 1800000).toISOString(),
  finishedAt: i % 5 < 2 ? undefined : new Date(Date.now() - i * 900000).toISOString(),
}));

const MOCK_RECEIPTS: Record<string, RuntimeReceipt[]> = {};

MOCK_OPERATIONS.forEach((op) => {
  MOCK_RECEIPTS[op.id] = [
    {
      id: `rcpt-${op.id}-1`,
      operationId: op.id,
      code: 'STARTED',
      message: `Operation ${op.type} started for ${op.targetId}`,
      status: 'ok',
      timestamp: op.createdAt,
    },
    {
      id: `rcpt-${op.id}-2`,
      operationId: op.id,
      code: op.status === 'failed' ? 'ERROR' : 'COMPLETED',
      message:
        op.status === 'failed'
          ? `Operation failed: connection timeout`
          : `Operation ${op.type} completed successfully`,
      status: op.status === 'failed' ? 'error' : 'ok',
      timestamp: op.finishedAt ?? new Date().toISOString(),
    },
  ];
});

export async function fetchOperations(
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<RuntimeOperation>> {
  const total = MOCK_OPERATIONS.length;
  const start = (page - 1) * pageSize;
  return {
    items: MOCK_OPERATIONS.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function fetchOperationById(id: string): Promise<RuntimeOperation | undefined> {
  return MOCK_OPERATIONS.find((o) => o.id === id);
}

export async function fetchReceiptsByOperation(
  operationId: string
): Promise<RuntimeReceipt[]> {
  return MOCK_RECEIPTS[operationId] ?? [];
}
