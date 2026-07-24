# 龙虾哥同步稿 - 2026-07-19

> 最新口径：神机营 SaaS 已从“冲刺写功能”切到“Release Bundle 驱动交付”。

---

## 1. 当前生产状态

- `sportsant.net` 正式公网入口已切换完成。
- 当前正式域名：
  - `api.sportsant.net`
  - `admin.sportsant.net`
  - `store.sportsant.net`
  - `tob.sportsant.net`
- 生产 TLS 已切为 DigiCert 通配符证书：`CN=*.sportsant.net`
- live Ingress 已切到正式域名口径。
- live Config 已切到正式口径：
  - `NEXT_PUBLIC_API_URL=https://api.sportsant.net/api/v1`
  - `NEXT_PUBLIC_WS_URL=wss://api.sportsant.net`
  - `CORS_ORIGIN=https://admin.sportsant.net,https://store.sportsant.net,https://tob.sportsant.net`

## 2. 当前线上验收结果

- `api.sportsant.net/api/v1/health/ping = 200`
- `admin.sportsant.net = 200`
- `store.sportsant.net = 200`
- `tob.sportsant.net = 200`
- 浏览器验收已通过：
  - `admin.sportsant.net` 页面成功加载
  - `store.sportsant.net` 页面成功加载
  - `tob.sportsant.net` 页面成功加载
- 当前核心 Deployment 稳态：
  - `m5-api 1/1`
  - `m5-admin-web 2/2`
  - `m5-storefront-web 2/2`
  - `m5-tob-web 1/1`

## 3. 本次线上问题与确认经验

- 阿里云账户欠费会导致 SLB 锁定，典型表现：
  - TCP 可达
  - TLS 握手直接 EOF / `SSL_ERROR_SYSCALL`
- `acr-regcred` 当前依赖 ACR 临时令牌，过期后会导致：
  - `401 Unauthorized`
  - `ImagePullBackOff`
  - Pod 不 Ready
  - 公网入口统一返回 `503`
