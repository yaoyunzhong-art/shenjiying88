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
# 3. NAT 网关和弹性IP (用于节点访问公网)
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
# 4. 安全组
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_security_group" "main" {
  name   = "${var.cluster_name}-sg"
  vpc_id = alicloud_vpc.main.id

  tags = {
    Name        = "${var.cluster_name}-sg"
    Environment = var.environment
  }
}

# 安全组规则 - 允许内网访问
resource "alicloud_security_group_rule" "allow_internal" {
  type              = "ingress"
  ip_protocol       = "all"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "1/65535"
  priority          = 1
  security_group_id = alicloud_security_group.main.id
  cidr_ip           = "10.0.0.0/16"
}

# ═══════════════════════════════════════════════════════════════════════
# 5. ECS实例 - K8s Master节点 (3台)
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_instance" "master" {
  count           = 3
  image_id        = "centos_8_5_x64_20G_alibase_20220727.vhd"
  instance_type   = "ecs.c7.2xlarge"  # 8C16G
  security_groups = [alicloud_security_group.main.id]
  vswitch_id      = alicloud_vswitch.zone_a.id
  host_name       = "k8s-master-${count.index + 1}"
  instance_name   = "${var.cluster_name}-master-${count.index + 1}"

  system_disk_category = "cloud_essd"
  system_disk_size     = 100

  internet_charge_type       = "PayByTraffic"
  internet_max_bandwidth_out = 10

  user_data = <<-EOF
#!/bin/bash
# 安装Docker和K8s基础环境
yum install -y docker
systemctl enable docker && systemctl start docker

# 安装kubeadm kubelet kubectl
cat <<EOF2 > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF2

yum install -y kubelet kubeadm kubectl
systemctl enable kubelet
EOF

  tags = {
    Name        = "${var.cluster_name}-master-${count.index + 1}"
    Environment = var.environment
    NodeType    = "master"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 6. ECS实例 - K8s Worker节点 (4台)
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_instance" "worker" {
  count           = 4
  image_id        = "centos_8_5_x64_20G_alibase_20220727.vhd"
  instance_type   = "ecs.c7.2xlarge"  # 8C16G
  security_groups = [alicloud_security_group.main.id]
  vswitch_id      = alicloud_vswitch.zone_b.id
  host_name       = "k8s-worker-${count.index + 1}"
  instance_name   = "${var.cluster_name}-worker-${count.index + 1}"

  system_disk_category = "cloud_essd"
  system_disk_size     = 100

  data_disks {
    category = "cloud_essd"
    size     = 200
  }

  internet_charge_type       = "PayByTraffic"
  internet_max_bandwidth_out = 10

  user_data = <<-EOF
#!/bin/bash
# 安装Docker和K8s基础环境
yum install -y docker
systemctl enable docker && systemctl start docker

# 安装kubeadm kubelet kubectl
cat <<EOF2 > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF2

yum install -y kubelet kubeadm kubectl
systemctl enable kubelet
EOF

  tags = {
    Name        = "${var.cluster_name}-worker-${count.index + 1}"
    Environment = var.environment
    NodeType    = "worker"
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 7. RDS PostgreSQL 数据库
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_db_instance" "postgres" {
  engine           = "PostgreSQL"
  engine_version   = "15.0"
  instance_type    = "rds.pg.c2.2xlarge"  # 8C16G
  instance_storage = "500"
  vswitch_id       = alicloud_vswitch.zone_b.id
  security_ips     = [alicloud_vpc.main.cidr_block]

  instance_name = "${var.cluster_name}-postgres"

  tags = {
    Name        = "${var.cluster_name}-postgres"
    Environment = var.environment
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 8. Redis 缓存
# ═══════════════════════════════════════════════════════════════════════

resource "alicloud_kvstore_instance" "redis" {
  instance_type  = "Redis"
  engine_version = "6.0"
  instance_name  = "${var.cluster_name}-redis"
  vswitch_id     = alicloud_vswitch.zone_b.id
  security_ips   = [alicloud_vpc.main.cidr_block]

  instance_class = "redis.master.xlarge"  # 4C8G

  tags = {
    Name        = "${var.cluster_name}-redis"
    Environment = var.environment
  }
}

# ═══════════════════════════════════════════════════════════════════════
# 9. 输出
# ═══════════════════════════════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID"
  value       = alicloud_vpc.main.id
}

output "vswitch_ids" {
  description = "交换机ID列表"
  value       = [alicloud_vswitch.zone_a.id, alicloud_vswitch.zone_b.id, alicloud_vswitch.zone_c.id]
}

output "master_ips" {
  description = "K8s Master节点IP"
  value       = alicloud_instance.master[*].public_ip
}

output "worker_ips" {
  description = "K8s Worker节点IP"
  value       = alicloud_instance.worker[*].public_ip
}

output "postgres_endpoint" {
  description = "PostgreSQL连接地址"
  value       = alicloud_db_instance.postgres.connection_string
}

output "redis_endpoint" {
  description = "Redis连接地址"
  value       = alicloud_kvstore_instance.redis.connection_domain
}
