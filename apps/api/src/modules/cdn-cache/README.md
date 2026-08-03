# CDN 缓存模块 (CDN-Cache)

## 用途
CDN 缓存规则管理与边缘节点运营：支持规则 CRUD + URL pattern 匹配、边缘节点管理、主动缓存失效（URL/Pattern）、缓存命中率统计、Cache-Control 头构造。全局模块，网关/CDN 层依赖。

## 关键端点
- `POST /cdn/rules` — 创建缓存规则
- `GET /cdn/rules` — 列出全部规则
- `PATCH /cdn/rules/:id` — 更新规则
- `DELETE /cdn/rules/:id` — 删除规则
- `POST /cdn/nodes` — 添加边缘节点
- `POST /cdn/invalidate` — 主动失效缓存
- `GET /cdn/match` — URL 路由匹配

## 测试文件
- `cdn.controller.test.ts` / `cdn.controller.spec.ts` — 控制器测试
- `cdn.service.test.ts` / `cdn.service.spec.ts` — 服务层测试
- `cdn.e2e.test.ts` — E2E 测试
- `cdn.dto.test.ts` — DTO 校验测试
- `cdn.entity.test.ts` — 实体测试
- `cdn.module.test.ts` — 模块测试
- `cdn.contract.test.ts` — 合同测试
- `cdn.role.test.ts` / `cdn.role-extended.test.ts` / `cdn.role-v2.test.ts` — 角色权限测试
- `cdn.stress.test.ts` — 压力测试
- `cdn-cache-ringbeam.test.ts` — 环形测试
