# DR-012 · 多区域路由策略

## 状态
已接受 (2026-06-26, Pulse-82)

## 背景
GDPR 要求 EU 数据不出境,网络安全法要求 CN 数据不出境。多区域 SaaS 需跨境合规。

## 决策
1. **4 region**: cn (default) / us / eu / jp
2. **租户钉住优先**: tenantId → region 显式映射,跨境合规
3. **GeoIP fallback**: 钉住失败时按 IP 国家就近路由
4. **Latency-aware failover**: 主区域 DOWN 自动选最低延迟健康区域
5. **canMigrateToRegion**: 钉住租户拒绝跨区域数据迁移

## 后果
- ✅ GDPR/网络安全法 合规基础达成
- ✅ failover RTO < 30s (健康检查 + 自动切换)
- ⚠️ GeoIP 简化 mock,生产需 MaxMind GeoLite2
- ⚠️ 跨区域复制延迟: 50-200ms

## 替代方案
- 单一 region 多可用区: 跨境合规失败
- 用户手动选 region: 体验差
- 选择: 自动化 + 钉住 + failover 组合
