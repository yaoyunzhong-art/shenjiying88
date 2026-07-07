# Daily Standup Protocol · 每日站会

> 创建日期: 2026-06-25 · Pulse-64

## 目的
- 同步昨日 phase 进度
- 收集业务专家关切点
- 推动 RFC 投票 → 实施队列
- 总时长: **15 分钟** (时间盒严格控制)

## 时间
- **每日 09:00-09:15 CST**
- 节假日除外 (由 Champion 提前 1 天公告)

## 角色
| 角色 | 人数 | 职责 |
|---|---|---|
| Phase Owner | 1-2 | 汇报昨日 phase 进度 (每人 2 分钟) |
| 活跃专家 (≥ Reviewer) | 3-5 | 提出业务关切 (每人 1 分钟) |
| Champion | 1 | 主持 + 时间盒管理 + RFC 投票识别 |
| Recorder | 1 | 产出 `docs/process/standup-YYYY-MM-DD.md` |

## 流程 (3 步骤)

### Step 1: Phase Owner 汇报 (6 分钟)
每个进行中 phase 派 1 Owner 用 2 分钟回答 3 个问题:
1. **昨日完成了什么?** (用 1-2 句)
2. **今天要做什么?** (用 1-2 句)
3. **有什么 blocker?** (如果无 blocker 跳过)

格式: `Phase-XX · Owner: <E编号+姓名> · 完成 X/Y · blocker: <有/无>`

### Step 2: 活跃专家发言 (6 分钟)
级别 ≥ Reviewer 的专家按举手顺序发言,每人 1 分钟:
- **Morning Voice** 类型反馈
- 关注点: 客户体验/合规风险/技术债务/营销机会/品牌一致性
- 不需要解决,只需要被记录
- Champion 决定哪些需要立即 follow-up

### Step 3: RFC 投票识别 (3 分钟)
Champion 检查过去 24 小时 RFC 投票:
- ≥3 Approver 同意 + 0 Champion 否决 → 标记 `approved` → 进入实施队列
- 有 Champion 否决 → 标记 `blocked` → 48h 紧急评审
- 投票未结束 → 提醒剩余时间

## 输出
每次会议产出 1 份 markdown 记录,路径 `docs/process/standup-YYYY-MM-DD.md`。

详见 [standup-template.md](standup-template.md)。

## 时间盒管理
- 每个 Owner 发言超 2 分钟 → Champion 提醒"wrap up"
- 每个专家发言超 1 分钟 → Champion 提醒"留到 Weekly Memo"
- 09:15 准时结束,无论是否讨论完

## 缺席处理
- Phase Owner 缺席 → 由该 phase 的 Champion 替补汇报
- 专家缺席 → 不补,直接进入下个议程

## 关联文档
- [standup-template.md](standup-template.md) - 会议记录模板
- [phase-review.md](phase-review.md) - 三阶段评审
- [expert-rating.md](expert-rating.md) - 评级体系