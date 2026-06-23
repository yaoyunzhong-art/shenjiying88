'use client';

import { DetailActionBar } from '@m5/ui';
import { useDetailActions, type UseDetailActionsOptions } from './use-detail-actions';

export interface DetailPageActionsProps extends UseDetailActionsOptions {
  /** Optional heading shown above the action bar. */
  heading?: string;
  /** Optional caption shown under the heading. */
  caption?: string;
}

/**
 * DetailPageActions 是一个 client-side 包装组件，专门用于在 server component
 * 详情页（async function、page.tsx）的 JSX 末尾接上 DetailActionBar。
 *
 * 直接在 server component 中调用 useDetailActions 是非法的（hook 只能在
 * 客户端组件中调用），所以这里把 useDetailActions 包装成 client 组件，
 * server component 只需传入可序列化的 props（workspace / detailId /
 * record / shareTitle / shareText / enableExports / heading / caption）。
 *
 * 使用方式（server component 中）：
 *
 *   <DetailPageActions
 *     workspace="pad"
 *     detailId={role}
 *     record={{ role, title: workbench.title }}
 *     shareTitle={`Pad 工作台 · ${workbench.title}`}
 *     shareText={`查看 Pad ${role} 工作台详情`}
 *     caption="复制 / 导出 / 分享当前 Pad 工作台"
 *   />
 */
export function DetailPageActions({
  heading = '详情收口动作',
  caption = '复制 / 导出 / 分享当前详情',
  ...options
}: DetailPageActionsProps) {
  const { actions } = useDetailActions(options);
  return <DetailActionBar actions={actions} heading={heading} caption={caption} />;
}
