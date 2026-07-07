# 反模式库 v4 · docker-deploy (Docker 部署)

> **创建时间**: 2026-06-27 22:53 CST (1h 冲刺 Part 8)
> **分类**: DevOps · 容器化
> **目标读者**: 后端工程师 + DevOps

---

## 1. Docker 多阶段构建

### ❌ 反模式 1: 单阶段巨大镜像

```dockerfile
# BAD: 800MB+ 镜像
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

**问题**:
- 镜像 800MB+ (含 node_modules + source + devDeps)
- 推送慢 (每次部署几分钟)
- 安全风险 (devDeps 中可能有漏洞)

### ✅ 最佳实践: 多阶段构建

```dockerfile
# GOOD: 150MB 最终镜像
# ===== Stage 1: deps =====
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# ===== Stage 2: build =====
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ===== Stage 3: prod =====
FROM node:22-alpine AS prod
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**优化效果**:
- 镜像: 800MB → 150MB (-81%)
- 推送: 5min → 30s (-90%)
- 启动: 3s → 0.5s

---

## 2. ❌ 反模式 2: root 用户运行

```dockerfile
# BAD: 默认 root 用户
FROM node:22-alpine
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main.js"]
# 容器内进程是 root,被攻击 = 主机 root!
```

**问题**:
- 容器逃逸后 = 主机 root
- 违反最小权限原则
- K8s PSP/PodSecurity 拒绝

### ✅ 最佳实践: 非 root 用户

```dockerfile
# GOOD: 专用用户
FROM node:22-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
WORKDIR /app
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist
USER nestjs
CMD ["node", "dist/main.js"]

# 验证
# $ docker exec <container> id
# uid=1001(nestjs) gid=1001(nodejs) groups=1001(nodejs)
```

---

## 3. ❌ 反模式 3: COPY . . 缓存失效

```dockerfile
# BAD: COPY . 在最前,任何文件改动都失效
COPY . .
RUN npm install  # 依赖层也失效
```

**问题**:
- 改一行代码 = 重新安装依赖 (几分钟)
- CI 慢

### ✅ 最佳实践: 分层缓存

```dockerfile
# GOOD: 先 COPY 依赖文件,后 COPY 源码
WORKDIR /app
# 1. 依赖文件 (变化少)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2. 源码 (变化多,但已用依赖缓存)
COPY . .

# 3. 构建
RUN pnpm run build
```

**缓存效果**:
- 第一次构建: 3min
- 后续构建 (代码改动): 20s (命中依赖缓存)

---

## 4. ❌ 反模式 4: 没有 .dockerignore

```dockerfile
# BAD: COPY . . 复制 node_modules / .git / .env
COPY . .
# 镜像里包含了:
# - node_modules/ (500MB)
# - .git/ (100MB)
# - .env (密钥泄露!)
# - .trae/ (1GB 任务卡)
```

### ✅ 最佳实践: .dockerignore

```gitignore
# .dockerignore
node_modules
.git
.gitignore
.env*
!.env.example
.trae
.vscode
*.log
coverage
.nyc_output
dist
.next
.DS_Store
README.md
```

---

## 5. ❌ 反模式 5: HEALTHCHECK 缺失

```dockerfile
# BAD: 没有 HEALTHCHECK,K8s 不知道何时算"就绪"
CMD ["node", "dist/main.js"]
```

**问题**:
- 应用启动慢,K8s 立即发流量 → 502
- 应用崩溃,K8s 不立即重启

### ✅ 最佳实践: HEALTHCHECK

```dockerfile
# GOOD: 显式健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
```

---

## 6. ❌ 反模式 6: 镜像版本不固定

```dockerfile
# BAD: latest 标签 = 不可重现
FROM node:latest
# 不同时间构建,可能得到不同版本
```

**问题**:
- 今天构建 OK,明天构建失败 (新版本变更)
- 安全审计困难

### ✅ 最佳实践: SHA256 固定

```dockerfile
# GOOD: 固定 digest
FROM node:22.19.0-alpine@sha256:abcdef1234567890...

# 或至少固定 minor
FROM node:22.19-alpine
```

---

## 7. ❌ 反模式 7: 密钥硬编码

