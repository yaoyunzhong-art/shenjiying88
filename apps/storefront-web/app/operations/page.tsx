'use client';

import {
  runtimeOperationListDemoPresets,
  RuntimeOperationDemoListPage,
} from '@m5/ui';

const storefrontPreset = runtimeOperationListDemoPresets.storefront;

export default function OperationsListPage() {
  return (
    <RuntimeOperationDemoListPage
      title="Runtime Operations"
      description="Track deployment and infrastructure operations across all services."
      preset={storefrontPreset}
      count={50}
      detailHrefBase="/operations"
    />
  );
}
