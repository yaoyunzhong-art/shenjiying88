# ✅ 神机营 SaaS 店A 临时大法上线检查清单

> 最后更新: 2026-07-25 02:50 CST
> 39 commits today

---

## 一、代码质量 🟢

- [x] TSC 零错误 (24h保持)
- [x] 183/183 模块 Service+Controller 完整
- [x] 核心测试 2642/2684 通过 (98.4%)
- [x] 6道门全部签署 (G1~G6 ✅)
- [x] RLS 72模型多租户白名单
- [x] 审计日志全局拦截器覆盖
- [x] console.log 清理 (生产代码 15→10)
- [x] 183/183 模块 README 覆盖

## 二、安全 🔒

- [x] TenantGuard 鉴权 (minor-protection 6端点)
- [x] 身份信息脱敏 (ID掩码)
- [x] 未成年保护后端校验完整
- [ ] 依赖安全审计 (128 vulns, 3 critical) → Day1
- [ ] HTTPS/TLS 强制 (已有)

## 三、运维 ⚙️

- [x] 部署验收脚本 (deploy-check.sh)
- [x] DB自动备份 (DatabaseBackupService)
- [x] 健康检查 (7组件探测)
- [ ] ACR 镜像自动刷新
- [ ] 回滚方案演练
- [ ] 监控阈值配置

## 四、压测 📊

- [x] k6 压测脚本 (3场景)
- [ ] 50 VU 压测 → 基线
- [ ] 200 VU 极限压测

## 五、上线步骤 (7/30)

```
1. git tag v1.0.0-rc1
2. CI 构建 Docker 镜像 → ACR
3. kubectl set image deployment/m5-api
4. kubectl rollout status deployment/m5-api
5. bash scripts/deploy-check.sh production
6. 健康检查验证
7. 线上验收 (收银下单 + 支付 + 退款)
```

## 六、回滚

```
kubectl rollout undo deployment/m5-api
kubectl rollout undo deployment/m5-admin-web
```
