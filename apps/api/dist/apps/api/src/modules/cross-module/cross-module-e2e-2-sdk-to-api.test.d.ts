/**
 * 🦞 跨模块 E2E 测试链 #2: SDK调用 → domain处理 → API返回
 *
 * 模拟链路:
 *   packages/types → packages/domain → apps/api (market/portal/workbench)
 *   → API 合同输出 → 前端消费验证
 *
 * 验证:
 *   - domain 枚举与 API 合同输出一致
 *   - types contract 在各模块间传递时不漂移
 *   - SDK 辅助函数在各端消费结果一致
 *   - foundation 依赖在 module 间正确注入
 */
export {};
//# sourceMappingURL=cross-module-e2e-2-sdk-to-api.test.d.ts.map