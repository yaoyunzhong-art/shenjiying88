# ✅ 跨模块 E2E 测试检查清单

> 版本: v1.1 (2026-07-18)
> 提炼自: Pulse-Nightly-1~18 (36链, ~338 subtests)

---

## 一、设计阶段

### 覆盖检查
- [ ] 至少涉及 3 个以上 app 模块
- [ ] 包括 P(正例)/N(反例)/B(边界) 三个维度
- [ ] 覆盖 7 个角色视角(Admin/Tob/Storefront/Mobile/App/MinIapp/API)
- [ ] 包含数据正向流转和逆向回退路径
- [ ] 每条 subtests 可独立运行和验证

### 数据设计
- [ ] Mock 数据覆盖至少 4 种状态变体
- [ ] 边界值(0, 负数, 超大值, 空值)都考虑
- [ ] 时间戳使用相对值(Date.now())而非硬编码
- [ ] 各实体ID唯一
- [ ] 避免直接构造业务状态绕过业务逻辑(如直接构造active状态跳过publish)

---

## 二、编码阶段

### 数据隔离
- [x] 存储数组使用深拷贝初始化 `mockData.map(d => ({...d}))`
- [x] 每个 describe 块添加 `test.before()` 重置到初始状态
- [x] 跨测试传递的数据使用变量跟踪而非按状态查找
- [x] `test.after()` 清理全局副作用

### 业务逻辑检查
- [ ] 防重检查优先级最高(支付前先检查已支付)
- [ ] 条件字段名与数据接口字段名完全一致
- [ ] 费率/阈值等计算引用常量而非魔数
- [ ] 时间序断言使用 `>=` 而非 `>` 容忍同毫秒
- [ ] 多条件错误检查顺序: 时间范围 > 活动状态 > 防重 > 名额限制
- [ ] RBAC 权限矩阵与业务场景匹配(如 store_admin 需 leave/approve)
- [ ] 统计缓存字段在依赖更新后同步重算(或使用 getter)

### 测试断言
- [ ] 每条断言有明确的自述性错误消息
- [ ] P/N/B 的 describe 命名清晰可识别
- [ ] subtests 内不依赖其他 test 的执行顺序
- [ ] 异步操作 await 或使用回调
- [ ] `assert.throws` 的 regex 与实际 error message 匹配(注意检查优先级)
- [ ] 浮点数比较用 `assert.equal(actual, expected)` 而非 `strictEqual`

---

## 三、运行阶段

### 环境检查
- [ ] Node 版本 >= 20 (支持 node:test)
- [ ] `pnpm turbo test` 在独立 app 中可跑通
- [ ] `node --test` 直接运行 E2E 文件
- [ ] 没有 `MODULE_TYPELESS_PACKAGE_JSON` 等严重警告

### 验证通过标准
- [ ] 100% subtests pass
- [ ] 正例: 全链路数据流转正确
- [ ] 反例: 错误分支处理合理
- [ ] 边界: 阈值/极端值处理正确

---

## 四、复盘阶段

### 债务记录
- [ ] 新发现问题写入 debt.md (含根因+修复+影响等级)
- [ ] 已有债务状态更新(趋势: 📈 恶化/📉 改善)
- [ ] 持续跟踪 P0-FIRE, TSC, vitest 兼容等

### 知识沉淀
- [ ] 写入 knowledge/best-practices/
- [ ] 提炼 expert-insights/ 供40人专家团参考
- [ ] 更新 MEMORY.md 长期知识
- [ ] 更新 HEARTBEAT.md 测试矩阵

---

## 五、演进建议

| 优先级 | 改进项 | 说明 |
|:------:|:-------|:-----|
| P1 | 全量链引入 test.before 重置 | 消除 01-27 链累计状态污染 |
| P1 | 共享存储迁移到工厂模式 | 替代全局变量, 每describe独立实例 |
| P2 | 引入事务性测试隔离 | 类似数据库事务的rollback-on-error |
| P2 | 自动生成测试报告图表 | 从 subtests 计数自动渲染 |
| P3 | 性能基线注入 | 每链记录执行耗时, 监控退化 |
| P2 | 统计类函数从预计算改为 getter | 避免缓存字段同步问题 |
| P1 | admin-web settings 页面渲染假阳治理 | JSX/Promise 问题分析 |
