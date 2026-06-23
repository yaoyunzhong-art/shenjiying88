'use client';

import {
  runtimeOperationListDemoPresets,
  RuntimeOperationDemoListPage,
} from '@m5/ui';

const tobPreset = runtimeOperationListDemoPresets.tob;

export default function OperationsListPage() {
  return (
    <RuntimeOperationDemoListPage
      title="运维操作中心"
      description="Runtime operations history — 查看所有部署、回滚、扩缩容等操作记录。"
      preset={tobPreset}
      count={50}
      detailHrefBase="/operations"
    />
  );
}