- 域名切换不能只改证书和 Ingress，必须同步改：
  - `m5-config`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_WS_URL`
  - `CORS_ORIGIN`

## 4. 已拍板的标准开发流程

- 从现在开始统一采用：`Release Bundle 驱动开发流程`
- 核心原则：
  - 任一时刻只允许 `1 条业务主线 + 1 条稳态主线`
  - 上线只认：`Git -> 镜像 -> ACR -> K8s -> 验收 -> 留证 -> 可回滚`
  - 禁止直接 SSH 上生产改源码
  - 禁止容器内手改代码
  - 没有验收证据，不算完成
  - 没有回滚口径，不得上线

## 5. 未来 14 天推进方向

- 先稳生产，再收收入主链，最后做平台化。
- 第一周：
  - `acr-regcred` 自动刷新
  - 发布前检查脚本
  - 阿里云余额 / SLB 锁定告警
  - 唯一业务主线确认
- 第二周：
  - 只推进 1 条真实业务主链闭环
  - 推荐优先：`POS / Checkout / 支付 / 退款`
- 禁止多线平推，禁止新模块插队。

## 6. 本周任务板

- 唯一业务主线：`POS / Checkout / 支付 / 退款`
- 唯一稳态主线：`acr-regcred 自动刷新 + 发布前检查`
- 本周目标：
  - 把生产稳态做成制度
  - 把唯一交易主链做成可演示、可验收、可回滚

## 7. 后续执行硬规则

- 所有生产口径统一以 `sportsant.net` 为准。
- 不得回到：
  - `.m5.local`
  - `m5-platform.com`
  - 旧 TLS / 旧 Ingress / 旧 Config 口径
- 所有任务必须按四层拆分：
  - 代码层
  - 配置层
  - 验收层
  - 回滚层

## 8. 当前权威文件

- `infra/k8s/rendered-cert-manager/m5-ingress-public.yaml`
- `infra/k8s/rendered-cert-manager/m5-config-public.yaml`
- `scripts/verify-m5-tls-secret.sh`
- `scripts/verify-prod-public-endpoints.sh`
- `TASKS_STATUS.md`
- `WEEKLY-RYG-STATUS-BOARD.md`

## 9. 给龙虾哥的一句话执行令

- 从现在起，神机营只按标准流程推进：先稳生产，再收唯一主链，不再多线乱战。

---

## 10. 2026-07-23 最新协作口径

- 大飞哥负责监督、拍板和验收。
- 龙虾哥负责动脑、动嘴、给策略、做评审、出建议。
- 树哥负责执行、落代码、跑联调、补证据、做收口。
- 后续所有任务默认按这套三方分工执行，除非大飞哥临时改口。

## 11. 当前外部依赖约束

- `LYT 电玩城` 和 `数字运动潮玩馆管理系统` 的真实接口文件暂时还没有拿到。
- 因此所有 `LYT` 相关开发当前只能按以下原则推进：
  - 先做本地适配器边界、配置模型、容错和降级能力。
  - 不得臆造真实线上协议细节并当成已确认事实。
  - 需要真实联调的接口，统一标记为 `blocked by missing LYT api spec`。
  - 一旦接口文件到位，优先补齐：字段映射、签名方式、错误码、Webhook、轮询/回调语义。

## 12. 当前最高规划基线

- 当前项目最高蓝图继续以 `《规划6-8_副本.md.txt》V5.1` 为准。
- 已完成的对照拆解与开发计划，统一按以下文档执行：
  - `/Users/yaoyunzhong/Desktop/shenjiying/规划6-8_副本.md.txt`
  - `docs/operations/r18-requirement-dev-mapping.md`
  - `docs/6-8-compliance-rectification-list.md`
  - `docs/6-8-foundation-compliance-charter.md`
  - `docs/knowledge/2026-07-23-6-8-development-master-backlog-v1.md`
  - `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md`
  - `docs/operations/r11-architecture-hard-constraints.md`
  - `docs/operations/r12-middleware-engine-specs.md`
  - `docs/operations/r13-business-app-requirements.md`
  - `docs/operations/r14-cexperience-marketing-hard-constraints.md`
  - `docs/operations/r15-social-growth-eco-governance.md`
  - `docs/operations/r16-optimization-matrix.md`

## 13. 已同步给龙虾哥的最新规划口径

- 《规划6-8》不是“参考文档”，而是当前开发总基线。
- 现阶段不能宣称“全部功能已开发完成”，只能宣称：
  - 交易/订单/H5 支付/财务主链已明显前进。
  - 对 `V5.1` 全量功能清单仍有大量条目未完成。
- 最新开发计划现以 `v2 正式版` 为准，`v1` 仅保留作审阅痕迹，不再作为派工依据。
- 最新可执行任务总表文件为：
  - `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md`
- Sprint-0 执行包文件为：
  - `docs/knowledge/sprint-0/2026-07-23-wp-compliance-kickoff-tasks-checklist.md`
  - `docs/knowledge/sprint-0/2026-07-23-wp-00-kickoff-tasks-checklist.md`
  - `docs/knowledge/sprint-0/2026-07-23-wp-02a-kickoff-tasks-checklist.md`
  - `docs/knowledge/sprint-0/2026-07-23-wp-02b-kickoff-tasks-checklist.md`
- `v2` 已完成以下修正：
  - 补齐 `WP-00` 架构底座与 `WP-COMPLIANCE`
  - 修正 `BS-0260` 误用，开发合规阀门改回 `BS-0233`
  - 补齐 `P0 最小上线包`
  - 将所有 `LYT` 相关任务拆成 `A 可先做 / B 条件启动`
  - 增加 `阻塞单 / PR 合规字段 / 回滚模板 / 周报数据源`
- 当前优先级顺序：
  - 先补底座和强依赖。
  - 先收 `P0` 和强合规项。
  - 再补业务、中台、增长引擎。
  - 最后清零 `SIM-01 ~ SIM-20`、`OPT-01 ~ OPT-45`。

## 14. 对龙虾哥的当前执行提醒

- 后续在任何涉及 `LYT` 的方案建议里，必须显式区分：
  - 已确认事实
  - 本地假设
  - 被接口文件阻塞项
- 后续在任何排期建议里，必须优先引用 `《规划6-8_副本.md.txt》` 与 `r18` 映射，不再以局部模块完成度代替全局完成度。
- 后续对大飞哥的口径必须保持一致：
  - 开发由大飞哥监督
  - 龙虾哥出脑力和策略
  - 树哥负责实际执行落地

## 15. 2026-07-23 Sprint-0 执行包已就绪（请龙虾哥 Review）

### Sprint-0 执行包（Kickoff/Tasks/Checklist）

- `docs/knowledge/sprint-0/2026-07-23-wp-compliance-kickoff-tasks-checklist.md`
- `docs/knowledge/sprint-0/2026-07-23-wp-00-kickoff-tasks-checklist.md`
- `docs/knowledge/sprint-0/2026-07-23-wp-02a-kickoff-tasks-checklist.md`
- `docs/knowledge/sprint-0/2026-07-23-wp-02b-kickoff-tasks-checklist.md`

### WP-COMPLIANCE 新增合规资产

- 模板库（PR/DEV/BLK/RB/周报）：
  - `docs/knowledge/compliance/_templates.md`
- 合规台账（数据源）：
  - `.trae/compliance/deviation-registry.json`
  - `.trae/compliance/bs-catalog.json`
  - `.trae/compliance/coverage-matrix.json`
- 生成 BS 台账命令：
  - `pnpm exec tsx scripts/build-bs-catalog.ts`

### WP-02B 第一批 P0 偏离已登记

- 已正式登记到 `.trae/compliance/deviation-registry.json`：
  - `DEV-0001` → `BS-0050` 审计日志一年留存缺口
  - `DEV-0002` → `BS-0057` 管理员 2FA 缺口
  - `DEV-0003` → `BS-0059` 超 500 条导出审批阀门缺口
  - `DEV-0004` → `BS-0064` 暴力破解 5 次锁定缺口
- 已新建 Sprint-1 整改执行包：
  - `docs/knowledge/sprint-1/2026-07-23-wp-02b-p0-remediation-kickoff-tasks-checklist.md`
- 龙虾哥后续评审时请重点给：
  - 2FA 方案建议
  - 导出审批与 workflow 串联建议
  - 登录锁定策略的误伤兜底建议

### DEV-0004 已补 HTTP 证据并校正当前代码基线

- `apps/api/src/modules/auth/auth.service.ts`
  - 当前磁盘代码已补回真实锁定语义，而非仅停留在文档口径
  - 同一 `mobile/email` 连续输错 `5` 次后返回 `AUTH_005`，并锁定 `30` 分钟
  - 正确登录会重置失败计数，锁定期间即使密码正确也继续拦截
- `apps/api/src/modules/auth/auth.http.e2e.test.ts`
  - 已新增 `POST /auth/login/password` 真 HTTP 证据
  - 覆盖第 `5` 次错误密码返回 `AUTH_005`
  - 覆盖锁定后正确密码仍被阻断
- 已同步修正旧测试口径：
  - `apps/api/src/modules/auth/auth.service.test.ts`
  - `apps/api/src/modules/auth/auth.role.test.ts`
  - `apps/api/src/modules/auth/auth.role-collaboration.test.ts`
- 定向验证已通过：
  - `pnpm --dir apps/api exec vitest run src/modules/auth/auth.service.test.ts src/modules/auth/auth.role.test.ts src/modules/auth/auth.role-collaboration.test.ts src/modules/auth/auth.http.e2e.test.ts`
  - 结果：`4` 个测试文件、`85` 条用例全部通过
- 当前结论：
  - `DEV-0004` 已从“仅文档/口头口径”推进为“代码 + service + HTTP”三层证据
  - 仍需后续把失败计数与锁定态从内存态升级为可持久化/跨实例共享，才能彻底消除生产级绕过风险

## 16. 2026-07-23 Swagger 根因修复已收口

- 根因确认：
  - `apps/api` 原 `dev` 链路使用 `tsx watch --tsconfig tsconfig.json src/main.ts`
  - `tsx/esbuild` 在当前项目口径下不产出 `emitDecoratorMetadata` 所需参数元数据
  - 直接导致 `@nestjs/swagger` 在 `SwaggerModule.createDocument()` 阶段读取参数元数据崩溃
- 代码修复：
  - `apps/api/package.json`
    - `dev` 已切换为 `node --watch --require ts-node/register --require tsconfig-paths/register src/main.ts`
    - 已补 `ts-node`、`tsconfig-paths` 开发依赖
  - `apps/api/tsconfig.json`
    - `types` 已补为 `["node", "vitest/globals"]`
  - `apps/api/src/main.ts`
    - 保留 Swagger fallback：文档生成失败时不再拖垮 API 启动
    - 仅在 Swagger 真正挂载成功时输出 `/docs` 端点日志
- 运行态验证：
  - 参数元数据恢复验证通过：
    - `Reflect.getMetadata(PARAMTYPES_METADATA, SessionController.prototype, 'createSession')`
    - 输出类型名已不再是 `null`
  - 标准 dev 链路下 `3114` 端口验证通过：
    - `GET http://127.0.0.1:3114/docs` → `200`
    - `GET http://127.0.0.1:3114/api/v1/health` + 标准租户头 → `200`
    - `GET http://127.0.0.1:3114/api/v1/health/ping` + 标准租户头 → `200`
