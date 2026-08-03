# 🧠 G1-G4 专家晨学简报 · 2026-07-20 (周一)

> **V22 Monday · 总 2,267 commits · TSC 全系统 0 ✅ · 工作区干净**
> 专家组: G1架构(E1陈架构+E44周技术) · G2安全(E2李安全+E36卫审计+E38沈监管)
>          G3收银(E3马收银+E19王支付+E25杨会员+E13黄交易) · G4营销(E4黄营销+E14邓增长+E32周推广+E26陈忠诚)
> 签署时间: 08:00-08:45 CST · 产出: 本简报 + Gate1签署

---

## 一、🏛️ 今日「六门」签署预备

### Gate 1: 架构+安全 — 今日事前签署 (见第二节)

### Gate 2: 对口业务签署 — 待今日任务产出后签
| 待签项 | 状态 | 责任人 |
|:-------|:----:|:-------|
| P-31 RLS Controller 集成示例 | 🔴 未开工 | E44 → 树哥 |
| P-37 procurement 采购详情+审批 | 🔴 未开工 | E19 → 树哥 |
| P-38 财务面板联表增强 | 🔴 未开工 | E42 → 树哥 |

### Gate 3-G6: 午间/晚间完成
| Gate | 时段 | 专家组 |
|:----|:----:|:-------|
| 🟢 Gate3 数据+AI | 14:00午会 | E5赵数据+E9吴AI |
| 🟢 Gate4 体验+租户 | 14:00午会 | E7孙体验+E40杨客户 |
| 🟢 Gate5 合规+财务 | 20:00晚会 | E36卫审计+E2李安全 |
| 🟢 Gate6 审计+监管 | 20:00晚会 | E38沈监管+E6刘合规 |

---

## 二、🏛️ G1 架构组 · 技术事前签署 (Gate1)

### L1 行业学习 — 多租户安全架构
**PostgreSQL RLS + 零信任网关 · 2026 行业最佳实践**

1. **数据库层隔离 > 应用层隔离** — PostgreSQL RLS 是目前多租户 SaaS 首选的隔离层。即使应用层 bug，RLS 仍可在数据库层拦截跨租户数据泄露，减少跨租户漏洞 90%+。
2. **NIST SP 800-207 零信任架构** — 永不信任、始终验证、最小权限。支付网关需：每请求身份验证、基于策略的访问控制、持续监控。
3. **每租户连接池** — 行业趋势从"共享数据库+RLS"向"每租户连接池"演进，以应对 PCI-DSS 等高合规场景。

### M1 晨间签阅 — V22 凌晨架构交付
| 检查项 | 状态 |
|:-------|:----:|
| PaymentGateway Controller TenantGuard 注入 | ✅ `94eabd504` |
| 4 端点签名添加 tenantId header | ✅ |
| 测试适配新签名 | ✅ |
| TSC 零错误 | ✅ |

### 发现风险
| # | 风险 | 等级 | 优先级 |
|--|------|:----:|:------:|
| 1 | **PaymentGatewayService 缺 tenantId 透传** — pay/query/refund 方法未接受 tenantId | 🔴 | P0 今日关闭 |
| 2 | **支付网关表未接入 RLS** — 无数据库层兜底 | 🔴 | P0 本周 |
| 3 | TenantGuard 依赖单一 header，无 fallback token | 🟡 | P1 |
| 4 | query.tenantId 兜底选项不安全 (access log 泄漏) | 🟡 | P1 |

### 💡 今日架构行动项
1. **P0** `PaymentGatewayService.pay/query/refund` 增加 `tenantId` 参数 → 交易记录写入 tenantId
2. **P0** 将 payment_gateway 相关表纳入 RLS 保护范围
3. **P1** TenantGuard 移除 `query.tenantId`，仅接受 header
4. **P2** 添加 RLS verify 端点，每周 cron 扫描

### 📊 架构评分
| 维度 | 评分 | 说明 |
|------|:----:|------|
| 多租户隔离完整性 | 🟡 | Controller 已修，Service 有 gap |
| RLS 覆盖度 (11/53 model) | 🟡 | 19 model 无 tenantId |
| 零信任成熟度 | 🟡 | 单层验证 |
| V22 交付质量 | ✅ | 4 端点 + 测试全部通过 |

> **签署**: G1 架构组 ✅ — 条件通过，P0 问题需今日关闭

---

## 三、🔐 G2 安全组 · 安全事前签署 (Gate1+Gate5)

