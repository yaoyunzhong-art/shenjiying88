# 📘 Pulse-Nightly-11 经验教训 · 2026-07-09

> 跨模块 E2E 扩展 31→34链 · +29 subtests · 0 fail · 3 种新模式

---

## 新增跨模块模式

### 1. Nest TestingModule 真实集成 (链32)
**核心设计**:
- DI 风格的 Service 分层: IoT Service (数据层) → Edge Service (推理层) → Realtime Service (协同层) → Lineage Service (审计层)
- 每个 Service 使用独立的 Store (Map/Array), `resetAllStores()` 统一清理
- 正例: 设备注册 → 数据上报 → Edge推理 → Realtime事件 → Lineage血缘全链路
- 反例: 未注册设备/空数据/重复注册/离线设备
- 边界: 极端温度/高湿度/批量设备

**经验**: DI 风格测试比 inline 单层函数更接近真实 NestJS 体验, 适合作为后续链升级模板

### 2. AI 内容审核工作流 (链33)
**核心设计**:
- 审核状态机: draft → pending_ai_review → ai_approved/ai_rejected → approved/rejected → published
- 三种角色: author (提交), system_ai (自动审核), human_reviewer (人工复核), editor_in_chief (发布)
- AI 审核规则: 敏感词检测 (4个关键词) + 质量评分 (最小字数10) + 合规检测 (product_desc 特殊要求)
- 审计日志: 每个状态变更都记录 `ApprovalRecord`, 可追溯完整审核历史

**经验**:
- `submitForReview()` 内部包含两步操作 (状态变更→AI审核), 审计日志记录 2 条
- AI 驳回后 `reSubmitAfterRejection()` 自动回到 draft → 再次 `submitForReview()`
- 使用 `passed = flags.length === 0 || (no_high_severity && score >= 70)` 防止低质量内容阻断

### 3. 故障注入 + 降级恢复 (链34)
**核心设计**:
- `setRegionStatus()` + `performHealthCheck()` 分离故障注入与检测
- `autoRespondToFault()` 编排层: 根据故障类型+严重度自动选择降级策略
- 降级策略: failover, stale_cache, read_only, global_fallback
- 审计追溯: 每次策略激活/去激活都记录 `DegradationRecord`

**经验**:
- 多区域同时 critical 故障自动触发全局兜底
- 抖动场景: up→down→up 的快速切换, 审计记录累积正确
- 故障恢复后健康检查自动恢复, 延迟回归正常

## 测试注意事项

### 审计日志断言
- `re_submit` 操作不是独立的 audit action, 而是通过 `submit_review` 记录 (因为 `reSubmitAfterRejection()` 内部调用 `submitForReview()`)
- 每次审核提交产生的审计记录: 1 (submit_review) + 1 (ai_review)

### 故障注入测试技巧
- 使用 `performHealthCheck` 等待异常检测, 而非直接断言状态
- 严重度 `critical` + 类型 `region_down` 才会触发 failover 策略
- 两个及以上 region 同时 critical → 全局 fallback

### 内容审核测试技巧
- 敏感词大小写检测使用 `bodyLower`
- quality_low (中严重度) + 无其他高严重度 flag → score=80 → passed=true
- 测试"驳回→重提→再审核→发布"流程时注意版本号递增

## 新 E2E 链文件位置

```
apps/api/src/modules/cross-module/
  cross-module-e2e-32-nest-testing-module-integration.test.ts  (9 subtests)
  cross-module-e2e-33-ai-content-review-workflow.test.ts      (11 subtests)
  cross-module-e2e-34-fault-injection-graceful-degradation.test.ts (9 subtests)
```

## 运行命令

```bash
# 单链运行 (api 模块)
cd apps/api && npx vitest run --reporter=verbose src/modules/cross-module/cross-module-e2e-32-*.test.ts

# 全部新链
cd apps/api && npx vitest run --reporter=verbose src/modules/cross-module/cross-module-e2e-3[2-4]-*.test.ts
```
