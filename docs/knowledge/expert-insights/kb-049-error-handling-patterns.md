# 错误处理模式

> 分类: 开发实践 | 标签: 错误处理, 异常管理, Result模式, 稳定性 | 适用: 后端开发

## 概述

错误处理是决定系统健壮性的关键因素，也是开发中最容易被忽视的环节之一。很多系统的代码质量从"看起来不错"到"不堪一击"的分水岭就在错误处理——是否在每个可能失败的点都做了适当的处理。Shenjiying88系统作为企业级审计自动化平台，承载着客户的合规数据和时间敏感的任务，一个未处理的Error可能导致审计任务失败而不自知、数据保存不完整而后期难追溯。

错误处理的核心目标不是"不抛出异常"，而是"在正确的层次以正确方式处理异常"。底层方法抛出具体异常，中间层进行转换和增强(添加上下文信息），顶层统一捕获、记录并返回友好的错误信息。这种分层处理策略避免了"吞掉异常"也避免了"在每一层都catch同一异常"。

## 核心原则

- **原则1: 遇错必报，不吞异常**: 不要使用空的catch块(`catch (e) {}`）吞掉异常。如果catch了异常就至少做两件事：记录错误日志(包含完整的stack trace）和向上层传递异常或返回错误响应。Shenjiying88的ESLint配置禁止空的catch子句。
- **原则2: 业务异常使用Result模式，系统异常使用Exception**: 业务逻辑中的预期失败(如请求资源不存在、权限不足、格式校验失败）使用 `Result<T, E>` 模式返回。而非预期的系统级错误(数据库连接失败、文件系统错误、网络超时）使用Throw Exception。这种区分让调用方能清晰地区分"预期要处理的错误"和"表示系统有问题的错误"。
- **原则3: 错误信息包含追踪上下文**: 所有错误日志必须包含 `transactionId`、`tenantId`、`userId` 和 `requestPath`。这四元组使得运维人员可以在ELK中定位与同一请求相关的所有日志。Shenjiying88的NestJS ExceptionFilter在捕获异常时自动从请求上下文中提取并添加这些信息。
- **原则4: 全局异常过滤器统一响应格式**: 使用NestJS的全局ExceptionFilter将所有异常转换为统一的API错误响应格式。HTTP 4xx错误返回清晰的问题描述，5xx错误返回通用消息 + transactionId(避免泄露内部信息），同时记录完整的错误详情到ELK。
- **原则5: 重试策略区分幂等与非幂等**: 对于幂等操作(读取、PUT幂等更新），失败时自动重试(重试3次，指数退避）。对于非幂等操作(POST创建），失败时告知调用方"请求可能已处理"，由调用方通过查询确认状态。Shenjiying88使用 `@nestjs/bull` 的Retry机制实现消息处理的重试。

## 实践案例（基于shenjiying88项目）

- **案例1: Service层的Result模式**: `AuditService.createAudit()` 返回 `Result<AuditDto, AuditError>`。调用方通过 `const result = await auditService.createAudit(dto); if (result.success) { ... } else { ... }` 处理。`AuditError` 是一个联合类型：`AuditNameDuplicate | ProjectNotFound | TenantQuotaExceeded`。TypeScript的类型守卫确保每个错误类型被分别处理。

- **案例2: 全局ExceptionFilter的完整实现**: NestJS `AllExceptionsFilter` 实现 `catch(exception: unknown, host: ArgumentsHost)` 方法。对 `HttpException` 返回对应的HTTP状态码和code/message。对 `QueryFailedError`(数据库错误）识别PostgreSQL错误码——23505(唯一约束冲突）返回409，其他返回500。对所有未知异常返回500 + transactionId，同时写入Error级别的Winston日志。

## 反模式警示

- **反模式1: 在错误对象中包含敏感信息**: 数据库连接字符串、密码、内部IP地址等敏感信息不应出现在错误响应中。Shenjiying88的ExceptionFilter在开发环境下可以显示stack trace(用于调试），在生产环境中将其剥离并只记录到日志。

- **反模式2: 使用异常控制业务逻辑流程**: 不要抛出一个异常并期望调用方catch它作为控制流(如用异常表示"用户不存在"然后catch后创建用户）。这比普通的条件判断慢10-100倍，且使代码难以理解。使用明确的返回值或Result模式处理预期的业务分支。

## 参考文献

- NestJS Documentation (2025) "Exception Filters"
- Martin Fowler (2024) "Error Handling Patterns" — martinfowler.com
- Michael Nygard (2018) "Release It! — Design and Deploy Production-Ready Software" 2nd Ed.
