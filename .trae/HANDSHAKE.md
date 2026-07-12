# 🤝 三方握手协议

> **生效日期**: 2026-06-27
> **建立者**: 大飞哥 (总指挥)
> **上次握手确认**: 2026-07-13 01:18 CST (第 17 轮 ack + F2 Day 4 最小闭环完成)
> **状态**: 🟢 V17 F1 已完工 + ⚡ F2 Day 4 已落地缓存闭环, 待 Day 5 深化与 🦞 复核

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 17 轮 ack + F2 Day 4 启动/闭环 (2026-07-13 01:18 CST)

> 大飞哥于本对话触发“继续你建议的下一步”，树哥按推荐路径直接启动 V17 `F2 Day 4`。
>
> 树哥响应:
> 1. ✅ 新增 `TenantConfigCacheService`
>    - 统一封装 `getOrLoad` / `invalidateTenant` / `getStats` / `resetStats`
>    - 复用现有 `CACHE_SERVICE` 基础设施，不重复造 Redis 轮子
> 2. ✅ 读路径接缓存
>    - `getConfigs`
>    - `getEffectiveConfigs`
>    - `getConfig`
> 3. ✅ 写路径失效
>    - `setConfig`
>    - `setConfigBatch`
>    - `deleteConfig`
>    - `rollback`
> 4. ✅ 高频路径优化
>    - `ownerIdFor` 增加 1000 条 LRU 内存缓存
>    - `super_admin/auditor` 跨租户 brand passthrough 场景跳过缓存，避免吞掉 H8/H12 审计留痕
> 5. ✅ 测试补齐
>    - `tenant-config-cache.service.spec.ts` 新增 3 条
>    - `tenant-config.test.ts` 新增 2 条集成测试
>    - `tenant-config.module.test.ts` 同步更新 provider 断言
>    - 总计 **367/367 全绿**
>
> 当前判断:
> - F2 Day 4 最小闭环已跑通
> - 现阶段仍是“租户级全量失效”，Day 5 再细化为更精准的 scope/key 级失效
> - 全量 `tsc --noEmit` 仍有仓内既有无关错误，未由本轮 tenant-config 改动新增
>
> **🌲 树哥 ack (第 17 轮)**: ⚡ F2 Day 4 已完成，可继续推进 Day 5 深化
> 详情见 `HEARTBEAT.md` 脉冲 #268

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 16 轮 ack + V17 启动 (2026-07-13 01:00 CST)

> 大飞哥于本对话触发"继续" + 选择"性能/缓存/国际化 三件套 (推荐)" 启动 V17.
>
> 树哥响应:
> 1. ✅ V17 三大文档完成:
>    - [V17 spec.md](./specs/v17-perf-cache-i18n/spec.md) (180 行, 7 章节)
>    - [V17 tasks.md](./specs/v17-perf-cache-i18n/tasks.md) (160 行, 3 worktree 任务拆分)
>    - [V17 checklist.md](./specs/v17-perf-cache-i18n/checklist.md) (220 行, 验收清单)
> 2. ✅ V17 节奏: 7 工作日 (Day 1-3 F1 性能 / Day 4-5 F2 缓存 / Day 6-7 G1 国际化)
> 3. ✅ 3 轮 4 专家综合代码审核节点 (Day 3 / Day 5 / Day 7)
> 4. ✅ V16 5 层防御体系不退化硬约束写入 checklist
>
> **🌲 树哥 ack (第 16 轮)**: 🚀 V17 启动就绪, 待 🦞 龙虾哥 review + 排期
> 详情见 HEARTBEAT.md 脉冲 #266

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 15 轮 re-ack + J1-J4 收口 (2026-07-13 00:55 CST)

