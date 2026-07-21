# 网关模块 (Gateway)

## 用途
OpenAPI 网关服务，提供微服务路由查找、API Key 认证、令牌桶限流与配额管理、请求转发。集成网关分析仪表盘（请求量/QPS/延迟热力图/异常检测）。

## 关键端点
- `POST /gateway/route` — 路由查找（path → 目标微服务）
- `POST /gateway/auth` — API Key 认证
- `POST /gateway/rate-limit` — 限流检查
- `POST /gateway/rate-limit/consume` — 消费令牌
- `POST /gateway/quota/set` — 修改配额
- `POST /gateway/api-keys` — 创建/吊销 API Key

## 测试文件
- `gateway.controller.test.ts` / `gateway.controller.spec.ts` — 控制器测试
- `gateway.service.test.ts` / `gateway.service.spec.ts` — 服务层测试
- `gateway.e2e.test.ts` — E2E 集成测试
- `gateway.dto.test.ts` — DTO 校验测试
- `gateway.entity.test.ts` — 实体测试
- `gateway.module.test.ts` — 模块测试
- `gateway.role.test.ts` / `gateway.role-extended.test.ts` / `gateway.role-scenario.test.ts` — 角色权限测试
- `gateway-analytics.service.test.ts` — 分析服务测试
- `gateway-ringbeam.test.ts` — 环形测试
- `gateway.test.ts` — 基础测试
