# 🏗️ 架构决策记录

> **宪法级·仅追加不删除**
> **活跃层(T1)** — 索引 + 最新决策
> 完整历史: `docs/knowledge/archive/architecture-decisions-archive.md`
> 最后更新: 2026-07-10 09:23 GMT+8

---

## 索引（完整内容见归档层）

| 章 | 标题 | 归档层 |
|:--:|------|:------:|
| 1 | 系统架构概览 | archive.md §1 |
| 2 | 核心架构决策 | archive.md §2 |
| 3 | 模块拆分决策 | archive.md §3 |
| 4 | 技术选型决策 | archive.md §4 |
| 5 | 架构演进记录 | archive.md §5 |

### 最新架构决策 (2026-07)

- **多租户**: Shared Table + tenant_id (已验证), Hybrid模式(P0演进)
- **模块拆分**: 112 API模块 → 25 Phase
- **AI引擎**: Rule Engine + Diagnosis Engine 双引擎架构
- **前端**: 7端 (admin/storefront/miniapp/tob-api/app/mobile → 4合并中)

---

## 更新记录

| 日期 | 修改人 | 摘要 |
|------|--------|------|
| 2026-07-10 | 🦞 龙虾哥 | T1活跃层化; 完整历史迁至archive |
