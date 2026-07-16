/**
 * Agent Studio · 写操作面板
 * 功能: 创建/运行/批量执行/删除 Agent 配置与会话
 * 所有写操作直接调用后端 SDK,失败时显示原始错误便于排查
 *
 * 页面结构:
 * - 统计卡片: Agent 配置数 / 启用中 / 已禁用 / 启用反思
 * - 操作栏: 搜索 / 模型筛选 / 批量操作 / 刷新
 * - Agent 配置表格: 名称 / 模型 / 状态 / 步数 / 超时 / 工具数
 * - 创建 Modal: 名称 / 模型 / 启用反思 / 最大步数
 * - 加载态: LoadingSkeleton 包裹主内容
 * - 空态: 无配置时显示引导
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { loadAgentConfigs } from '../agent-view-model';
import AgentStudioClient from './studio-client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// ---- 主页面 (Server Component) ----

export default async function AgentStudioPage() {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <Suspense fallback={<LoadingSkeleton variant="card" rows={3} />}>
        <PageShell title="Agent Studio · 写操作面板" subtitle="创建/运行/批量执行/删除 Agent 配置与会话。所有写操作直接调用后端 SDK,失败时显示原始错误便于排查。">
          <AgentStudioClient configs={snapshot.configs} deliveryMode={snapshot.deliveryMode} />
        </PageShell>
      </Suspense>
    </main>
  );
}
