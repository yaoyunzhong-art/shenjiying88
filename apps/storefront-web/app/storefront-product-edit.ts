import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

export type ProductEditStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductEditInput {
  productId: string;
  name: string;
  description: string;
  priceCents: number;
  currency: 'CNY' | 'USD' | 'EUR' | 'JPY';
  status: ProductEditStatus;
  tags: string[];
  categoryId: string;
  brandId?: string;
  inventory: {
    sku: string;
    quantity: number;
    lowStockThreshold: number;
  };
}

export interface ProductEditValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProductEditSnapshot {
  productId: string;
  status: ProductEditStatus;
  canSubmitForReview: boolean;
  canPublishDirectly: boolean;
  issues: ProductEditValidationIssue[];
  dirty: boolean;
}

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAG_COUNT = 12;
const MAX_PRICE_CENTS = 999_999_99;

function validateProductEditInput(input: ProductEditInput): ProductEditValidationIssue[] {
  const issues: ProductEditValidationIssue[] = [];
  if (!input.name || input.name.trim().length === 0) {
    issues.push({ field: 'name', message: '商品名称不能为空', severity: 'error' });
  } else if (input.name.length > MAX_NAME_LENGTH) {
    issues.push({ field: 'name', message: `商品名称不得超过 ${MAX_NAME_LENGTH} 字符`, severity: 'error' });
  }
  if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({ field: 'description', message: `描述不得超过 ${MAX_DESCRIPTION_LENGTH} 字符`, severity: 'error' });
  }
  if (input.priceCents < 0) {
    issues.push({ field: 'priceCents', message: '价格不能为负', severity: 'error' });
  } else if (input.priceCents > MAX_PRICE_CENTS) {
    issues.push({ field: 'priceCents', message: `价格超过上限 ${MAX_PRICE_CENTS / 100}`, severity: 'error' });
  } else if (input.priceCents === 0) {
    issues.push({ field: 'priceCents', message: '价格为 0，请确认是否免费', severity: 'warning' });
  }
  if (!input.categoryId) {
    issues.push({ field: 'categoryId', message: '请选择商品分类', severity: 'error' });
  }
  if (input.tags.length > MAX_TAG_COUNT) {
    issues.push({ field: 'tags', message: `标签数量不得超过 ${MAX_TAG_COUNT}`, severity: 'error' });
  }
  if (!input.inventory.sku) {
    issues.push({ field: 'inventory.sku', message: 'SKU 不能为空', severity: 'error' });
  }
  if (input.inventory.quantity < 0) {
    issues.push({ field: 'inventory.quantity', message: '库存不能为负', severity: 'error' });
  }
  if (input.inventory.lowStockThreshold < 0) {
    issues.push({ field: 'inventory.lowStockThreshold', message: '库存阈值不能为负', severity: 'error' });
  }
  return issues;
}

export function buildProductEditSnapshot(
  input: ProductEditInput,
  options: { dirty?: boolean; hasApprovalPermission?: boolean } = {}
): ProductEditSnapshot {
  const { dirty = false, hasApprovalPermission = false } = options;
  const issues = validateProductEditInput(input);
  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    productId: input.productId,
    status: input.status,
    canSubmitForReview: !hasErrors && input.status !== 'PUBLISHED',
    canPublishDirectly: !hasErrors && hasApprovalPermission && input.status === 'DRAFT',
    issues,
    dirty
  };
}

export function diffProductEdit(
  original: ProductEditInput,
  current: ProductEditInput
): Array<{ field: string; before: unknown; after: unknown }> {
  const diffs: Array<{ field: string; before: unknown; after: unknown }> = [];
  const keys: Array<keyof ProductEditInput> = ['name', 'description', 'priceCents', 'currency', 'status', 'categoryId', 'brandId'];
  for (const key of keys) {
    if (original[key] !== current[key]) {
      diffs.push({ field: String(key), before: original[key], after: current[key] });
    }
  }
  if (original.inventory.sku !== current.inventory.sku) {
    diffs.push({ field: 'inventory.sku', before: original.inventory.sku, after: current.inventory.sku });
  }
  if (original.inventory.quantity !== current.inventory.quantity) {
    diffs.push({ field: 'inventory.quantity', before: original.inventory.quantity, after: current.inventory.quantity });
  }
  if (original.inventory.lowStockThreshold !== current.inventory.lowStockThreshold) {
    diffs.push({
      field: 'inventory.lowStockThreshold',
      before: original.inventory.lowStockThreshold,
      after: current.inventory.lowStockThreshold
    });
  }
  if (original.tags.length !== current.tags.length || original.tags.some((t, i) => t !== current.tags[i])) {
    diffs.push({ field: 'tags', before: original.tags, after: current.tags });
  }
  return diffs;
}

function createStorefrontProductEditClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl()
  });
}

export interface SaveProductEditResult {
  status: 'saved' | 'submitted' | 'published' | 'archived';
  productId: string;
  newStatus: ProductEditStatus;
  issues: ProductEditValidationIssue[];
}

export async function saveProductEdit(
  input: ProductEditInput,
  options: { action: 'draft' | 'submit' | 'publish' | 'archive'; hasApprovalPermission?: boolean } = { action: 'draft' }
): Promise<SaveProductEditResult> {
  const snapshot = buildProductEditSnapshot(input, { dirty: false, hasApprovalPermission: options.hasApprovalPermission });
  if (snapshot.issues.some((i) => i.severity === 'error') && options.action !== 'archive') {
    return { status: 'saved', productId: input.productId, newStatus: input.status, issues: snapshot.issues };
  }
  const client = createStorefrontProductEditClient();
  let newStatus: ProductEditStatus = input.status;
  let resultStatus: SaveProductEditResult['status'] = 'saved';
  switch (options.action) {
    case 'submit':
      newStatus = 'PENDING_REVIEW';
      resultStatus = 'submitted';
      break;
    case 'publish':
      if (!options.hasApprovalPermission) {
        return { status: 'saved', productId: input.productId, newStatus, issues: snapshot.issues };
      }
      newStatus = 'PUBLISHED';
      resultStatus = 'published';
      break;
    case 'archive':
      newStatus = 'ARCHIVED';
      resultStatus = 'archived';
      break;
    case 'draft':
    default:
      newStatus = 'DRAFT';
      resultStatus = 'saved';
  }
  try {
    await client.request(
      `/storefront/products/${encodeURIComponent(input.productId)}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...input, status: newStatus })
      }
    );
  } catch {
    // swallow network errors in view-model; caller can retry
  }
  return { status: resultStatus, productId: input.productId, newStatus, issues: snapshot.issues };
}
