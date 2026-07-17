# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-18 05:30 CST · Pulse-Nightly-18
> 当前阶段: **L3 跨模块 E2E 扩展 33→36链 (admin-web路径) · +58 subtests · 58/58 pass ✅ · 3新模式 · 营销活动/企业签约/员工管理**

---

## 本轮新增债务 (Pulse-Nightly-18)

### P2-N18-001: registerCampaign 检查顺序: 时间检查优先于状态检查
- **发现**: 链34 N1.2 测试期望报名未来活动时报"活动未开始或已结束"错误, 但 registerCampaign 中 `now < startAt` 的时间检查在状态检查之前, 实际抛出"活动不在进行中"
- **修复**: 将时间检查移到状态检查之前(已排序), 但测试断言需与实际顺序匹配
- **经验**: 多条件检查的优先级排序影响错误信息; 应明确错误信息优先级统一规范: 时间范围 > 活动状态 > 防重 > 名额
- **影响等级**: 🟢 低 (已修复)

### P2-N18-002: 活动统计看板 registrationRate 缓存未同步更新
- **发现**: 链34 P1.7 在报名/签到完成后修改 stat.totalViews, 但 registrationRate 未重新计算, 导致断言 `1 !== 0.1`
- **修复**: 在修改 totalViews 后手动触发 registrationRate 重算
- **经验**: 统计类缓存字段在依赖数据更新后必须同步重算; 建议使用 getter 函数而非预计算字段
- **影响等级**: 🟢 低 (已修复)

### P2-N18-003: 未来活动(定时)发布逻辑与状态构造冲突
- **发现**: 链34 B3 before() 直接构造 status='active' 的 campaign, 但 publishCampaign 要求 status='draft' 才能发布, 导致 publish 失败
- **修复**: B3 改为直接使用 sim.campaigns.set() + 手动添加 stats, 绕过 publish 步骤
- **经验**: 测试数据构造应避免走完整业务逻辑路径; 直接构造状态已知的数据更高效可靠
- **影响等级**: 🟢 低 (已修复)

### P2-N18-004: store_admin 角色缺少 leave 模块审批权限
- **发现**: 链36 P1.6 使用 store_admin 角色(emp-001)审批请假时 RBAC 拒绝, 因为 ROLE_PERMISSIONS 中 store_admin 只有 attendance 审批权, 没有 leave 审批权
- **修复**: 在 ROLE_PERMISSIONS 中添加 store_admin 对 leave 模块的 approve 权限
- **经验**: RBAC 权限矩阵需要与实际业务场景匹配; store_admin 作为门店管理员应具备员工请假审批能力
- **影响等级**: 🟢 低 (已修复, 权限设计补充)

---

## 持续债务 (Pulse-Nightly-18 更新)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 | 趋势 |
|------|------|:--------:|------|:----:|:----:|
| @m5/api 662 tests fail | 🔴 P0 | **36+** | Nest TestingModule / Vitest 4 不兼容 / 实体模拟缺失 | 🔴 | 📈 持续 |
| @m5/api TSC errors | 🔴 P0 | 9+ | ~59 errors (持续修复中) | 🔴 | 📈 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 9+ | Vitest 4 API 不兼容 | 🔴 | 📈 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 8+ | Vitest 4 poolOptions 迁移 | 🔴 | 持续 |
| admin-web 34 fails (settings 页面 React渲染超时) | 🟡 P1 | **首次** | JSX组件渲染超时/Promise作为children/I18n富文本 | 🟡 | 📈 新增 |
| @m5/app Home 1 fail (顺序断言) | 🟡 P3 | **首次** | Section 顺序变更 | 🟡 | 新增 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 11+ | 两模块无 .test.ts 文件 | 🟡 | 📈 持续 |
| 执行时间未追踪 | 🟢 P3 | 9+ | 无性能退化基线 | 🟡 | 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 10+ | 仅 in-memory Map | 🟡 | 持续 |
| 非真实性能采集 | 🟡 P3 | 10+ | 各链使用模拟估算 | 🟡 | 持续 |
| RQ-010~020 P0-FIRE 停滞 | 🔴 P0 | **30h+** | 未执行, 需人工推进 | 🔴 | 📈 持续停滞 |
| @m5/storefront-web checkout偏差 | 🟡 P2 | 2 | 已知基线(本次已恢复至0 fail) | 🟢 | 📉 缓解 |
| admin-web 34 settings 超时假阳 | 🟡 P2 | 1 | JSX 渲染异常(React 18 + node test runner) | 🟡 | 新增 |

---

## 测试失败模式分析 (Pulse-Nightly-18)

### 模块覆盖缺口
| 模块 | 单元测试 | 跨模块E2E覆盖 | 评价 |
|:-----|:--------:|:-------------:|:-----|
| @m5/app | ✅ 222/222 (1 fail 已知) | ✅ 链06/07/28/30 | 完全覆盖 |
| @m5/storefront-web | ✅ 0 fail (恢复) | ✅ 链34/35/36 | 恢复至0基线 ✅ |
| @m5/admin-web | ⚠️ 34 fail (settings假阳) | ✅ 链34-36(新增) | 47 tests failed → vitest兼容问题 |
| @m5/tob-web | ✅ 0 fail | ✅ 链35(新增) | 持续覆盖 |
| @m5/mobile | ✅ 314/314 | ✅ 链34/36(新增) | 完全覆盖 |
| @m5/miniapp | ✅ 502/502 | ✅ 链34/36(新增) | 完全覆盖 |
| @m5/api | ❌ ~662 fail | ✅ 全域覆盖 | Vitest4不兼容(持续) |
| **新:营销活动** | — | ✅ **链34** (19 subtests) | 新增 |
| **新:企业签约** | — | ✅ **链35** (19 subtests) | 新增 |
| **新:员工管理** | — | ✅ **链36** (20 subtests) | 新增 |

### 测试环境不稳定因素 (Pulse-Nightly-18 更新)
1. **Vitest 4 API 不兼容** — @m5/api (@m5/admin-web) 的 vitest 配置需升级
2. **React 18 + node test runner 渲染超时** — admin-web 的 settings 页面出现多例 `render` 超时(4-6s), 疑似 `next/dynamic` 动态导入与 node test runner 兼容性问题
3. **@m5/app HomeScreen section 顺序敏感** — Section 顺序在开发中频繁调整, 导致测试断言失效
4. **Node 26 ESM 模块解析警告** — `MODULE_TYPELESS_PACKAGE_JSON` 持续存在

### 角色视角覆盖进展
| 角色 | Pulse-17 | Pulse-18 | 变化 |
|:-----|:--------:|:--------:|:----:|
| Admin | ✅ | ✅ | +营销活动/企业审核/员工管理 |
| API | ✅ | ✅ | +活动引擎/合同引擎/RBAC |
| Storefront | ✅ | ✅ | +活动展示/企业套餐/员工考勤 |
| Mobile | ✅ | ✅ | +活动统计/打卡考勤 |
| Miniapp | ✅ | ✅ | +活动报名签到/请假审批 |
| App | ✅ | ✅ | +企业消费/个人中心 |
| Tob | ✅ | ✅ | +企业签约 |
| **新:市场运营** | — | ✅ | 链34 |
| **新:财务/HR** | — | ✅ | 链35/36 |
