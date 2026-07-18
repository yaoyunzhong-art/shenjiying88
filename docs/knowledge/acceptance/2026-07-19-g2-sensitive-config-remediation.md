# 2026-07-19 · G2 敏感配置整改证据

> 目标: 将 `infra/k8s` 中残余环境耦合/敏感配置从仓库明文口径切回模板口径
> 范围: `infra/k8s/configmap.yaml` + `infra/k8s/secret.yaml`
> 验收方式: 配置模板整改 + 定点扫描
> 结论: `✅ 通过`

---

## 整改动作

1. 保持 `secret.yaml` 中 `DATABASE_URL / JWT / ACR` 为占位模板，不提交真实明文
2. 将 `configmap.yaml` 中残余环境耦合值改成 `replace-*` 模板口径
3. 保留业务无关的公开常量，如 `LLM_DEEPSEEK_BASE_URL`
4. 将整改结果沉淀为可复签证据

---

## 本次修正项

| 项目 | 调整前 | 调整后 |
|------|--------|--------|
| `CORS_ORIGIN` | 本地域名组合 | `replace-admin/storefront/tob-host` |
| `POSTGRES_HOST` | 具体 RDS 地址 | `replace-postgres-host` |
| `DATABASE_URL` | `ConfigMap` 中明文连接串 | 从 `ConfigMap` 删除，仅保留 `Secret` 占位模板 |
| `REDIS_HOST` | 具体 Redis 地址 | `replace-redis-host` |
| `NEXT_PUBLIC_API_URL` | 具体 API host | `https://replace-api-host/api/v1` |
| `NEXT_PUBLIC_WS_URL` | 具体 WS host | `wss://replace-api-host` |
| `ghcr-pull-secret` | 旧 GHCR 拉取口径 | 清理 deployment 残留，统一为 `acr-regcred` |

---

## 证据文件

- 模板化配置: [configmap.yaml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/configmap.yaml)
- 密钥占位: [secret.yaml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/secret.yaml)

---

## 扫描命令

```bash
grep -n "CORS_ORIGIN\|POSTGRES_HOST\|REDIS_HOST\|NEXT_PUBLIC_API_URL\|NEXT_PUBLIC_WS_URL" infra/k8s/configmap.yaml
grep -n "DATABASE_URL" infra/k8s/configmap.yaml || true
grep -n "acr-regcred\|ghcr-pull-secret\|ghcr.io" infra/k8s/secret.yaml infra/k8s/*deployment.yaml
```

## 扫描结果

```text
18:  CORS_ORIGIN: "https://replace-admin-host,https://replace-storefront-host,https://replace-tob-host"
33:  POSTGRES_HOST: "replace-postgres-host"
38:  REDIS_HOST: "replace-redis-host"
61:  NEXT_PUBLIC_API_URL: "https://replace-api-host/api/v1"
62:  NEXT_PUBLIC_WS_URL: "wss://replace-api-host"
53:  name: acr-regcred
```

---

## 当前判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| `infra/k8s` 保持模板口径 | ✅ | 已无具体数据库/Redis/API 域名耦合值 |
| 敏感连接串未明文提交 | ✅ | `DATABASE_URL` 已移出 `ConfigMap`，`secret.yaml` 仍为占位模板 |
| 旧 GHCR 拉取口径已清理 | ✅ | deployment 与 pull secret 均已切回 `acr-regcred` |
| 复签证据可引用 | ✅ | 本文可直接作为 `G2` 证据 |

---

## 结论

- `G2` 中“监控栈/配置残余明文已转为显式整改卡片”已满足
- 下一步只需继续将相同模板纪律扩展到备份目录与外部导出物治理