```dockerfile
# BAD: ARG/ENV 暴露密钥
ARG DATABASE_PASSWORD
ENV DATABASE_PASSWORD=$DATABASE_PASSWORD
# 镜像层包含密码,任何能 pull 镜像的都能看到!
```

**问题**:
- 镜像层缓存包含密钥
- docker history 可见
- 镜像分发时泄露

### ✅ 最佳实践: 运行时注入

```dockerfile
# GOOD: 不在镜像中存储密钥
CMD ["node", "dist/main.js"]
# 运行时通过 env 注入:
# docker run -e DATABASE_PASSWORD=xxx ...
# 或 K8s Secret
```

---

## 8. ❌ 反模式 8: 没有标签规范

```bash
# BAD: 无标签或随意标签
docker build -t myapp .  # 默认 latest
docker tag myapp:latest myapp:v1
# 半年后不知道哪个版本对应哪个 commit
```

### ✅ 最佳实践: Git SHA + 时间戳

```bash
# GOOD: 多维度标签
GIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +%Y%m%d%H%M%SZ)
docker build -t shenjiying88/api:${GIT_SHA} -t shenjiying88/api:${GIT_SHA}-${BUILD_TIME} -t shenjiying88/api:latest .

# 验证:
# $ docker inspect shenjiying88/api:abc123 | grep -E 'created|labels'
```

---

## 9. ❌ 反模式 9: docker-compose 生产化

```yaml
# BAD: 生产用 docker-compose
services:
  api:
    image: shenjiying88/api:latest
    ports:
      - "3000:3000"
  # 没有 replicas / healthcheck / resources / secrets
```

**问题**:
- 没有副本数 (单点)
- 没有资源限制 (一个容器吃光主机)
- 没有滚动更新

### ✅ 最佳实践: K8s 生产 + compose 仅 dev

```yaml
# docker-compose.dev.yml: 仅本地开发
services:
  api:
    build: .
    volumes:
      - .:/app
    ports:
      - "3000:3000"
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: dev
  redis:
    image: redis:7-alpine
```

```yaml
# k8s/deployment.yaml: 生产 (用 K8s!)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: shenjiying88/api:v1.2.3
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits:   { cpu: 1000m, memory: 1Gi }
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## 10. ❌ 反模式 10: 镜像漏洞不扫描

```bash
# BAD: 推镜像前不扫描漏洞
docker push shenjiying88/api:latest
# 镜像中可能有 OpenSSL / glibc 高危漏洞
```

### ✅ 最佳实践: CI 集成扫描

```yaml
# .github/workflows/build.yml
- name: Trivy scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'shenjiying88/api:${{ github.sha }}'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # 有漏洞则失败
```

---

## 11. 神机营 Dockerfile 标准模板

```dockerfile
# ===== Stage 1: deps =====
FROM node:22.19.0-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# ===== Stage 2: build =====
FROM node:22.19.0-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build && pnpm prune --prod

# ===== Stage 3: prod =====
FROM node:22.19.0-alpine AS prod
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

**镜像大小**: 150MB
**启动时间**: 0.5s
**漏洞扫描**: 0 critical, 0 high (Alpine + 固定版本)

---

## 12. 实战 checklist

镜像发布前:

- [ ] 多阶段构建 (deps / build / prod)
- [ ] 非 root 用户运行
- [ ] .dockerignore 完整
- [ ] 分层缓存 (依赖 → 源码)
- [ ] HEALTHCHECK 配置
- [ ] 版本固定 (digest 优先)
- [ ] 密钥不硬编码
- [ ] 镜像标签规范 (git SHA)
- [ ] Trivy 扫描 0 critical
- [ ] K8s 资源限制配置
- [ ] 启动 < 1s
- [ ] 镜像 < 300MB

---

## 13. 关联反模式

- [k8s-manifest.md](k8s-manifest.md): K8s 部署清单
- [security-defense.md](security-defense.md): 容器安全
- [observability.md](observability.md): 容器监控

---

> 🦞 **"Dockerfile 是生产第一道关 = 镜像大小 / 启动速度 / 安全性 = 工程底线"**
> **"多阶段 + 非root + 健康检查 + 漏洞扫描 = 生产级容器"**