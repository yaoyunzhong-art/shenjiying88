# M5 Platform - 故障排查手册

## 1. 快速诊断流程

```
发现问题
    ↓
查看日志 → 定位错误
    ↓
确认影响范围
    ↓
采取措施(降级/重启/修复)
    ↓
验证恢复
    ↓
复盘总结
```

## 2. 服务状态检查清单

### 2.1 基础服务检查

```bash
#!/bin/bash
# save as: check-health.sh

echo "=== M5 Platform 健康检查 ==="
echo ""

# 1. Docker 服务
echo "[1/10] Docker 服务..."
if docker info > /dev/null 2>&1; then
    echo "  ✓ Docker 运行正常"
else
    echo "  ✗ Docker 服务异常"
fi

# 2. API 服务
echo "[2/10] API 服务..."
if curl -s http://localhost:3001/api/v1/health/ping > /dev/null; then
    echo "  ✓ API 服务正常"
else
    echo "  ✗ API 服务异常"
fi

# 3. PostgreSQL
echo "[3/10] PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "  ✓ PostgreSQL 正常"
else
    echo "  ✗ PostgreSQL 异常"
fi

# 4. Redis
echo "[4/10] Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "  ✓ Redis 正常"
else
    echo "  ✗ Redis 异常"
fi

# 5. RabbitMQ
echo "[5/10] RabbitMQ..."
if curl -s http://localhost:15672/api/overview > /dev/null; then
    echo "  ✓ RabbitMQ 正常"
else
    echo "  ✗ RabbitMQ 异常"
fi

echo ""
echo "=== 检查完成 ==="
```

### 2.2 系统资源检查

```bash
# CPU 和内存使用情况
echo "=== 系统资源使用 ==="
echo "CPU 使用率:"
top -l 1 | grep "CPU usage"

echo ""
echo "内存使用情况:"
free -h

echo ""
echo "磁盘使用情况:"
df -h

echo ""
echo "Docker 容器资源使用:"
docker stats --no-stream
```

## 3. 常见问题排查

### 3.1 服务启动失败

#### 问题: Docker 容器无法启动

**症状**: 
```bash
docker-compose up -d
# 容器启动后立即退出
docker ps  # 看不到运行的容器
```

**排查步骤**:

```bash
# 1. 查看容器日志
docker-compose logs <service-name>

# 2. 检查容器状态
docker inspect <container-id>

# 3. 查看退出码
docker ps -a
```

**常见原因及解决方案**:

| 原因 | 解决方案 |
|------|----------|
| 端口被占用 | `lsof -i :<port>` 查找并终止占用进程 |
| 磁盘空间不足 | `docker system prune -a` 清理空间 |
| 内存不足 | 增加 Docker 内存限制或清理无用容器 |
| 配置错误 | 检查 `.env` 文件和环境变量 |
| 依赖服务未启动 | 按顺序启动服务 (先数据库，后应用) |

#### 问题: Node.js 应用启动失败

**症状**:
```bash
pnpm dev
# Error: Cannot find module '@m5/api'
# 或
# Error: Port 3001 is already in use
```

**排查步骤**:

```bash
# 1. 确认依赖已安装
pnpm install

# 2. 确认 Prisma Client 已生成
pnpm --filter @m5/api prisma:generate

# 3. 检查端口占用
lsof -i :3001
# 或
netstat -tlnp | grep 3001

# 4. 终止占用进程
kill -9 <PID>

# 5. 清理缓存重试
rm -rf node_modules/.cache
pnpm dev
```

### 3.2 数据库连接问题

#### 问题: 无法连接到 PostgreSQL

**症状**:
```
Error: P1001: Can't reach database server at `localhost`:`5432`
```

**排查步骤**:

```bash
# 1. 检查 PostgreSQL 是否运行
pg_isready -h localhost -p 5432

# 2. 检查 Docker 容器状态
docker ps | grep postgres

# 3. 查看 PostgreSQL 日志
docker logs m5-postgres

# 4. 测试网络连通性
telnet localhost 5432
# 或
nc -zv localhost 5432

# 5. 验证连接字符串
psql "postgresql://m5:m5_password@localhost:5432/m5"
```

