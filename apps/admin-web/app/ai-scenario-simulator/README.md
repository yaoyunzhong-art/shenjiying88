# AI 场景模拟器 — AI Scenario Simulator

门店 AI 运营场景模拟模块，支持通过调整营销预算、折扣力度、设备更新等参数，预测门店运营决策效果，辅助数据驱动经营决策。

## 目录结构

```
ai-scenario-simulator/
├── page.tsx        # 主页面 — 场景模拟器（客户端组件）
├── loading.tsx     # 页面加载骨架屏
├── page.test.ts    # 单元测试（Vitest）
└── page.test.tsx   # 交互式组件测试（@testing-library/react）
```

## 核心功能

| 功能 | 说明 |
|------|------|
| **场景预设选择** | 支持「营销预算分配模拟」「人员配置与服务质量」「定价策略模拟」等多套预设 |
| **变量参数调整** | 数字滑条/下拉框等控件，支持 adBudget、discountRate、staffCount、pricePerUnit 等变量 |
| **AI 模拟运行** | 根据变量参数异步执行 `ScenarioPreset.simulate()`，返回 `SimulationResult[]` |
| **结果对比展示** | 对比卡片展示「模拟前 vs 模拟后」指标变化，绿色增长/红色下降高亮 |
| **历史记录** | `HistoryRecord[]` 本地列表，记录每次模拟的快照与时间戳 |
| **场景趋势统计** | `ScenarioTrend[]` 面板展示各预设的 avgAfter / count 聚合趋势 |
| **场景使用指南** | 底部面板展示各分类（营销/运营/定价）的场景说明 |
| **导出报告 + 重置** | 一键导出模拟结果、一键清空所有输入与记录 |

## 使用指引

1. 在预设选择面板中点击某个预设（如「营销预算分配模拟」）
2. 页面右侧显示该预设的场景描述与变量输入控件
3. 拖拽或输入调整变量值，点击「开始模拟」
4. 模拟完成后，对比卡片展示关键指标变化（如营收、客流、会员增长）
5. 在「历史记录」面板查看所有历史模拟快照
6. 点击「导出报告」可将结果导出；「重置」清空当前状态

## 相关依赖

| 包 | 来源 | 用途 |
|----|------|------|
| `@m5/ui` — `AIScenarioSimulator` | 内部 UI 库 | AI 场景模拟器基础组件 |
| `@m5/ui` — `PageShell` / `StatCard` / `StatusBadge` | 内部 UI 库 | 页面框架与统计卡片 |
| `@m5/ui` — `DataTable` / `FormSubmitFeedback` | 内部 UI 库 | 数据表格与表单反馈 |
| `react` / `next` | 外部依赖 | 框架 |

## 类型定义（页面内）

- `ScenarioPreset` — 场景预设描述（id / label / variables / simulate）
- `ScenarioVariable` — 变量定义（type: number | select，含默认值/范围/选项）
- `SimulationResult` — 单次模拟结果行（label / before / after / unit）
- `HistoryRecord` — 历史记录快照
- `ScenarioTrend` — 趋势聚合统计
