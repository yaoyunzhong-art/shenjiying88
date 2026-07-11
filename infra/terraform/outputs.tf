# ═══════════════════════════════════════════════════════════════
# M5 — Terraform Outputs
# ═══════════════════════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vswitch_ids" {
  description = "交换机 ID 列表"
  value       = module.vpc.vswitch_ids
}

output "ecs_instance_ids" {
  description = "ECS 实例 ID 列表"
  value       = alicloud_instance.m5_ecs[*].id
}

output "ecs_public_ips" {
  description = "ECS 公网 IP 列表"
  value       = alicloud_instance.m5_ecs[*].public_ip
}

output "ecs_private_ips" {
  description = "ECS 内网 IP 列表"
  value       = alicloud_instance.m5_ecs[*].private_ip
}

output "slb_id" {
  description = "SLB 实例 ID"
  value       = alicloud_slb_load_balancer.m5_slb.id
}

output "slb_address" {
  description = "SLB 公网地址"
  value       = alicloud_slb_load_balancer.m5_slb.address
}

output "rds_instance_id" {
  description = "RDS 实例 ID"
  value       = alicloud_db_instance.m5_postgres.id
}

output "rds_connection_string" {
  description = "RDS 连接地址"
  value       = alicloud_db_connection.m5_db_conn.connection_string
  sensitive   = true
}

output "rds_port" {
  description = "RDS 端口"
  value       = "5432"
}

output "rds_database_name" {
  description = "RDS 数据库名称"
  value       = alicloud_db_database.m5_db.name
}

output "rds_account" {
  description = "RDS 数据库账号"
  value       = alicloud_rds_account.m5_db_account.account_name
}

output "rds_password" {
  description = "RDS 数据库密码 (请安全保存)"
  value       = random_password.rds_password.result
  sensitive   = true
}

output "redis_instance_id" {
  description = "Redis 实例 ID"
  value       = alicloud_kvstore_instance.m5_redis.id
}

output "redis_connection_string" {
  description = "Redis 连接地址"
  value       = alicloud_kvstore_instance.m5_redis.connection_domain
  sensitive   = true
}

output "redis_port" {
  description = "Redis 端口"
  value       = "6379"
}

output "oss_assets_bucket" {
  description = "OSS 资源存储桶名称"
  value       = alicloud_oss_bucket.m5_assets.bucket
}

output "oss_backups_bucket" {
  description = "OSS 备份存储桶名称"
  value       = alicloud_oss_bucket.m5_backups.bucket
}

output "security_group_id" {
  description = "安全组 ID"
  value       = alicloud_security_group.m5_sg.id
}

output "eip_addresses" {
  description = "弹性公网 IP 地址列表"
  value       = alicloud_eip_address.m5_eip[*].ip_address
}
