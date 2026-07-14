# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-15 05:30 CST (晨间收尾 · Pulse-Nightly-16 · admin-web路径27链 + api路径43链 · +38 subtests 🟢 · 3新模式 · 会员积分/扫码点餐/规则引擎)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 4299 | ✅ **27 链 (链01~27 admin-web路径)** + 43 链 (链01~43 api路径) |
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
       /  \       跨模块 E2E (admin-web 27链 + api 43链 = 70链总, ~220+ subtests) ← 🆕 +3链 · +38 subtests
      /────\
     /      \      集成测试 (~200, admin-web)
    /────────\
   /          \    单元测试 (~1500+, 全部 apps)
  /────────────\
```

### 新增覆盖领域 (Pulse-Nightly-16)
| 领域 | 覆盖链 | subtests | 模式 |
|:----:|:------:|:--------:|:-----|
| 会员积分·等级·兑换·核销 | 链25 | 15 | 全链路 |
| 扫码点餐·厨房·推送·统计 | 链26 | 11 | 全链路 |
| 定时规则·告警升级·促销激活 | 链27 | 12 | 全链路 |

### 测试运行器
- 跨模块 E2E (api): vitest
- 跨模块 E2E (admin-web): node --import tsx --test

### 测试文件命名规范
- 跨模块 E2E (api): `cross-module-e2e-${序号}-${描述}.test.ts`
- 跨模块 E2E (admin-web): `cross-module-journey-${序号}-${模块链路}.test.ts`
- 必须覆盖: positive + negative + boundary (正例+反例+边界)

### 新增测试模式 (Pulse-Nightly-16)
7. **会员积分兑换模式** (链25): admin等级配置 → SDK倍数计算 → Domain规则/上限/冻结 → API查询/变更 → Storefront兑换/核销
   - ⚠️ 关键: `_now` 局部变量隔离避免作用域污染; 全等级(5级)×全行为(6种)×多金额浮点安全; 冻结/解冻循环安全
8. **扫码点餐全链路模式** (链26): Miniapp扫码 → 下单/支付 → Domain厨房队列 → Mobile Push → Admin出餐统计
   - ⚠️ 关键: 多桌并发调度不冲突; 催单超时标记; 菜品标签多维度过滤验证; 大桌总额不溢出
9. **定时规则引擎+告警升级模式** (链27): API Cron调度 → Domain条件评估(AND/多字段) → 动作执行 → 告警4级升级链 → 降噪防护 → 活动时间窗口
   - ⚠️ 关键: 规则幂等性需要状态字段保护(disabled跳过); 告警升级链info→warning→critical→emergency; 毫秒级边界activeFrom=now

### 过往测试模式 (Pulse-Nightly-14/15)
1. **部署生命周期模式**: 灰度→全量→健康降级→自动回滚→手动回滚→通知确认
2. **多币种+低代码模式**: 低代码模板→多币种→Storefront定价→Miniapp跨境结算
3. **语音+LYT+AI+国际化+监控模式**: 语音STT→交易→AI Chat→多语言→调用链监控
4. **数据管道同步模式**: 全量/增量/定时同步; 版本冲突解决; 多目标一致性
5. **订单全生命周期模式**: cart→pending_payment→paid→confirmed→preparing→shipping→delivered→completed
6. **企业多租户全流程模式**: 注册→审批→订阅→资源配额→数据隔离→审计

---

## 🔴 持续债务 (Pulse-Nightly-16)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 | 趋势 |
|------|------|:--------:|------|:----:|:----:|
| @m5/api 662 tests fail | 🔴 P0 | **34+** | Nest TestingModule / Vitest 4 不兼容 | 🔴 | 📈 恶化 |
| @m5/api TSC errors | 🔴 P0 | 7+ | ~59 errors (持续修复中) | 🔴 | 📈 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 7+ | Vitest 4 API 不兼容 | 🔴 | 📈 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 6+ | Vitest 4 poolOptions 迁移 | 🔴 | 持续 |
| 共享状态隔离 链01-27 | 🟡 P2 | 10+ | 全局变量模式,需要迁移到工厂模式 | 🟡 | 📉 待迁移 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 9+ | 两模块无 .test.ts 文件 | 🟡 | 📈 持续 |
| 40人专家团反馈未产出 | 🟡 P1 | 9+ | 从 Pulse-64 起未启动 | 🟡 | 持续 |
| admin-web stores/layout 1✖假阳 | 🟡 P2 | 11+ | 源文件模式匹配断言 | 🟡 | 恒定非新 |
| RQ-010~020 P0-FIRE 停滞 | 🔴 P0 | **26h+** | 20h+未执行, 需人工推进 | 🔴 | 📈 持续停滞 |
| now作用域污染风险 | 🟡 P2 | 1 | 同文件函数使用外层变量 | 🟡 | 已修复 |

### Pulse-Nightly-15 经验教训
- **时间戳零差**: 同一事件循环内 `Date.now()` 返回相同值; 时间序断言需用 `>=` 而非 `>`
- **状态机跳转严谨**: 业务状态转换必须严格按照定义链; 跨步跳转应触发错误
- **前置状态依赖**: 负向测试(版本冲突/非法转换)需要清晰的前置条件建立

### Pulse-Nightly-16 经验教训
- **函数内now变量隔离**: 工具函数中的 `now` 引用可能无意引用外层模块变量; 必须用 `let/const _now` 隔离
- **测试数据源一致**: 配置项(monthlyPointCap)应与数据源严格一致, 禁止硬编码魔数
- **规则引擎幂等性**: 条件触发动作后, 需要额外状态字段防止重复执行
- **兑换计数符号安全**: 扣减记录计数应使用 `filter.length` 而非 `filter.length * -1`
- **纯函数测试稳定性**: 无副作用/无全局状态的纯函数测试模式稳定性极高, 应推广至所有跨模块E2E
- **金额测试浮点安全**: 涉及金额的测试应增加全等级/全行为/多金额组合的浮点安全验证
