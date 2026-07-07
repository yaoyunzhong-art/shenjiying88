# RFC 投票模板 · R{N}

> 复制到 `rfcs/voting/R{N}-{name}.md`

---

## RFC 信息
- **RFC 编号**: R{N}
- **RFC 标题**: <标题>
- **关联 RFC 文档**: [rfcs/R{N}-{name}.md](../R{N}-{name}.md) (如有)
- **提交人**: <E编号 + 姓名>
- **提交日期**: YYYY-MM-DD
- **投票截止**: YYYY-MM-DD HH:MM (提交后 72 小时)

## 投票 (按时间倒序)

| 投票人 | 级别 | 投票 | 投票权重 | 理由 | 时间 |
|---|---|---|---|---|---|
| E{N} {姓名} | Approver | ✅ 同意 | 1.0 | <理由> | YYYY-MM-DD HH:MM |
| E{N} {姓名} | Owner | ✅ 同意 | 1.5 | <理由> | YYYY-MM-DD HH:MM |
| E{N} {姓名} | Approver | ❌ 反对 | 1.0 | <理由> | YYYY-MM-DD HH:MM |
| E{N} {姓名} | Champion | 🛑 否决 | 2.0 | <理由> | YYYY-MM-DD HH:MM |

## 当前统计

- **同意总权重**: X.X
- **反对总权重**: X.X
- **Champion 否决**: 有/无
- **是否通过**: 待定 / 通过 / 阻塞

## 通过条件

- ✅ 同意总权重 ≥ 3.0
- ✅ Champion 否决 = 0
- ✅ 投票窗口结束 (提交后 72h)

## 最终决议

- **决议**: 通过 / 阻塞 / 撤回
- **决议日期**: YYYY-MM-DD
- **实施 Owner**: <E编号 + 姓名>
- **实施开始日期**: YYYY-MM-DD

---

> 本记录由 Champion 在投票窗口结束时签字归档