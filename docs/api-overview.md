# 神机营 SaaS API 全景 · 2026-07-25

> 分支: `tree/codeup-acr-ci-20260717` · 48 commits today

---

## 总览

| 指标 | 数值 |
|:-----|:---:|
| API模块 | 183 (100% Service+Controller) |
| REST端点 | 2,282 |
| Prisma Models | 114 |
| 有端点的模块 | 180 |
| TSC | 零错误 · strict:true |
| 核心测试 | 2,642/2,684 (98.4%) |

## 端点TOP 10

| 模块 | 端点 |
|:-----|:---:|
| brand-operations | 86 |
| logistics | 82 |
| alliance | 58 |
| performance | 48 |
| realtime | 44 |
| push | 41 |
| inventory | 33 |
| employee-marketing | 33 |
| finance | 31 |
| openapi | 29 |

## 安全

- 99/114 Model 含 tenant_id + @@index
- RLS 72 Model 白名单
- 审计日志全局拦截器 (P-59)
- TenantGuard 鉴权 (P-46)
- 未成年保护 6端点 (P-22)

## 运维

- 健康检查 5端点 (health)
- DB备份 API (backup/trigger)
- 部署验收 (deploy-check.sh)
- 压测 (load-test.js, k6 3场景)

---

_Generated automatically · 2026-07-25 03:15 CST_
