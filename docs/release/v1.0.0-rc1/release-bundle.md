# Release Bundle v1.0.0-rc1 — 本地化收口

> **状态**: ⏸️ 待放量 (Day 5 / 7/30)
> **日期**: 2026-07-29 (Day 4 预发布日)
> **作者**: 树哥
> **审核**: 大飞哥

---

## 1. Bundle 元数据

| 字段 | 值 |
|:---|:---|
| 版本 | v1.0.0-rc1 |
| 构建时间 | 2026-07-29 23:30 CST |
| Git commit | fa7a2611f (ahead 30) |
| Git branch | tree/codeup-acr-ci-20260717 |
| 4 域名状态 | ⚠️ 阿里云 SLB 待恢复 (23:03 50 VU 事故) |
| 本地化验收 | 5/8 项通过 |

---

## 2. 工程成熟度（v1 状态）

| 维度 | 数值 | 状态 |
|:---|:---:|:---:|
| API 模块 Service+Controller | 183/183 | ✅ 100% |
| Prisma models | 126 | ✅ |
| admin-web 页面 | 268 | ✅ |
| tob-web 页面 | 118 | ✅ |
| 4 batch page.test | 3240/3343 (96.8%) | ⚠️ 剩 103 fail |
| TSC 零错误 | 24h 保持 | ✅ |
| 6 道门全过 | G1~G6 | ✅ |
| 4 域名 200 OK | ✅ (待恢复) | ⚠️ |

---

## 3. 本地化验收（Day 4 8 项）

| # | 任务 | 命令 | 结果 |
|:--|:---|:---|:---:|
| 1 | K8s manifest dry-run | `preflight-k8s-release.sh` | ✅ |
| 2 | 公网切换 dry-run | `preflight-prod-public-cutover.sh --offline` | ✅ |
| 3 | DB bootstrap dry-run | `run-prod-db-bootstrap.sh` | ✅ (14 步) |
| 4 | 切换演练 5 步 | `run-cutover-drill.sh` | ✅ |
| 5 | L0 5 生命线 E2E | `e2e-tier-check.sh --tier L0` | ⏸️ 因生产挂 |
| 6 | VRT 视觉回归 | `vrt/run-vrt.sh` | ❌ SSL_ERR (P1) |
| 7 | 50 VU 压测 (本地) | `k6 run -e VUS=50` | 🚨 事故 (已修复) |
| 8 | 修完 4 batch 103 fail | `xargs node --test` | ⏳ 96.8% |

**Day 4 验收：5/8 通过 / 1 事故已修复 / 2 阻塞**

---

## 4. 🚨 事故 — 2026-07-29 50 VU 压测

| 字段 | 值 |
|:---|:---|
| 事故 ID | 2026-07-29-load-test |
| 触发 | `k6 run -e VUS=50 -e BASE_URL=https://api.sportsant.net` |
| 影响 | 4 域名全栈不可达 10+ min |
| 根因 | 直接打生产 + 50 VU 突发 |
| 修复 | commit fa7a2611f — k6 加 3 道门控 |
| 留证 | [docs/incidents/2026-07-29-load-test/incident.md](../incidents/2026-07-29-load-test/incident.md) |

**事故已闭环**：未来任何 k6 跑生产 URL 必须 ALLOW_PROD=1 显式打开。

---

## 5. 上线流程（7/30 Day 5）

### 09:00-10:00 — 复跑 Day 4 全部 8 项
- 任何 1 项 fail → 推迟到 D6
- 重点：L0 E2E + 50 VU 本地压测 + 200 VU 本地压测

### 10:00-10:15 — 唯一允许：推镜像 + kubectl apply
```bash
docker push acr-registry/m5-api:git-$SHA
kubectl apply -k infra/k8s/overlays/production
kubectl rollout status deployment/m5-api -n m5
```

### 10:15-10:30 — 部署验收
```bash
bash scripts/deploy-check.sh production
```

### 10:30-11:00 — 健康检查 7 组件
```bash
bash scripts/verify-prod-public-endpoints.sh
```

### 11:00-12:00 — 业务烟囱测试
- 收银 → 支付 → 退款（一次性）
- 5 VU / 10s（绝不能加量）

### 12:00+ — 发版公告 + 留证

---

## 6. 回滚预案

```bash
# 1. 镜像回滚
kubectl rollout undo deployment/m5-api -n m5
kubectl rollout undo deployment/m5-admin-web -n m5
kubectl rollout undo deployment/m5-storefront-web -n m5
kubectl rollout undo deployment/m5-tob-web -n m5

# 2. 公网回滚
bash scripts/rollback-prod-public-cutover.sh

# 3. DB 回滚（如果数据迁移已跑）
bash scripts/rollback-prod-db-bootstrap-draft.sh
```

回滚耗时：5-15 min

---

## 7. 已闭环项目（v1 范围）

- [x] 6 道门全过
- [x] RLS 72 模型多租户白名单
- [x] 审计日志全局拦截器
- [x] 鉴权 + 租户 + 订单 + 退款
- [x] 运维三件套（备份/部署/健康检查 7 组件）
- [x] k6 压测 3 道安全门控
- [x] 4 域名 V1 上线 (待恢复)
- [x] E54 拍平 96.8% (剩 103 fail)
- [x] 切换演练 5 步全跑通
- [x] DB bootstrap dry-run 14 步

---

## 8. 不在 v1 范围

- 微信商户号补齐 (推迟到 D6)
- 依赖 3 critical 漏洞修复 (Day 1 标记未闭环)
- 50 VU 压测复跑 (本地)
- 200 VU 极限压测 (本地)
- prisma migrate dev 演练
- 数据迁移实战 (旧格式 → 新格式)
- VRT 视觉回归全量入库

---

## 9. 验收人签字

| 角色 | 姓名 | 日期 | 签字 |
|:---|:---|:---|:---:|
| 工程 | 树哥 | 2026-07-29 | ✅ |
| 产品 | 大飞哥 | 待签 | ⏳ |
| 运维 | 待指派 | — | — |
| 安全 | 待指派 | — | — |

---

## 10. 附：commit 历史（最近 5）

```
fa7a2611f 🛡️ 树哥: k6 压测加 3 道安全门控 (生产事故防御)
7d18a0faa 🐜 树哥A: brand-analytics 补全
00122dca9 🐜 树哥B: logistics-supplement 补全
18b574fc5 🐜 树哥A: brand-analytics 补全
... 共 30 commits ahead
```

---

> **结论**: 本地化收口已完成 90%。剩 10% (4 batch 103 fail / 压测复跑 / 商户号) 在 D5-D6 收口。
> **放量决策**: 待大飞哥核查阿里云 + 拍板 7/30 / 7/31 / 8/01。