- 额外发现：
  - 守卫语义已收紧为双层模型：
    - `@Public()` 仅绕过 `IdentityAccess` 认证
    - `@TenantOptional()` 才绕过 `TenantGuard` 的租户头校验
  - 已将 `health` 与 `empower-cards/health` 标记为 `@Public() + @TenantOptional()`
  - 公开但 tenant-scoped 的业务端点（如 `auth`、`cashier`、`member/register`）保持必须显式提供 `x-tenant-id`
  - 全仓 `health` 端点已按语义分层：
    - 裸探活：`/api/v1/health`、`/api/v1/health/ping`、`/api/v1/empower-cards/health`
    - 受保护模块健康检查：如 `health/readiness`、`bootstrap/health`、`docs/health`、`platform/health`、`aiops/health`
    - 业务健康度接口：如 `alliance/health/:partnerId/*`、`analytics-v2/*/health`、`iot/devices/:deviceId/health`
  - 后续规则应保持：
    - 仅“裸探活”允许 `@Public() + @TenantOptional()`
    - 模块健康检查与业务健康度接口默认保留 tenant / auth 约束，不做一刀切放开
  - 已新增 `empower-card` 的 HTTP 回归测试，锁住 `/empower-cards/health` 不被 `:id` 路由吞掉，且确保详情端点仍保持非公开
  - 已补 `@Public()` 但 tenant-scoped 端点的 HTTP 边界回归：
    - `POST /auth/login/password` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /auth/login/sms` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /auth/login/wechat` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /auth/refresh` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /auth/logout` 无租户头 → `401 Missing x-tenant-id header`
    - `GET /cashier/members/lookup` 无租户头 → `401 Missing x-tenant-id header`
    - `GET /cashier/products/:sku` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /members/register` 无租户头 → `401 Missing x-tenant-id header`
  - 结论：当前仓库中 `@Public()` 仅表示“绕过认证”，不表示“绕过租户域”
  - 真实运行态抽样复验（端口 `3116`）也与自动化测试一致：
    - `GET /api/v1/health/ping` 无租户头 → `200`
    - `POST /api/v1/auth/login/password` 无租户头 → `401 Missing x-tenant-id header`
    - `GET /api/v1/cashier/members/lookup?q=13800138000` 无租户头 → `401 Missing x-tenant-id header`
    - `GET /api/v1/cashier/products/SKU-001` 无租户头 → `401 Missing x-tenant-id header`
    - `POST /api/v1/members/register` 无租户头 → `401 Missing x-tenant-id header`
- 基线保持：
  - 本轮修复过程中顺手补平了两个 typecheck 残点：
    - `apps/api/src/modules/tournament/tournament.contract.test.ts`
    - `apps/api/src/modules/employee-marketing/employee-marketing.service.ts`
    - `apps/api/src/modules/employee-marketing/employee-marketing.service.spec.ts`
  - 最终 `pnpm --dir apps/api typecheck` 已再次清零

### DEV-0004 已补 Redis 共享锁定态

- `apps/api/src/modules/auth/auth.service.ts`
  - 已改为 `RedisService` 可选注入
  - Redis 可用时，密码失败计数与锁定态写入共享键，支持跨实例生效
  - Redis 不可用时，自动回退到当前内存态，不阻断现有轻量测试基座
- `apps/api/src/modules/auth/auth.service.test.ts`
  - 已新增“两个 AuthService 实例共享同一 Redis 存储时，锁定态可跨实例生效”测试
- 定向验证已通过：
  - `pnpm --dir apps/api exec vitest run src/modules/auth/auth.service.test.ts src/modules/auth/auth.role.test.ts src/modules/auth/auth.role-collaboration.test.ts src/modules/auth/auth.http.e2e.test.ts src/modules/auth/auth.module.test.ts`
  - 结果：`5` 个测试文件、`95` 条用例全部通过
- 当前结论：
  - `DEV-0004` 已从“代码 + service + HTTP”推进为“代码 + service + HTTP + 跨实例共享门禁”
  - 后续若要再补强，可继续做 Redis 原子计数脚本化、审计留痕与运维解锁口径

### DEV-0004 已修补 Redis 并发竞态

- `apps/api/src/modules/auth/auth.service.ts`
  - 共享态失败计数已切到 `Redis INCR + EXPIRE`
  - 修复了并发失败请求下“未达阈值请求删掉已写锁”的竞态风险
  - 现在更接近真实多实例场景下的稳定锁定语义
- `apps/api/src/modules/auth/auth.service.test.ts`
  - 已新增并发 `5` 次错误密码后，后续正确密码仍被阻断的定向验证
- 定向验证已通过：
  - `pnpm --dir apps/api exec vitest run src/modules/auth/auth.service.test.ts src/modules/auth/auth.http.e2e.test.ts src/modules/auth/auth.role.test.ts src/modules/auth/auth.role-collaboration.test.ts`
  - 结果：`4` 个测试文件、`87` 条用例全部通过

### DEV-0004 已补锁定/解锁审计留痕

- `apps/api/src/modules/auth/auth.service.ts`
  - 首次触发锁定时记录 `auth.login_locked`
  - 成功登录清空失败态时记录 `auth.login_unlocked`
  - 审计只打在关键状态跃迁点，避免把普通输错密码刷成噪音
- `apps/api/src/modules/auth/auth.module.ts`
  - 已补 `AuditService` provider，AuthModule 内可直接注入复用
- `apps/api/src/modules/auth/auth.service.test.ts`
  - 已新增锁定事件与解锁事件的定向验证
- 定向验证已通过：
  - `pnpm --dir apps/api exec vitest run src/modules/auth/auth.service.test.ts src/modules/auth/auth.http.e2e.test.ts src/modules/auth/auth.module.test.ts src/modules/auth/auth.role.test.ts src/modules/auth/auth.role-collaboration.test.ts`
  - 结果：`5` 个测试文件、`98` 条用例全部通过

### Foundation 总览链已终局收口

- fresh runtime 已在端口 `3122` 成功启动：
  - `INFO: m5-api started`
  - `foundation blueprint endpoint = http://localhost:3122/api/v1/foundation/bootstrap`
  - `swagger docs endpoint = http://localhost:3122/docs`
