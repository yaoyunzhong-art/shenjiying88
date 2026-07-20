# V23 审计 · G2 安全组
> 日期: 2026-07-20 · 评审专家: E2李安全 + E38沈监管
> 版本: V23 v1.2

## 总体评级
🟡 **有条件通过**

## 评审意见

### 1️⃣ AuthGuard 默认拒绝原则已提上日程，但 V23 roadmap 缺少可执行的时间线

V23 在"54名专家评审意见"（第九节）中明确写入"AuthGuard 默认拒绝已上线"。但对比同样的安全基线检查记录：

- **182/189 个 Controller 无 `@Roles`/`@Permissions`/`@UseGuards` 显式标注**（来自 V22 安全组晨间简报）
- **全局 Guard 仍为宽松模式**：未标注路由默认放行，而非 403 拒绝

**核心矛盾**：V23 roadmap 第九节说"已上线"，而实际操作层面依然是宽松模式。这并不是 V23 的制度设计问题——制度写对了——而是**执行路线图缺失**：

- 没有给出"默认拒绝模式"的具体排期（Phase 几？什么时候完成？）
- 没有 `@Public()` 装饰器的实施计划
- 没有从 182 个 Controller 中筛选"哪些需要加 Guard"的行动步骤

**G2 要求**：在 V23 Phase 计划中补充"AuthGuard 默认拒绝"的明确排期，建议在 Phase 1（7/24-26）内完成核心模块（cashier/payment-gateway/finance/tenant）的 Guard 标注。

### 2️⃣ Security baseline 8/8 可签署，但"签署即安全"的幻觉未打破

V23 正确继承了 V18 教训："安全组签署不看签署率，看实战扫描结果"。但 roadmap 中写"Security baseline 8/8 ✅"作为 G2 签署前置条件，这与"看实战扫描"的原则矛盾。

**具体问题**：

| 基线项 | V23 状态 | 真实风险 | G2 判断 |
|:-------|:--------:|:---------|:-------:|
| AuthGuard 覆盖率 | ⚠️ 182/189 | 🔴 默认放行 | ❌ 不足8/8 |
| RLS 保护表 | 11 张 | 🟡 19 个 model 无 tenantId | ❌ 不足 |
| deviceToken 持久化 | ❌ 全内存 | 🔴 重启即失效 | ❌ 不足 |
| SSL 配置 | m5.ssl.conf 已建 | 🟡 自签名+内部域名（非生产级） | ✅ 但仅限dev |
| Docker 暴露端口 | 🔴 未审计 | 🟡 未明确 port 限制策略 | ❌ 未评估 |
| 渗透测试 CI | ✅ 退出码0 | ✅ 基础扫描 | ✅ |
| 跨租户隔离 | ✅ Controller 修复 | 🟡 Service 层仍有 gap | 🟡 |
| 认证白名单 | ⚪ 未定义 | 🔴 无白名单概念 | ❌ |

**真实情况**：8项中只有约3项达到 "✅ 生产级安全" 标准。V23 说"Security baseline 8/8 ✅" 是一种**签署幻觉**——把"写了配置"等同于"做好了安全"。

**G2 结论**：Security baseline 必须拆分「开发环境」和「生产环境」两套标准。开发环境用自签名+内部域名可以，生产环境必须有真实的证书、域名、暴露面最小化策略。

### 3️⃣ Docker 暴露面 + nginx SSL 配置的审计缺失

V23 Phase 0 完成了：
- `m5.ssl.conf` 创建 ✅
- `init-selfsigned-cert.sh` 自签名脚本 ✅
- nginx Docker build 通过 ✅

**G2 关注的是没有做的事情**：

- **Docker 端口暴露策略缺失**：`docker-compose.yml` 中没有定义哪些端口对外暴露、哪些仅内部访问。默认 `ports:` 映射会把服务端口直接暴露到宿主机，增加攻击面。
- **nginx SSL 配置无 certbot/certificate 更新机制**：自签名证书在 90 天后过期，没有配置自动续期或提醒机制。一旦过期，整个 HTTPS 链路会中断。
- **没有定义 reverse proxy bypass 的保护**：如果 nginx SSL terminate 在边缘，内部 API 之间是否也走 TLS？如果 API 走 HTTP 内部通信，攻击者通过内部网络访问即可绕过 nginx。

**要求**：
1. docker-compose 中显式标注每个服务的 `expose` vs `ports` 策略
2. certbot 或 acme.sh 自动续期脚本（即使自签名，也要有 cron 续期）
3. 内部 API 通信最低要求：网络隔离（internal network）+ 至少 HTTP Basic Auth

### 4️⃣ V23 的"远程推送 0次"铁律高度认可，但未覆盖 API 主动外呼风险

V23 继承了大飞哥的远程推送禁令：V22→V23 远程推送 **0次**。这是正确的。

**但 V23 roadmap 没有覆盖另一个出去方向的风险**：API 主动外呼。PaymentGateway 的 WeChat/Alipay adapter 需要主动向外发起 HTTPS 请求。如果这些请求没有：
- URL 白名单验证
- 超时控制（connect timeout + read timeout）
- 响应体大小限制
- mTLS 证书校验

那么即使不 push，API 外呼也能成为数据泄露的通道。

**建议**：在 V23 安全策略中补充「外呼安全」章节，覆盖 PaymentGateway adapter、Webhook callback、AI 模型 API 调用等出去方向。

