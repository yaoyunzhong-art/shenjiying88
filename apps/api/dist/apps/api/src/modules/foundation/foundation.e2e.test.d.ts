/**
 * E2E-level: Foundation 底座服务层测试
 *
 * 链路:
 *   FoundationService.getModuleCatalog() → FoundationModuleDescriptor[]
 *   FoundationService.getGovernanceBaselines() → FoundationGovernanceBaseline[]
 *   FoundationService.getBlueprint() → FoundationBlueprint
 *   FoundationService.getConsumerCatalog() → FoundationConsumerDescriptor[]
 *   FoundationService.getConsumerDependency() → FoundationConsumerDescriptor | { availableConsumers }
 *   FoundationService.getDependencySummary() → FoundationConsumerDescriptor | undefined
 *
 * 验证:
 *   - getModuleCatalog 返回 6 个子模块描述符
 *   - 所有模块 key 唯一
 *   - getGovernanceBaselines 返回治理基线数组
 *   - getBlueprint 包含 modules / consumers / governanceBaselines
 *   - getConsumerCatalog 使用 adminWorkbenchConsumerDescriptor
 *   - getConsumerDependency 命中有效 consumer 返回描述
 *   - getConsumerDependency 未命中返回 availableConsumers
 *   - getDependencySummary 委托到 getConsumerCatalog
 *   - 幂等性: 多次调用一致
 *   - 边界: 空字符串 consumer
 */
export {};
//# sourceMappingURL=foundation.e2e.test.d.ts.map