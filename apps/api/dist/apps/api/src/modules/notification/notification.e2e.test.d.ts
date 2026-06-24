/**
 * E2E: Notification 通知模块 HTTP 链路
 *
 * 链路:
 *   HTTP → NotificationController → NotificationService → MapStore
 *
 * 验证:
 *   - POST /notifications/templates     - 注册模板
 *   - GET  /notifications/templates     - 模板列表/筛选
 *   - GET  /notifications/templates/:id - 模板详情
 *   - PATCH /notifications/templates/:id - 更新模板
 *   - POST /notifications/send          - 发送通知
 *   - GET  /notifications/dispatches    - 调度列表/筛选
 *   - GET  /notifications/dispatches/:id - 调度详情
 *   - POST /notifications/dispatches/:id/retry  - 重试
 *   - POST /notifications/dispatches/:id/cancel - 取消
 *   - 模板不存在时的边界行为
 *   - 调度不存在时的边界行为
 *   - 发送失败通知后重试
 */
import 'reflect-metadata';
//# sourceMappingURL=notification.e2e.test.d.ts.map