### L1 行业学习 — 安全基线合规 · 2026 审计准备
1. **2026 SaaS 安全基线** — 审计要求从"是否实施"转向"是否可证明"(auditable evidence)
2. **数据隔离三等级**: L1 应用层(Guard) → L2 数据库层(RLS) → L3 基础设施层(连接池)
3. **GDPR/CCPA 2026**: 新增"数据驻留地图"(Data Residency Map) — 需记录每张表/每租户的数据位置
4. **渗透测试自动化** — SOC 2 Type II 标配，CI/CD 安全扫描+退出码门禁

### M1 晨间签阅 — V22 安全修复
| 修复项 | Commit | 状态 |
|--------|--------|:----:|
| PaymentGateway 跨租户修复 | `94eabd504` | ✅ |
| TenantGuard 注入 | `94eabd504` | ✅ |
| Cashier SDK 去 Mock | `12d77daf0` | ✅ |
| POS/checkout/payment/refund E2E | `84e5ecef9` | ✅ |
| 权限链审计脚本 | `28e7e9fc4` | ✅ |
| 金额对齐检查脚本 | `28e7e9fc4` | ✅ |

### 安全基线对比
| 基线项 | 上日 | 今日 | 变化 |
|--------|:----:|:----:|:----:|
| AuthGuard 覆盖率 | ⚠️ 182/189 | ⚠️ 182/189 | → |
| RLS 保护表 | 11 | 11 | → |
| deviceToken 持久化 | ❌ 全内存 | ❌ 全内存 | → |
| 未成年保护 | ⚠️ 仅前端 | ⚠️ 未变化 | → |
| 渗透测试退出码 | ✅ 0 | ✅ 0 | → |

### 🔴 高优先级风险
| # | 风险 | 等级 | 优先级 |
|--|------|:----:|:------:|
| 1 | **AuthGuard 默认放行** — 182/189 Controller 无显式 Guard | 🔴 | P0 本周 |
| 2 | **deviceToken 无持久化** — 推送服务全内存，重启即丢 | 🔴 | P1 本周 |
| 3 | 19 个 model 无 tenantId | 🟡 | P1 |
| 4 | PaymentGateway Service tenantId 未透传 | 🟡 | P0 今日 |

### 💡 今日安全行动项
1. **P0** IdentityAccessGuard 改为默认拒绝 + `@Public()`装饰器
2. **P1** deviceToken 持久化 → DB/Redis
3. **P1** 19 个 model 补充 tenantId + RLS 迁移
4. **P1** PaymentGatewayService 补充 tenantId 审计日志

### 📊 安全评分
| 维度 | 评分 | 说明 |
|------|:----:|------|
| 跨租户隔离 | 🟡 | Controller已修，Service有gap |
| 安全基线 (10/10项) | ✅ | 全部覆盖，2项高风险 |
| AuthGuard 覆盖率 | 🟡 | 默认放行风险 |
| 渗透测试自动化 | ✅ | CI/CD正常 |
| V22安全交付 | ✅ | 修复全完成 |

> **签署**: G2 安全组 ✅ — 条件通过，AuthGuard 默认放行问题需本周攻坚

---

## 四、💰 G3 收银组 · 业务事前签署

### L1 行业学习 — POS 收银 + 支付链路最佳实践
1. **POS Offline-First 架构** — 本地缓存商品/会员/价格，网络恢复后批量同步。核心: 事件溯源 + 冲突检测 + 离线队列
2. **支付链路隔离** — Cashier(订单流)与 PaymentGateway(资金流)职责分离，通过 `orderId/transactionId` 关联
3. **多币种+动态税务** — 实时汇率+锁定汇率、多币种结算、多 jurisdiction 区域税率

### M1 晨间签阅 — P-38 Finance + currency/tax + Cashier
| 模块 | 测试数 | 状态 |
|:-----|:------:|:----:|
| Finance 全模块 | 2,881 | ✅ 完整 ledger/account/settlement/invoice |
| Currency 引擎 | 20+ files | ✅ 全测试覆盖 |
| Tax 引擎 | ✅ 有测试 | 🟡 TaxPolicyConfig 无 tenantId |
| Cashier | 1,333 / 37 files | ✅ 完整 CRUD + offline + billing + tenant |
| POS E2E | `84e5ecef9` | ✅ POS/checkout/payment/refund 全链路 |

### 🔴 风险
| # | 风险 | 等级 | 优先级 |
|--|------|:----:|:------:|
| 1 | Cashier 内存 seed data → 需切换真实 DB | 🟡 | P0 |
| 2 | TaxPolicyConfig 无 tenantId | 🟡 | P1 |
| 3 | Finance 对账 MVP stub (WeChat/Alipay adapter 开发 Secret) | 🟡 | P1 |
| 4 | Currency 无汇率锁定 — 跨交易汇率变化风险 | 🟡 | P1 |
| 5 | Finance 全内存 (ledger/account/settlement/invoice) | 🟡 | P0 — 今天行动 |

