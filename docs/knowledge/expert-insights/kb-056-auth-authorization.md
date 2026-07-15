# 认证授权设计

> 分类: 安全 | 标签: 认证, 授权, JWT, RBAC, OAuth2, ACL | 适用: 安全工程师, 后端架构师

## 概述

认证(Authentication）验证"你是谁"，授权(Authorization）决定"你能做什么"。这两个概念是系统安全的基础门禁。Shenjiying88系统作为多租户审计平台，认证授权设计需要同时支持用户到租户的归属关系、租户内的角色权限和跨租户的管理能力。系统的权限模型采用RBAC(Role-Based Access Control）+ 资源级ACL(Access Control List）的组合方案。

根据OWASP 2025年的安全指南，约50%的Web应用安全漏洞与认证授权缺陷有关——最常见的是水平越权(用户A访问用户B的资源）和权限提升(普通用户执行管理操作）。Shenjiying88的认证授权设计从零开始就遵循"最小权限"和"纵深防御"原则，并通过自动化安全测试定期验证。

## 核心原则

- **原则1: 认证与授权分离**: JWT(Access Token）仅负责认证——证明"我是用户X，属于租户Y"。所有的权限决策在服务层通过RBAC引擎进行——检查"用户X的角色在资源Z上是否有操作权限"。这样Token在有效期内不需要刷新，权限变更可以即时生效(通过查询数据库）。
- **原则2: 最小权限原则(Least Privilege）**: 每个用户只分配完成其工作所需的最小权限集。默认拒绝，明确允许。Shenjiying88的授权策略是：新建用户默认没有任何权限，需要管理员显式分配角色。API端点的默认状态是"认证+授权"，需要声明为Public才允许无Token访问。
- **原则3: RBAC + 资源级ACL双层**: RBAC控制角色层级的权限(审计员可以查看审计任务）。ACL控制特定资源的权限(审计员只能查看自己所属项目的审计任务）。Shenjiying88的权限检查流程：先检查RBAC角色授权，再检查ACL资源授权。第二层ACL是防止水平越权的关键。
- **原则4: Token生命周期管理**: Access Token(15分钟过期）用于API认证。Refresh Token(7天过期，一次性使用）用于获取新的Access Token。Token通过HTTP-only + Secure + SameSite=Strict Cookie或Authorization Header传输。Refresh Token轮换：每次使用Refresh Token获取新Token时，旧的Refresh Token失效。
- **原则5: 密码策略与多因子认证(MFA）**: 密码最小长度12字符，必须包含大小写字母+数字+特殊字符。使用Argon2id进行密码哈希(迭代次数3、内存15MB、并行度1）。MFA可选但推荐：使用TOTP(时间型一次性密码）或WebAuthn(FIDO2）。Shenjiying88在管理后台和敏感操作上强制MFA。

## 实践案例（基于shenjiying88项目）

- **案例1: 租户内的RBAC权限模型**: Shenjiying88定义了四种预置角色：Org Admin(租户超级管理员，所有权限）、Audit Manager(审计经理，创建/执行/编辑审计任务）、Auditor(审计员，只能执行和查看审计任务）、Viewer(只读，只能查看报告）。Org Admin可以自定义角色和权限组合。权限检查通过 `@RequirePermission('audit:create')` 装饰器在路由层面完成。

- **案例2: 资源级ACL实现**: 审计任务的ACL规则：只有创建者、任务分配者和项目管理员可以编辑审计任务；所有项目成员可以查看。权限检查在 `AuditService.getAuditDetail()` 中实现：先从数据库中获取审计任务的 `projectId` 和 `assigneeId`，然后检查当前用户是否在该项目的成员列表中。如果不在则返回403。

## 反模式警示

- **反模式1: 只在Frotend做权限控制**: 前端隐藏按钮不等于后端无权限。攻击者可以直接调用API绕过前端限制。所有权限决策必须在后端执行，前端权限控制仅是用户体验层面的辅助。

- **反模式2: 使用角色硬编码**: `if (user.role === 'admin')` 写在业务代码中。当需要新增角色或修改角色权限链时，需要搜索所有硬编码的角色检查位置。正确的做法是使用统一的权限检查服务，角色-权限映射存储在数据库中，支持动态配置。

## 参考文献

- OWASP (2025) "Authentication Cheat Sheet" / "Authorization Cheat Sheet"
- NIST SP 800-63B (2023) "Digital Identity Guidelines"
- Auth0 (2024) "Best Practices for Auth & Authorization"
