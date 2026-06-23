export interface StoreScopeParams {
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
}

const DEFAULT_MARKET_CODE = 'cn-mainland';

export function resolveStoreScope(scope: string[]): StoreScopeParams | null {
  if (scope.length === 3) {
    return {
      marketCode: DEFAULT_MARKET_CODE,
      tenantCode: scope[0]!,
      brandCode: scope[1]!,
      storeCode: scope[2]!,
    };
  }

  if (scope.length === 4) {
    return {
      marketCode: scope[0]!,
      tenantCode: scope[1]!,
      brandCode: scope[2]!,
      storeCode: scope[3]!,
    };
  }

  return null;
}