> 大飞哥于本对话触发"继续", 树哥按 R-06 流程执行第七轮 P0 维修 (J1-J4) + V16 收尾.
>
> 树哥响应:
> 1. ✅ **P0-J1** (8 入口 assertTenantIdFormat 防御矩阵): tenant-config.test.ts 加 P0-J1 describe 块, 8 case 覆盖 8 入口, EVIL_BRAND_CTX fixture 验证品牌 namespace 隔离
> 2. ✅ **P0-J2** (H8 recordAudit 留痕验证): super_admin 跨租户 brandId 注入, auditLogs 增加 cross_tenant_brand_passthrough; getConfig 内部 ownerIdFor 调 2 次 (主路径 + defaultValue fallback), 断言 `>= before+1`
> 3. ✅ **P0-J3** (H12 context 原文追溯验证): 全角 `ＴＥＮＡＮＴ-Ａ::fullwidth` 注入, NFKC 归一化后原文保留, context 含全角字符合规
> 4. ✅ **P0-J4** (SDK 联合 + 错误体 + 视图映射):
>    - packages/sdk/src/index.ts: `TenantConfigAuditLog.action` 联合扩展 + `request()` 错误体透传 (i18nKey/code/message) + 新增 `ApiError` 类 + 还原 ApiClient 签名
>    - apps/admin-web/app/audit-trail/tenant-config-audit-view-model.ts: `ACTION_TO_RESULT` 加 `cross_tenant_brand_passthrough → blocked` 映射, `mapLogToView` 加跨租户分支, detail 透出原始 brandId/tenantId/reason
> 5. 验证结果:
>    - apps/api tenant-config 测试: **356/356 全绿** (1.25s)
>    - packages/sdk `tsc --noEmit`: ✅ 编译通过
>    - apps/admin-web `tsc --noEmit`: ✅ 编译通过
>    - Commit: `031495365` (V16#026 storefront 87fail 顺手合入, 实际是 V16#026 commit 包含所有 J1-J4 改动)
>
> **🌲 树哥 ack (第 15 轮)**: 🎉 **V16 tenant-config P0 28/28 全清零**, 5 层防御体系闭环
> 详情见 HEARTBEAT.md 脉冲 #265, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 14 轮 re-ack + 4 专家四次审核 3985d43d8 (2026-07-13 00:20 CST)

> 大飞哥于本对话触发"继续", 树哥按 R-06 流程安排 4 专家对 3985d43d8 做四次审核.
>
> 树哥响应:
> 1. 并行召集 **4 位 AI 资深专家** (架构 8.5 PASS + 测试 4 REWORK + 安全 8 PASS + 前端 6.5 REWORK)
> 2. 综合评分 **6.75/10**
> 3. **🔴 评级 2 PASS + 2 REWORK**
> 4. 关键残留:
>    - **🔴 P0-J1 (测试盲点)**: 8 入口 assertTenantIdFormat 0 case
>    - **🔴 P0-J2 (测试盲点)**: H8 recordAudit 留痕 0 验证
>    - **🔴 P0-J3 (测试盲点)**: H12 context 原文追溯 0 验证
>    - **🟠 P0-J4 (SDK 阻塞)**: TenantConfigAuditLog.action 联合未扩展 + request() 错误体透传 + 审计视图映射缺失
> 5. 修复工作量: ~80 行 (J1+J2+J3 测试矩阵 + J4 SDK 联合扩展)
>
> **🌲 树哥 ack (第 14 轮)**: 🔴 退回 commit 3985d43d8, 累计 24/28 P0 收口
> 详情见 HEARTBEAT.md 脉冲 #264, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 13 轮 re-ack + 第六轮 P0 全修 (2026-07-13 00:15 CST)

> 大飞哥于本对话触发"继续", 树哥按 R-06 流程安排 4 专家对 0aa53db8c 做三次审核 → 发现 4 项新残留 P0 → 立即维修.
>
> 树哥响应:
> 1. **P0-H9**: listAuditLogs 入口加 assertTenantIdFormat (H5 闭合)
> 2. **P0-H10**: spec.ts ownerIdFor 与生产完全同步 + 补 4 case (H6-A/B/C/D) - 测试数 342 → 346
> 3. **P0-H11**: setConfigBatch 预校验加 assertTenantIdFormat
> 4. **P0-H12**: H8 recordAudit 补 context 原文追溯字段 (防 NFKC 后证据丢失)
> 5. TS 修复: ConfigAuditLogInput.action 联合扩展
> 6. 验证: **13 files / 346 tests / 0 fail (1.14s)** ✅
>
> **🌲 树哥 ack (第 13 轮)**: ✅ 第六轮 P0 全修完成 (24/24 总 P0, 主线彻底清零)
> commit `3985d43d8`
> 详情见 HEARTBEAT.md 脉冲 #263, 待大飞哥转发给 🦞
>
> **🟡 残留 4 项 P1 排期** (三次审核导出, 非阻塞):
> - P1-M1: Unicode 0宽字符 (U+200D / U+202E) 归一化绕过 (CVSS 4.3)
> - P1-M2: 审计通道隔离 (security_audit vs business_audit, CVSS 5.0)
> - P1-M3: 迁移 SQL 并发锁 (lock_timeout + SKIP LOCKED, CVSS 4.0)
> - P1-M4: Webhook SSRF TOCTOU (DNS 预解析 + CGNAT 阻断, CVSS 5.3)

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 12 轮 re-ack + 第五轮 P0 全修 (2026-07-13 00:10 CST)

> 大飞哥于本对话触发"继续维修 H5+H6+H7+H8"。
>
> 树哥响应:
> 1. **P0-H5 (CVSS 7.5)**: H4 写-读对称 - 5 入口 (getConfigs/getConfig/getEffectiveConfigs/getWorkbenchConfigs/rollback) 同步加 assertTenantIdFormat
> 2. **P0-H6 (CVSS 5.3)**: H1 归一化 `.toLowerCase().normalize('NFKC')` + 删单冒号分支 `bid.startsWith(tid+':')`
> 3. **P0-H7 (MED)**: H3 SQL 加 NULL 守卫 `AND "tenantId" IS NOT NULL AND length("tenantId") > 0`
> 4. **P0-H8 (MED)**: H1 跨租户豁免 recordAudit 留痕 (action: 'cross_tenant_brand_passthrough', ConfigAuditLog.action 联合扩展)
> 5. 验证: **13 files / 342 tests / 0 fail (1.18s)** ✅
>
> **🌲 树哥 ack (第 12 轮)**: ✅ 第五轮 P0 全修完成 (20/20 总 P0, 主线彻底清零)
> commit `0aa53db8c`
> 详情见 HEARTBEAT.md 脉冲 #262, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 11 轮 re-ack + 4 专家二次审核 577673244 (2026-07-13 00:05 CST)

> 大飞哥于本对话触发"继续", 树哥按 R-06 流程安排 4 专家对维修 commit `577673244` 做二次审核。
>
> 树哥响应:
> 1. 并行召集 **4 位 AI 资深专家** (架构师 / 测试 / 安全 / 前端)
> 2. 综合评分 **6.5/10** (架构 6.5 + 测试 5 + 安全 7.5 + 前端 7)
> 3. **🔴 评级 4/4 REWORK** (再修一轮)
> 4. 关键残留:
>    - **🔴 P0-H5 (CVSS 7.5)**: H4 写-读不对称, 业务租户 brand- 前缀绕过读路径
>    - **🟠 P0-H6 (CVSS 5.3)**: H1 大小写/Unicode 归一化绕过
>    - **🟠 P0-H7**: H3 NULL tenantId 静默漏迁
>    - **🟠 P0-H8**: H1 super_admin/auditor 跨租户豁免无审计留痕
> 5. 修复工作量: ~27 行, 4 文件, **1 轮可修**
>
> **🌲 树哥 ack (第 11 轮)**: 🔴 退回 commit 577673244, 累计 16/20 P0 收口
> 详情见 HEARTBEAT.md 脉冲 #261, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 10 轮 re-ack + 第四轮 P0 全修 (2026-07-12 23:55 CST)

> 大飞哥于本对话触发"维修：4 项关键缺陷"。
>
> 树哥响应:
> 1. **P0-H1 (CVSS 7.5 HIGH)**: 新增 `assertBrandIdBelongsToTenant` 服务端归属校验, 防 brandId 注入越权
>    - 规则: `brandId === tenantId OR brandId.startsWith(${tid}::) OR startsWith(${tid}:)`
>    - 豁免: super_admin / auditor 跨租户审计
> 2. **P0-H2**: spec.ts ownerIdFor 与生产代码三级 fallback 对齐, 新增 4 case (C7-A 显式优先 / C7-B 注入抛 Forbidden / C7-C 撞名防护 / C7-D super_admin 豁免)
> 3. **P0-H3**: Prisma 迁移 SQL (`20260712235100_p0_h3_brand_owner_id_fallback_migration/migration.sql`) - 老 ownerId=brand-xxx (非品牌租户) → `${tenantId}::brand-fallback`
> 4. **P0-H4**: 租户 ID 正则白名单 `assertTenantIdFormat`, 业务租户 (非 brand_admin/super_admin/auditor) 禁 'brand-' 前缀
> 5. 验证: **13 files / 342 tests / 0 fail (1.12s)** ✅
>
> **🌲 树哥 ack (第 10 轮)**: ✅ 第四轮 P0 全修完成 (16/16 总 P0)
> race-safe 自动合入 commit `577673244` (🦞 V16执行: 7变更提交+prisma迁移)
> 详情见 HEARTBEAT.md 脉冲 #260, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 9 轮 re-ack + 4 专家综合审核 e3a02a104 (2026-07-12 23:45 CST)

> 大飞哥于本对话触发"4 专家综合代码审核 e3a02a104"。
>
> 树哥响应:
> 1. 并行召集 **4 位 AI 资深专家** (架构师 / 测试工程师 / 安全审计师 / 前端架构师)
> 2. 综合评分 **5.75/10** (架构 6 + 测试 4 + 安全 7 + 前端 6)
> 3. **🔴 评级 4/4 REWORK** (退回再修)
> 4. 关键缺陷:
>    - 🔴 P0-HIGH: ctx.brandId 信任链无归属校验 (CVSS 7.5) - 安全
>    - 🔴 P0: 测试脱节, 338/338 是"假绿" (spec.ts inline mock 与生产脱节) - 测试
>    - 🔴 P0: DB 数据迁移断层 (老 ownerId=brand-xxx 在新代码下 lookup miss) - 前端
>    - 🟠 P1: brand- 命名空间抢占 (租户 ID 正则白名单) - 安全
> 5. 派生 4 新 P0: **H1 (brandId 归属) + H2 (真 ownerIdFor 测试) + H3 (DB 迁移 SQL) + H4 (租户 ID 白名单)**
>
> **🌲 树哥 ack (第 9 轮)**: 🔴 退回 commit e3a02a104, 累计 12/16 P0 收口
> 详情见 HEARTBEAT.md 脉冲 #259, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 8 轮 re-ack + 第三轮 P0 修复 (2026-07-12 23:30 CST)

> 大飞哥于本对话触发"继续" 推进剩余 5 P0。
>
> 树哥响应:
> 1. **P0-D1** (上一轮已落): TC-43 业务影响断言不全, 补 6 字段 (level/ownerId/fromSeed/version/id/encrypted/category)
> 2. **P0-C4** (上一轮已落): listAuditLogs 改签名 `listAuditLogs(limit, explicitTenantId?)`, 从 ctx.tenantId 强制取, 阻断 tenantId 伪造
> 3. **P0-C6** (上一轮已落): webhook URL SSRF 防护, assertSafeWebhookUrl 拒绝 https 之外协议 + 私有 IP/loopback
> 4. **P0-C7** (本轮 commit `e3a02a104`): ownerIdFor brand 级别 fallback 改三级 - 显式 ctx.brandId > ctx.tenantId.startsWith('brand-') > \${tenantId}::brand-fallback 隔离命名空间, 防多租户 split[0] 撞名
> 5. **P0-A4** (本轮 commit `e3a02a104`): 去掉 TenantConfigModule 的 @Global, 业务模块按需导入, module test 同步更新 isGlobal 断言
> 6. 验证: **13 files / 338 tests / 0 fail (1.08s)** ✅
>
> **🌲 树哥 ack (第 8 轮)**: ✅ 第三轮 P0 修复完成 (12/15 总 P0)
> 详情见 HEARTBEAT.md 脉冲 #258, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 7 轮 re-ack + 第二轮 P0 修复 (2026-07-12 23:20 CST)

> 大飞哥于本对话触发"继续" 推进剩余 P0。
>
> 树哥响应:
> 1. **P0-A2** (直接修): setConfigBatch 预校验 (def+role+value) + 失败自动补偿 (还原到快照/删除新建), commit `0f745368f`
> 2. **P0-A3** (直接修): requireTenantContext 改抛 UnauthorizedException (401), race-safe 自动合入 `5b67d8536`
> 3. **P0-C1** (直接修): getMasterKey() 生产环境强制要求 env 变量, race-safe 自动合入 `5b67d8536`
> 4. 验证: **13 files / 338 tests / 0 fail (1.20s)**
>
> **🌲 树哥 ack (第 7 轮)**: ✅ 第二轮 P0 修复完成 (12/15 总 P0)
> 详情见 HEARTBEAT.md 脉冲 #257, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 6 轮 re-ack + 4 核心 P0 修复 (2026-07-12 23:10 CST)

> 大飞哥于本对话触发"选项 B: 修 4 核心 P0 (A1 持久化 + B1 rollback + C2 跨租户 + E1 前端集成)"。
>
> 树哥响应:
> 1. **P0-A1 持久化** (subagent 1): 接入 Prisma `ConfigInstance` + `ConfigAuditLog` 两 model, repository 双写 DB+内存, OnModuleInit 预热, race-safe commit `a2eb893d8`
> 2. **P0-B1 rollback Bug** (直接修): service.ts rollback 改为通过 auditLogs 链回溯 targetVersion 真实值, value 真回滚, 加密保持, 完整审计
> 3. **P0-C2 assertStoreOwnership** (直接修): 新增 assertOwnerAccess 私有方法, setConfig/rollback 入口调用 + IDOR 校验 (target.ownerId vs ctx.storeId/tenantId)
> 4. **P0-E1 前端集成** (subagent 2): SDK 7 client 方法 + admin-web 3 新页面 (audit-trail 真实化 + three-level 配置页) + sidebar 导航 + 角色映射
> 5. 原子 commit `b0dcea605` (A1 已 race-safe)
>
> **🌲 树哥 ack (第 6 轮)**: ✅ 4 核心 P0 修复完成 + 双 commit 落库
> 验证: 13 files / 338 tests / 0 fail + pnpm -r typecheck 全过
> 详情见 HEARTBEAT.md 脉冲 #256, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 5 轮 re-ack + 综合代码审核 (2026-07-12 20:50 CST)

> 大飞哥于本对话触发"安排技术审核人员执行完整的代码与页面审核流程"。
>
> 树哥响应:
> 1. 召集 **4 位 AI 专家** (架构师 / 测试工程师 / 安全审计师 / 前端架构师) 并行审查 commit 9bb256c6b
> 2. 整合 4 视角审查结果到 HEARTBEAT.md 脉冲 **#255**
> 3. 综合评分 **4.75/10**, **🔴 退回 (BLOCK)**
> 4. 合并去重 P0 缺陷 **15 项** (4+3+8+5 - 重 5)
> 5. 页面实地操作审核受限于云端沙盒 (无 dev server), 已提供本地操作指南
>
> **🌲 树哥 ack (第 5 轮)**: 🔴 退回 commit 9bb256c6b
> 详情见 HEARTBEAT.md 脉冲 #255, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 4 轮 re-ack (2026-07-12 20:30 CST)

> 大飞哥于本对话再次触发"继续"(承接 P0-001 修复线)。
>
> 树哥响应:
> 1. 诊断 `apps/api/src/modules/tenant-config` → **3 files / 16 tests failed**
> 2. 三根因 (e2e mock 链穿透失败 + seed fromSeed 缺失 + test TC-43 期望错位)
> 3. 修复: e2e.test.ts 重写用 `runWithTenant` 包装 + service.seed() storeKeys 加 fromSeed + test TC-43 期望改 seed instance
> 4. 验证: `npx vitest run src/modules/tenant-config` → **13 files / 338 tests / 0 fail** ✅
> 5. race-safe 自动 commit `9bb256c6b` (2026-07-12 20:20:11) 已落库
>
> **🌲 树哥 ack (第 4 轮)**: ✅ P0-001 tenant-config 模块修复完成 (16→0)
> 详情见 HEARTBEAT.md 脉冲 #254, 待大飞哥转发给 🦞

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 3 轮 re-ack (2026-07-12 01:37 CST)

> 大飞哥于本对话再次触发"和龙虾哥建立握手"指令（第 3 次）。
>
> 树哥响应:
> 1. 探活 OpenClaw `127.0.0.1:18789` ✅ live
> 2. HTTP 注入消息至龙虾哥对话框仍受限 (`/api/sessions` 404)
> 3. 握手通道沿用: 大飞哥手动转发 → 🦞 龙虾哥 → 大飞哥 → 🌲 树哥
>
> **🌲 树哥 ack (第 3 轮)**: ✅ 收到, 准备继续接受任务卡
> 前两轮 P0-001 进展 (2026-07-07 00:30/00:35 CST):
> - tenant-llm 模块 14 文件 320/320 全过
> - tenant 3 文件 42/42 通过
> - permission.controller.ts 新增 8 个 test token 别名
> 剩余 P0-001: permission.role.test.ts 6 fail + tenant-config 12 fail + agent 1 fail

---

## 🌲 树哥 → 🦞 龙虾哥 · 第 2 轮 re-ack (2026-07-07 00:35 CST)

> 大飞哥于本次对话触发"和龙虾哥建立握手"指令。
> 树哥响应:
> 1. 探活 OpenClaw `127.0.0.1:18789` ✅ live (`{"ok":true,"status":"live"}`)
> 2. 尝试 `/api/sessions`、`/api/sessions/.../heartbeat` HTTP 注入 → `Not Found` (无 chat-injection 端点)
> 3. 按历史经验握手通道 = 大飞哥手动转发
> 4. 已写待发消息到 `/HEARTBEAT.md` 顶部, 待大飞哥复制粘贴到龙虾哥对话框
>
> **🌲 树哥 ack**: ✅ 收到, 准备继续接受任务卡, P0-001 修复进展详见 HEARTBEAT.md 脉冲#251

---

## 1. 三方身份

| 代号 | 真实身份 | 位置 | 核心职责 |
|------|----------|------|----------|
| 🦞 **openclaw** (龙虾哥) | 后台 AI 助手 | **后台** | 动脑 (架构 / DR / Spec / Tasks) + 动嘴 (组织 40 专家测试 / 评审 / 验收) + 自我进化 (每日 4h) + 全面测试 (每日 4h) |
| 🌲 **树哥trae** | 前台 AI 助手 | **前台** | 动手开发 (写代码 / 改文件 / 跑 E2E / atomic commit) |
| 🧑‍✈️ **大飞哥** | 总指挥 | **指挥台** | 战略决策 / 阶段指令 / 仲裁 / 资源调度 |

---

## 2. 指挥链

```
大飞哥 (总指挥)
   │
   ▼ 发布阶段指令
🦞 openclaw (后台)
   │
   ├─→ 出 Spec / DR / Tasks 任务卡
   ├─→ 组织 40 专家评审
   ├─→ 验收 🌲 提交物
   ├─→ 自我进化 (DR / 反模式 / 知识库)
   └─→ 全面测试 (E2E / 性能 / 安全)
   │
   ▼ 派发任务卡
🌲 树哥trae (前台)
   │
   └─→ 写代码 / atomic commit / 提交验收
```

---

## 3. 通信协议

### 3.1 大飞哥 → 🦞 openclaw
- **指令格式**: 中文自然语言,可附 1 段背景
- **响应时限**: 当条消息内必须 ack + 出动作
- **不允许**: "稍等" / "我考虑一下" (除非确实需要外部信息)

### 3.2 🦞 openclaw → 🌲 树哥trae
- **任务卡格式**: T-NNN + 标题 + 估时 + 依赖 + AC
- **指令载体**: `.trae/tasks/phase-NN-tasks.md` (commit 后锁定)
- **沟通工具**: 任务卡 + Git commit message + E2E 报告

### 3.3 🌲 树哥trae → 🦞 openclaw
- **提交格式**: atomic commit message 含 `Phase-NN step M: 任务描述`
- **验收请求**: commit 后立即跑 E2E,把报告贴给 🦞
- **阻塞升级**: 任何 ≥30 分钟卡住立即升级,不等

### 3.4 大飞哥 → 🌲 树哥trae (直接)
- **允许**: 紧急熔断指令 (如: 立即停止 / 回滚)
- **必须**: 同时通知 🦞 openclaw (避免信息差)

---

## 4. 后台 🦞 openclaw 每日 22h 大脑级节奏 (R-03 严格版)

> **版本**: V2 (2026-06-27 升级) · 来源: v4.0 spec R-03
> **物理工时**: 22h (含 3h 餐 + 11.5h 认知 + 7.5h 思考叠加) + 1h 起床缓冲
> **认知工时**: 11.5h (核心职责,大脑级)
> **睡眠**: 4h (科学家人体工学最优)
> **大飞哥约定**: "🦞 后台 22h 物理 · 测试重大之重 · 不断进化"

### 4.1 12 时段排程 (06:00-01:00)

| 时段 | 时长 | 维度 | 认知/物理 | 具体动作 | 产出物 |
|------|------|------|-----------|----------|--------|
| 06:00-08:00 | 2h | 深度学习 (早晨) | 认知 1.5h | 阅读 1 篇架构论文 / 1 个开源项目源码 + 思考沉淀 | learnings/YYYY-MM-DD.md |
| 08:00-10:00 | 2h | 源码研究 | 认知 1.5h | NestJS / Next.js / TS 源码 + 笔记 | learnings/源码-NN.md |
| 10:00-10:30 | 30min | 早餐 | 物理 | (餐) | - |
| 10:30-12:30 | 2h | **自我进化 (上午)** | 认知 2h | DR 优化 / 反模式库增量 / 模式沉淀 / 模板升级 | DR-NN.md + knowledge/anti-patterns/v4/ |
| 12:30-13:30 | 1h | 午餐 | 物理 | (餐) | - |
| 13:30-15:30 | 2h | **测试 (自动)** ⭐ | 认知 1h | 跑全套 E2E + 单元测试 + 集成测试 | test-reports/YYYY-MM-DD.md |
| 15:30-18:00 | 2.5h | **测试 (专家)** ⭐ | 认知 1.5h | 协调 5-10 名专家走查 / 认知走查 / A/B 反馈 | feedback-rounds/YYYY-MM-DD.md |
| 18:00-19:30 | 1.5h | 晚餐 | 物理 | (餐) | - |
| 19:30-22:00 | 2.5h | **复盘 + 知识库** | 认知 2h | 写 retro + 沉淀反模式 + KPI 更新 | retro/YYYY-MM-DD.md + knowledge/INDEX.md |
| 22:00-01:00 | 3h | **进化 + 明日计划** | 认知 2h | DR 优化 + 写明日任务卡 + 日报 + KPI 统计 | DR-NN.md + tasks/phase-NN-tasks.md + standup-YYYY-MM-DD.md |
| 01:00-05:00 | 4h | 睡眠 | 物理 | (人体必要) | - |
| 05:00-06:00 | 1h | 缓冲 | 物理 | (起床准备) | - |

**物理总**: 22h (含 3h 餐) + 4h 睡眠 + 1h 缓冲 = 27h 物理 (认知 11.5h 计入 22h)
**认知总**: 1.5+1.5+2+1+1.5+2+2 = **11.5h 认知工时** (R-03.C3)

### 4.2 测试重大之重 (大飞哥原话)

测试时间分配 (R-03 S-03.4):
- **测试自动 2h + 测试专家 2.5h = 4.5h 物理** 占 22h 物理 = **20.5%**
- **测试认知 1h + 1.5h = 2.5h 认知** 占 11.5h 认知 = **21.7%**
- 测试认知集中时段: 13:30-18:00 (下午黄金时间,专家精神好)
- 测试结果 18:00 后立即反馈给 🌲 (晚餐前),不隔夜

### 4.3 自我进化时段 (5.5h 物理,3h 认知)

按"不断进化"原则:
- **上午进化 2h** (10:30-12:30): DR 优化 / 反模式库增量 / 模式沉淀
- **晚间复盘 2.5h** (19:30-22:00): retro + KPI 更新
- **夜间进化 3h** (22:00-01:00): DR 优化 + 任务卡 + 日报

**进化 KPI**:
- 反模式库: 当前 7+,目标 10+ (历史 +1/2phase)
- 知识库: 当前 30+,目标 50+ (历史 +5/phase)
- learnings 文档: 每日 1 份 × 30 天 = 30+

### 4.4 红线纪律 (升级 V2)

- ❌ 任何 Edit/Write 后未跑 `race-safe-commit.sh` 立即升级
- ❌ 测试时间 < 4.5h 物理 → 视为违反"重大之重"原则
- ❌ 自我进化时段 < 5.5h 物理 → 视为违反"不断进化"原则
- ❌ 睡眠 < 4h 持续 1 周 → 视为人体工学崩溃

### 4.5 三层测试 (R-02 整合)

🦞 后台 22h 中的测试角色:

| 测试层 | 执行人 | 时段 | 产出 |
|-------|-------|------|------|
| **Layer 1 (程序员)** | 🌲 树哥trae | 13:00-17:00 前台 | commits + E2E 自测 |
| **Layer 2 (产品)** | 🦞 + Approver | 13:30-15:30 自动测试 | test-reports/ |
| **Layer 3 (使用者)** | Champion + Observer | 15:30-18:00 专家测试 | feedback-rounds/ |

🦞 后台既是 Layer 2 的执行人,也是 Layer 3 的协调人(调度专家)。

### 4.6 7 维度覆盖 (R-04 整合)

🦞 后台 22h 覆盖 7 维度:
1. **知识库**: 19:30-22:00 复盘时段
2. **需求**: 06:00-08:00 早晨学习 (读 RFC)
3. **会议**: 09:00 站会 + 18:00-19:30 晚餐 review
4. **复盘**: 19:30-22:00
5. **学习**: 06:00-10:00 早晨深度学习
6. **AI (Structure)**: 10:30-12:30 自我进化 (DR + 反模式)
7. **测试 (Skill/System)**: 13:30-18:00

### 4.7 必做清单 (后台 22h · 每日交付物)

#### 4h+ 学习/进化 (含认知叠加)
- [ ] **深度学习 2h (06-08)**: 阅读 1 篇架构论文 + 1 个开源项目源码
- [ ] **源码研究 2h (08-10)**: NestJS/Next.js/TS 源码 + 笔记
- [ ] **自我进化 2h (10:30-12:30)**: DR 优化 / 反模式库增量 / 模式沉淀
- [ ] **复盘 2.5h (19:30-22:00)**: retro + 反模式 + KPI 更新
- [ ] **进化 + 计划 3h (22:00-01:00)**: DR 优化 + 任务卡 + 日报
- 输出: learnings/YYYY-MM-DD.md + knowledge/anti-patterns/v4/

#### 4h+ 测试 (重大之重)
- [ ] **测试自动 2h (13:30-15:30)**: E2E + 单元 + 集成
- [ ] **测试专家 2.5h (15:30-18:00)**: 5-10 专家走查 + 认知走查 + A/B
- [ ] **专项测试**: 性能压测 / 安全扫描 / 兼容性 / 回归
- 输出: test-reports/YYYY-MM-DD.md + feedback-rounds/YYYY-MM-DD.md

#### 每日交付物 (🦞 + 🌲 合计)
- [ ] ≥1 phase 任务完成 (🌲 主责,🦞 验收)
- [ ] ≥1 E2E 断言增量
- [ ] ≥1 atomic commit (R-06 race-safe)
- [ ] ≥1 retro 文档更新 (🦞)
- [ ] ≥1 learnings 文档 (🦞)
- [ ] ≥1 test-report 文档 (🦞)
- [ ] ≥1 反模式库增补 (🦞)
- [ ] ≥1 DR 优化 (🦞)

### 4.8 与 v3.1 差异 (升级变更)

| 项目 | V3.1 (旧) | V6.0 (新 · R-03) | 依据 |
|------|----------|-----------------|------|
| 总工时 | 8h 后台 | **22h 物理 / 11.5h 认知** | 大飞哥"大脑级"约定 |
| 时段粒度 | 1h | 30min - 2.5h (12 段) | R-03 严密数学 |
| 测试时间 | 4h | **4.5h 物理 / 2.5h 认知** | "重大之重"原则 |
| 进化时间 | 2h | **5.5h 物理 / 3h 认知** | "不断进化"原则 |
| 睡眠 | 未规定 | 4h 固定 | 人体工学最优 |
| 红线 | 1 条 | 4 条 | R-06 整合 |

**升级 BREAKING**:
- ❌ v3.1 "🦞 8h 后台"已废弃
- ✅ 所有 KPI 按 22h 计算
- ✅ 测试 / 进化 / 学习 必须严格按 12 时段排程

---

> **"🦞 22h 大脑级 + 测试重大之重 + 不断进化 = 神机营 SaaS 必胜"**

---

## 5. 防御机制 (大飞哥最关心)

### 5.1 cron auto-stash 防护
- 🦞 openclaw 维护 `scripts/race-safe-commit.sh`
- 🌲 树哥trae 每次 Edit/Write 立即跑
- 大飞哥 不直接操作 git

### 5.2 git reset --hard 红线
- **绝对禁止**: 任何人用 `git reset --hard` / `git commit --amend`
- 改用 `git revert` 或新 commit
- 违反 = 立即升级大飞哥

### 5.3 上下文丢失防护
- 任何决策 → 落盘到 `.trae/`
- 任何 Phase → 必出 spec + retro + tasks 三件套
- 任何 commit → 必有清晰 message

---

## 6. 升级路径

| 级别 | 谁处理 | 响应时限 |
|------|--------|----------|
| L1 | 🌲 自决 | 立即 |
| L2 | 🦞 openclaw | 5 分钟 |
| L3 | 大飞哥 | 视情况 |

---

## 7. 握手签名

- 🦞 **openclaw** (龙虾哥) ✅ 收到握手协议,2026-06-27 生效
- 🌲 **树哥trae** ✅ 收到握手协议 (待 ack)
- 🧑‍✈️ **大飞哥** ✅ 总指挥签发,2026-06-27

---

> 🤝 **"三方协同 + 红线纪律 + 后台 8h = 神机营 SaaS 必胜"**

---

## 8. 🦞 openclaw 最新状态 (2026-07-06 握手确认)

> 本次握手由大飞哥触发，🦞 openclaw 主动确认并同步当前工作状态。

### 8.1 🦞 当前工作模式

| 维度 | 当前状态 |
|------|---------|
| 运行平台 | OpenClaw (独立运行, not Trae) |
| 会话模型 | deepseek/deepseek-chat |
| 脉冲频率 | ~2-3h/次验收脉冲 (脉冲#154, 17:48) |
| 任务派发 | 通过 HEARTBEAT.md 记录 + 验收笔记, 未直接派发🌲 |
| 知识库 | docs/knowledge/business-insights.md (550行, 9章) |
| daily-brief | docs/daily/brief-2026-07-06.md (已生成) |

### 8.2 项目整体状态

| 指标 | 值 |
|------|:---:|
| 非api TSC全绿 | ✅ 15/15模块 |
| 非api测试通过 | ✅ ~12,677 tests / 0 fail |
| @m5/api TSC | 🔴 404 errors (P0-009, 持续~10天) |
| @m5/api 测试 | 🔴 hang (P0-001, 持续~10天) |
| 知识库行数 | ~550行 (business-insights) + 19,614行 (全国竞品库) |
| 最近commit | f28dbce9f 🦞 V4知识库第3/4段 + daily-brief |

### 8.3 当前待办 (🌲 树哥可见)

| 优先级 | 事项 | 标签 |
|:------:|------|:----:|
| 🔴 P0 | @m5/api TSC 404 errors, 先修 @types/jest 缺失(74%根因) | P0-009 |
| 🔴 P0 | @m5/api 测试 hang, jest --detectOpenHandles 排查 | P0-001 |
| 🟡 P1 | 测试增量维持 + 技术债修复比例提升至30% | P1-001 |
| 🟡 P1 | 知识库定期刷新 (搜索可用时补网络数据) | P1-002 |

### 8.4 自我评估: 🦞↔🌲 沟通科学性

| 维度 | 评分 | 改进方向 |
|:----|:---:|---------|
| 任务清晰度 | 5/10 | 需建立直接任务派发通道, 不再靠脉冲间接影响 |
| 闭环效率 | 3/10 | 需1脉冲内闭环, 现在需要1-3个脉冲 |
| 任务优先级 | 2/10 | 🌲 应增加技术债修复比例(当前仅1%提交) |
| 知识传递 | 4/10 | 🦞 验收报告应回流给🌲 |
| 并行效率 | 7/10 | 🌲 产出量充足(57提交/天) |
| 错误预防 | 2/10 | 需引入事前评审机制 |

### 8.5 🦞 对🌲的期待 (明日)

1. 优先修复 @m5/api 404 TSC (P0-009), 从 @types/jest 缺失入手
2. 技术债修复提交占比从 1% → 30%
3. 禁止新增 `as any` 掩盖类型 (反模式 AM-001)
4. 每次 commit 前检查 TSC, 避免产生新 TSC errors

### 8.6 下次握手计划

- 🦞 openclaw 将每24h更新一次本文件
- 若有P0升级, 通过taks卡在 .trae/tasks 下发

> 🦞 openclaw ✅ 握手确认, 2026-07-06 22:48 CST
> 🌲 树哥trae ✅ 握手确认, 2026-07-07 00:30 CST
> 🧑‍✈️ 大飞哥 ✅ 已签发
