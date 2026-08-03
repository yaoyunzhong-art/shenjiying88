# V23 Day14 L1 — 店A上线前完整检查清单

**检查时间:** 2026-07-25 23:59 GMT+8  
**检查范围:** apps/admin-web/ apps/tob-web/ apps/storefront-web/ docs/ infras/ scripts/  
**⚠️ 排除:** apps/api/

---

## 1. 三Web端 TypeScript 编译检查 ✅

| 应用 | TSC 错误数 |
|------|-----------|
| admin-web | **0** ✅ |
| tob-web | **0** ✅ |
| storefront-web | **0** ✅ |

> 三端 TypeScript 编译全部通过，无类型错误。

---

## 2. 环境变量模板 ✅

`.env.example` 存在且结构完整，包含：
- NODE_ENV, API_PORT, LYT_MODE
- CORS_ORIGIN, LOG_LEVEL
- PostgreSQL 连接参数
- 标注了「生产环境通过 CI/CD Pipeline 注入或 K8s Secrets」

> 环境变量模板规范，生产配置有明确指引。

---

## 3. package.json 脚本检查 ✅

| 应用 | build | start | test |
|------|-------|-------|------|
| admin-web | `next build` ✅ | `next start` ✅ | Node test runner ✅ |
| tob-web | `next build` ✅ | `next start` ✅ | Node test runner ✅ |
| storefront-web | `next build` ✅ | `next start` ✅ | Node test runner + Vitest ✅ |

> 三端 build/start/test 脚本齐全，测试依赖已安装。

---

## 4. 部署配置 ⚠️

`infras/` 目录下未发现 `.yaml`、`.yml` 或 `Dockerfile` 文件。

> 可能部署配置位于其他路径或托管在独立仓库。建议确认部署配置完整性。

---

## 5. Git 状态 ✅

- 未提交文件数: **10**
- 全部位于 `apps/api/`（不在本次检查边界内）

> 检查边界内的文件全部已提交，状态干净。

---

## 总结

| 检查项 | 状态 |
|--------|------|
| TSC 编译 | ✅ 三端通过 |
| 环境变量 | ✅ .env.example 完整 |
| 构建脚本 | ✅ build/start/test 齐全 |
| 部署配置 | ⚠️ infras/ 为空 |
| Git 状态 | ✅ 边界内干净 |

**结论:** 店A 上线前 L1 检查通过。唯一关注点是 infras/ 目录下暂无部署配置文件，需确认是否由 CI/CD 其他环节负责。

---

## 提交记录

```
quality: Day14-L1 上线前检查清单
```
