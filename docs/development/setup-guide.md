# M5 Platform - 开发环境搭建指南

## 1. 系统要求

### 1.1 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核+ |
| 内存 | 16 GB | 32 GB+ |
| 磁盘 | 100 GB SSD | 200 GB SSD+ |
| 网络 | 10 Mbps | 100 Mbps+ |

### 1.2 操作系统支持

- **macOS**: 12.0+ (推荐用于开发)
- **Linux**: Ubuntu 22.04 LTS / CentOS 8+
- **Windows**: Windows 10/11 + WSL2

## 2. 基础工具安装

### 2.1 macOS 环境

```bash
# 1. 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装基础工具
brew install git curl wget jq yq

# 3. 安装 Node.js 22 (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.zshrc  # 或 ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22

# 4. 安装 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.zshrc

# 5. 安装 Dockerrew install --cask docker

# 6. 安装 VS Code
brew install --cask visual-studio-code

# 7. 安装其他开发工具
brew install --cask iterm2
brew install fzf ripgrep fd eza bat zoxide
```

### 2.2 Linux (Ubuntu) 环境

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装基础工具
sudo apt install -y git curl wget jq build-essential

# 3. 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 安装 pnpm
npm install -g pnpm

# 5. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 6. 安装 Docker Compose
sudo apt install -y docker-compose-plugin

# 7. 安装其他工具
sudo apt install -y fzf ripgrep fd-find bat
```

## 3. 项目初始化

### 3.1 克隆代码仓库

```bash
# 1. 克隆项目
git clone https://github.com/shenjiying88/shenjiying-m5.git
cd shenjiying-m5

# 2. 切换到 main 分支
git checkout main

# 3. 安装依赖
pnpm install

# 4. 生成 Prisma Client
pnpm --filter @m5/api prisma:generate
```

### 3.2 配置环境变量

```bash
# 1. 复制环境变量模板
cp apps/api/.env.example apps/api/.env

# 2. 编辑 .env 文件，配置以下关键变量
```

**apps/api/.env** 关键配置：

```env
# 应用配置
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# 数据库配置
DATABASE_URL="postgresql://m5:m5_password@localhost:5432/m5?schema=public"

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

# 日志配置
LOG_LEVEL=debug
LOG_FORMAT=json

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=./uploads

# 邮件配置 (可选)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### 3.3 启动基础设施

```bash
# 1. 启动 PostgreSQL、Redis、RabbitMQ
pnpm docker:up

# 2. 验证服务状态
pnpm docker:ps

# 3. 执行数据库迁移
pnpm --filter @m5/api prisma:migrate:dev

# 4. 填充种子数据（可选）
pnpm --filter @m5/api prisma:seed
```

## 4. 开发工作流

### 4.1 启动开发服务器

```bash
# 方式1: 使用 turborepo 启动所有服务
pnpm dev

# 方式2: 单独启动 API 服务
cd apps/api
pnpm dev

# 方式3: 单独启动前端应用
cd apps/admin-web
pnpm dev
```

### 4.2 代码规范

```bash
# 运行代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 格式化代码
pnpm format

# 类型检查
pnpm typecheck
```

### 4.3 测试

```bash
# 运行所有测试
pnpm test

# 运行特定模块测试
pnpm --filter @m5/api test

# 运行 E2E 测试
pnpm e2e:smoke

# 运行特定测试文件
pnpm vitest run apps/api/src/modules/logistics/logistics-ringbeam.test.ts
```

### 4.4 Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 提交代码
git add .
git commit -m "feat: add new feature"

# 3. 推送分支
git push origin feature/your-feature-name

# 4. 创建 Pull Request（通过 GitHub Web 界面）

# 5. 代码审查通过后合并到 main 分支
```

## 5. 调试技巧

### 5.1 使用 VS Code 调试

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "args": ["vitest", "run", "${relativeFile}"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### 5.2 使用 Postman 测试 API

1. 导入 OpenAPI 规范：`docs/api/openapi-spec.yml`
2. 配置环境变量：
   - `baseUrl`: http://localhost:3001
   - `token`: 登录后获取的 JWT Token
   - `tenantId`: tenant-demo

### 5.3 查看日志

```bash
# 查看 API 服务日志
cd apps/api
pnpm logs

# 使用 pino-pretty 美化日志
pnpm dev | pino-pretty

# 查看 Docker 日志
docker-compose logs -f api
```

## 6. 常见问题

### Q1: 安装依赖时卡住？

```bash
# 清除缓存后重试
pnpm store prune
rm -rf node_modules
pnpm install
```

### Q2: Prisma 生成失败？

```bash
# 重新生成 Prisma Client
cd apps/api
rm -rf node_modules/.prisma
pnpm prisma:generate
```

### Q3: 端口被占用？

```bash
# 查找占用端口的进程
lsof -i :3001
# 或
netstat -tlnp | grep 3001

# 终止进程
kill -9 <PID>
```

### Q4: Docker 启动失败？

```bash
# 检查 Docker 状态
docker info
docker ps

# 重启 Docker
sudo systemctl restart docker

# 清理 Docker 资源
docker system prune -a
```

## 7. 相关资源

- **项目仓库**: https://github.com/shenjiying88/shenjiying-m5
- **API 文档**: https://docs.m5.local/api
- **开发文档**: https://docs.m5.local/dev
- **运维手册**: https://docs.m5.local/ops
- **架构文档**: https://docs.m5.local/arch

---

**文档版本**: v1.0.0  
**最后更新**: 2026-07-16  
**维护团队**: M5 Platform Team
