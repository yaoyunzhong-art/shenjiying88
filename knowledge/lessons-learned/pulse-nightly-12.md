# 🦞 Pulse Nightly #12 — Taro跨平台样式属性兼容陷阱

**时间**: 2026-07-09 04:15  
**脉冲**: #225  
**来源**: TSC 验证失败修复

## 洞察1: Taro 小程序项目的 style 类型是 CSSProperties 而非 ViewStyle

**问题**: `apps/miniapp/src/pages/return-orders/detail/index.tsx:207` 中使用了 `paddingVertical: 8`，
这是 React Native `ViewStyle` 的简写属性，但 Taro `View` 组件的 style 类型是 `React.CSSProperties`，
不包含 `paddingVertical`。

**教训**:
- Taro 虽然支持 JSX 写法和 RN 类似，但其 style 类型系统对齐 **Web CSS** 而非 RN
- `paddingVertical`/`paddingHorizontal` 是 RN 专有属性，在 Taro(Web) 中需拆分为 `paddingTop` + `paddingBottom` / `paddingLeft` + `paddingRight`
- 其他 RN 专有属性如 `marginVertical`, `marginHorizontal`, `aspectRatio`, `elevation` 等也可能在 Taro 中引发类似 TSC 错误
- 修复方法: 当遇到 `TS2353: X does not exist in type 'CSSProperties'` 时，将 RN 简写属性拆分为对应的 Web 长写属性

## 洞察2: 连续3脉冲0新fail策略已到瓶颈调整期

**观察**: 本次脉冲前（#224）连续2脉冲测试零fail，但 TSC 在新提交内容上出现了新的类型错误。
这说明 **测试零fail≠零缺陷**，TSC 变更是更细粒度的质量门禁。

**建议**: 验收脉冲应同步验证 TSC + Test 双重门禁，不能只看测试结果。