- `foundation` 主线最终运行态证据已经补齐，三条接口全部恢复 `200`：
  - `GET /api/v1/foundation/overview` → `200`
  - `GET /api/v1/foundation/overview/alerts` → `200`
  - `GET /api/v1/foundation/overview/alerts/catalog` → `200`
- 对应响应体已留证：
  - `/tmp/foundation-overview-3122.body`
  - `/tmp/foundation-alerts-3122.body`
  - `/tmp/foundation-catalog-3122.body`
- 当前 `overview`/`alerts` 响应中已可见真实聚合数据：
  - `secret-rotation-attention`
  - `recovery-drill-attention`
  - `observability-degradation`
  - `moduleHealth.trustGovernance/configurationGovernance/resilienceOperations/runtimeGovernance`
- 为打通 fresh runtime，本轮连续清掉了一批 `ts-node` 类型阻塞，关键收口文件包括：
  - `apps/api/src/modules/finance/reconciliation-db.service.ts`
  - `apps/api/src/modules/observability/metrics.controller.ts`
  - `apps/api/src/modules/observability/grafana-dashboards.ts`
  - `apps/api/src/modules/marketing/marketing.service.ts`
  - `apps/api/src/modules/e2e-auto-gen/e2e-auto-gen.controller.ts`
  - `apps/api/src/modules/recommend/recommend.service.ts`
