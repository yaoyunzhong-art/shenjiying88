# ═══════════════════════════════════════════════════════════════
# M5 Monorepo — Makefile
#
# 常用操作快速入口
# ═══════════════════════════════════════════════════════════════

.PHONY: help install dev build test lint typecheck docker-dev \
        docker-build docker-prod-up docker-prod-down docker-clean \
        k8s-apply k8s-delete terraform-plan terraform-apply \
        setup-hooks commit

# ─── 帮助 ──────────────────────────────────────────────
help: ## 显示帮助
	@printf '\033[36mM5 Monorepo — 常用命令\n\033[0m'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-20s\033[0m %s\n", $$1, $$2}'

# ─── 本地开发 ──────────────────────────────────────────
install: ## 安装依赖 (pnpm install)
	pnpm install

dev: ## 启动开发环境 (turbo dev)
	pnpm dev

build: ## 构建所有项目 (turbo build)
	pnpm build

test: ## 运行测试
	pnpm test

lint: ## 运行 lint
	pnpm lint

typecheck: ## 类型检查
	pnpm typecheck

# ─── Docker ────────────────────────────────────────────
docker-dev: ## 启动本地依赖服务 (postgres + redis + rabbitmq)
	pnpm docker:up

docker-build: ## 构建所有生产镜像
	docker compose build --parallel

docker-build-api: ## 构建 API 镜像
	docker build --target=api-prod -t m5-api:latest .

docker-build-admin: ## 构建 Admin Web 镜像
	docker build --target=admin-prod -t m5-admin:latest .

docker-build-storefront: ## 构建 Storefront 镜像
	docker build --target=storefront-prod -t m5-storefront:latest .

docker-build-tob: ## 构建 ToB Web 镜像
	docker build --target=tob-prod -t m5-tob:latest .

docker-build-all: docker-build-api docker-build-admin docker-build-storefront docker-build-tob ## 构建全部镜像

docker-prod-up: ## 启动生产环境
	docker compose -f docker-compose.yml up -d

docker-prod-down: ## 停止生产环境
	docker compose -f docker-compose.yml down

docker-prod-logs: ## 查看生产日志
	docker compose -f docker-compose.yml logs -f --tail=100

docker-clean: ## 清理生产环境 (含 volumes)
	docker compose -f docker-compose.yml down -v --remove-orphans

# ─── K8s ───────────────────────────────────────────────
k8s-apply: ## 应用 K8s 配置
	kubectl apply -k infra/k8s/

k8s-delete: ## 删除 K8s 配置
	kubectl delete -k infra/k8s/

k8s-status: ## 查看 K8s 状态
	@echo "=== Pods ==="
	@kubectl get pods -n m5
	@echo ""
	@echo "=== Services ==="
	@kubectl get svc -n m5
	@echo ""
	@echo "=== Deployments ==="
	@kubectl get deployments -n m5

k8s-logs-api: ## 查看 API 日志
	kubectl logs -n m5 -l app=m5-api --tail=100 -f

k8s-logs-admin: ## 查看 Admin 日志
	kubectl logs -n m5 -l app=m5-admin-web --tail=100 -f

# ─── Terraform ─────────────────────────────────────────
ENV ?= production

terraform-init: ## Terraform 初始化
	cd infra/terraform && terraform init -backend-config="key=m5/$(ENV)/terraform.tfstate"

terraform-plan: ## Terraform 计划
	cd infra/terraform && terraform plan -var-file=environments/$(ENV)/terraform.tfvars -out=tfplan

terraform-apply: ## Terraform 应用
	cd infra/terraform && terraform apply tfplan

terraform-destroy: ## Terraform 销毁
	cd infra/terraform && terraform destroy -var-file=environments/$(ENV)/terraform.tfvars

# ─── Git Hooks ─────────────────────────────────────────
setup-hooks: ## 安装 Git hooks
	bash scripts/install-hooks.sh

# ─── 部署清单 ──────────────────────────────────────────
deploy-checklist: ## 部署前检查清单
	@echo "=========================================="
	@echo "M5 部署前检查清单"
	@echo "=========================================="
	@echo ""
	@echo "✅ 环境变量:"
	@echo "   - .env 文件是否已配置?"
	@echo "   - 密钥是否已注入 K8s Secrets?"
	@echo ""
	@echo "✅ 依赖服务:"
	@echo "   - PostgreSQL 是否可访问?"
	@echo "   - Redis 是否可访问?"
	@echo ""
	@echo "✅ Docker:"
	@echo "   - docker compose build 是否成功?"
	@echo "   - docker compose up 是否正常启动?"
	@echo ""
	@echo "✅ 健康检查:"
	@echo "   - curl http://localhost:3001/api/v1/health/ping"
	@echo "   - curl http://localhost:3002/"
	@echo "   - curl http://localhost:3003/"
	@echo ""
	@echo "=========================================="
