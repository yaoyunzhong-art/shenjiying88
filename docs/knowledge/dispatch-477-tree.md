# Dispatch #477 - @m5/app HomeScreen NEW FAIL (2 failures)

## 故障分析

### FAIL 1: `HomeScreen: renders sections in correct order`
- 错误: 章节顺序应为：快捷操作 → 待办任务 → 门店公告
- 文件: `apps/app/screens/home/HomeScreen.test.tsx:219`
- 原因: "待办任务" 章节标题 `<Text>` 中有嵌套 `<Text style={styles.badge}>{mockStats.pendingTasks}</Text>` badge，
  react-test-renderer 渲染后 children 变成数组 `['待办任务 ', <Text>]`，测试通过 `.some(c => typeof c === 'string' && c.includes('待办任务'))` 搜索。
  虽然逻辑上应该正确，但可能是渲染树遍历顺序或 children 结构变化导致索引错位。
- 修复方向: 改用 `findAllByProps({style: styles.sectionTitle})` 定位章节标题，或使用更稳健的 text 提取方式。

### FAIL 2: `HomeScreen: tapping a task item does not throw`
- 错误: `taskTouchables[0].props.onPress is not a function`
- 文件: `apps/app/screens/home/HomeScreen.test.tsx:240`
- 原因: HomeScreen.tsx 的 task items (`TouchableOpacity`) **没有设置 onPress 属性**，测试期望调用 `onPress()` 时报错。
- 修复方向: 
  - 方案A: 给 task items 添加 onPress 回调（导航到任务详情或日志输出）
  - 方案B: 移除该测试（如果任务项目前不是交互式的）
- 推荐: **方案A** — 添加基础的 onPress 处理，使组件更完整。

## 修复方案

### 文件1: `apps/app/screens/home/HomeScreen.tsx`
给 task item 的 TouchableOpacity 添加 onPress:
```tsx
<TouchableOpacity 
  key={task.id} 
  style={styles.taskItem}
  onPress={() => console.log('Task pressed:', task.id)}
>
```

### 文件2: `apps/app/screens/home/HomeScreen.test.tsx`
修复章节顺序测试，使用更稳健的查找方式:
```typescript
// 改用 findByProps 或直接检查 sectionIndices[0] < sectionIndices[1] < sectionIndices[2]
// 或使用 findAllByProps({style: styles.sectionTitle}) 获取所有章节标题元素
```

## 状态: ⏳ 已派待修复