- foundation 缺表降级链路当前已补平并经 fresh runtime 证明生效：
  - `trust-governance`
  - `governance-approval`
  - `runtime-governance`
  - `configuration-governance`
  - `foundation alert acknowledgement / audit activity`
- 当前剩余启动日志里仍可能出现某些“本地库缺表”的降级提示，但已不再阻断 API 启动，也不再把 `foundation` 三条接口打成 `500`

### 启动噪音已继续收敛

- `apps/api/src/modules/tenant-config/tenant-config.repository.ts`
  - `ConfigInstance` / `ConfigAuditLog` 在 Prisma 返回 `P2021/P1010/P1001` 时，读链路已按只读降级处理
  - 启动阶段的 `loadAllInstances()` 已从高噪音 `error` 收敛为普通 `log + []`
- `apps/api/src/modules/saas-advanced/domain-resolution.service.ts`
  - `CustomDomain` 缺表时，`onModuleInit()` 已按降级口径跳过预热
  - 本地开发场景下缺表提示已从 `warn` 收敛为普通 `log`
- 结论：
  - 当前 dev runtime 口径已从“编译阻塞 + foundation 500”推进到“可启动、可出文档、foundation 三连全绿、剩余缺表仅降级提示”

### Retrieval skeleton 启动噪音已收敛

