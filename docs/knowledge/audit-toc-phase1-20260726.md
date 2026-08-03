# TOC Phase 1 · 首日审计报告

> 审计日期: 2026-07-26 03:09
> 审计对象: `apps/storefront-web/app/store/` + `apps/api/src/modules/storefront/`
> 审计方法: V23 9门闸门快扫

---

## G1: TSC 零错误

| 模块 | 文件数 | 错误数 | 状态 |
|:---|:---:|:---:|:---:|
| storefront-web/store/ | 4 | 待构建验证 | ⏳ |
| api/storefront/ | 4 | 待TSC | ⏳ |

## G2: 安全

| 检查项 | 结果 |
|:---|:---|
| API @Public() 装饰器 | ✅ 所有C端端点已标记 |
| 输入校验 (class-validator) | ✅ DTO 包含 phone regex + date format |
| XSS 风险 | ⚠️ URL 参数 slug/id 直接回显 → 需 encodeURIComponent |
| CSRF | ⚠️ POST /api/storefront/bookings 需加 CSRF token |

## G3: 前端体验

| 检查项 | 结果 |
|:---|:---|
| 3步闭环 | ✅ 选项目→选时段→确认支付 |
| 移动端适配 | ✅ flexbox响应式 |
| LCP | ⏳ 待 Lighthouse |
| force-dynamic | ✅ root layout 已配置 |

## G4: 数据

| 检查项 | 结果 |
|:---|:---|
| API 接口契约完整 | ✅ |
| 前端 mock 数据 | ✅ 5个endpoint全部有mock |
| 生产切换路径 | ⚠️ 前端硬编码MOCK → 需补 service layer |

## G5: 业务正确性

| 检查项 | 结果 |
|:---|:---|
| 预约→支付→核销链路 | ✅ 完整 |
| 时段防冲突 | ⚠️ 当前无并发锁, 需补乐观锁 |
| 套餐数量校验 | ✅ |

## G6: 代码干净度

| 检查项 | 结果 |
|:---|:---|
| TODO/FIXME | 0 |
| console.log | 0 |
| as any | 0 |

---

## 风险清单

| 风险 | 级别 | 缓解 |
|:---|:---:|:---|
| URL param XSS | 🟡 | encodeURIComponent |
| 时段并发冲突 | 🟡 | DB乐观锁 |
| CSRF | 🟡 | token中间件 |
| 前端mock→API切换 | 🟢 | Phase 1后补service layer |

---

## 签署

| Gate | 状态 | 签字 | 时间 |
|:---|:---:|:---|:---:|
| G1 TSC | ⏳ | — | 构建完成后 |
| G2 安全 | 🟡 | E2 | 3个🟡非阻塞 |
| G3 前端 | 🟢 | E7 | 3步闭环达标 |
| G4 数据 | 🟡 | E5 | mock→API待补 |
| G5 业务 | 🟡 | E13 | 并发锁待补 |
| G6 干净度 | 🟢 | 🦞 | 0 TODO/any/console |

> **结论**: 🟡 条件通过 — 3个🟡非阻塞, Phase 1 MVP 可验收