### 📊 收银链路评分
| 维度 | 评分 | 说明 |
|------|:----:|------|
| Cashier 完整性 (27 src) | ✅ | 完整 |
| P-38 Finance | ✅ | 全模块完成 |
| Currency 引擎 | ✅ | 多币种 |
| Tax 引擎 | 🟡 | 缺 tenantId |
| Cashier 测试 | ✅ | 1,333 tests |
| V22 POS E2E | ✅ | 全链路 |

> **签署**: G3 收银组 ✅ — 条件通过，Finance 需从内存迁移 DB

---

## 五、📢 G4 营销组 · 业务事前签署

### L1 行业学习 — 促销引擎架构 + 营销预算管理
1. **促销引擎三层**: Level 1 单次促销 → Level 2 复合促销(行业当前阶段) → Level 3 AI驱动促销
2. **预算管理三阶段**: 阶段1 手动(当前) → 阶段2 自动分配 → 阶段3 AI动态优化
3. **行业数据**: Arcade 全球市场 USD 11.8B (2026) → USD 31.0B (2033), CAGR 14.8% (Grand View Research)
4. **五个主流趋势**: 赛车模拟器VR集成 / 无现金RFID支付 / 兑换游戏支配 / 亚太扩张 / AI远程诊断

### M1 晨间签阅 — Promotions + Budget + Marketing
| 模块 | 测试数 | 状态 |
|:-----|:------:|:----:|
| Promotions (storefront 5页) | 69 tests / 7 files | ✅ 前端完成 |
| Budget (admin) | 83 tests | ✅ 状态机+乐观锁+幂等 |
| api/marketing | ✅ | CRUD + role 测试 |
| api/ai-marketing | ✅ | 28 test files |
| api/campaign + coupon + loyalty | ✅ | 完整 |
| Promotions-adjustments 报表 | `77d86304e` | ✅ 新增 |
| Campaign-rules skeleton | `dc31410b1` | 🟡 填充完成待后端 |

### 🔴 风险
| # | 风险 | 等级 | 优先级 |
|--|------|:----:|:------:|
| 1 | Budget 页 668 行全 mock 数据，无真实 API | 🟡 | P0 今日 |
| 2 | Promotions 页全 mock (`STORE_NAMES` 等硬编码) | 🟡 | P0 今日 |
| 3 | Campaign-rules 未接真实 API | 🟡 | P1 |
| 4 | Budget 状态机无前端非法跳转 guard | 🟡 | P1 |
| 5 | ROI 计算口径不一致 (marketing-audit.md) | 🟡 | P2 |

### 📊 营销评分
| 维度 | 评分 | 说明 |
|------|:----:|------|
| Promotions 前端 | ✅ | 5页完整, 搜索/CRUD/状态 |
| Promotions 测试 (69) | ✅ | 7 test files |
| Budget 前端 (668行) | ✅ | 状态机+乐观锁 |
| Budget 测试 (83) | ✅ | 全维度 |
| 后端 API | ✅ | 5模块完整 |
| 真实 API 集成 | 🟡 | 全部 mock |
| Campaign-rules | 🟡 | skeleton 待接线 |

> **签署**: G4 营销组 ✅ — 条件通过，重点: 前端 mock → 真实 API

---

## 六、📰 L1 行业动态 (自助游戏/街机/娱乐零售经营趋势)

### 摘要: 2026 年全球街机行业五大趋势

**1. 全球市场高速增长**
- 街机游戏机市场 2025 年 USD 110 亿 → 2026 年 USD 118 亿 → 2033 年 USD 310 亿
- CAGR 14.8% (Grand View Research 2026)
- 北美 39.3% 收入份额领跑，亚太增速最快
- 兑换游戏(redeemption games)占市场最大份额 29.2%

**2. VR/沉浸式体验成为核心锚点**
- Meta Quest 3 / PS VR2 推动共享空间多人VR (4-6人协作)
- 赛车模拟器 + VR 集成在 FEC 中生成 **USD $500-900/台/月**
- 实感射击机（后坐力+动态座椅）打造家用不可复制的体验

**3. 无现金支付 -> 收入增长驱动器**
- RFID 卡/QR码/NFC 取代硬币，消除交易摩擦
- AMOA 数据: 无现金系统平均单次充值金额 > 硬币
- Embed+Windcave 合作(2025.06) 将无现金支付推广到无人自助街机
- 玩家数据云端保存，获知访问频率/游戏偏好

**4. 亚太快速扩张 + 社交化消费场景**
- 中国/日本/越南/马来西亚/印尼为中心
- 购物中心 → 娱乐区改造: 从零售转向体验消费
- 街机酒吧(barcade)概念在 UK 回本周期 10 个月(行业均值 12-18月)
- 多玩家联机游戏(篮球/气垫球/射击)带来社交竞争价值