- `apps/api/src/modules/retrieval/retrieval.client.ts`
  - `QdrantClientWrapper.onModuleInit()` 的骨架提示已从 `warn` 收敛为普通 `log`
  - 当前口径为：`[QdrantClientWrapper] onModuleInit skipped — Pulse-71 skeleton`
- `apps/api/src/modules/retrieval/retrieval.embedder.ts`
  - `EmbeddingService.onModuleInit()` 的骨架提示已从 `warn` 收敛为普通 `log`
  - 当前口径为：`[EmbeddingService] onModuleInit skipped — Pulse-71 skeleton`
- fresh runtime 运行态已复验：
  - 端口：`3123`
  - 日志中可见：
    - `LOG [QdrantClientWrapper] [QdrantClientWrapper] onModuleInit skipped — Pulse-71 skeleton`
    - `LOG [EmbeddingService] [EmbeddingService] onModuleInit skipped — Pulse-71 skeleton`
    - `INFO: m5-api started`
- 结论：
  - retrieval 模块当前仍明确处于 Pulse-71 skeleton 阶段
  - 但“预期未实现”已不再作为异常级别噪音污染本地 dev 启动日志

### 缺表降级日志文案已最终收口

- `apps/api/src/modules/tenant-config/tenant-config.repository.ts`
  - `describePersistenceFallback()` 已优先提取 Prisma 的表不存在单句
  - 若无该单句，则把原始 message 压平成单行，避免 `loadAllInstances` 冒号后看似空白
