# ═══════════════════════════════════════════════════════════════
# M5 — Terraform 变量定义
# ═══════════════════════════════════════════════════════════════

# ─── 全局变量 ──────────────────────────────────────────
variable "region" {
  description = "阿里云区域"
  type        = string
  default     = "cn-hongkong"
}

variable "environment" {
  description = "部署环境 (staging / production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "项目名称"
  type        = string
  default     = "m5"
}

variable "tags" {
  description = "资源标签"
  type        = map(string)
  default = {
    Project     = "m5"
    ManagedBy   = "terraform"
    Owner       = "shenjiying"
    Environment = "production"
  }
}

# ─── 计算 (ECS) ────────────────────────────────────────
variable "ecs_instance_type" {
  description = "ECS 实例规格"
  type        = string
  default     = "ecs.g7.xlarge"  # 4C 16G
}

variable "ecs_instance_count" {
  description = "ECS 实例数量"
  type        = number
  default     = 2
}

variable "ecs_system_disk_size" {
  description = "系统盘大小 (GB)"
  type        = number
  default     = 40
}

variable "ecs_data_disk_size" {
  description = "数据盘大小 (GB)"
  type        = number
  default     = 100
}

# ─── 网络 ──────────────────────────────────────────────
variable "vpc_cidr" {
  description = "VPC CIDR 网段"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vswitch_cidrs" {
  description = "交换机 CIDR 列表 (每个可用区一个)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "availability_zones" {
  description = "可用区列表"
  type        = list(string)
  default     = ["cn-hongkong-b", "cn-hongkong-c"]
}

# ─── RDS (PostgreSQL) ─────────────────────────────────
variable "rds_instance_class" {
  description = "RDS PostgreSQL 实例规格"
  type        = string
  default     = "pg.n2.2xlarge.1"  # 8C 16G
}

variable "rds_storage_size" {
  description = "RDS 存储大小 (GB)"
  type        = number
  default     = 100
}

variable "rds_db_name" {
  description = "数据库名称"
  type        = string
  default     = "m5"
}

variable "rds_account_name" {
  description = "数据库账号"
  type        = string
  default     = "m5"
}

# ─── Redis ─────────────────────────────────────────────
variable "redis_instance_class" {
  description = "Redis 实例规格"
  type        = string
  default     = "redis.master.small.default"  # 1GB 主从版
}

# ─── ACK (Kubernetes) ─────────────────────────────────
variable "k8s_node_instance_type" {
  description = "ACK Worker 节点规格"
  type        = string
  default     = "ecs.g7.xlarge"  # 4C 16G
}

variable "k8s_node_count" {
  description = "ACK Worker 节点数量"
  type        = number
  default     = 3
}

variable "k8s_node_disk_size" {
  description = "ACK Worker 节点系统盘大小 (GB)"
  type        = number
  default     = 120
}

# ─── SSL ───────────────────────────────────────────────
variable "domain_name" {
  description = "主域名"
  type        = string
  default     = "m5.local"
}

variable "ssl_protocol" {
  description = "证书协议"
  type        = string
  default     = "HTTPS"
}

# ─── 监控 ──────────────────────────────────────────────
variable "enable_cloud_monitor" {
  description = "是否启用云监控"
  type        = bool
  default     = true
}
