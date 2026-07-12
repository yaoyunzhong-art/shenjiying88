# 🧬 进化日志 evolution-log

> 记录每次系统进化的关键决策、反模式发现、正向模式固化
> 格式: YYYY-MM-DD HH:MM [类型] 标题 | 内容 | 关联实验/计划

---

## 2026-07-12 20:12 🧠 晚会签署 6道门签入

### 关键事件
| 时间 | 事件 | 详情 |
|:----:|:----|:------|
| 20:00 晚会启动 | V15#154 117commits | 6道门签署: 架构🟡/安全🟡/业务🟡/数据AI🟡/体验🟡/合规🟡/治理✅ |
| 19:10 pulse#368 | 🔴缓存揭示 admin-web~40✖+storefront 8✖真实状态暴露 | 缓存假阳(27轮约8h) → 强制清除缓存后再验收规则 |
| 18:38-19:00 | P-35~P-40 6页面上线 | 3619行/133测试/smoke41/41全绿 |
| 15:45 | ✅ P0-001 正式闭环 | forceExit验证通过(22天马拉松) |
| 13:08 | ✅ dispatch-358闭环 TSC14/14恢复 | 路由迁移逆风翻盘 |
| 11:50 | 🧠 根因纠偏 | storefront-web路由迁移→角色断言失败，非Controller问题 |

### 反模式
| ID | 反模式 | 发现时间 | 详情 | 影响 | 治理措施 |
|:--:|--------|:-------:|:----|:----:|:---------|
| AM-020 | **缓存假阳→TSC断裂延迟8h发现** | 20:00晚会 | pulse#337→#364共27轮(约8h)缓存未失效→pulse#368才揭示admin-web真实TSC40✖ | 验收延迟8h+，dispatch-366+367连续零commit浪费 | 验收脉冲必须cache-bust→force-run，接受30s额外耗时 |

### 正向模式
| ID | 正向模式 | 发现时间 | 详情 |
|:--:|---------|:-------:|:------|
| PP-011 | **P-35~P-40 6页面上线模式** | 20:00晚会 | 单日密集冲刺6个核心店A页面(3619行/133测试全绿)，Store模式可复制 |
| PP-012 | P0-001 22天闭环复盘模式 | 20:00晚会 | forceExit+fileParallelism:false+teardownTimeout 三管齐下 → 文档沉淀到knowlege |

### 关键决策
| 时间 | 决策 | 理由 |
|:----:|:-----|:------|
| 20:12 | V15 92%推进完成，晚会签入 | TSC14/14恢复+P0-001闭环+6页面上线为核心达成 |
| 20:12 | V16首日优先: admin-web TSC清零 | pulse#368缓存揭示暴露40✖/5页面断裂 |
| 20:12 | 强制验收缓存清理 | AM-020缓存假阳治理: 所有验收脉冲cache-bust后再force-run |

### V16 改进草案

```
验收缓存:
  - 验收脉冲cache-bust: 每次pulse前执行touch(或timestamp参数)强制tsc/pnpm run typecheck
  - 缓存明示: pulse记录中标注"✅缓存清理"/"⚠️缓存未清"

admin-web修复优先级:
  - dispatch-368: admin-web TSC清零 → storefront 8✖ → Controller 16fail
  - 修复后需连续2次缓存清除后验收确认才可标记闭环

P-31多租户隔离:
  - 7/13(周一)启动概念文档
  - 7/16前确认 TenantQuotaService exports
  - 7/18前确认 stores/[id]/ tenantContext.run() 包裹
```

---

## 2026-07-12 02:15 🐜 侦察兵全国扩展+全国场管DB入库

### 关键事件
| 时间 | 事件 | Commit | 详情 |
|:----:|:----|:------:|:------|
| 02:02 | 侦察兵全国扩展30城 | `828d39bea` | 城市分级T1~T5 30城配置 + competitive-intelligence同步
| 02:08 | 全国场馆+竞品DB入库+知识库+ScoutModule | `b5dda7727` | 8张全国表+import脚本+NestJS ScoutModule+3知识库同步
| 02:10 | V14.1凌晨执行成果更新 | `37c66e91f` | 执行状态确认/后续关联更新列明

### 数据基础设施
- **DB迁移**: `20260712_create_national_venue_competitor_tables.sql` (venues + 6竞品子表 + scout_cities/scout_collection_logs)
- **采集脚本**: `scripts/import-national-venues.ts` (8平台×30城采集框架)
- **API服务**: `apps/api/src/modules/scout/` (ScoutController + ScoutService + ScoutModule)
- **知识库**: competitive-intelligence.md / national-venue-database.md / scout-intelligence.md 同步完成

---

## 2026-07-11 23:00 📡 日终汇总

### 反模式
| ID | 反模式 | 发现时间 | 详情 | 影响 | 治理措施 |
|:--:|--------|:-------:|:----|:----:|:---------|
| AM-017 | patterns-anti-patterns T1层与evolution-log不同步 | 20:48晚学 | evolution-log已追加AM-010~016共7条，但patterns-anti-patterns.md T1活跃索引仅至AM-009 | 新访客无法从索引了解最新反模式 | 日终23:00自动追加；周日手动修复 |
| AM-018 | expert-insights/目录持续为空 | 20:48晚学 | 44+专家团队缺乏独立洞察文件积累 | 专家知识无书面沉淀 | 日终从当日产出提取洞察写入 |
| **AM-019** | **验收断裂无告警** | 23:00日终 | pulse#331断裂后~1h无人发现，直到23:00日终同步才捕获 | 系统故障延迟响应达1h+ | 新增20min pulse健康检查cron |

