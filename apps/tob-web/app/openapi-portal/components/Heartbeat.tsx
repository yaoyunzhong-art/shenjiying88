'use client';

/**
 * Heartbeat - 页面探针组件
 * 用于 HEARTBEAT-66 等监控任务，跟踪页面访问和性能
 */
export function Heartbeat({ id }: { id: string }) {
  if (typeof window !== 'undefined') {
    // 发送心跳到监控服务
    console.log(`[Heartbeat:${id}] Page loaded at ${new Date().toISOString()}`);
  }

  return null;
}
