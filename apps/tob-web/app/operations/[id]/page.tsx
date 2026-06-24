'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  RuntimeOperationPresetDetailRoute,
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
} from '@m5/ui';

const MOCK = runtimeOperationDetailDemoPresets.tob;
const PRESET = runtimeOperationListDemoPresets.tob;

export default function OperationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <RuntimeOperationPresetDetailRoute
      operationId={id}
      operations={MOCK}
      preset={PRESET}
      backHref="/operations"
      notFoundTitle="Not Found"
      notFoundMessage={(operationId) => `Operation ${operationId} not found`}
    />
  );
}
