# P-49 开放平台专项审计

> 更新时间: 2026-07-13 23:25
> 范围: `PRD-014` / `PRD-016` / `open-api` / `openapi` / `tenant-llm`

## 1. 审计结论

P-49 已从“只有正式 PRD”推进到“有需求卡、有圈梁测试、有专项审计”的状态，但当前仍属于 `🟡 已补主圈梁，未达全绿`。

## 2. 证据总表

| 模块 | PRD | 代码入口 | 测试证据 | 审计结论 |
|:-----|:----|:---------|:---------|:---------|
| open-api | PRD-016 | `apps/api/src/modules/open-api/open-api.service.ts` | `open-platform-ringbeam.test.ts` 中 AC-49-21/22/23/24 | OAuth/HMAC 主链已绑到 PRD |
| openapi | PRD-016 | `apps/api/src/modules/openapi/openapi.controller.ts` | `open-platform-ringbeam.test.ts` 中 AC-49-25/26/27/28 + RQ-49-26/27 | API Key/Webhook/Sandbox/Usage 已有验收主证据 |
| tenant-llm | PRD-014 | `apps/api/src/modules/tenant-llm/llm-config.service.ts` | `open-platform-ringbeam.test.ts` 中 AC-49-01/05/06/07 + `llm-config.tenant-service.test.ts` 30 例 | 多租户隔离、审批、统计已有主链验证 |

## 3. 本轮补齐

1. 新增需求卡 `docs/knowledge/requirement-cards/2026-07-13-P49-open-platform.md`
2. 新增圈梁测试 `apps/api/src/modules/openapi/open-platform-ringbeam.test.ts`，覆盖 13 条关键场景
3. 修复 `tenant-llm` 密钥存储空转问题：
   - `createConfig` 写入模块级加密存储
   - `updateConfig` 支持更新密钥
   - `deleteConfig` 同步删除密钥
   - `getApiKey` 可按租户读取明文供网关调用

## 4. AC / RQ 映射

| 需求 | 证据 |
|:-----|:-----|
| AC-49-21 | `client_credentials` 成功签发 Bearer Token |
| AC-49-22 | 错误 `client_secret` 返回 401 |
| AC-49-23 | HMAC 合法签名通过 |
| AC-49-24 | 过期时间窗口签名被拒绝 |
| AC-49-25 | API Key 创建成功，列表结果不含明文 secret |
| AC-49-26 | API Key 撤销后校验返回 `revoked` |
| AC-49-27 | Webhook 失败后进入重试并最终进入死信 |
| RQ-49-26 | Sandbox 创建、隔离、状态切换、清理可执行 |
| RQ-49-27 | Usage 桶、配额累加、租户级报表可执行 |
| AC-49-28 | `/openapi/docs` 返回 OpenAPI 文档与安全方案 |
| AC-49-01 | tenant-llm 配置跨租户不可见 |
| AC-49-05 / AC-49-06 | tenant-llm 额度阈值与统计可查询 |
| AC-49-07 | tenant-llm 审批通过流转可执行 |

## 5. 剩余缺口

1. `PRD-014 / AC-49-08` 的“无审批权限拒绝 + 审计日志”还没有圈梁证据。
2. `PRD-015` 目前仍停留在 PRD / 页面契约层，尚未补前台实现与监控验收。
3. P-49 当前以 service/controller 级圈梁为主，还缺更高层的 E2E 或 API smoke 审计。

## 6. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/openapi/open-platform-ringbeam.test.ts
pnpm --dir apps/api exec vitest run src/modules/tenant-llm/llm-config.tenant-service.test.ts
bash scripts/prd-validate.sh
```
