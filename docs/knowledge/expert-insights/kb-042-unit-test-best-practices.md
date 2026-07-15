# 单元测试最佳实践

> 分类: 测试策略 | 标签: 单元测试, Jest, TDD, 代码质量 | 适用: 后端/前端开发

## 概述

单元测试是测试金字塔的基石，也是保证代码质量成本最低的防线。一个精心编写的单元测试在毫秒级内验证单个代码单元(通常是函数或方法）的行为是否正确。单元测试的价值体现在三个层面：第一，在开发过程中即时捕获回归错误；第二，为重构提供安全网；第三，作为代码的活文档说明功能预期。Shenjiying88现阶段的目标是将单元测试覆盖率从当前的65%提升到85%以上，并确保所有核心Service都有完整的单元测试覆盖。

根据Jest官方基准测试，Jest在启用并行执行时可以每秒执行数千个测试用例。Shenjiying88的单元测试池包含约1200个测试用例，CI阶段全部执行耗时不到3分钟。Jest的Snapshot测试、覆盖率报告和Watch模式是开发阶段最常用的特性。

## 核心原则

- **原则1: FIRST原则**: Fast(快速）、Isolated(隔离）、Repeatable(可重复）、Self-validating(自验证）、Timely(及时）。每个测试用例运行时间不超过100ms，不依赖外部服务，每次运行结果一致，自动判断通过/失败，在编码后立即编写。
- **原则2: 一个测试用例只测试一件事**: 每个it/describe块验证一个行为。测试用例的命名应当清晰描述被测试的行为：`it('should return error when audit name exceeds 100 characters')`。如果一个测试用例中有多个断言(assert/expect），确保它们验证的是同一个行为的多个方面。
- **原则3: 适当的Mock范围**: Mock外部依赖但尽量避免Mock内部方法。Service A调用Service B时Mock Service B，但Service A内部的方法应当真实调用。过度Mock会导致测试与实现过度耦合，Mock太少则测试可能访问真实数据库变慢。
- **原则4: 边界条件优先测试**: 优先编写输入边界值、空值、极值的测试用例。空数组/空字符串、最大值/最小值、null/undefined、非法类型等边界条件是Bug高发区。Shenjiying88对每个公共函数要求至少包含3个边界条件测试。
- **原则5: 覆盖率不是目标，质量才是**: 100%覆盖率不等于没有Bug。差劲的测试(没有断言、测试空洞代码）即使覆盖率100%也没有价值。Shenjiying88将行覆盖率75%设为基线，但更关注Mutation Testing的结果——测试能否捕获引入的变异缺陷。

## 实践案例（基于shenjiying88项目）

- **案例1: AuditService的单元测试**: `AuditService.createAudit()` 测试包括：传递合法DTO时应成功创建并返回审计任务对象；传递空的auditName时抛出ValidationException；传递不存在的projectId时抛出NotFoundException；同一租户下创建同名审计时抛出ConflictException。所有数据库操作通过 Mock `AuditRepository` 实现。

- **案例2: 参数化测试**: 使用Jest的 `test.each` 对不同输入组合进行参数化测试。`test.each([{input: [...], expected: 'completed'}, {input: [...], expected: 'failed'}])('should return $expected when audit rules include $input.rule', ({input, expected}) => {...})`。参数化测试减少了重复代码，同时提升了测试覆盖的输入空间。

## 反模式警示

- **反模式1: 测试私有方法**: 测试应该关注公共行为(Public API），而非实现细节(Private Methods）。如果私有方法足够复杂需要单独测试，考虑将其提取为独立的公共方法或提取到另一个类中。直接测试私有方法会导致测试与实现耦合，重构时测试必须同步修改。

- **反模式2: 测试中操作用时**: 使用 `sleep()` 或 `setTimeout()` 等待异步完成是反模式。正确的做法是使用Jest的Mock Timer(`jest.useFakeTimers()`) 或Promise解析控制。基于真实时间的等待使测试变慢且不稳定。

## 参考文献

- Jest Documentation (2025) "Testing Framework Best Practices"
- Robert C. Martin (2008) "Clean Code" — Chapter 9: Unit Tests
- Kent Beck (2002) "Test Driven Development: By Example"
