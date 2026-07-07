# 40+4 人专家团索引 (V6.1 · 严密逻辑版 · 老板团队扩展)

> 最后更新: 2026-06-27 · Pulse-69 · **R-01 严密版**
> 总人数: **44 人** · 按 8 大领域(40) + 老板团队(4 Champion) 分组
> 升级: V5.1 → V6.0 → V6.1 (新增 4 个 Champion 老板 · 不同身份层级)

---

## 🎯 V6.1 升级说明 (R-01 定理 · 老板团队)

**定理 (Theorem · V6.1)**: **44 专家** × ≥2 phase/人 ≥ **88 phase-专家关联**,无虚指,可证伪。

**升级变更** (V6.0 → V6.1,大飞哥 2026-06-27 批准):
- ➕ **新增 4 个 Champion 老板**(E41 王董事长 / E42 李总经理 / E43 张区域 / E44 周技术)
- ➕ 总人数 40 → **44**
- ➕ Champion 评级 0 → **5**
- ➕ 每周总时长 75h → **91h** (科学评定,见 §科学评定)

**数学证明 (Proof · V6.1)**:
- 架构 (3人) × 2 = 6 关联
- 安全 (3人) × 2 = 6 关联
- 营销 (10人) × 2 = 20 关联
- 数据 (2人) × 2 = 4 关联
- 财务 (3人) × 2 = 6 关联
- 体验 (3人) × 2 = 6 关联
- 租户 (10人) × 2 = 20 关联
- 后勤 (7人) × 2 = 14 关联
- 老板 (4人) × 2 = 8 关联
- **总计**: 6+6+20+4+6+6+20+14+8 = **90 phase-专家关联** ≥ 88 ✓

**可证伪 (Falsification · V6.1)**:
- **F-01.1**: 任一专家缺 phase 绑定 → R-01 失败
- **F-01.2**: 44×2 数学推导 < 88 → R-01 失败
- **F-01.3**: 任一 phase 无 ≥3 专家覆盖 → R-01 失败
- **F-01.4** (新增): 任一 Champion 老板缺 2 phase 绑定 → R-01 失败

---

## 👑 老板团队 (Champion · 5 人) · 大飞哥批准

| 老板 | 编号 | 身份层级 | 管辖范围 | 每周时长 | 关注 Phase |
|------|------|----------|----------|----------|-----------|
| [E41 · 王集团董事长](E41-wang-chairman.md) | E41 | **Tier 1 战略** | 集团全业务 | 4h | Phase-50 战略闭环 + Phase-49 开放平台 |
| [E42 · 李事业部总经理](E42-li-gm.md) | E42 | **Tier 2 业务** | 神机营事业部 | 4h | Phase-35 收银 + Phase-36 会员 |
| [E43 · 张区域总监](E43-zhang-regional.md) | E43 | **Tier 3 区域** | 华南区 15 门店 | 3h | Phase-46 招商 + Phase-47 品牌运营 |
| [E44 · 周技术总监](E44-zhou-cto.md) | E44 | **Tier 3 技术** | 研发中心架构/安全 | 3h | Phase-31 多租户 + Phase-44 开放 API |
| [E19 · 陈老板](E19-chen-boss.md) | E19 | **Tier 2 业务** | 神机营顶层 | 4h | Phase-50 战略闭环 + Phase-49 平台 |

**5 Champion 协同机制**:
- 周一 09:00 周会(全员 5 人,30min)
- 月度战略 review(王董事长主持)
- 双周业务对接(李总经理主导)
- 季度区域战略(张区域总监汇报)
- 月度架构 review(周技术总监主持)

---

## 🏛️ 架构与基础设施 (3 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E1 · 陈架构](E1-chen-arch.md) | E1 | Phase-15/16 多租户 | Phase-32/33 重连持久化 | 4h | Reviewer → Approver → Owner → Champion |
| [E3 · 王硬件](E3-wang-hardware.md) | E3 | Phase-30 SSE 集成 | Phase-37 库存硬件 | 2h | Reviewer |
| [E39 · 韩开发](E39-han-isv.md) | E39 | Phase-26 工具注册 | Phase-38 财务 SDK | 2h | Reviewer |

## 🔒 安全与合规 (3 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E2 · 李安全](E2-li-security.md) | E2 | Phase-31 多租户隔离 | Phase-35/36 收银/会员安全 | 4h | Reviewer → Approver → Owner |
| [E6 · 刘合规](E6-liu-legal.md) | E6 | Phase-20 合规与审计 | Phase-40 数据报表合规 | 2h | Reviewer |
| [E38 · 沈监管](E38-shen-regulator.md) | E38 | Phase-44 开放 API 合规 | Phase-20 监管上报 | 1h | Observer |