### 正向模式
| ID | 正向模式 | 发现时间 | 详情 |
|:--:|---------|:-------:|:------|
| PP-008 | isolated cron隔离成功 | 全天验证 | 30个isolated cron全天0打扰用户 |
| PP-009 | 晚学6道门签署机制 | 20:48 | G1-G6逐门签署后输出综合健康度+反模式自查 |
| PP-010 | 38连胜🏆（pulse#293→#330） | 21:11 | 连续38次验收脉冲全绿，创历史最高记录（后因页面变更断裂） |

### 关键决策
| 时间 | 决策 | 理由 |
|:----:|:----|:-----|
| 23:00 | 验收断裂告警机制 → V12改进项 | 1h+空窗期不可接受，需20min轮询 |
| 23:00 | V11计划中未完成的3项列入周日计划 | @m5/api hang + 索引同步 + expert-insights首次产出 |

### V12 改进草案 (23:00 自检产出)

```
验收断裂告警:
  - 新增20min脉冲健康检查cron
  - 读取phase-progress最新记录，失败→标记至daily-brief
  - 连续2次脉冲失败→晚学／日终标记

知识库自动同步:
  - 日终23:00自动同步evolution-log新增项到patterns-anti-patterns T1索引
  - 日终从专家产出提取1-2条洞察写入expert-insights/YYYY-MM-DD.md

Phase推进规范:
  - 前端验收为通道门禁：P-35/P-36完成后端测试后必须补前端
  - 多租户隔离(P-31)优先级提升至P-35之前
  - 验收断裂自动触发Phase阻卡
```

---

## 2026-07-10 23:00 📡 日终汇总

### V11计划归档
V11计划已完成归档。核心成果：
1. **V10 cron架构修复**：25→28 cron修复（3处矛盾），cron健康度28/28 active
2. **cron隔离升级**：13个非核心cron从`main systemEvent`迁移到`isolated agentTurn`
3. **绝对路径铁律**：所有文件读写使用`$PROJECT/...`绝对路径，完全消除`cd + 相对路径`模式
4. **Phase周目标**：P-35/P-36/P-44在强制调度后全部闭环
5. **@m5/api TSC清零**：pulse#254从~59 errors降至0
6. **验收脉冲30min→30min(含Cache→force-run)**：已支持验收回写+force-run联动

### 反模式
| ID | 反模式 | 发现时间 | 详情 | 影响 | 治理措施 |
|:--:|--------|:-------:|:----|:----:|:---------|
| AM-014 | systemEvent产出丢失 | 10:28晨学 | cron超长prompt→12:07后systemEvent阶段17→仅19→34小时产出丢失 | 关键日终总结信息缺位 | → isolate模式/短prompt |
| AM-015 | force-run不确认 | 10:28晨学 | pulse验收回写写入了空内容 | 验收数据污染 | → 跑后查runs/看产出 |
| AM-016 | workspace路径 | 10:28晨学 | cd+相对路径→14个cron全部需要绝对路径 | 路径不稳定 | → $PROJECT绝对路径铁律 |

### 正向模式
| ID | 正向模式 | 发现时间 | 详情 |
|:--:|---------|:-------:|:------|
| PP-005 | 30min验收脉冲抗逆性 | 全天 | 在18error/14fail状态仍保持37连胜 |
| PP-006 | 多路并行的Phase调度 | 强制调度 | P-35/P-36/P-44同时推进，1h内全部闭环 |
| PP-007 | @m5/api TSC清零 | pulse#254 01:15 | 59→0，auth.e2e/workbench role-collaboration修复 | 1.9 |

### 关键决策
| 时间 | 决策 | 理由 |
|:----:|:----|:-----|
| 10:28 | 13cron→isolated迁移 | AM-014 systemEvent丢失修复方案 |
| 10:28 | 绝对路径铁律 | AM-016 cd路径不稳定修复方案 |
| 10:28 | 短prompt、跑后验产出 | AM-015 force-run产出确认方案 |
| 23:12 | V10计划归档+V11取代 | 3处改造全部落地、38小时cron验证成功 |
| 23:12 | 37连胜数据锚定 | 存量pulse#293→#329已验证全绿 |

---

## 2026-07-10 10:28 🧠 晨学

### 反模式
| ID | 反模式 | 发现时间 | 详情 |
|:--:|--------|:-------:|:----|
| AM-014 | systemEvent产出丢失 | 07-10 10:28 | cron超长prompt→systemEvent阶段产出丢失34小时，导致知识库断更 |
| AM-015 | force-run不确认 | 07-10 10:28 | 验收回写force-run后产出空内容，验收脉冲被污染 |
| AM-016 | workspace路径 | 07-10 10:28 | cd+相对路径导致cron任务访问文件不一致 |

### 正向模式
| ID | 正向模式 | 发现时间 | 详情 |
|:--:|---------|:-------:|:----|
| PP-004 | force-run+验收回写联动 | 07-10 | 验收脉冲触发force-run后自动写回phase-progress |
