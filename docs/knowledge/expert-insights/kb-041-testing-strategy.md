# 分层测试策略

> 分类: 测试策略 | 标签: 测试金字塔, 测试策略, 质量保障, 分层 | 适用: 开发/QA/DevOps

## 概述

分层测试策略(Multi-layer Testing Strategy）是基于测试金字塔(Test Pyramid）理念定义不同粒度和覆盖范围的测试方法。典型的测试金字塔包含三层：底层是大量单元测试(Unit Tests），中间层是接口/集成测试(Integration Tests），顶层是少量端到端测试(E2E Tests）。每一层都有其独特的价值目标和成本结构——单元测试执行快(毫秒级）但覆盖范围窄，E2E测试覆盖真实场景但执行慢(分钟级）且不稳定。

Shenjiying88系统的测试策略在设计之初就确定了"70/20/10"比例分配——70%单元测试、20%集成测试、10%E2E测试。这个比例在团队实践中被证明是高效的：开发阶段每次提交可以快速执行单元测试发现问题，部署前由CI流水线执行集成和E2E测试验证整体功能。根据Google Testing Blog的研究，70/20/10比例的测试金字塔在开发速度和缺陷发现率之间取得了最佳平衡。

## 核心原则

- **原则1: 单元测试覆盖所有业务逻辑**: 所有Service层、Utils函数和领域模型必须编写单元测试。边界条件、异常路径和正常路径都需要覆盖。Shenjiying88的要求是Service方法的分支覆盖率≥85%，行覆盖率≥90%。
- **原则2: 集成测试覆盖数据访问和外部依赖**: 使用TestContainers启动PostgreSQL和Redis的真实实例进行集成测试，覆盖所有Repository层的CRUD操作和数据库约束。Mock外部HTTP服务但使用真实的数据库和缓存——这保证了数据层代码的可靠性。
- **原则3: E2E测试覆盖关键用户旅程**: E2E测试仅覆盖核心业务流程(注册→创建项目→运行审计→查看报告），不覆盖每个边缘case。每个E2E测试独立管理自己的测试数据(创建→使用→清理），不依赖其他测试的状态。
- **原则4: 测试数据确定性**: 每个测试用例使用独立的数据库事务，测试结束后回滚。确保测试的可重复性——无论执行顺序和次数，结果一致。Shenjiying88使用TypeORM的事务机制实现自动回滚。
- **原则5: 测试即文档**: 好的测试用例本身就是代码的活文档。测试用例的命名采用Given-When-Then模式：`should return completed audit when audit task finishes successfully`。测试代码应当像生产代码一样干净、可维护。

## 实践案例（基于shenjiying88项目）

- **案例1: AuditService的测试金字塔**: 底层: 对 `AuditService.calculateRiskScore()` 方法编写15个单元测试用例，覆盖不同输入组合。中间层: 通过TestContainers启动PostgreSQL，对 `AuditRepository.findByTenantAndStatus()` 进行集成测试。顶层: E2E测试覆盖 "企业用户创建审计任务→任务执行完成→查看报告" 完整流程。

- **案例2: CI中的分层测试执行策略**: 开发分支每次push时只执行单元测试(约3分钟）。合并到main时执行单元测试+集成测试(约12分钟）。部署到staging后执行E2E测试(约20分钟）。只有所有层级的测试都通过，代码才能部署到生产环境。这种分层执行避免了E2E测试成为开发速度的瓶颈。

## 反模式警示

- **反模式1: 冰淇淋/纸杯蛋糕反模式**: 金字塔颠倒——大量耗时的E2E测试 + 少量脆弱的集成测试 + 几乎没有单元测试。E2E测试的维护成本和执行时间都很高，且不稳定(Flaky）。如果发现团队在E2E测试上投入了大量时间而单元测试很少，说明测试策略需要调整。

- **反模式2: 共享测试状态**: 多个测试用例共享相同的数据库状态或全局变量。这导致测试之间相互依赖，执行顺序变化会得到不同结果。每个测试应当是完全独立的，设置自己的fixture并自行清理。

## 参考文献

- Martin Fowler (2018) "Test Pyramid" — martinfowler.com
- Google Testing Blog (2024) "Just Say No to More End-to-End Tests"
- Mike Cohn (2009) "Succeeding with Agile" — Test Automation Chapter