**常见原因**:

| 原因 | 解决方案 |
|------|----------|
| PostgreSQL 容器未启动 | `docker-compose up -d postgres` |
| 连接字符串错误 | 检查用户名、密码、端口 |
| 防火墙阻止 | 开放 5432 端口或关闭防火墙 |
| 数据库不存在 | 执行 `createdb m5` 创建数据库 |
| 权限不足 | 检查数据库用户权限 |

#### 问题: Redis 连接失败

**症状**:
```
Error: Redis connection to localhost:6379 failed
```

**排查步骤**:

```bash
# 1. 检查 Redis 是否运行
redis-cli ping

# 2. 检查 Docker 容器
docker ps | grep redis

# 3. 查看 Redis 日志
docker logs m5-redis

# 4. 测试连接
redis-cli -h localhost -p 6379 ping

# 5. 检查配置
redis-cli CONFIG GET maxmemory
```

### 3.3 API 请求问题

#### 问题: 401 Unauthorized

**症状**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**排查步骤**:

```bash
# 1. 确认已登录并获取 token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'

# 2. 检查请求头
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: tenant-demo"

# 3. 验证 token 是否过期
# 检查响应中的 expiresIn 或重新登录获取新 token
```

#### 问题: 403 Forbidden

**症状**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**原因**: 用户已登录但权限不足

**解决方案**:
1. 检查用户角色和权限
2. 确认访问的资源属于当前租户/品牌/门店
3. 联系管理员分配相应权限

#### 问题: 请求超时

**症状**:
```
Error: timeout of 5000ms exceeded
```

**排查步骤**:

```bash
# 1. 检查服务端是否正常运行
curl http://localhost:3001/api/v1/health/ping

# 2. 检查网络连通性
ping localhost

# 3. 检查资源使用率
top

# 4. 查看应用日志
docker-compose logs -f api

# 5. 增加超时时间
curl --max-time 30 http://localhost:3001/api/v1/slow-endpoint
```

### 3.4 性能问题

#### 问题: API 响应慢

**排查步骤**:

```bash
# 1. 使用 curl 测量响应时间
curl -o /dev/null -s -w "%{time_total}\n" \
  http://localhost:3001/api/v1/coupons

# 2. 使用 Apache Bench 压测
ab -n 1000 -c 10 http://localhost:3001/api/v1/health/ping

# 3. 查看数据库查询日志
# 在 Prisma 配置中启用查询日志

# 4. 检查 Redis 缓存命中率
redis-cli INFO stats | grep keyspace

# 5. 监控 Node.js 性能
# 使用 clinic.js
npm install -g clinic
clinic doctor -- node dist/main.js
```

**优化建议**:

| 问题 | 优化方案 |
|------|----------|
| 数据库查询慢 | 添加索引、优化查询、使用连接池 |
| 没有缓存 | 启用 Redis 缓存、使用本地缓存 |
| 响应数据大 | 启用压缩、分页、只返回必要字段 |
| 计算密集型 | 使用 Worker Threads、异步处理 |
| 内存泄漏 | 使用 heapdump 分析、及时清理引用 |

## 4. 调试工具

### 4.1 VS Code 配置

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      },
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["vitest", "run", "${relativeFile}"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "test"
      }
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "processId": "${command:PickProcess}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 4.2 常用调试命令

```bash
# 查看 Node.js 进程
ps aux | grep node

# 查看进程详情
pidstat -p <PID> 1

# 查看内存使用
pmap <PID>

# 生成 heapdump
node --heap-prof index.js

# 使用 clinic.js 诊断
clinic doctor -- node dist/main.js
clinic flame -- node dist/main.js
clinic bubbleprof -- node dist/main.js

# 使用 0x 生成火焰图
0x node dist/main.js
```

## 5. 相关资源

- **项目文档**: https://docs.m5.local
- **API 文档**: https://docs.m5.local/api
- **部署指南**: https://docs.m5.local/ops/deployment-guide
- **架构文档**: https://docs.m5.local/arch
- **常见问题**: https://docs.m5.local/faq

---

**文档版本**: v1.0.0  
**最后更新**: 2026-07-16  
**维护团队**: M5 Platform Team
