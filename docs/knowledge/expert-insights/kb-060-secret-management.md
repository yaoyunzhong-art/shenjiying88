# 密钥管理最佳实践

> 分类: 安全 | 标签: 密钥管理, Secret管理, KMS, Vault | 适用: 安全工程师, DevOps

## 概述

密钥管理(Secret Management）是系统安全中最容易被忽视但也最关键的领域之一。数据库密码、API Key、JWT签名密钥、TLS证书和加密密钥——这些"秘密"存储和管理不当，就等同于把家门钥匙放在门垫下。根据GitGuardian 2025年泄露秘密报告，开发者每天平均将30个新秘密意外提交到公开代码仓库中，其中15%是有效且可用的。

Shenjiying88系统采用了多层密钥管理策略：基础设施层密钥(数据库密码、云服务密钥）使用Vault/KMS管理；应用层密钥(JWT签名、加密密钥）由应用配置中心管理但值本身加密存储；开发环境密钥使用 `sops`(Secret OPerationS）加密后在Git中安全存储。这种分层策略确保了不同敏感级别的密钥得到相应级别的保护。

## 核心原则

- **原则1: 密钥绝不硬编码**: 密码、Token、证书等任何形式的密钥绝不以明文形式出现在代码或配置文件中。Shenjiying88使用环境变量(来自K8s Secret或Docker Compose的docker secret）或Vault获取密钥。ESLint配置了 `no-hardcoded-secrets` 规则扫描代码中可能的硬编码密钥。
- **原则2: 密钥轮转自动化**: 所有密钥都有固定的轮转周期：数据库密码每90天轮转，JWT签名Key每180天轮转，TLS证书每年轮转。Shenjiying88使用自动化脚本执行轮转——通过Vault API生成新密钥、更新目标服务配置、验证新密钥可用、使旧密钥过期——整个过程无需人工介入。
- **原则3: 最小权限访问密钥**: 每个服务只访问其需要的密钥，不授予"读取所有密钥"的全局权限。Shenjiying88的Vault策略按服务维度定义。`Audit Service` 只能读取 `secret/audit/*` 路径的密钥，无法读取 `secret/user/*` 路径的密钥。
- **原则4: 审计密钥访问记录**: 所有密钥的读取操作都有审计日志记录——"谁在什么时间从什么IP读取了哪个密钥"。Shenjiying88的Vault审计日志通过Syslog发送到ELK，每周审查异常的密钥访问行为(如夜间大量读取数据库密码）。
- **原则5: 安全的密钥分发通道**: 新成员加入时，不使用聊天工具发送密码、不使用明文邮件发送密钥。Shenjiying88使用一次性密钥分发链接(24小时内有效，访问后失效）或由成员通过Vault CLI自行获取。所有密钥交付均有审计记录。

## 实践案例（基于shenjiying88项目）

- **案例1: Vault中的密钥管理**: Shenjiying88的HashiCorp Vault存储以下密钥：`secret/database/postgresql`(主数据库连接串）、`secret/redis/connection`(Redis密码）、`secret/jwt/signing-key`(JWT签名私钥）、`secret/third-party/sendgrid-api-key`(邮件服务Key）。应用启动时通过Vault Agent自动注入环境变量。Vault集群部署在独立于应用集群的服务器上。

- **案例2: docker secret替代环境变量**: 在Docker Compose配置中使用 `secrets:` 替代直接设置环境变量。例如：`POSTGRES_PASSWORD_FILE: /run/secrets/db_password`，应用读取文件而非环境变量获取密码。这种方式比环境变量更安全(环境变量可被子进程继承，可被 `/proc` 读取），且密码不存储在docker-compose.yml中。

## 反模式警示

- **反模式1: 密钥在日志中被泄露**: SQL查询日志中包含了密码(INSERT INTO users VALUES('admin', 'plaintext_password')），或者错误日志中打印了完整的连接字符串。Shenjiying88的日志过滤器配置了秘密字段模式——任何匹配 `password`、`secret`、`token`、`key` 等模式的字段值都会被替换为 `[REDACTED]`。

- **反模式2: 所有人共享同一个密钥**: 所有服务使用同一个数据库密码、同一个JWT签名密钥。一旦某个服务被攻破，所有其他服务也面临风险。Shenjiying88为每个服务分配独立的数据库用户和密码，JWT签名密钥也区分内外(token type不同）。

## 参考文献

- HashiCorp Vault Documentation (2025) "Production Hardening Guide"
- GitGuardian (2025) "State of Secrets Sprawl Report 2025"
- OWASP (2024) "Secrets Management Cheat Sheet"
