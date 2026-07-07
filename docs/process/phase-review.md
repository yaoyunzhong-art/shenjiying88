# Three-Phase Review · 三阶段评审

> 创建日期: 2026-06-25 · Pulse-64

## 目的
每个 phase 强制经过 3 个评审点,确保:
- **事前 (Kickoff)**: 目标清晰 + 验收标准明确
- **事中 (Mid)**: 业务偏差早发现
- **事后 (Retro)**: 经验沉淀到专家档案

## 3 个评审点

### Phase Kickoff (事前)
- **时间**: Phase 开始前 1-3 天
- **参与者**: Phase Owner + Champion + 至少 1 Approver
- **时长**: 30-60 分钟
- **输入**: RFC 草案 (含 scope/验收标准/risks)
- **输出**: 签字的 [kickoff-template.md](kickoff-template.md) → 归档到 `docs/phases/<phase>/kickoff.md`
- **通过条件**: Champion + ≥2 Approver 签字

### Mid-Phase Review (事中)
- **时间**: Phase 完成 50% 时
- **参与者**: Phase Owner + Reviewer + Approver
- **时长**: 30-45 分钟
- **输入**: 当前 PR diff + 已完成 checklist
- **输出**: 签字的 [mid-review-template.md](mid-review-template.md) → 归档到 `docs/phases/<phase>/mid.md`
- **关注点**: 业务偏差 + 性能 + 客户影响 + 合规

### Phase Retro (事后)
- **时间**: Phase 完成后 3 天内
- **参与者**: Phase Owner + Champion + 全部 Reviewer
- **时长**: 60-90 分钟
- **输入**: 完整 checklist + 客户/专家反馈
- **输出**: 签字的 [retro-template.md](retro-template.md) → 归档到 `docs/phases/<phase>/retro.md`
- **关键产物**: 3-5 条 lessons learned,合并到对应专家的 `experts/E*.md` 反馈日志

## 评级影响

| 评审点 | 影响 |
|---|---|
| Kickoff 拒绝 RFC | Phase Owner 失去 1 次 Owner 评级累计 |
| Mid Review 发现重大业务偏差 | Phase 进入 "at-risk" 状态,Champion 介入 |
| Retro 不达标 | 阻断下个 Phase Kickoff |

## 关联文档
- [kickoff-template.md](kickoff-template.md)
- [mid-review-template.md](mid-review-template.md)
- [retro-template.md](retro-template.md)
- [daily-standup.md](daily-standup.md)
- [expert-rating.md](expert-rating.md)