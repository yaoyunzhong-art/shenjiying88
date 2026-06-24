'use client';

import { PortalList, type PortalListItemView } from '@m5/ui';

export function PortalListClient({ portals }: { portals: PortalListItemView[] }) {
  return (
    <PortalList
      portals={portals}
      searchPlaceholder="搜索门店门户（名称、描述、域名）..."
      emptyTitle="暂无门店门户"
      emptyDescription="Bootstrap 未返回任何门店门户数据，请检查 API 连接或网络后重试。"
    />
  );
}
