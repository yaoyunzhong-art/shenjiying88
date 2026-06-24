/**
 * E2E: Queue 排队模块 HTTP 链路
 *
 * 链路:
 *   HTTP → attachTenantContext → ValidationPipe → ResponseInterceptor
 *     → TestQueueController (wrapper of QueueController)
 *     → QueueService (真实 service)
 *
 * 验证:
 *   - POST /queue/join → 创建 entry + 返回 contract
 *   - POST /queue/:entryId/leave → 取消
 *   - POST /queue/call-next → 叫下一个
 *   - GET /queue/status/:resourceId → 队列统计
 *   - GET /queue/position → 排号位置
 *   - 完整 join→call-next→start→complete 流程
 *   - 跨租户隔离
 *   - ValidationPipe 错误处理
 */
import 'reflect-metadata';
//# sourceMappingURL=queue.e2e.test.d.ts.map