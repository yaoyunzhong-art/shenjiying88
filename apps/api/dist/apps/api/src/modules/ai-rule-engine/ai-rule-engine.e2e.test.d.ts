/**
 * E2E: AI Rule Engine 评估 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → AiRuleEngineService
 *
 * 验证:
 *   - 成员等级评估 (VIP / SVIP / REGULAR)
 *   - 设备异常检测 (CPU / MEMORY / DISK / NETWORK / ERROR)
 *   - 批量评估 (混合 member + device)
 *   - 引擎状态查询
 *   - 路由分发 (POST /evaluate)
 *   - 异常输入 (未知 type / 缺少字段)
 */
import 'reflect-metadata';
//# sourceMappingURL=ai-rule-engine.e2e.test.d.ts.map