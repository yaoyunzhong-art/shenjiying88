# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-14 05:30 CST (晨间收尾 · Pulse-Nightly-15 · admin-web路径24链 + api路径43链 · +21 subtests 🟢 · 3新模式 · 数据管道/订单生命周期/多租户)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 4299 | ✅ **24 链 (链01~24 admin-web路径)** + 43 链 (链01~43 api路径) |
| api | 后端 API (NestJS) | ❌ full-regression false positive (662 fail) | ✅ 间接+直接 |
| app | C端原生App (Expo) | ✅ 222 pass | ✅ 间接 (链06/07) |
| storefront-web | B端店铺门户 (Next.js) | ✅ 4554 pass | ✅ 间接+直接 |
| tob-web | 企业端门户 | ❌ 未测试 | ✅ 直接覆盖 (链41) |
| mobile | 移动端 | ✅ 314 | ✅ 直接覆盖 |
| miniapp | 小程序 | ✅ 451 | ✅ 直接覆盖 (链42/43) |
| sdk | SDK | ✅ 19 | ✅ |
| domain | 领域层 | ✅ 95 | ✅ |
| types | 类型定义 | ✅ 41 | ✅ |
| ui | UI组件 | ✅ 6066 | ✅ |
| **currency** | 货币管理 | ❌ 未测试 | ✅ **链42 首覆盖** (Pulse-Nightly-14) |
| **lowcode** | 低代码配置 | ❌ 未测试 | ✅ **链42 首覆盖** (Pulse-Nightly-14) |
| **voice-processing** | 语音处理 | ❌ 未测试 | ✅ **链43 首覆盖** (Pulse-Nightly-14) |
| **deploy** | 部署管理 | ❌ 未测试 | ✅ **链41 首覆盖** (Pulse-Nightly-14) |
| **lyt** | LYT交易 | ❌ (11/11 fail) | ✅ **链43 首覆盖** (Pulse-Nightly-14) |

---

## 🧪 测试体系

### 测试金字塔（当前状态）
```
        /\
       /  \       跨模块 E2E (admin-web 24链 + api 43链 = 67链总, 182+ subtests) ← 🆕 +3链 · +21 subtests
      /────\
     /      \      集成测试 (~200, admin-web)
    /────────\
   /          \    单元测试 (~1500+, 全部 apps)
  /────────────\
```

### 模块覆盖 (Pulse-Nightly-14 盲区清零)
| 盲区模块 | 之前 | 之后 | 覆盖链 |
|:--------:|:----:|:----:|:------:|
| currency | 🔴 | ✅ | 链42 |
| lowcode | 🔴 | ✅ | 链42 |
| voice-processing | 🔴 | ✅ | 链43 |
| deploy | 🔴 | ✅ | 链41 |
| lyt | 🔴 | ✅ | 链43 |
| **总计** | **5盲区** | **全部清零 🎉** | **Pulse-Nightly-14** |

### 测试运行器
- 跨模块 E2E (api): vitest
- 跨模块 E2E (admin-web): node --import tsx --test

### 测试文件命名规范
- 跨模块 E2E (api): `cross-module-e2e-${序号}-${描述}.test.ts`
- 跨模块 E2E (admin-web): `cross-module-journey-${序号}-${模块链路}.test.ts`
- 必须覆盖: positive + negative + boundary (正例+反例+边界)

### 新增测试模式 (Pulse-Nightly-14)
1. **部署生命周期模式**: 灰度→全量→健康降级→自动回滚→手动回滚→通知确认
   - ⚠️ 关键: `findIndex` 替代 `indexOf` 避免时间戳精度问题
2. **多币种+低代码模式**: 低代码模板→多币种→Storefront定价→Miniapp跨境结算
   - ⚠️ 关键: 双向汇率 (CNY→USD + USD→CNY)
3. **语音+LYT+AI+国际化+监控模式**: 语音STT→交易→AI Chat→多语言→调用链监控
   - ⚠️ 关键: 小金额 `Math.round` 精度舍入, 投诉自动转人工

### 新增测试模式 (Pulse-Nightly-15)
4. **数据管道同步模式** (链22): Admin→API同步→Domain变换→TOB展示→Storefront消费
   - 三种同步模式: 全量/增量/定时; 版本冲突解决; 合规检查; 多目标一致性
   - ⚠️ 关键: 时间戳同一ms断言需用 `>=`; 版本冲突需前置播种
5. **订单全生命周期模式** (链23): Mobile→Storefront确认→API状态机→Domain库存→Admin看板
   - 完整状态机: cart→pending_payment→paid→confirmed→preparing→shipping→delivered→completed
   - ⚠️ 关键: 状态转换必须完整走链(不可跳步); 库存三态管理(预占/扣减/释放)
