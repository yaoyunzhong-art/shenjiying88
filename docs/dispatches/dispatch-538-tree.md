# dispatch-538-tree: @m5/app HomeScreen 章节顺序修复

## 发现
- **脉冲**: #538 (2026-07-17 02:36)
- **模块**: @m5/app
- **测试**: `HomeScreen: renders sections in correct order`
- **错误**: `AssertionError: 章节顺序应为：快捷操作 → 待办任务 → 门店公告`
- **上下文**: V19 Day2 950行合入(b893386d2)导致缓存刷新，暴露出此前被缓存掩藏的@m5/app HomeScreen章节顺序失败

## 分析
测试文件: `apps/app/screens/home/HomeScreen.test.tsx` (line 236)
期望顺序: 快捷操作 → 待办任务 → 门店公告
实际顺序: 待办任务 → 门店公告 → (缺失快捷操作) 或类似错乱

## 修复任务
1. 检查 `apps/app/screens/home/HomeScreen.tsx` 中section渲染顺序
2. 修复render逻辑确保顺序为: 快捷操作(Section) → 待办任务(Section) → 门店公告(Section)
3. 验证测试通过

## 优先级
- P1: 首次发现@m5/app真实fail (之前45🏆纯缓存)
- 下次脉冲验收
