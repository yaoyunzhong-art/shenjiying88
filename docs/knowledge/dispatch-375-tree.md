# 🌲 dispatch-375 · admin-web 供应商页面审计信息测试回归

> 源自 pulse#381 缓存消除真实揭示
> 脉冲: pulse#381 · 2026-07-13 02:21
> **严重度**: P2 (单测试回归 · 不影响功能)

---

## 错误详情

```
app/suppliers/page.test.tsx:178
✖ 应包含 audit trail info (0.095458ms)
AssertionError [ERR_ASSERTION]: 缺少审计信息
  assert.ok(src.includes('audit') || src.includes('updatedAt'), '缺少审计信息');
```

**原因**: 供应商页面渲染结果中不包含 'audit' 或 'updatedAt' 字符串。

**修复方向**:
- **确认法**: 检查供应商页面组件是否确实渲染了审计信息（如updatedAt列）→ 若无，增加；测试期望合理。
- **适配法**: 若页面确实无审计信息且不该有，修改测试断言匹配实际渲染内容。

## 影响范围
- `apps/admin-web/app/suppliers/page.test.tsx:178`

## 验收标准
- [ ] `pnpm turbo test --filter=@m5/admin-web` 通过 (0 failures)
