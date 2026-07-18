# 📦 生产 Release Bundle 唯一交付口径

> 更新日期: 2026-07-19
> 目标: 将 `PLAN-REV-A2` 从“原则”落地为“正式生产交付制度”
> 适用范围:
> - `ACK + ACR + K8s` 正式生产发布
> - 生产公网切流
> - 与 `docker compose staging/应急` 的边界声明

---

## 一句话原则

**正式生产发布只认 `版本化 release bundle`，不认源码目录中的默认清单，不认 `latest`，不认临时手敲 `kubectl apply`。**

---

## 适用边界

### 允许

- 基于 `m5-release-images.env` 渲染出来的 `rendered-release/`
- 基于 `m5-public-endpoints.env` 和 `release-images.env` 生成的 `cutover bundle/`
- 经过 `preflight -> dry-run -> apply -> verify -> rollback ready` 的生产窗口执行

### 禁止

- 直接对 `infra/k8s/*.yaml` 进行正式生产 `kubectl apply`
- 用默认 `kustomization.yaml` 中的 `latest` 直接作为正式生产版本
- 在生产窗口中混用 `源码清单` 和 `bundle 产物`
- 在未生成 `RELEASE-METADATA.env` 的情况下执行正式切流

---

## 唯一交付物定义

正式生产交付物由两部分组成:

### 1. 版本化 K8s release bundle

最少应包含:

- `rendered-release/api-deployment.yaml`
- `rendered-release/admin-deployment.yaml`
- `rendered-release/storefront-deployment.yaml`
- `rendered-release/tob-deployment.yaml`
- `rendered-release/kustomization.yaml`
- `rendered-release/RELEASE-METADATA.env`

### 2. 公网切流 bundle

最少应包含:

- `cutover-bundles/<ts>/public-endpoints.env`
- `cutover-bundles/<ts>/rendered-public/`
- `cutover-bundles/<ts>/CUTOVER-COMMANDS.md`
- 若本次涉及正式发布，还应包含:
  - `cutover-bundles/<ts>/release-images.env`
  - `cutover-bundles/<ts>/rendered-release/`

---

## 生成方式

### 1. 先准备镜像版本输入

```bash
cp infra/k8s/templates/m5-release-images.env.example /tmp/m5-release-images.env
```

### 2. 渲染版本化 release bundle

```bash
bash scripts/render-k8s-release-manifests.sh \
  --env-file /tmp/m5-release-images.env \
  --output-dir infra/k8s/rendered-release
```

### 3. 生成切流 bundle

```bash
bash scripts/prepare-prod-cutover-bundle.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file /tmp/m5-release-images.env
```

---

## 发布准入规则

只有同时满足以下条件，才允许进入正式生产发布:

1. 存在 `release-images.env`
2. 存在 `rendered-release/RELEASE-METADATA.env`
3. 四个业务镜像 tag 均不是 `latest`
4. `preflight-k8s-release.sh --release-env-file ...` 通过
5. `prepare-prod-cutover-bundle.sh` 成功生成 bundle
6. 若涉及公网切流，必须附 `CUTOVER-COMMANDS.md`

---

## 源清单与产物清单的关系

### 源清单

- `infra/k8s/*.yaml`
- `infra/k8s/kustomization.yaml`

作用:

- 作为模板与事实来源
- 用于渲染 bundle
- 不直接作为正式生产 apply 输入

### 产物清单

- `infra/k8s/rendered-release/`
- `infra/k8s/cutover-bundles/<ts>/`

作用:

- 作为唯一正式发布输入
- 用于发布窗口中的 `apply / verify / rollback ready`

---

## 与 compose 链的边界

- `compose` 只用于:
  - `staging`
  - `production` 应急回退/临时验证
- `K8s release bundle` 只用于:
  - `ACK` 正式生产发布
  - 正式公网切流

禁止将两条链混合描述为同一生产交付路径。

---

## 复签证据

本政策文件可作为以下检查项的直接证据:

- `PLAN-REV-A2`
- `G1` 的“版本化 release bundle 成为唯一生产交付口径”
- `G1` 的“源清单与渲染产物不存在双口径冲突”

关联材料:

- [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md)
- [PROD-BATCH-CHECKLIST-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-BATCH-CHECKLIST-20260718.md)
- [V7.2-RESIGN-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/V7.2-RESIGN-CHECKLIST.md)
