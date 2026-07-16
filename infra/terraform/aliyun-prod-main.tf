# ═══════════════════════════════════════════════════════════════════════
# M5 Platform - 阿里云生产环境基础设施 (无角色版)
# 版本: v1.0.0
# 说明: 使用ECS自建K8s，无需ACK服务角色
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
  vswitch_name = "${var.cluster