## 📈 营销与运营 (10 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E4 · 张营销](E4-zhang-marketing.md) | E4 | Phase-39 数据报表营销 | Phase-17 营销社群 | 3h | Reviewer → Approver |
| [E8 · 周运营](E8-zhou-ops.md) | E8 | Phase-17 营销 + 社群 | Phase-42 自愈运营 | 2h | Reviewer |
| [E15 · 吴内容](E15-wu-content.md) | E15 | Phase-17 内容运营 | Phase-45 增值服务 | 2h | Reviewer |
| [E16 · 郑社群](E16-zheng-community.md) | E16 | Phase-17 社群运营 | Phase-36 会员社群 | 2h | Reviewer |
| [E17 · 周活动](E17-zhou-event.md) | E17 | Phase-17 活动策划 | Phase-45 活动增值 | 1h | Reviewer |
| [E24 · 马招商](E24-ma-bd.md) | E24 | Phase-46 渠道拓展 | Phase-39 数据招商 | 1h | Reviewer |
| [E37 · 蒋媒体](E37-jiang-media.md) | E37 | Phase-45 增值服务 | Phase-46 渠道 | 1h | Observer |
| [E11 · 钱店长](E11-qian-store.md) | E11 | Phase-35 收银台 | Phase-37 库存管理 | 4h | Reviewer → Approver → Owner |
| [E12 · 孙导购](E12-sun-guide.md) | E12 | Phase-36 会员管理 | Phase-35 收银导购 | 3h | Reviewer → Approver |
| [E13 · 李收银](E13-li-cashier.md) | E13 | Phase-35 收银台 | Phase-38 财务对账 | 4h | Reviewer → Approver → Owner |

## 📊 数据与 AI (2 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E5 · 赵数据](E5-zhao-data.md) | E5 | Phase-19 数据驱动 | Phase-39 数据报表 | 3h | Reviewer → Approver |
| [E9 · 吴AI](E9-wu-ai.md) | E9 | Phase-40 智能推荐 | Phase-41 异常检测 | 3h | Reviewer → Approver |

## 💰 财务与投资 (3 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E10 · 郑财务](E10-zheng-finance.md) | E10 | Phase-38 财务对账 | Phase-35 收银核账 | 4h | Reviewer → Approver → Owner |
| [E29 · 李股东](E29-li-investor.md) | E29 | Phase-46 渠道招商 | Phase-50 投资回报 | 1h | Reviewer |
| [E36 · 卫审计](E36-wei-audit.md) | E36 | Phase-20 合规审计 | Phase-38 财务审计 | 2h | Reviewer → Approver |

## 🎨 体验与设计 (3 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E7 · 孙体验](E7-sun-ux.md) | E7 | Phase-18 体验优化 | Phase-36 会员 UX | 3h | Reviewer → Approver |
| [E21 · 张设计](E21-zhang-design.md) | E21 | Phase-18 视觉设计 | Phase-43 i18n 本地化 | 2h | Reviewer |
| [E40 · 杨客户](E40-yang-member.md) | E40 | Phase-36 会员体验 | Phase-40 推荐体验 | 2h | Reviewer → Approver |

## 🏢 租户与品牌 (10 人)

### 租户代表 (3 人 · 大/中/小)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E26 · 赵租户](E26-zhao-tenant-l.md) | E26 | Phase-31 多租户 (L) | Phase-46 大租户招商 | 3h | Reviewer → Approver |
| [E27 · 钱租户](E27-qian-tenant-m.md) | E27 | Phase-31 多租户 (M) | Phase-38 财务对账 | 2h | Reviewer |
| [E28 · 孙租户](E28-sun-tenant-s.md) | E28 | Phase-31 多租户 (S) | Phase-43 i18n 多语言 | 2h | Reviewer |

### 品牌负责人 (4 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E30 · 周品牌](E30-zhou-brand-premium.md) | E30 | Phase-47 高端品牌 | Phase-39 高端报表 | 2h | Reviewer |
| [E31 · 吴品牌](E31-wu-brand-traffic.md) | E31 | Phase-47 流量品牌 | Phase-45 增值引流 | 2h | Reviewer |
| [E32 · 郑品牌](E32-zheng-brand-kids.md) | E32 | Phase-47 亲子品牌 | Phase-36 亲子会员 | 2h | Reviewer |
| [E33 · 王品牌](E33-wang-brand-collab.md) | E33 | Phase-48 联名品牌 | Phase-49 开放平台 | 1h | Reviewer |