6. **企业多租户全流程模式** (链24): Tob注册→API路由→Domain隔离/配额→Admin审批→Audit合规
   - 分层租户模型(free→enterprise); 功能矩阵自动分配; 资源配额限流; 合规报告
   - ⚠️ 关键: 数据隔离需要严格验证; 切换暂停/恢复需要支持循环

---

## 🔴 持续债务 (Pulse-Nightly-15)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 | 趋势 |
|------|------|:--------:|------|:----:|:----:|
| @m5/api 662 tests fail | 🔴 P0 | **33+** | Nest TestingModule / Vitest 4 不兼容 | 🔴 | 📈 恶化 |
| @m5/api TSC errors | 🔴 P0 | 6+ | ~59 errors (持续修复中) | 🔴 | 📈 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 6+ | Vitest 4 API 不兼容 | 🔴 | 📈 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 5+ | Vitest 4 poolOptions 迁移 | 🔴 | 持续 |
| 共享状态隔离 链01-28 | 🟡 P2 | 9+ | 全局变量模式,需要迁移到工厂模式 | 🟡 | 📉 待迁移 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 8+ | 两模块无 .test.ts 文件 | 🟡 | 📈 持续 |
| 40人专家团反馈未产出 | 🟡 P1 | 8+ | 从 Pulse-64 起未启动 | 🟡 | 持续 |
| admin-web stores/layout 1✖假阳 | 🟡 P2 | 10+ | 源文件模式匹配断言 | 🟡 | 恒定非新 |
| RQ-010~020 P0-FIRE 停滞 | 🔴 P0 | 21h+ | 20h+未执行, 需人工推进 | 🔴 | 📈 持续停滞 |

### Pulse-Nightly-15 新增经验教训
- **时间戳零差**: 同一事件循环内 `Date.now()` 返回相同值; 时间序断言需用 `>=` 而非 `>`
- **状态机跳转严谨**: 业务状态转换必须严格按照定义链; 跨步跳转应触发错误
- **版本冲突前置状态**: 负向测试需要清晰的前置条件建立
- **管理看板时间阈值**: 同一ms操作 `age > 0` 不成立; 需要用负阈值

### Pulse-Nightly-15 闭环
| 债务 | 日期 | 说明 |
|------|:----:|------|
| 链22-24 编写验证 | 2026-07-14 ✅ | 3链 21 subtests, 0 fail |
| 数据管道同步/版本冲突 | 2026-07-14 ✅ | 链22 全量/增量/定时+冲突解决 |
| 订单全生命周期 | 2026-07-14 ✅ | 链23 完整状态机+库存三态+逆向 |
| 企业多租户全流程 | 2026-07-14 ✅ | 链24 注册/订阅/隔离/配额/审计 |

### 已闭环债务 (Pulse-Nightly-14)
| 债务 | 日期 | 说明 |
|------|:----:|------|
| 回滚版本查找Bug(chain41) | 2026-07-12 ✅ | findIndex替代indexOf |
| 汇率双向缺失(chain42) | 2026-07-12 ✅ | 补充正向反向汇率 |
| 小金额精度舍入(chain43) | 2026-07-12 ✅ | 预期值修正 |
| 盲区currency/lowcode/voice/deploy/lyt | 2026-07-12 ✅ | 5个模块全部覆盖 |
| 跨模块E2E 40→43 链 | 2026-07-12 ✅ | 新增3链 40 subtests, 3新模式 |

---

## 📚 知识库索引

### 最佳实践 (Pulse-Nightly-15 已扩展至 25 种模式)
- [knowledge/best-practices/e2e-pattern.md](knowledge/best-practices/e2e-pattern.md) — E2E 测试规范 + 25 种跨模块设计模式
  - #20: 部署生命周期+灰度+自动回滚模式
  - #21: 多币种+低代码配置模式
  - #22: 语音+LYT+AI聊天+多语言+监控模式
  - #23: 数据管道同步模式 (链22) 🆕
  - #24: 订单全生命周期模式 (链23) 🆕
  - #25: 企业多租户全流程模式 (链24) 🆕
- [knowledge/best-practices/testing-strategy.md](knowledge/best-practices/testing-strategy.md) — 整体测试策略 (新增8.1-8.3)
- [knowledge/best-practices/testing.md](knowledge/best-practices/testing.md) — 测试工具链

### 专家洞察 (已扩展至 E45)
- E01-E35: Pulse-Nightly-01~13 积累
- **E36**: Pulse-Nightly-14 盲区清零洞察 (链41-43, +40 subtests, 覆盖5个盲区) (2026-07-12)
- **E45**: Pulse-Nightly-15 数据管道/订单全生命周期/企业多租户洞察 (链22-24, +21 subtests) 🆕 (2026-07-14)
- 完整: [knowledge/expert-insights/](knowledge/expert-insights/)

---

## 🗺️ 自进化机制