**5. AI + 物联网运维智能化**
- IoT 传感器实时监控机器能耗/循环数/错误码
- 云仪表板远程看多店铺收入
- AI 推荐机器摆放位置/促销时间/预防性维护
- 设备无人化自主收入采集成为标配

### 对 shenjiying88 的启示
| 趋势 | 系统对应模块 | 当前成熟度 |
|:-----|:------------|:----------:|
| 无现金支付 | PaymentGateway / Cashier / Checkout | ✅ 基础支持 |
| Offline-First POS | Cashier offline-sync (2 files) | ⚠️ 需强化 |
| 多币种 | Currency 引擎 | ✅ 已上线 |
| 促销引擎 (Level 2→3) | Campaign-rules / ai-marketing | 🟡 骨架阶段 |
| AI 运维诊断 | Monitor / AI analytics-v2 | 🟡 基础 |
| 社交化/联机 | 设备关联欠缺 | ❌ 未开发 |

---

## 七、🏷️ 今日事前签署 (Gate1) — 架构+安全联合签署

### 签署概要
| 维度 | 签署 | 条件 |
|:-----|:----:|:-----|
| G1 架构组 | ✅ 条件通过 | P0: Service 层 tenantId 透传需今日关闭 |
| G2 安全组 | ✅ 条件通过 | P0: AuthGuard 默认拒绝模式需本周闭环 |
| Gate1 联合 | ✅ 条件通过 | P0 问题 deadline: 今日下午验收前 |

### 签批事项
1. **P-31 RLS Controller 集成** → 今日上午派树哥
   - 前提: G1已确认 Controller TenantGuard 已就位
   - 需补充: Service 层 tenantId 透传 + RLS 覆盖
2. **P-37 procurement** → 今日上午派树哥
   - 前提: G3签名已通过
3. **P-38 财务面板联表增强** → 今日下午派树哥
   - 前提: G3建议 Finance 从内存迁移 DB

### 签署人
```
G1架构: E1陈架构    — ✅ (条件)
G2安全: E2李安全    — ✅ (条件)
G2安全: E36卫审计   — ✅ (条件)
G2安全: E38沈监管   — ✅ (条件)
```

> **Gate1 总体判断: ✅ 条件通过**
> 架构+安全层面无阻止性障碍，V22 凌晨 48 commits 全量交付已验证通过。
> P0 问题（Service层tenantId + AuthGuard默认拒绝）要求今日内至少关闭1项。

---

## 八、📋 今日派单大纲

### 上午 (08:00-12:00)
| 优先级 | 任务 | 模块 | 前置条件 |
|:------:|:-----|:-----|:---------|
| P0 | P-31 RLS: 多租户拦截器集成到Controller示例 | api/rls + payment-gateway | Gate1已签 |
| P1 | P-37 procurement: 采购详情+审批流程 | api/procurement + admin-web | Gate1已签 |

### 下午 (12:00-18:00)
| 优先级 | 任务 | 模块 | 前置条件 |
|:------:|:-----|:-----|:---------|
| P1 | P-38 财务面板: 联表增强 | api/finance + admin-web | 上午产出验收后 |
| P1 | 测试覆盖 | 各模块 | 下午 |

### 晚间 (18:00-23:00)
| 任务 | 说明 |
|:-----|:------|
| 验收 | E2E 链 + 单元测试 0 fail |
| 日终审计 | V22 Day2 评分 + 自进化 L3 |
| Gate3-G6 签署 | 午间/晚间完成 |

### 今日 KPI 目标
| 指标 | 目标 |
|:-----|:----:|
| commits | 50+ |
| 净增行数 | 60,000 |
| TSC 全系统 | 0 |
| 测试 | 0 fail |
| 连续稳态 | 34🏆 |

---

## 九、📌 专家共识

1. **V22 凌晨交付质量高** — 48 commits, 全系统 TSC 0, 工作区干净
2. **HR完全体交付** — 84 tests / 39端点 / 3子模块, 3个缺失模块全部补齐
3. **安全修复有效** — PaymentGateway 跨租户 + Cashier 去 Mock + E2E 全链
4. **文档/脚本体系完备** — 9新文档 + 8新脚本
5. **主要 gap**: Service 层 tenantId 缺失 / Finance 全内存 / 前端 mock 数据
6. **P0 截止 7/23(周四)** — P-31 RLS + P-37 procurement

---

*🐜 G1-G4 专家晨学 · 2026-07-20 08:45 CST · V22 Monday · 产出: 本简报/Gate1签署/L1学习*