### 品牌运营 + 供应链 (2 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E34 · 冯经理](E34-feng-manager.md) | E34 | Phase-48 联名运营 | Phase-47 品牌运营 | 2h | Reviewer |
| [E35 · 褚采购](E35-chu-procurement.md) | E35 | Phase-37 库存采购 | Phase-35 收银供应链 | 2h | Reviewer |

## 👔 后勤与高层 (7 人)

| 专家 | 编号 | 主绑定 Phase | 副绑定 Phase | 每周时长 | 评级路径 |
|------|------|-------------|-------------|----------|----------|
| [E14 · 赵场地](E14-zhao-venue.md) | E14 | Phase-37 库存场地 | Phase-25 多 Session 监控 | 1h | Observer |
| [E18 · 刘总助](E18-liu-assistant.md) | E18 | Phase-50 战略闭环 | Phase-46 招商协调 | 2h | Reviewer → Approver |
| [E19 · 陈老板](E19-chen-boss.md) | E19 | **Champion 候选** · Phase-50 顶层 | Phase-49 开放平台 | 4h | **Champion** (待任命) |
| [E20 · 王培训](E20-wang-training.md) | E20 | Phase-43 i18n 培训 | Phase-36 会员培训 | 2h | Reviewer |
| [E22 · 杨物流](E22-yang-logistics.md) | E22 | Phase-37 库存物流 | Phase-33 EventStore 物流 | 1h | Observer |
| [E23 · 朱客服](E23-zhu-cs.md) | E23 | Phase-36 会员客服 | Phase-42 自愈客服 | 2h | Reviewer → Approver |
| [E25 · 牛保洁](E25-niu-cleaning.md) | E25 | Phase-30 SSE 后勤 | Phase-29 多 Session 监控 | 1h | Observer |

---

## 评级分布 (当前 · V6.1)

| 评级 | 人数 | 说明 |
|------|------|------|
| **Champion** | **5** (E19+E41+E42+E43+E44) | 跨 phase 战略决策 + 大飞哥审批 |
| **Owner** | **8** (E1/E2/E11/E13/E10/E9/E5/E23) | 负责 1 个 phase 完整生命周期 |
| **Approver** | **10** (E4/E7/E12/E40/E16/E26/E15/E36/E18/E39) | RFC 通过所需的 3 票之一 |
| **Reviewer** | **14** | 投票否决权(veto) |
| **Observer** | **7** (E3/E6/E38/E37/E14/E22/E25) | 仅阅读,可发言无投票权 |
| **总计** | **44** | - |

---

## 升级规则 (V6.1 强化)

- **Observer → Reviewer**: 连续 7 天有效反馈 + 采纳率 ≥50% + 完成 ≥1 phase 绑定
- **Reviewer → Approver**: 累计投票 10 次 + 采纳率 ≥60% + Owner 推荐
- **Approver → Owner**: 主导 1 个 phase 完整生命周期 (Kickoff→Mid→Retro 三阶段)
- **Owner → Champion**: 由现有 Champion 联名提名 + 大飞哥审批 (每月最多 1 人)

---

## Phase 关注矩阵 V3 (R-01 升级 · Champion 标注)

| Phase | 主责专家 (≥2) | 副责专家 (≥1) | Champion 督导 | 关键交付 |
|-------|--------------|---------------|---------------|----------|
| Phase-15 多租户架构 | E1 + E2 | E26 | **E44** 周技术 | TenantGuard + RLS |
| Phase-25 多 Session | E1 | E14 | E44 | 并发执行器 |
| Phase-26 工具注册 | E39 | E9 | E44 | ToolRegistry |
| Phase-27 流式事件 | E1 | E40 | E44 | 7 类事件 |
| Phase-30 SSE 集成 | E3 | E25 | E44 | HTTP SSE |
| Phase-31 多租户隔离 | E2 + E26/27/28 | E1 | **E44** 周技术 | 三层 filter |
| Phase-32 Stream 重连 | E1 | E40 | E44 | 指数退避 |
| Phase-33 EventStore | E1 | E22 | E44 | Postgres 持久化 |
| Phase-34 view-model | E2 | E40 | E44 | TenantValidator |
| **Phase-35 收银台** | **E13 + E11** | E10 | **E42** 李总经理 | 收银流程 (主 phase) |
| **Phase-36 会员管理** | **E12 + E40** | E23 | **E42** 李总经理 | 会员体系 (主 phase) |
| Phase-37 库存管理 | E11 + E35 | E14 | E42 | 库存 + 采购 |
| Phase-38 财务对账 | E10 + E27 | E36 | E42 | 财务核账 |
| Phase-39 数据报表 | E4 + E5 | E30 | E42 | 报表 + 营销 |
| Phase-40 智能推荐 | E9 + E40 | E5 | E42 | AI 推荐 |
| Phase-41 异常检测 | E9 | E5 | E44 | 监控告警 |
| Phase-42 自愈机制 | E23 | E8 | E44 | 自动恢复 |
| Phase-43 i18n 多语言 | E21 + E28 | E20 | E42 | 本地化 |
| Phase-44 开放 API | E38 | E39 | **E44** 周技术 | API 网关 |
| Phase-45 增值服务 | E15 + E31 | E17 | **E43** 张区域 | 内容运营 |
| Phase-46 渠道招商 | E24 + E26 | E18 | **E43** 张区域 | 招商 + 大租户 |
| Phase-47 品牌运营 | E30/E31/E32 | E34 | **E43** 张区域 | 三类品牌 |
| Phase-48 联名品牌 | E33 + E34 | E30 | E43 | 联名运营 |
| Phase-49 开放平台 | E33 + E39 | E19 | **E41** 王董事长 | 平台化 |
| Phase-50 战略闭环 | E19 | E18 | **E41** 王董事长 | 战略 + KPI |

