# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - Terraform 变量配置文件
# ═══════════════════════════════════════════════════════════════════════
# 警告: 此文件包含敏感信息，请勿提交到Git!
# ═══════════════════════════════════════════════════════════════════════

# 基础配置
region       = "cn-hangzhou"
environment  = "production"
cluster_name = "m5-prod-cluster"

# 节点配置
system_node_count      = 2
application_node_count = 4
data_node_count        = 3

# 数据库配置
db_instance_class     = "rds.pg.c2.2xlarge"
db_storage            = 500
redis_instance_class  = "redis.master.large"

# 访问限制 (安全组)
allowed_cidr_blocks = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16"
]

# 标签
common_tags = {
  Project     = "m5-platform"
  Environment = "production"
  ManagedBy   = "Terraform"
  Owner       = "shenjiying88"
}
