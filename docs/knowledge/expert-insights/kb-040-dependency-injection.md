# 依赖注入设计模式

> 分类: 技术架构 | 标签: 依赖注入, IoC, 解耦, 可测试性 | 适用: 后端开发

## 概述

依赖注入(Dependency Injection, DI）是实现控制反转(Inversion of Control, IoC）的核心设计模式。它将对象的依赖关系从"对象内部自行创建"转变为"由外部容器注入"，从而显著降低组件间的耦合度、提高可测试性和代码的灵活度。NestJS内置的DI容器基于Angular的Injector设计，支持构造函数注入、属性注入和可选注入，同时提供了丰富的Provider作用域控制（Singleton、Request、Transient）。

Shenjiying88系统的DI设计中贯彻了"显式依赖优于隐式依赖"的理念——任何服务所需的依赖都在构造函数中显式声明，而不是通过Service Locator模式或全局变量获取。这种设计使得单元测试中每个依赖都可以被Mock替换，测试覆盖率从45%提升到92%。根据Google Engineering Practices的研究，合理使用DI的项目，代码变更对现有功能的影响范围可缩小50-70%。

## 核心原则

- **原则1: 面向接口编程+令牌注入**: 定义抽象接口(Abstract Class或Interface），使用 `@Injectable()` 和自定义Provider Token(`{ provide: 'AUDIT_REPOSITORY', useClass: PostgresAuditRepository }`）实现依赖注入。这样可以在不修改消费者代码的情况下替换实现——测试时注入Mock，生产时注入真实实现。
- **原则2: 构造函数注入优先**: 始终使用构造函数注入(Constructor Injection），而非属性注入(`@Inject() property propertyService`）。构造函数注入使得依赖关系在实例创建时就明确可见，且有利于TypeScript的只读属性(`readonly`）和不变性保证。Shenjiying88的ESLint规则强制使用构造函数注入。
- **原则3: 作用域匹配生命周期**: Singleton(Single instance per application）用于无状态服务(AuditService、UserService）。Request(每个请求新建实例）用于需要请求上下文的服务(如CurrentUserContext）。Transient(每次注入新建）用于轻量级工具类。错误的作用域配置可能导致内存泄漏或数据污染。
- **原则4: Provider分类注册**: 将Provider分为三类——业务Service(在Feature Module中注册）、基础设施适配器(如Repository、Cache在Persistence Module中注册）和跨横切关注点(Logger、Config在Core Module中注册）。每类Provider在不同的模块层级中注册，创建清晰的依赖层次。
- **原则5: 自定义Provider灵活性**: NestJS支持多种Provider语法：`useClass`(别名）、`useFactory`(工厂模式，支持异步初始化）、`useValue`(常量注入）。Shenjiying88使用 `useFactory` 异步创建Redis连接实例，确保在服务使用前完成连接初始化。

## 实践案例（基于shenjiying88项目）

- **案例1: 审计数据处理器的DI设计**: `AuditDataProcessor` 构造函数接受 `AuditRuleRepository`、`ResultAnalyzer`、`ReportGenerator` 三个依赖。这三个依赖通过DI容器自动注入。在单元测试中，使用 `Test.createTestingModule({ providers: [AuditDataProcessor, { provide: AuditRuleRepository, useValue: mockRepository }] })` 创建测试模块，注入Mock依赖。

- **案例2: 自定义Provider实现Config注入**: `APP_CONFIG` Provider Token 通过 `useFactory` 创建——工厂函数从环境变量加载配置并返回配置对象。ConfigModule将该Provider标记为 `global: true`，使得所有模块都可以通过 `@Inject('APP_CONFIG')` 注入配置对象，无需在每个模块中导入ConfigModule。

## 反模式警示

- **反模式1: 构造函数注入过多依赖(超过5个）**: 如果服务构造函数有6个以上的参数，说明该服务承担了太多职责，需要拆分为多个更专注的服务。Shenjiying88的Code Review规则将构造函数参数数量上限设为5个，超过则强制重构。

- **反模式2: 使用Service Locator模式**: 通过全局静态方法获取服务实例(如 `ServiceLocator.get(AuditService)`）会隐藏依赖关系，使代码难以理解和测试。应始终坚持构造函数注入，让依赖关系透明可见。

## 参考文献

- Martin Fowler (2004) "Inversion of Control Containers and the Dependency Injection pattern"
- NestJS Documentation (2025) "Custom providers / Injection scopes"
- Google Engineering Practices (2023) "Dependency Injection Best Practices"
