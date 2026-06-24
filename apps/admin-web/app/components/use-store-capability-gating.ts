'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  buildCapabilityActionItems,
  buildCapabilityEntrypoints,
  filterCapabilityEntrypoints,
  loadStoreCapabilityAccessSnapshot,
  type CapabilityTenantContext,
  type StoreCapabilityAccessSnapshot
} from '../lyt-capability-access';

interface UseStoreCapabilityGatingOptions {
  targetCapabilities: readonly string[];
  defaultStoreId?: string;
  tenantContext?: CapabilityTenantContext;
}

export function useStoreCapabilityGating({
  targetCapabilities,
  defaultStoreId = 'store-001',
  tenantContext
}: UseStoreCapabilityGatingOptions) {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId') ?? tenantContext?.storeId ?? defaultStoreId;
  const [snapshot, setSnapshot] = useState<StoreCapabilityAccessSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    async function hydrateCapabilityAccess() {
      const nextSnapshot = await loadStoreCapabilityAccessSnapshot(storeId, {
        ...tenantContext,
        storeId
      });

      if (!disposed) {
        setSnapshot(nextSnapshot);
        setIsLoading(false);
      }
    }

    void hydrateCapabilityAccess();

    return () => {
      disposed = true;
    };
  }, [storeId, tenantContext]);

  const moduleEntrypoints = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return filterCapabilityEntrypoints(
      buildCapabilityEntrypoints(storeId, snapshot.capabilityAccess),
      targetCapabilities
    );
  }, [snapshot, storeId, targetCapabilities]);

  const moduleActions = useMemo(() => buildCapabilityActionItems(moduleEntrypoints), [moduleEntrypoints]);
  const visibleEntrypoints = moduleEntrypoints.filter((item) => item.visibility === 'visible');
  const visibleActions = moduleActions.filter((item) => item.visibility === 'visible');
  const degradedCount = moduleEntrypoints.filter((item) => item.access === 'degraded').length;
  const blockedCount = moduleEntrypoints.filter((item) => item.access === 'blocked').length;
  const hiddenCount = moduleEntrypoints.filter((item) => item.access === 'hidden').length;
  const recommendedEntrypoint = visibleEntrypoints.find((item) => item.isNavigable);
  const primaryNavigableAction = visibleActions.find((item) => !item.isDisabled);

  return {
    storeId,
    snapshot,
    isLoading,
    moduleEntrypoints,
    moduleActions,
    visibleEntrypoints,
    visibleActions,
    degradedCount,
    blockedCount,
    hiddenCount,
    recommendedEntrypoint,
    primaryNavigableAction
  };
}
