'use client';

import { useEffect } from 'react';
import { STOREFRONT_SCOPE_STORAGE_KEYS, type StorefrontScope } from '../../lib/storefront-transactions';

export function StorefrontScopePersistor({ scope }: { scope: StorefrontScope }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STOREFRONT_SCOPE_STORAGE_KEYS.marketCode, scope.marketCode);
    window.localStorage.setItem(STOREFRONT_SCOPE_STORAGE_KEYS.tenantId, scope.tenantId);
    window.localStorage.setItem(STOREFRONT_SCOPE_STORAGE_KEYS.brandId, scope.brandId);
    window.localStorage.setItem(STOREFRONT_SCOPE_STORAGE_KEYS.storeId, scope.storeId);
  }, [scope]);

  return null;
}

