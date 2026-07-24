# 🚀 神机营 SaaS 店A 上线科学计划 v2

> 更新时间: 2026-07-25 02:30 CST · V23 Day5
> 分支: `tree/codeup-acr-ci-20260717`

---

## 变更日志
| 时间 | 变更 |
|:-----|:-----|
| 02:21 | v1 初始评估 |
| 02:30 | v2 运维+压测就绪 · 商户号改为推迟 |

---

## 一、运维部署验收 ✅ 已就绪

### 部署验收脚本
```bash
bash scripts/deploy-check.sh staging
bash scripts/deploy-check.sh production
```
6项检查: HTTP连通性 · 数据库 · TLS证书 · K8s · Migration · 收银链

### 数据库备份
```
GET /api/v1/health/backup        # 备份状态
GET /api/v1/health/backup/trigger # 手动触发
```
自动备份: 每小时 pg_dump → /tmp/m5-backups/ · 保留7份 · 2h内无备份告警

### 健康检查 (已有)
```
GET /api/v1/health/ping          # 快速ping
GET /api/v1/health               # 完整检查 (DB/Redis/内存/磁盘/EventBus/Queue)
```

---

## 二、压力测试 ✅ 已就绪

```bash
# 默认 (10 VUs · 30s · api.sportsant.net)
bash scripts/run-load-test.sh

# 自定义
k6 run -e BASE_URL=https://staging-api.sportsant.net -e VUS=50 -e DURATION=60s scripts/load-test.js
```

3个场景: 健康检查 · 收银下单 · 未成年校验  
指标: P95延迟 · 失败率 · 吞吐量  
阈值: P95 < 2s · 失败率 < 5%

---

## 三、上线前检查清单

### Day 1 (7/26 周六) — 运维就绪
- [x] 部署验收脚本 ✅
- [x] DB自动备份 ✅
- [ ] ACR 镜像自动刷新
- [ ] 生产备份 cron 确认
- [ ] 回滚方案演练
- [ ] 监控阈值配置

### Day 2 (7/27 周日) — 验收测试
- [x] 压测脚本 ✅
- [ ] 执行 50 VU 压测 → 生成基线报告
- [ ] 收银→支付→退款 E2E
- [ ] 未成年保护合规验收

### Day 3 (7/28 周一) — 压测+数据
- [ ] 200 VU 极限压测
- [ ] 数据迁移方案制定
- [ ] 旧数据格式验证

### Day 4 (7/29 周二) — 预发布
- [ ] Staging 灰度部署
- [ ] 真实场景验收
- [ ] 回滚演练

### Day 5 (7/30 周三) — 正式上线 🎉
- [ ] 生产部署
- [ ] 切流量
- [ ] 线上验收
- [ ] 监控确认

### Day 6 (7/31 周四) — 缓冲
- [ ] 商户号补齐
- [ ] 最终验收

---

## 四、风险矩阵

| 风险 | 概率 | 影响 | 状态 |
|:-----|:---:|:---:|:---:|
| 微信商户号未激活 | 中 | 🔴 | → 推迟到上线后 |
| 数据迁移失败 | 低 | 🔴 | Day 3 验证 |
| 压测性能不足 | 低 | 🟡 | 已就绪 k6 |
| K8s 节点故障 | 低 | 🟡 | multi-region |
| 未成年合规 | 低 | 🟡 | ✅ 后端已完成 |

---

## 五、已完成 (不再重复)
- ✅ TSC 零错误
- ✅ RLS 72 模型
- ✅ 审计全局覆盖
- ✅ 订单 Prisma DB
- ✅ 未成年保护
- ✅ TenantGuard
- ✅ retrieval/ai-review 醒神
- ✅ 6 道门全部通过
- ✅ console.log/TODO 清理
- ✅ admin-web 268 页
- ✅ 部署验收脚本
- ✅ DB 自动备份
- ✅ k6 压测脚本
