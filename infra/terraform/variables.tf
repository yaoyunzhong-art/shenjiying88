# ═══════════════════════════════════════════════════════════════════════
# Variables - M5 Platform 阿里云生产环境
# ═══════════════════════════════════════════════════════════════════════

variable "region" {
  description = "阿里云区域"
  type        = string
  default     = "cn-hangzhou"
}

variable "cluster_name" {
  description = "集群名称"
  type        = string
  default     = "m5-prod-cluster"
}

variable "environment" {
  description = "环境标识"
  type        = string
  default     = "production"
}

variable "system_node_count" {
  description = "系统节点数量"
  type        = number
  default     = 2
}

variable "application_node_count" {
  description = "应用节点数量"
  type        = number
  default     = 4
}

variable "data_node_count" {
  description = "数据节点数量"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "数据库实例规格"
  type        = string
  default     = "pg.n2.2xlarge"
}

variable "db_storage" {
  description = "数据库存储容量(GB)"
  type        = number
  default     = 500
}

variable "redis_instance_class" {
  description = "Redis实例规格"
  type        = string
  default     = "redis.master.xlarge"
}

variable "allowed_cidr_blocks" {
  description = "允许的CIDR块"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "common_tags" {
  description = "通用标签"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Environment = "production"
  }
}
