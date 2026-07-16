# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 阿里云生产环境 Terraform 配置
# ═══════════════════════════════════════════════════════════════════════
# 版本: v1.0.0
# 更新日期: 2026-07-16
# 适用范围: 阿里云 ACK 生产集群
# ═══════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    alicloud = {
      source  = "hashicorp/alicloud"
      version = ">= 1.209.0"
    }
  }
  
  # 本地状态存储 (快速部署模式)
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 1. 基础配置与变量
# ═══════════════════════════════════════════════════════════════════════

# 阿里云认证 (通过环境变量传入)
# export ALICLOUD_ACCESS_KEY="your-access-key"
# export ALICLOUD_SECRET_KEY="your-secret-key"
# export ALICLOUD_REGION="cn-hangzhou"

variable "region" {
  description = "阿里云地域"
  type        = string
  default     = "cn-hangzhou"
}

variable "environment" {
  description = "环境标识"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "ACK集群名称"
  type        = string
  default     = "m5-prod-cluster"
}

# ═══════════════════════════════════════════════════════════════════════
# 2. VPC 网络
# ═══════════════════════════════════════════════════════════════════════

# 创建 VPC
resource "alicloud_vpc" "main" {
  vpc_name   = "${var.cluster_name}-vpc"
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name        = "${var.cluster_name}-vpc"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 创建交换机 (使用cn-hangzhou-b可用区)
resource "alicloud_vswitch" "zone_a" {
  vswitch_name = "${var.cluster_name}-vswitch-a"
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = "10.0.1.0/24"
  zone_id      = "${var.region}-b"

  tags = {
    Name        = "${var.cluster_name}-vswitch-a"
    Environment = var.environment
  }
}

resource "alicloud_vswitch" "zone_b" {
  vswitch_name = "${var.cluster_name}-vswitch-b"
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = "10.0.2.0/24"
  zone_id      = "${var.region}-b"

  tags = {
    Name        = "${var.cluster_name}-vswitch-b"
    Environment = var.environment
  }
}

resource "alicloud_vswitch" "zone_c" {
  vswitch_name = "${var.cluster_name}-vswitch-c"
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = "10.0.3.0/24"
  zone_id      = "${var.region}-b"

  tags = {
    Name        = "${var.cluster_name}-vswitch-c"
    Environment = var.environment
  }
}

# NAT 网关 (用于节点访问公网)
resource "alicloud_nat_gateway" "main" {
  vpc_id               = alicloud_vpc.main.id
  nat_gateway_name     = "${var.cluster_name}-nat"
  payment_type         = "PayAsYouGo"
  vswitch_id           = alicloud_vswitch.zone_a.id
  nat_type             = "Enhanced"
}

# EIP 绑定到 NAT 网关
resource "alicloud_eip_address" "nat" {
  address_name         = "${var.cluster_name}-nat-eip"
  isp                  = "BGP"
  internet_charge_type = "PayByTraffic"
  bandwidth            = 100
}

resource "alicloud_eip_association" "nat" {
  allocation_id = alicloud_eip_address.nat.id
  instance_id   = alicloud_nat_gateway.main.id
}

# ═══════════════════════════════════════════════════════════════════════
# 3. ACK 托管版 Kubernetes 集群
# ═══════════════════════════════════════════════════════════════════════

# 创建 ACK 托管版集群
resource "alicloud_cs_managed_kubernetes" "main" {
  name               = var.cluster_name
  cluster_spec       = "ack.standard"  # 托管版标准版
  version            = "1.36.1-aliyun.1"
  
  # 网络配置
  vswitch_ids        = [
    alicloud_vswitch.zone_a.id,
    alicloud_vswitch.zone_b.id,
    alicloud_vswitch.zone_c.id
  ]
  pod_cidr           = "172.20.0.0/16"
  service_cidr       = "172.21.0.0/20"
  
  # 访问配置
  new_nat_gateway    = false  # 使用已创建的NAT
  slb_internet_enabled = true  # 公网SLB
  
  # 标签
  tags = {
    Name        = var.cluster_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  
  depends_on = [
    alicloud_nat_gateway.main,
    alicloud_eip_association.nat
  ]
}

# ═══════════════════════════════════════════════════════════════════════
# 4. 节点池配置
# ═══════════════════════════════════════════════════════════════════════

# 系统节点池 (运行 kube-system 等核心组件)
resource "alicloud_cs_kubernetes_node_pool" "system" {
  node_pool_name    = "system"
  cluster_id        = alicloud_cs_managed_kubernetes.main.id
  
  vswitch_ids       = [alicloud_vswitch.zone_a.id]
  instance_types    = ["ecs.c7.xlarge"]  # 4C8G
  
  desired_size      = 2

  # 系统磁盘
  system_disk_category = "cloud_essd"
  system_disk_size     = 100
  
  # 标签和污点
  labels {
    key   = "node-type"
    value = "system"
  }
  
  tags = {
    Name        = "${var.cluster_name}-system"
    Environment = var.environment
  }
}

# 应用节点池 (运行业务应用)
resource "alicloud_cs_kubernetes_node_pool" "application" {
  node_pool_name    = "application"
  cluster_id        = alicloud_cs_managed_kubernetes.main.id
  
  vswitch_ids       = [
    alicloud_vswitch.zone_a.id,
    alicloud_vswitch.zone_b.id,
    alicloud_vswitch.zone_c.id
  ]
  instance_types    = ["ecs.c7.2xlarge"]  # 8C16G
  
  desired_size      = 4

  # 系统磁盘
  system_disk_category = "cloud_essd"
  system_disk_size     = 100
  
  # 数据磁盘 (用于容器镜像和EmptyDir)
  data_disks {
    category = "cloud_essd"
    size     = 200
  }
  
  # 标签
  labels {
    key   = "node-type"
    value = "application"
  }
  
  tags = {
    Name        = "${var.cluster_name}-application"
    Environment = var.environment
  }
  
  depends_on = [alicloud_cs_kubernetes_node_pool.system]
}

# 数据节点池 (运行数据库中间件等)
resource "alicloud_cs_kubernetes_node_pool" "data" {
  node_pool_name    = "data"
  cluster_id        = alicloud_cs_managed_kubernetes.main.id
  
  vswitch_ids       = [
    alicloud_vswitch.zone_b.id,
    alicloud_vswitch.zone_c.id
  ]
  instance_types    = ["ecs.r7.2xlarge"]  # 8C32G (内存优化型)
  
  desired_size      = 3

  # 系统磁盘
  system_disk_category = "cloud_essd"
  system_disk_size     = 100
  
  # 数据磁盘
  data_disks {
    category = "cloud_essd"
    size     = 500
  }
  
  # 标签和污点
  labels {
    key   = "node-type"
    value = "data"
  }
  
  taints {
    key    = "dedicated"
    value  = "data"
    effect = "NoSchedule"
  }
  
  tags = {
    Name        = "${var.cluster_name}-data"
    Environment = var.environment
  }
  
  depends_on = [alicloud_cs_kubernetes_node_pool.application]
}

# ═══════════════════════════════════════════════════════════════════════
# 5. 输出信息
# ═══════════════════════════════════════════════════════════════════════

output "cluster_id" {
  description = "ACK集群ID"
  value       = alicloud_cs_managed_kubernetes.main.id
}

output "cluster_endpoint" {
  description = "集群API Endpoint"
  value       = alicloud_cs_managed_kubernetes.main.id
}

output "cluster_public_endpoint" {
  description = "集群公网API Endpoint"
  value       = alicloud_cs_managed_kubernetes.main.name
}

output "kubeconfig" {
  description = "KubeConfig内容(敏感)"
  value       = alicloud_cs_managed_kubernetes.main.kube_config
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = alicloud_vpc.main.id
}

output "vswitch_ids" {
  description = "交换机ID列表"
  value       = [
    alicloud_vswitch.zone_a.id,
    alicloud_vswitch.zone_b.id,
    alicloud_vswitch.zone_c.id
  ]
}

output "nat_gateway_id" {
  description = "NAT网关ID"
  value       = alicloud_nat_gateway.main.id
}

output "eip_address" {
  description = "NAT网关公网IP"
  value       = alicloud_eip_address.nat.ip_address
}