## 关注点

### 🔴 认证白名单策略缺失

V23 全篇没有提及"认证白名单"——即哪些 IP/域名可以绕过 AuthGuard 访问哪些端点。这在以下场景中必须：

- CI/CD 的 webhook 回调（GitHub → API）
- 支付网关的回调（WeChat/Alipay → payment-gateway）
- nginx health check 端点
- 监控系统（Prometheus）对 API 的拉取请求

没有白名单意味着这些入口都依赖 AuthGuard 的宽松模式——要么全部放行，要么全部阻塞。

**建议**：在 V23 Phase 2（7/27→30）中补充认证白名单配置，定义 `ALLOWED_CALLBACK_IPS` 环境变量，并创建 `ip-whitelist.guard.ts` 装饰器。

### 🟡 Docker 镜像安全基线缺失

- 使用什么基础镜像（`node:22-slim` vs `node:22-alpine` vs `distroless`）？
- 是否运行在 non-root 用户下（`USER node`）？
- 是否安装了不必要的系统包（curl、wget、bash）？
- 是否有层缓存安全问题（secret 泄漏到镜像层）？

**建议**：在每个 Dockerfile 中补充：
1. `RUN addgroup -S app && adduser -S app -G app` + `USER app`
2. 多阶段构建，最终阶段不携带 devDependencies
3. 添加 `docker scout` 或 `trivy` 扫描到 CI

### 🟡 渗透测试完整度不足

当前 CI 中的渗透测试（security-pentest 扫描）使用退出码门禁，但扫描范围不明确：
- 是否扫描了所有 189 个 Controller 的所有端点？
- 是否测试了 SQL 注入、XSS、CSRF、JWT 伪造？ 
- API 的 fuzz 测试是否覆盖？

**建议**：在 V23 Phase 2 中扩展渗透测试范围：
- 从"端点可达性扫描"升级为"OWASP Top 10 覆盖扫描"
- 补充规则：已知 CVE 的依赖库扫描（`npm audit` + `snyk` 或 `trivy`）

## 建议

### 1. 安全基线拆分「开发/生产」两阶段

**开发环境基线**（Phase 0 结束时达成）：

| 项 | 标准 |
|:---|:-----|
| AuthGuard | 全局宽松模式 + 至少 cashier/payment-gateway/finance 三个核心模块显式 Guard |
| SSL | 自签名证书 + nginx 配置有效 |
| Docker | non-root 用户运行 + expose 策略定义 |
| RLS | 11 张表保护 + payment_gateway 表补充 |
| 扫描 | CI 渗透测试退出码0 |
| 远程推送 | 0次铁律 |

**生产环境基线**（Phase 2 结束时达成）：

| 项 | 标准 |
|:---|:-----|
| AuthGuard | 默认拒绝模式 100% Controller 显式标注 |
| SSL | Let's Encrypt 真实证书 + certbot 自动续期 |
| Docker | 最小暴露面 + trivy 漏洞扫描 |
| RLS | 全部含 tenantId 的 model 保护 |
| 扫描 | OWASP Top 10 + 依赖漏洞扫描 |
| 远程推送 | 0次铁律 + 外呼安全控制 |

### 2. 从 Guard→Policy 升级：声明式安全策略引擎

当前的安全体系是基于装饰器的（`@UseGuards`），每个 Controller 独立标注。当 189 个 Controller 变成 300 个时，手动标注不可持续。

**建议 V23 引入 security-policy.yaml 策略文件**：

```yaml
# config/security-policy.yaml
endpoints:
  # 所有路由默认拒绝
  default: { auth: DENY_ALL }
  
  # 白名单
  "/auth/*": { auth: PUBLIC }
  "/health": { auth: PUBLIC, rate_limit: 100/min }
  "/open-api/*": { auth: API_KEY, rate_limit: 30/min }
  
  # 内部服务
  "/api/monitoring/*": { auth: INTERNAL_NETWORK }
  "/callback/*": { auth: IP_WHITELIST }
  
  # 业务端点
  "payment-gateway/*": { auth: TENANT_AWARE, roles: [admin, finance] }
```

这样，新增 Controller 时不需要手动标注——Policy 引擎会根据 URL 模式自动匹配安全策略。

### 3. 安全审计日志的持久化策略

当前多个模块使用内存 Map 存储交易记录/审计日志（Finance 全内存、deviceToken 全内存）。安全审计的黄金法则是 **"谁在什么时候做了什么"** ——重启丢失意味着零审计追溯能力。

**建议**：
- 审计日志至少写入 `stdout`（docker logs）做最低保障
- 交易记录使用数据库持久化（finance 模块 P0 迁移）
- 建立 audit_log 表，记录所有 `@UseGuards` 未命中事件（AuthGuard 拒绝日志）

---

**G2 最终评级: 🟡 有条件通过**

通过条件（Phase 0 结束前 7/23）：
1. 发布 "AuthGuard 默认拒绝" 的具体 Phase 排期和迁移计划
2. 完成 Docker 端口暴露策略文档 + non-root 用户配置
3. 指定认证白名单策略（至少 callback + health check 两条）

若 7/23 前无上述产出，G2 保留升级为🔴退回的权利。

*🐜 G2 安全组 · V23 审计 · 2026-07-20 23:10 CST*
