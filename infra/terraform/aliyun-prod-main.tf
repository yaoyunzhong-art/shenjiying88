# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 阿里云ACK托管版K8s集群
# 版本: v1.0.0
# 说明: 全自动创建ACK托管版集群，需要RAM服务角色授权
# ═══════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.9.0"
  required_providers {
    alicloud = {
      source  = "hashicorp/alicloud"
      version = ">= 1.209.0"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "alicloud" {
  region = var.region
}

# ═══════════════════════════════════════════════════════════════════════
# 1. VPC 网络
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_vpc" "main" {
  vpc_name   = "${var.cluster_name}-vpc"
  cidr_block = "10.0.0.0/16"

  tags = {
    Name        = "${var.cluster_name}-vpc"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 2. 交换机 (使用cn-hangzhou-b可用区)
# ═══════════════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════════════
# 3. NAT 网关和弹性IP
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_eip_address" "nat" {
  address_name = "${var.cluster_name}-nat-eip"
  isp            = "BGP"
  netmode        = "public"
  bandwidth      = "100"

  tags = {
    Name        = "${var.cluster_name}-nat-eip"
    Environment = var.environment
  }
}

resource "alicloud_nat_gateway" "main" {
  vpc_id               = alicloud_vpc.main.id
  nat_gateway_name     = "${var.cluster_name}-nat"
  payment_type         = "PayAsYouGo"
  vswitch_id           = alicloud_vswitch.zone_b.id
  nat_type             = "Enhanced"
  specification        = "Small"

  tags = {
    Name        = "${var.cluster_name}-nat"
    Environment = var.environment
  }
}

resource "alicloud_eip_association" "nat" {
  allocation_id = alicloud_eip_address.nat.id
  instance_id   = alicloud_nat_gateway.main.id
}

# ═══════════════════════════════════════════════════════════════════════
# 4. ACK托管版集群
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_cs_managed_kubernetes" "main" {
  name               = var.cluster_name
  cluster_spec       = "ack.standard"
  version            = "1.34.3-aliyun.1"
  
  # 网络配置
  vswitch_ids        = [
    alicloud_vswitch.zone_a.id,
    alicloud_vswitch.zone_b.id,
    alicloud_vswitch.zone_c.id
  ]
  pod_cidr           = "172.20.0.0/16"
  service_cidr       = "172.21.0.0/20"
  
  # 访问配置
  new_nat_gateway    = false
  slb_internet_enabled = true
  
  # 最小化插件配置（绕过CSI等插件的角色授权限制）
  # 仅启用核心插件
  addons {
    name    = "kube-proxy"
    config  = ""
  }
  addons {
    name    = "coredns"
    config  = ""
  }
  
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
# 5. 节点池配置
# ═══════════════════════════════════════════════════════════════════════

# 系统节点池
resource "alicloud_cs_kubernetes_node_pool" "system" {
  node_pool_name    = "system"
  cluster_id        = alicloud_cs_managed_kubernetes.main.id
  
  vswitch_ids       = [alicloud_vswitch.zone_a.id]
  instance_types    = ["ecs.c7.xlarge"]
  
  desired_size      = 2

  system_disk_category = "cloud_essd"
  system_disk_size     = 100

  labels {
    key   = "node-type"
    value = "system"
  }

  tags = {
    Environment = var.environment
    Name        = "${var.cluster_name}-system"
  }
}

# 应用节点池
resource "alicloud_cs_kubernetes_node_pool" "application" {
  node_pool_name    = "application"
  cluster_id        = alicloud_cs_managed_kubernetes.main.id
  
  vswitch_ids       = [alicloud_vswitch.zone_b.id, alicloud_vswitch.zone_c.id]
  instance_types    = ["ecs.c7.2xlarge"]
  
  desired_size      = 4

  system_disk_category = "cloud_essd"
  system_disk_size     = 100

  data_disks {
    category = "cloud_essd"
    size     = 200
  }

  labels {
    key   = "node-type"
    value = "application"
  }

  tags = {
    Environment = var.environment
    Name        = "${var.cluster_name}-application"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 6. 输出
# ═══════════════════════════════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID"
  value       = alicloud_vpc.main.id
}

output "vswitch_ids" {
  description = "交换机ID列表"
  value       = [alicloud_vswitch.zone_a.id, alicloud_vswitch.zone_b.id, alicloud_vswitch.zone_c.id]
}

output "cluster_id" {
  description = "ACK集群ID"
  value       = alicloud_cs_managed_kubernetes.main.id
}

output "cluster_name" {
  description = "集群名称"
  value       = alicloud_cs_managed_kubernetes.main.name
}

output "nat_gateway_id" {
  description = "NAT网关ID"
  value       = alicloud_nat_gateway.main.id
}

output "eip_address" {
  description = "弹性IP地址"
  value       = alicloud_eip_address.nat.ip_address
}
