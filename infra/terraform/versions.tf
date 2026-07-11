# ═══════════════════════════════════════════════════════════════
# M5 — Terraform Provider & Backend 配置
# ═══════════════════════════════════════════════════════════════
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.240.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # ─── 远程状态存储 (OSS,阿里云对象存储) ──────────────
  backend "oss" {
    bucket  = "m5-terraform-state"
    prefix  = "terraform/state"
    key     = "m5/terraform.tfstate"
    region  = "cn-hongkong"
    encrypt = true
  }
}

provider "alicloud" {
  region = var.region
}

provider "random" {}
