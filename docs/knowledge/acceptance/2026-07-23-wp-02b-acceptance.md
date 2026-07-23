# WP-02B 安全与审计阀门 · Sprint-0 基线验收卡

**日期**: 2026-07-23  
**迭代**: Sprint-0  
**状态**: ⚠️ 基线已盘点（存在明确缺口，需进入 Sprint-1 整改）  
**6-8_refs**: [BS-0048, BS-0049, BS-0050, BS-0051, BS-0052, BS-0053, BS-0054, BS-0055, BS-0056, BS-0057, BS-0058, BS-0059, BS-0062, BS-0063, BS-0064, BS-0065]  
**blocker_id**: none  

---

## 1. 条款基线矩阵（证据驱动）

| BS | 条款 | 当前态 | 证据 |
|:--:|------|:------:|------|
| BS-0048 | TLS 1.3 全链路 | ⚠️ 部分 | Ingress 已强制 HTTPS + TLS secret 引用：`infra/k8s/rendered-cert-manager/m5-ingress-public.yaml`；TLS 1.3 协议级需以 ingress controller 配置/线上握手证据补齐 |
| BS-0049 | AES-256 敏感数据字段加密 | ⚠️ 部分 | 已存在 AES-256-GCM 字段加密工具：`apps/api/src/modules/ai-model-config/encryption.util.ts`（覆盖 AI 模型密钥/端点）；全域敏感字段清单与统一加密边界未形成 |
| BS-0050 | 审计日志 ≥ 1 年 | ❌ 未满足 | 审计能力存在但为内存态：`apps/api/src/modules/audit/audit.service.ts`、`apps/api/src/modules/compliance/audit-log.service.ts`；缺少持久化与保留策略证据 |
| BS-0051 | AI 训练 opt-in（默认关闭） | ❌ 未发现实现 | 未检索到明确 opt-in/consent gating 实现（需在 AI 相关模块补齐并形成验收证据） |
| BS-0052 | 数据泄露应急 1 小时启动 | ⚠️ 待补证据 | 需补 SOP 文档/演练记录与责任链（可参考 `docs/knowledge/acceptance/2026-07-22-prod-503-acr-regcred-closeout.md` 的事故收口风格） |
| BS-0053 | 防火墙仅必要端口 | ⚠️ 待补证据 | IaC 存在：`infra/terraform/aliyun-prod-*.tf`；需补安全组端口清单与最小暴露证据（含 ACK/SLB/RDS/Redis） |
| BS-0054 | SSH 密钥登录（堡垒机） | ⚠️ 待补证据 | 需补运维基线与执行证明（是否存在堡垒机/仅密钥/禁用密码登录） |
| BS-0055 | 网络完全隔离（生产/开发 VPC） | ⚠️ 待补证据 | IaC 存在：`infra/terraform/aliyun-prod-*.tf`；需补 VPC/子网/路由隔离证明与“开发不可直连生产”门禁 |
| BS-0056 | 高防 IP / DDoS 防御（建议） | ⚠️ 待确认 | 条款为“建议”，需在外部资产清单中确认是否启用与策略级别 |
| BS-0057 | 双因素认证（管理员） | ❌ 未发现实现 | 需在 auth/admin 侧补 2FA 能力与验收链路（登录/高危操作二次校验） |
| BS-0058 | API 网关统一 IP 注入 | ⚠️ 部分 | Ingress 已配置 `X-Request-Id/Traceparent` 等头放行；审计模块支持从上下文注入 IP：`apps/api/src/modules/audit/audit.service.ts`；需补“真实来源 IP 注入策略”证据（X-Forwarded-For / X-Real-IP 解析链） |
| BS-0059 | >500 条导出需审批 | ❌ 未发现实现 | 需补导出审批流（RBAC + workflow）与可验证门禁（超阈值自动阻断/发起审批） |
| BS-0062 | 密钥加密 + 定期轮换 | ⚠️ 部分 | 已存在生产环境强制密钥注入拒绝 fallback：`apps/api/src/modules/ai-model-config/encryption.util.ts`；全域密钥轮换与审计未形成闭环 |
| BS-0063 | 年度第三方渗透测试 | ⚠️ 待补证据 | 需外部交付物（报告/整改闭环）并挂到验收目录 |
| BS-0064 | 暴力破解防护（5 次锁定） | ⚠️ 已补代码、HTTP 与跨实例门禁 | `apps/api/src/modules/auth/auth.service.ts` 已实现同一 `mobile/email` 连续失败 `5` 次锁定 `30` 分钟、成功登录复位，并支持 `RedisService` 可用时走共享锁定态、不可用时回退内存态；`auth.service.test.ts`、`auth.http.e2e.test.ts` 已覆盖 service/HTTP/跨实例验证 |
| BS-0065 | 离职 72 小时锁定 | ⚠️ 待补证据 | 需补账号生命周期治理（disable/revoke token/权限回收）与审计证据 |

---

## 2. Sprint-1 最小门禁建议（先能拦截）

- Block Merge（P0）建议：BS-0050（审计留存）、BS-0057（2FA）、BS-0064（暴力破解防护）、BS-0059（导出审批）
- Pre-release 建议：TLS 强制 + CORS 白名单 + 入口限流（已有 Ingress 注解基础，需补验证脚本）
- 偏离登记（DEV）建议：对“存在但未证据化/未持久化”的条款先登记 DEV，避免口头承诺

---

## 3. 证据落点

- Sprint-0 执行包：`docs/knowledge/sprint-0/2026-07-23-wp-02b-kickoff-tasks-checklist.md`
- 合规模板库：`docs/knowledge/compliance/_templates.md`
- 偏离台账：`.trae/compliance/deviation-registry.json`

---

## 4. Sprint-0 WP-02B 本轮完成项 (2026-07-23)

### 4.1 审计事件类型补缺

新增事件类型（代码级，无需 DDL）：
- `user.created`, `user.deleted`, `user.disabled`, `user.enabled`
- `admin.user_created`, `admin.user_deleted`, `admin.user_disabled`, `admin.user_enabled`

**修改文件**: `apps/api/src/modules/audit/audit.service.ts`, `apps/api/src/modules/audit/audit.entity.ts`

### 4.2 修复测试缺陷

修复 `audit.role-api.test.ts`：异常检测需 `eventType='auth.login'` + `metadata.success=false`，但原测试使用了不存在的事件类型 `auth.login_failed`。

### 4.3 PRD 摘要卡

- `docs/knowledge/prd/v23/v23-prd-security-audit.md` — 安全与审计模块全量盘点 + 本轮回合变更说明

### 4.4 测试结果

| 模块 | 文件 | 用例 | 结果 |
|------|------|------|------|
| audit | 14 | 396 | ✅ 全绿 |
| security | 13 | 347 | ✅ 全绿 |

**无** `test.skip` / `test.only`

### 4.5 安全基线扫描

AuthGuard 覆盖率: **95.75%** (203/212) — 远超 80% 阈值

### 4.6 TSC 检查

无新增编译错误（预存错误来自 `ai-model-config`/`cashier`/`compliance`/`devops` 测试文件，与本次变更无关）

### 4.7 PR 合规

- `6-8_refs: [BS-0048..BS-0059, BS-0062..BS-0065]`
- blocker_id: none