- `apps/api/src/modules/saas-advanced/domain-resolution.service.ts`
  - `describePersistenceFallback()` 已同步采用同一单行摘要口径
  - `load custom domains skipped` 不再被多行 Prisma 文本冲散
- fresh runtime 运行态已复验：
  - 端口：`3125`
  - 日志中可见：
    - `LOG [TenantConfigRepository] [loadAllInstances] skipped persistence preload: The table "public.ConfigInstance" does not exist in the current database.`
    - `LOG [DomainResolutionService] load custom domains skipped: The table "public.CustomDomain" does not exist in the current database.`
    - `INFO: m5-api started`
- 结论：
  - 当前 dev runtime 已无“冒号后空白”的降级日志尾巴
  - `ConfigInstance` 与 `CustomDomain` 缺表提示都已稳定为单行、可读、可检索摘要

### OpenTelemetry 启动噪音已静默化

- `apps/api/src/modules/observability/tracing/tracing.ts`
  - 开发环境未显式设置 `OTEL_TRACES_EXPORTER` 时，默认值已从 `console` 收为 `none`
  - 生产环境仍保持默认 `otlp`
  - 若本地需要看 span，仍可显式设置 `OTEL_TRACES_EXPORTER=console`
- `apps/api/src/modules/observability/tracing/tracing.service.test.ts`
  - 已新增定向测试，锁住“开发环境默认静默”的口径
  - 定向验证已通过：`pnpm exec vitest run src/modules/observability/tracing/tracing.service.test.ts`
  - 结果：`1` 个测试文件、`12` 条用例全部通过
- fresh runtime 运行态已复验：
  - 端口：`3127`
  - API 正常启动，日志可见：
    - `LOG [TenantConfigRepository] [loadAllInstances] skipped persistence preload: The table "public.ConfigInstance" does not exist in the current database.`
    - `LOG [DomainResolutionService] load custom domains skipped: The table "public.CustomDomain" does not exist in the current database.`
    - `INFO: m5-api started`
  - 原先刷屏的 OpenTelemetry `tcp.connect` span 对象日志已不再出现
- 结论：
  - 当前 dev runtime 已无 OTel console exporter 带来的大段对象噪音
  - tracing 默认口径调整为“本地静默、显式开启、生产 OTLP”

### retrieval 与 mock bootstrap 日志再收一刀

- `apps/api/src/modules/retrieval/retrieval.client.ts`
  - `QdrantClientWrapper` skeleton 启动日志已去掉重复的 `[QdrantClientWrapper]` 前缀
- `apps/api/src/modules/retrieval/retrieval.embedder.ts`
  - `EmbeddingService` skeleton 启动日志已去掉重复的 `[EmbeddingService]` 前缀
- `apps/api/src/modules/cashier/ports/payment-channel.bootstrap.ts`
  - 当 `ENABLE_MOCK_PAYMENT_CHANNELS` 未开启时，默认不再打印“skip default mock channel bootstrap”提示
  - 显式开启时仍保留真实 bootstrap 成功日志
- fresh runtime 再次复验：
  - 启动探针端口：`3137`
  - 日志可见：
    - `LOG [TenantConfigRepository] [loadAllInstances] skipped persistence preload: The table "public.ConfigInstance" does not exist in the current database.`
    - `LOG [DomainResolutionService] load custom domains skipped: The table "public.CustomDomain" does not exist in the current database.`
    - `LOG [QdrantClientWrapper] onModuleInit skipped — Pulse-71 skeleton`
    - `LOG [EmbeddingService] onModuleInit skipped — Pulse-71 skeleton`
    - `INFO: m5-api started`
  - 默认日志中已不再出现：
    - `Skip default mock channel bootstrap because ENABLE_MOCK_PAYMENT_CHANNELS is not enabled`
- 当前剩余最显眼的启动噪音：
  - Nest `RouterExplorer` 大量 `Mapped {...}` 路由枚举日志
  - 若继续收口，可下一步评估是否仅在显式调试时保留该类框架级路由日志
