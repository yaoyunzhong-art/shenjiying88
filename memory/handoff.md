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