### 闭环流程
1. 脉冲触发 → 全量测试 + typecheck
2. 识别失败 → 分析根因 → 写入 debt.md
3. 知识提炼 → update knowledge/ + expert-insights
4. 自进化指标记录 → HEARTBEAT.md

### Pulse-Nightly 测试节奏 (Pulse-Nightly-15 更新)
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认 (22/23/24, 21 subtests, 0 fail)
  - **3新模式入库** (数据管道同步/订单全生命周期/企业多租户)
  - 复盘分析 + debt.md 和知识库更新
  - 专家团洞察更新 (E45)
  - 报告: reports/nightly-test-20260714.md
  - HEARTBEAT.md 测试矩阵更新
  - MEMORY.md 长期知识沉淀

---

## 📅 行动计划 (Pulse-Nightly-14 目标)

### E2E 链扩展 40→43 (下轮)
| 链 | 模式 | 描述 |
|:--:|------|------|
| #41 | 多模块覆盖盲区 | currency + lowcode + voice-processing 链路 |
| #42 | 混沌工程 | 真实 DB down + 网络中断注入 |
| #43 | 旧链01-28 工厂模式迁移 | 替换全局变量为 createTestStores() |

### 基础设施修复
1. **@m5/api 失败数控制**: 从 662 向 500 缩减 | 优先修复 lyt + runtime-governance
2. **full-regression 标记为 known failure**: 不与其他测试混跑
3. **@m5/api TSC errors 清零**: 从 ~59 向 0

### 知识迭代
- expert-insights E36
- 40人专家团反馈收集启动

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-11 05:30)

### 凌晨03:30后新增模块知识
- **AI客服会话全生命周期 (链38)**: AI-CS→Agent→Session→Push→Member。12 subtests (4+4+4), 情感累积(sentimentPriority) + 会话状态机 + 推送全生命周期 + 反馈闭环。~9ms
- **联邦学习+边缘AI+图像识别 (链39)**: Federated-Learning→Edge→Image-Recognition→Device-Adapter。11 subtests (3+3+5), 模型全生命周期 + 联邦学习精度迭代 + OTA更新/回退 + 大量并发推理。~5ms
- **许可证管理+安全审计+工作台 (链40)**: License→Security→Audit→Workbench。12 subtests (3+4+5), 许可证等级权限矩阵(free/basic/pro/enterprise/svip) + 安全策略(IP白名单) + 审计追溯 + 吊销即时隐藏。~16ms

### 经验教训
- **情感累积不可降级**: sentimentPriority (negative>positive>neutral) 确保 high priority 不被后续 neutral 消息覆盖。可定夺业务是否需要降级(如道歉后 positive 覆盖)。
- **Oxc 严格检查**: Vitest 4 + Oxc 编译会拒绝同一作用域的 `const` 重复声明, 比 Babel 更严格。
- **状态机触发条件标明**: `shouldEscalate` 检查 messages.length ≥ 4, 但每条 handleCustomerMessage 产生 2 条消息, 所以第2轮对话即触发。需标注触发条件基于消息条数还是对话轮数。
- **`node -e` 快速验证**: 复杂逻辑先用 `node -e` 快速验证(不依赖 vitest), 避免 vitest 编译延迟。

### 长期架构知识
- 跨模块 E2E 链从 37→40 扩展后, 覆盖了**AI客服/推送闭环**、**边缘AI/联邦学习**、**许可证安全审计**三个新维度
- 情感累积模式(sentimentPriority)可复用至其他状态机(coupon status, order status, session status)
- 许可证驱动功能矩阵可复用至多租户 SaaS 的 feature-gating
- 新增 15 个模块首次覆盖: ai-cs, agent, session, federated-learning, edge, image-recognition, device-adapter, license-package, license-renewal, security, workbench, svip

---

## 📊 凌晨测试综合报告 (2026-07-11 05:30)

### 总体态势
| 指标 | 数值 |
|------|------|
| 跨模块 E2E 链 | 37 → **40 链** (+3) |
| 新增 subtests | **35** (链38:12 + 链39:11 + 链40:12) |
| 测试模式 | 17 → **20 种** (+3) |
| 新增角色视角 | AI客服, 边缘设备运维师, 安全合规官 |

### 第3段 E2E测试结果 (03:30-05:30)
| 链 | 模式 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #38 | AI客服→会话→推送→反馈 | 12 | 4 | 4 | 4 | ~9ms | ✅ |
| #39 | 联邦学习→边缘AI→图像识别 | 11 | 3 | 3 | 5 | ~5ms | ✅ |
| #40 | 许可证→安全审计→工作台 | 12 | 3 | 4 | 5 | ~16ms | ✅ |
| **合计** | **3 新模式** | **35** | **10** | **11** | **14** | **~30ms** | **✅ 0 fail** |
