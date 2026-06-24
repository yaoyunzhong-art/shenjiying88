'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  RuntimeOperationPresetDetailRoute,
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
} from '@m5/ui';

const MOCK_OPS = runtimeOperationDetailDemoPresets.storefront;
const PRESET = runtimeOperationListDemoPresets.storefront;

export default function OperationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <RuntimeOperationPresetDetailRoute
      operationId={id}
      operations={MOCK_OPS}
      preset={PRESET}
      backHref="/operations"
      notFoundTitle="Operation Not Found"
      notFoundMessage={(operationId) => `Operation ${operationId} not found`}
    />
  );
}
