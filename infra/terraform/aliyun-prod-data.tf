# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 数据层部署 (RDS PostgreSQL + Redis)
# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# RDS PostgreSQL 主从架构
# ─────────────────────────────────────────────────────────────────────

resource "alicloud_db_instance" "main" {
  engine               = "PostgreSQL"
  engine_version       = "15.0"
  instance_type        = "pg.n2.2c.1m"
  instance_storage     = 50
  instance_name        = "${var.cluster_name}-rds"
  vswitch_id           = alicloud_vswitch.zone_b.id
  instance_charge_type = "Postpaid"
  security_ips         = ["10.0.0.0/8", "172.20.0.0/16"]

  tags = {
    Name        = "${var.cluster_name}-rds"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "alicloud_db_database" "main" {
  instance_id = alicloud_db_instance.main.id
  name        = "m5platform"
}

resource "alicloud_rds_account" "m5admin" {
  db_instance_id = alicloud_db_instance.main.id
  account_name   = "m5admin"
  account_password = "M5Platform@2026!"
  account_type   = "Super"
}

resource "alicloud_db_connection" "main" {
  instance_id       = alicloud_db_instance.main.id
  connection_prefix = "${var.cluster_name}-rds"
  port              = "5432"
}

# ─────────────────────────────────────────────────────────────────────
# Redis 缓存
# ─────────────────────────────────────────────────────────────────────

resource "alicloud_kvstore_instance" "main" {
  db_instance_name = "${var.cluster_name}-redis"
  vswitch_id       = alicloud_vswitch.zone_b.id
  security_ips     = ["10.0.0.0/8", "172.20.0.0/16"]
  
  instance_type    = "Redis"
  engine_version   = "7.0"
  instance_class   = "redis.master.small.default"

  tags = {
    Name        = "${var.cluster_name}-redis"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 输出
# ═══════════════════════════════════════════════════════════════════════

output "rds_endpoint" {
  description = "RDS PostgreSQL 连接地址"
  value       = alicloud_db_connection.main.connection_string
}

output "rds_database" {
  description = "RDS 数据库名"
  value       = alicloud_db_database.main.name
}

output "redis_endpoint" {
  description = "Redis 连接地址"
  value       = alicloud_kvstore_instance.main.connection_domain
}
