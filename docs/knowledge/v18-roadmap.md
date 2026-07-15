# 🏗️ V18 神机营SaaS 路线图

> 版本: V18 | 7/16 (周四) → 7/25 (周六) | 目标: 63%→80%
> 基址: V17 3天 395 commits / 84,712行 / 12🏆稳态
> 生成: 2026-07-15 17:50 自进化复盘产物

---

## 一、全局状态

```
当前进度:  ~63-65%
V18目标:   ~80%
V19目标:   ~92%
V20目标:   100% (8/1 Store A生产发布)

V18核心口号: 「后端闭合+admin-web批量」
```

### 资产总览 (V17末端)

| 维度 | 已完工 | 剩余 | 百分比 |
|:----|:-----:|:----:|:-----:|
| 🖥️ 后端API模块(120) | ~110 | ~10 | **~92%** |
| 🎨 admin-web页面(122) | ~68 | ~54 | **~56%** |
| 📋 Phase业务(10) | ~5.8 | ~4.2 | **~58%** |
| 🤖 AI引擎(~14) | ~6.5 | ~7.5 | **~45%** |
| 📐 测试覆盖 | ~75% | ~25% | **~75%** |

### 最大瓶颈

```
1. 🔴 admin-web 54薄页 (占比35%剩余最大)
2. 🔴 P-38财务 35%→100% (工作量第二大)
3. 🔴 @m5/api 662 fail (P0·53脉冲未解决)
4. 🟡 AI D3推荐引擎 0% (需启动)
5. 🟡 31模块缺E2E
```

---

## 二、Phase 1: 后端闭合 (7/16-7/18, 3天)

### 任务排布

| 优先级 | 任务 | 模块/文件 | 产出 | 时间 |
|:------|:----|:---------:|:----:|:----:|
| P0 | RLS controller+service完整CRUD | rls.controller, rls.service | GET/POST/PUT/DELETE | 2h |
| P1 | edge service补全 | edge.service | CRUD+推理API | 1.5h |
| P1 | realtime service补全 | realtime.service | WebSocket+Room管理 | 2h |
| P2 | 剩余15模块Service补齐(已在V17写过的跳过) | ~6模块 | 批量脚本+并行 | 3h |
| P2 | 5薄模块测试增加 | db-knowledge·devops·logistics·rls·scout | 每个≥15cases | 4h |

**里程碑**: 7/18 后端120模块全部有Controller+Service ✅

---

## 三、Phase 2: admin-web批量 (7/18-7/22, 4天)

### 54薄页分批拉升 (100→250行)

| 批次 | 页面数 | 内容 | 模板 |
|:----|:-----:|:-----|:----|
| A | 14页 | 低复杂度: alerts·audit-trail·foundation·rate-limits·resilience | 标准列表+搜索+创建Modal |
| B | 14页 | 中复杂度: agents·campaign-rules·integration-orchestration | 列表+搜索+编辑+状态Tag |
| C | 14页 | 中高: ai-decision·compliance·incidents·vendor | 列表+搜索+编辑+详情页 |
| D | 12页 | 高复杂度: 含业务逻辑页面 | 全功能+数据绑定 |

### 模板标准

```
每页最终结构 (250行):
  1. 列表表格 (50行): columns·sort·search
  2. 创建Modal (40行): form fields·validation·submit
  3. 编辑Modal (40行): prefill·update·confirm
  4. 操作栏   (30行): 批量操作·刷新·导出
  5. 状态管理 (30行): loading·empty·error handling
  6. 路由+类型 (30行): params·searchParams·types
  7. 样式装饰 (30行): Tailwind responsive
```

### 质量门

```
- 每页通过 TSC ✅
- 每页至少1个冒烟测试 (page.test.tsx)
- 无 as any
- 连续3🏆始准入下一批
```

**里程碑**: 7/22 admin-web 68/122→82/122丰满 ✅

---

## 四、Phase 3: P-38财务 + AI D3 (7/19-7/22, 3天)

### P-38财务 35%→65%→80%

| 阶段 | 内容 | 产出 | 时间 |
|:----|:-----|:----|:----:|
| 1 | Service对账核心 - 已完成(42测试/792行) | ✅ 已交付 | — |
| 2 | admin-web对账UI: 搜索+表格+差异明细+resolve | 新 page 300行 | 2h |
| 3 | 对账报表: 月度汇总+导出Excel | 新功能 200行 | 2h |
| 4 | 测试增强: E2E场景+大数性能 | +20测试 | 2h |

### AI D3 推荐引擎

| 模块 | 功能 | 产出 |
|:----|:-----|:-----|
| ai-recommend | 会员分层+商品推荐 | 入口Service+Controller+测试 |
| 协同过滤 | 基于用户行为的协同过滤 | 算法模型+批量评分 |
| 冷启动 | 新用户/新商品推荐策略 | 规则引擎适配 |

**里程碑**: P-38~80% ✅ · AI D3 引擎启动 ✅

---

## 五、Phase 4: 质量门+验收 (7/22-7/25, 3天)

| 任务 | 说明 |
|:----|:------|
| 31模块E2E | 批量生成+并行验收 |
| admin-web测试绑定 | 每页≥1冒烟 |
| 覆盖率检查cron | 新鲜度6h绑定 |
| 哈希链自动 | 持续+扩展 |
| 性能基线 | TSC全绿+force-run稳定 |

---

## 六、V18 Day1 作战计划 (7/16 周四)

```
06:00  晨会: V18对齐+E1架构检查
07:00  树哥派单(5路并行):
        ① rls controller+service CRUD (P0)
        ② edge service补全 (P1)
        ③ realtime service补全 (P1)
        ④ admin-web A批10页拉升 (P0)
        ⑤ P-38 UI对账页启动 (P0)
08:30  RQ派单: 剩余Service补齐(6模块) + 5薄模块测试
09:00  专家晨会: Gate1签署
12:00  午检: 树哥验收 + 闭环追踪
14:00  午间自学: G5~G8卡片
15:00  午会: Gate2~4签署
20:00  晚会: Gate5~6签署 + 日轮汇总
23:00  自复盘: 偏差检查 + Day2微调

Day1 KPI:
  commits ≥30 | 行数 ≥8,000
  10 admin-web薄页→丰满
  P-38 UI交付
  TSC全绿·无新增fail
```

---

## 七、注释

```
@m5/api 662 fail (P0-001 hang):
  等待vitest升级修复，V18不主动攻关
  日常跳过 @m5/api 测试

admin-web 44假阳基准:
  持续持平，非恶化
  V18 Phase2拉升时可能引入新假阳，需监控

专家会议:
  短prompt(<800字) + main systemEvent
  避免 isolated cron超时
```
