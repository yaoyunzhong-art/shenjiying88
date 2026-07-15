# Mock/Stub/Fake策略

> 分类: 测试策略 | 标签: Mock, Stub, Fake, 测试替身, 隔离测试 | 适用: 后端开发

## 概述

在单元测试和集成测试中，测试替身(Test Doubles）是隔离被测试代码与外部依赖的关键技术。常见的测试替身包括Mock、Stub、Fake、Spy和Dummy五种类型，它们各自有不同的用途和行为语义。错误使用测试替身会导致测试可靠性下降——过度Mock使得测试与实现耦合、更换实现需要重写所有测试；Mock不足则使测试缓慢且不稳定。Shenjiying88的测试套件约1200个用例中，大约30%需要Mock外部依赖。

理解每种替身的区别很重要：Stub返回预设的响应(ans：A方法调用B，B被替换为返回固定值的Stub）；Mock验证交互行为(验证A确实调用了B，且参数正确）；Fake是一个轻量级的真实实现替代(如内存数据库替代真实数据库）。Shenjiying88的测试策略中，Mock仅用于验证服务间的交互是否正确，Stub/Fake用于隔离外部依赖使测试快速运行。

## 核心原则

- **原则1: 优先Fake，其次Stub，最后Mock**: Fake(内存数据库、内存消息队列）提供了最真实的模拟行为，测试对Fake的依赖最少。Stub用于控制API调用的返回结果。Mock仅用于验证"交互是否发生"(如消息是否被发送、日志是否被记录）。Shenjiying88使用SQLite内存数据库作为PostgreSQL的Fake进行Repository层测试。
- **原则2: 不对自己不拥有的代码做Mock**: Mock外部API(第三方支付网关、邮件发送服务）是合理的，但不应对自己团队内部的Service层方法做Mock。如果Service A调用Service B，使用Stub设置Service B的返回结果，而非使用Mock验证Service A调用了Service B——那是在测试实现细节。
- **原则3: Mock配置只在测试中可见**: Mock定义应当内嵌在测试文件中，而非放在全局的setup文件。全局Mock会导致测试间的隐式依赖，且不容易追踪Mock的来源。Shenjiying88的每个测试文件都在文件开头声明该文件中使用的Mock。
- **原则4: Mock验证最小化**: 仅验证关键的交互——消息是否被发送到正确的队列、日志是否记录了错误信息。不要验证每个中间变量的值或每个方法的调用顺序——那是在测试实现细节。Shenjiying88的Mock验证只覆盖外部边界：Service的方法调用和数据传递。
- **原则5: 使用Spy检查Side Effect**: Spy是Mock的变体——它包装真实对象，记录调用信息但不改变方法行为。Spy适合验证方法的副作用是否按预期发生。Shenjiying88使用Spy监控Logger是否正确记录了错误信息，而不改变Logger的原始行为。

## 实践案例（基于shenjiying88项目）

- **案例1: AuditService的Mock策略**: `AuditService.createAudit()` 内部调用 `AuditRepository.save()` 和 `EventBus.publish()`。测试中使用 `jest.spyOn(repository, 'save').mockResolvedValue(mockAudit)` Mock数据库保存操作；使用 `jest.spyOn(eventBus, 'publish').mockImplementation()` Mock事件发布。验证 `save` 被调用且参数正确，以及 `publish` 被调用且事件类型为 `audit.created`。

- **案例2: 使用In-Memory Fake替代真实数据库**: 对于Repository层测试，Shenjiying88使用 `@InjectRepository()` 注入一个SQLite内存数据库替代PostgreSQL。Fake数据库支持所有CRUD操作和事务，测试运行速度快(每次测试<10ms），且不需要启动TestContainers。仅在对PostgreSQL特定特性(如JSONB查询）的测试中使用真实数据库。

## 反模式警示

- **反模式1: Mock Everything**: 将所有依赖全部Mock，包括String、Array等语言内置类型和自己团队内部的所有方法。过度Mock导致测试与实现细节过度耦合——重构实现时就算行为不变也需要重写测试。只Mock外部边界(第三方服务、数据库、消息队列），内部调用保持真实。

- **反模式2: Mock返回undefined但代码不处理**: Mock了一个方法但未设置返回值(默认为undefined），然后代码在访问返回值属性时崩溃。所有Mock的方法必须明确设置返回值——即使是空对象或null。同时不要Mock那些返回void的方法。

## 参考文献

- Martin Fowler (2007) "Mocks Aren't Stubs" — martinfowler.com
- Gerard Meszaros (2007) "xUnit Test Patterns" — Test Double Patterns
- Jest Documentation (2025) "Mock Functions"
