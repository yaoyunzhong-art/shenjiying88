/**
 * 🦞 跨模块 E2E 测试链 #1: 管理端创建 → API存储 → B端展示 → C端消费
 *
 * 模拟链路:
 *   admin-web (tenant bootstrap) → API (foundation/bootstrap)
 *   → tob-web/storefront-web (portal bootstrap) → miniapp (C端消费)
 *
 * 验证:
 *   - tenant context 贯穿全链路
 *   - market profile 从配置正确下发到各个消费端
 *   - portal bootstrap 输出结构一致
 *   - C端 snapshot 从 API 数据正确派生
 */
export {};
//# sourceMappingURL=cross-module-e2e-1-admin-to-consumer.test.d.ts.map