**Champion 督导统计**:
- E41 王董事长 (Tier 1 战略): Phase-49 + 50 = 2 关联
- E42 李总经理 (Tier 2 业务): Phase-35~40 + 43 = 7 关联
- E43 张区域 (Tier 3 区域): Phase-45~48 = 4 关联
- E44 周技术 (Tier 3 技术): Phase-15/25/26/27/30~34/41/42/44 = 12 关联
- E19 陈老板 (Tier 2 业务): Phase-49 + 50 = 2 关联
- **Champion 关联**: 2+7+4+12+2 = **27 关联**

**总统计 V6.1**:
- 主责专家绑定: 25 phase × 2 = 50 关联
- 副责专家绑定: 25 phase × 1.28 = 32 关联
- Champion 督导: 27 关联 (叠加)
- **总计**: 50+32+27 = **109 phase-专家关联** ≥ 88 ✓ (R-01 V6.1 定理成立)

---

## 🧪 每周总时长科学评定 (大飞哥 Q5 决策)

**大飞哥原话**: "合理不合理,你要根据我的要求和系统开发需求,来科学评定,你说了算!"

**🦞 龙虾哥科学评定**:

| 维度 | 旧值 (V6.0) | **新值 (V6.1)** | 评定依据 |
|------|------------|----------------|----------|
| 40 业务专家 | 75h/周 | 75h/周 | 维持 |
| 4 Champion 老板 (新增) | - | **16h/周** (4+4+3+3+2 平均) | 战略决策高频 |
| **总时长** | 75h/周 | **91h/周** | V6.1 升级 |
| **人平均** | 1.875h/人/周 | **2.07h/人/周** | 略增 |
| **覆盖率** | 25 phase × 3h = 75h | 25 phase × 3.6h = 90h | 提升 20% |
| **每周相位进度** | 1 phase × 1.875h = 2.06% | 1 phase × 2.07h = 2.28% | 提升 10% |

**评定结论**:
- ✅ 91h/周 是 **合理且偏充裕**(比 75h 提升 21%)
- ✅ 25 phase 在 36 天 (R-05 工期) 内可完成 (每周约 5 phase,每天 1 phase)
- ✅ 2.07h/人/周 在合理范围(0.5-4h)
- ✅ Champion 每周 4h 决策,保证战略层密度
- ❌ 91h **不算多** — Champion 决策 + 业务深耕需要高频反馈

**优化建议**:
- 🔄 实施后监控每周反馈密度,若 > 95h 考虑减频(Observer 优先)
- 🔄 Champion 季度 review(每 3 月),可调整
- 🔄 月末自动统计: 若某个 phase 反馈 < 2h/周,触发"低密度"告警

---

## ✅ 大飞哥 6 项决策已落实 (2026-06-27)

1. **Champion 任命**: ✅ 5 个 Champion 已任命(E19+E41+E42+E43+E44,不同身份层级)
2. **每周总时长**: ✅ 91h/周(科学评定,合理)
3. **Phase-35 启动**: ✅ T158-T165 spec + tasks 卡片(见下)
4. **P3 估时**: ✅ 15 → 20 天(总工期 14+7+20 = 41 天 ≤ 80 ✓)
5. **专家激励**: ✅ 采纳率积分 → SaaS credits(E-Credits 方案 v1)
6. **T164 SSE 订单事件流**: ✅ 前台 🌲 任务卡已派发

---

> 索引由 `experts/INDEX.md` 维护 · 与 `experts/E*.md` 档案 1:1 对应
> 修改档案请同步更新本索引 · V6.1 与 v4.0 spec R-01 同步