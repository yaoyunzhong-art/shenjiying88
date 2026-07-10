# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-11 05:30 CST · Pulse-Nightly-13
> 当前阶段: **脉冲 #298 · L3 跨模块 E2E 扩展 37→40链 · +35 subtests · 0 fail ✅ · 3新模式**

---

## 本轮新增债务 (Pulse-Nightly-13)

### P1-N13-001: @m5/api 模块测试失败持续恶化
- **发现**: Pulse-Nightly-13 凌晨测试分析
- **状态**: 🔴 新增（已有根因持续）
- **根因**: @m5/api 662 个失败 tests，集中在 full-regression (34/34 fail)、lyt (11/11 fail)、runtime-governance (4/4 fail)、foundation/integration-orchestration (3/3 fail) 等模块
- **影响**: @m5/api 已成为项目测试体系的薄弱环节
- **追踪指标**:
  - @m5/api 失败数: 662 个 (vs Pulse-272 的 ~520 个, 扩大 27%)
  - full-regression false positive: 34/34 fail (持续)
  - auto-rollback timeout: 2 tests hang at 120s timeout (持续)

### P1-N13-002: 情感累积语义测试遗漏
- **发现**: 链38 编写时初始忽略了情感状态累积逻辑（negative被后续neutral消息覆盖）
- **状态**: 🟢 已修复
- **修复**: handleCustomerMessage 增加 sentimentPriority 累积逻辑, 保留更高优先级的情感
- **经验**: 跨模块测试中的状态机/累积逻辑需要特别关注

### P1-N13-003: 新模块覆盖盲区
- **发现**: 链39/40 首次覆盖 federated-learning, edge, device-adapter, license-package, security, workbench, svip 等模块
- **状态**: 🟢 已覆盖 (12 subtests 已验证)
- **剩余盲区**: currency, lowcode, lyt, voice-processing, deploy 等模块仍无跨模块链覆盖

---

## 持续债务 (Pulse-Nightly-13 更新)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 | 趋势 |
|------|------|:--------:|------|:----:|:----:|
| @m5/api 662 tests fail | 🔴 P0 | **31+** | Nest TestingModule / Vitest 4 不兼容 / 实体模拟缺失 | 🔴 | 📈 恶化 (520→662) |
| @m5/api TSC errors | 🔴 P0 | 4+ | ~59 errors (持续修复中) | 🔴 | 📈 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 4+ | Vitest 4 API 不兼容 | 🔴 | 📈 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 3+ | Vitest 4 poolOptions 迁移 | 🔴 | 持续 |
| 共享状态隔离 链01-28 | 🟡 P2 | 7+ | 全局变量模式, 需要迁移到工厂模式 | 🟡 | 📉 待迁移 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 6+ | 两模块无 .test.ts 文件 | 🟡 | 📈 持续 |
| 执行时间未追踪 | 🟢 P3 | 4+ | 无性能退化基线 | 🟡 | 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 5+ | 仅 in-memory Map | 🟡 | 持续 |
| 非真实性能采集 | 🟡 P3 | 5+ | 链15/38/39 使用模拟估算 | 🟡 | 持续 |
| 40人专家团反馈未产出 | 🟡 P1 | 6+ | 从 Pulse-64 起未启动 | 🟡 | 持续 |

### 新增持续债务摘要 (Pulse-Nightly-13)
- **情感累积模式**: 链38 的 sentimentPriority 逻辑可作为通用模式参考
- **模块盲区**: currency, lowcode, lyt, voice-processing, deploy 仍需添加跨模块链
- **lyt 模块**: lyt.module.test.ts (7/7 fail) + lyt-connection.manager.test.ts (4/4 fail) = 11/11 fail
- **license-cache**: license-cache.service.spec.ts 2/14 fail (DB connection mock缺失)

---

## 已闭环债务 (Pulse-Nightly-13)
| 债务 | 日期 | 说明 |
|------|:----:|------|
| 链38 N4 情感累积逻辑 Bug | 2026-07-11 ✅ | sentimentPriority 累积逻辑修复 |
| 链38-40 编写验证 | 2026-07-11 ✅ | 3链 35 subtests, 0 fail |
| 覆盖 federated-learning, edge, device-adapter, security, workbench | 2026-07-11 ✅ | 链39+40 首覆盖 |

---

## 🟣 Expert Feedback (V5.1 专家反馈追踪 · N13 新增)

### EF-N13-001: 情感累积模式可复用至其他状态机测试
- **发现**: Pulse-Nightly-13 链38 开发中
- **建议**: sentimentPriority 模式可复用至其它需求状态机(coupon status, order status, session status)
- **状态**: 🟢 已验证

### EF-N13-002: OTA 更新回退测试缺口
- **发现**: 链39 B5 验证了 OTA 更新失败场景, 但未覆盖自动回滚 + 版本比较
- **状态**: 🟢 已验证
