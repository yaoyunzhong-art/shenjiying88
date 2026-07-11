# ═══════════════════════════════════════════════════════════════
# M5 — Production 环境变量
# ═══════════════════════════════════════════════════════════════

region      = "cn-hongkong"
environment = "production"

project_name = "m5"

tags = {
  Project     = "m5"
  ManagedBy   = "terraform"
  Owner       = "shenjiying"
  Environment = "production"
}

# ─── 计算 ──────────────────────────────────────────────
ecs_instance_type  = "ecs.g7.xlarge"  # 4C 16G
ecs_instance_count = 2
ecs_system_disk_size = 40
ecs_data_disk_size   = 200

# ─── 数据库 ────────────────────────────────────────────
rds_instance_class = "pg.n2.2xlarge.1"  # 8C 16G
rds_storage_size   = 200

redis_instance_class = "redis.master.stand.default"  # 2GB 主从版

# ─── K8s ───────────────────────────────────────────────
k8s_node_instance_type = "ecs.g7.xlarge"
k8s_node_count         = 3
k8s_node_disk_size     = 120

# ─── 域名 ──────────────────────────────────────────────
domain_name = "m5.local"

# ─── SSL ──────────────────────────────────────────────
ssl_cert_path = "/etc/ssl/m5/fullchain.pem"
ssl_key_path  = "/etc/ssl/m5/privkey.pem"
