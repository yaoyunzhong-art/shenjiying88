# ═══════════════════════════════════════════════════════════════
# M5 — Staging 环境变量
# ═══════════════════════════════════════════════════════════════

region      = "cn-hongkong"
environment = "staging"

project_name = "m5"

tags = {
  Project     = "m5"
  ManagedBy   = "terraform"
  Owner       = "shenjiying"
  Environment = "staging"
}

# ─── 计算 ──────────────────────────────────────────────
ecs_instance_type  = "ecs.g7.large"   # 2C 8G
ecs_instance_count = 1
ecs_system_disk_size = 40
ecs_data_disk_size   = 50

# ─── 数据库 ────────────────────────────────────────────
rds_instance_class = "pg.n2.small.1"  # 2C 4G
rds_storage_size   = 50

redis_instance_class = "redis.master.small.default"  # 1GB

# ─── K8s ───────────────────────────────────────────────
k8s_node_instance_type = "ecs.g7.large"
k8s_node_count         = 2
k8s_node_disk_size     = 80

# ─── 域名 ──────────────────────────────────────────────
domain_name = "staging.m5.local"
