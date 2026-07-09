# 🔄 演进日志 Evolution Log

> **记录: 技术组专家学习与赋能 (E1陈架构/E2李安全/E3王硬件/E44周CTO)**
> **日期: 2026-07-10 05:30 CST (Pulse-Nightly-12)**
> **执行人: 🦞龙虾哥**

---

## 一、跨模块 E2E 进化 (Pulse-Nightly-12)

### 1.1 新增链

| 链 | 名称 | subtests | 模式 | 新增角色 | 状态 |
|:--:|------|:--------:|------|:--------:|:----:|
| #35 | Nest DI 升级: MultiRegion→Health + Content→Brand→I18n | 13 | DI风格集成、故障转移、品牌多语言 | — | ✅ |
| #36 | 跨租户数据隔离 + 治理审计 | 10 | 三层隔离(Identity+Data+Audit) | Compliance Officer | ✅ |
| #37 | 边缘缓存 + CDN 失效工作流 | 12 | 缓存预热+失效+分析 | CDN Operator | ✅ |

### 1.2 解决的关键问题
- **P1-021 (内联domain→DI升级)**: 链35 完成链30/31 的升级
- **Date.now() ID 冲突**: 加入递增序号保证唯一性
- **Vitest 变量提升陷阱**: 采用 `createTestStores()` 工厂模式

### 1.3 知识更新
- [docs/knowledge/lessons-learned/pulse-nightly-12.md](docs/knowledge/lessons-learned/pulse-nightly-12.md) — 经验教训
- [knowledge/expert-insights/E33-pulse-nightly-12-e2e-expansion.md](knowledge/expert-insights/E33-pulse-nightly-12-e2e-expansion.md) — 专家洞察

---

## 二、学前知识回顾 (历史)

### 2.1 架构决策(AD)关键要点

| 编号 | 标题 | 核心结论 | 偏离状态 |
|:----:|------|----------|:--------:|
| AD-0001 | M5总母机定位 | 唯一总控，LYT适配 | ✅ 已对齐 |
| AD-0005 | WebSocket+HTTP双通道 | WS>10s断→HTTP轮询5s/次 | 🔴 AD-DEV-02 未实现 |
| AD-0008 | 多租户隔离 | 共享表+tenant_id逻辑隔离 | 🟡 AD-DEV-08 部分实现 |
| AD-0011 | 边缘服务器策略 | NUC/Mac Mini + CRDT | 🔴 AD-DEV-03 未部署 |
| AD-0018 | 盲盒Redis Lua | Lua脚本保证原子性 | 🔴 AD-DEV-06 未实现 |
| AD-0017 | 积分通胀预警 | 实时计算+熔断 | 🟡 AD-DEV-05 未实现 |

[历史内容继续...]
