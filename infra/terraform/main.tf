# ═══════════════════════════════════════════════════════════════
# M5 — Terraform 主配置 (阿里云)
#
# 基础设施:
#   1. VPC + 交换机 + NAT 网关
#   2. ECS 实例 (Docker 部署)
#   3. RDS PostgreSQL (托管数据库)
#   4. Redis (托管缓存)
#   5. ACK (阿里云 K8s)
#   6. SLB (负载均衡)
#   7. OSS (对象存储)
#   8. DNS + SSL 证书
# ═══════════════════════════════════════════════════════════════

# ─── 1. VPC ────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  region             = var.region
  environment        = var.environment
  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  vswitch_cidrs      = var.vswitch_cidrs
  availability_zones = var.availability_zones
  tags               = var.tags
}

# ─── 2. 安全组 ────────────────────────────────────────
resource "alicloud_security_group" "m5_sg" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "M5 Security Group"
  vpc_id      = module.vpc.vpc_id

  tags = var.tags
}

resource "alicloud_security_group_rule" "allow_ssh" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "22/22"
  priority          = 1
  security_group_id = alicloud_security_group.m5_sg.id
  cidr_ip           = "0.0.0.0/0"
  description       = "SSH access"
}

resource "alicloud_security_group_rule" "allow_http" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "80/80"
  priority          = 1
  security_group_id = alicloud_security_group.m5_sg.id
  cidr_ip           = "0.0.0.0/0"
  description       = "HTTP"
}

resource "alicloud_security_group_rule" "allow_https" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "443/443"
  priority          = 1
  security_group_id = alicloud_security_group.m5_sg.id
  cidr_ip           = "0.0.0.0/0"
  description       = "HTTPS"
}

resource "alicloud_security_group_rule" "allow_intra_vpc" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "1/65535"
  priority          = 2
  security_group_id = alicloud_security_group.m5_sg.id
  cidr_ip           = var.vpc_cidr
  description       = "Intra-VPC communication"
}

# ─── 3. ECS (Docker 主机) ──────────────────────────────
resource "alicloud_instance" "m5_ecs" {
  count = var.ecs_instance_count

  instance_name        = "${var.project_name}-${var.environment}-ecs-${count.index + 1}"
  host_name            = "${var.project_name}-node-${count.index + 1}"
  instance_type        = var.ecs_instance_type
  image_id             = "ubuntu_24_04_x64_20G_alibase_20250324.vhd"
  security_groups      = [alicloud_security_group.m5_sg.id]
  vswitch_id           = module.vpc.vswitch_ids[count.index % length(module.vpc.vswitch_ids)]
  internet_charge_type = "PayByTraffic"
  internet_max_bandwidth_out = 100
  system_disk_category = "cloud_essd"
  system_disk_size     = var.ecs_system_disk_size

  data_disks {
    name        = "${var.project_name}-${var.environment}-data-${count.index + 1}"
    category    = "cloud_essd"
    size        = var.ecs_data_disk_size
    description = "Docker data volume"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -ex

    # ─── System ──────────────────────────────────────
    apt-get update -y
    apt-get upgrade -y
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release jq htop iotop sysstat

    # ─── Docker ──────────────────────────────────────
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker

    # ─── Docker Compose v2 ──────────────────────────
    DOCKER_COMPOSE_VERSION="2.32.4"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # ─── Data disk ──────────────────────────────────
    mkdir -p /data
    mkfs.ext4 /dev/vdb || true
    mount /dev/vdb /data || true
    echo '/dev/vdb /data ext4 defaults 0 0' >> /etc/fstab

    # ─── Swap ────────────────────────────────────────
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # ─── Sysctl ──────────────────────────────────────
    cat >> /etc/sysctl.conf <<'SYSCTL'
    net.core.somaxconn = 65535
    net.ipv4.tcp_max_syn_backlog = 65535
    net.ipv4.ip_local_port_range = 1024 65535
    net.ipv4.tcp_tw_reuse = 1
    net.ipv4.tcp_fin_timeout = 15
    vm.max_map_count = 262144
    fs.file-max = 1000000
    SYSCTL
    sysctl -p

    # ─── Limits ──────────────────────────────────────
    cat >> /etc/security/limits.conf <<'LIMITS'
    * soft nofile 1000000
    * hard nofile 1000000
    * soft nproc 65535
    * hard nproc 65535
    LIMITS

    # ─── Node.js 24 ──────────────────────────────────
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
    corepack enable
    corepack prepare pnpm@10.14.0 --activate

    echo "ECS init complete"
  EOF

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-ecs-${count.index + 1}"
    Role = "docker-host"
  })
}

# ─── 4. RDS PostgreSQL ────────────────────────────────
resource "random_password" "rds_password" {
  length  = 24
  special = false
}

resource "alicloud_db_instance" "m5_postgres" {
  engine              = "PostgreSQL"
  engine_version      = "16"
  instance_type       = var.rds_instance_class
  instance_storage    = var.rds_storage_size
  instance_charge_type = "PostPaid"
  monitoring_period   = 60

  vswitch_id       = module.vpc.vswitch_ids[0]
  security_group_ids = [alicloud_security_group.m5_sg.id]

  db_instance_storage_type = "cloud_essd_pl2"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-postgres"
    Role = "database"
  })
}

resource "alicloud_db_database" "m5_db" {
  instance_id = alicloud_db_instance.m5_postgres.id
  name        = var.rds_db_name
  character_set = "UTF8"
  description   = "M5 main database"
}

resource "alicloud_rds_account" "m5_db_account" {
  db_instance_id   = alicloud_db_instance.m5_postgres.id
  account_name     = var.rds_account_name
  account_password = random_password.rds_password.result
  account_type     = "Normal"
  description      = "M5 application account"
}

resource "alicloud_db_connection" "m5_db_conn" {
  instance_id    = alicloud_db_instance.m5_postgres.id
  connection_prefix = "${var.project_name}-${var.environment}"
  port           = 5432
}

# ─── 5. Redis ──────────────────────────────────────────
resource "alicloud_kvstore_instance" "m5_redis" {
  instance_class      = var.redis_instance_class
  instance_name       = "${var.project_name}-${var.environment}-redis"
  engine_version      = "7.0"
  instance_type       = "Redis"
  vswitch_id          = module.vpc.vswitch_ids[0]
  security_group_ids  = [alicloud_security_group.m5_sg.id]
  backup_period       = [3, 5, 7]
  backup_time         = "03:00Z-04:00Z"
  private_connection_port = 6379

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-redis"
    Role = "cache"
  })
}

# ─── 6. OSS (文件存储) ────────────────────────────────
resource "alicloud_oss_bucket" "m5_assets" {
  bucket = "${var.project_name}-${var.environment}-assets"
  acl    = "private"

  lifecycle_rule {
    id      = "expire-old-logs"
    enabled = true
    prefix  = "logs/"
    expiration {
      days = 90
    }
  }

  versioning {
    status = "Enabled"
  }

  tags = var.tags
}

resource "alicloud_oss_bucket" "m5_backups" {
  bucket = "${var.project_name}-${var.environment}-backups"
  acl    = "private"

  versioning {
    status = "Enabled"
  }

  lifecycle_rule {
    id      = "expire-old-backups"
    enabled = true
    expiration {
      days = 365
    }
  }

  tags = var.tags
}

# ─── 7. SLB (负载均衡) ────────────────────────────────
resource "alicloud_slb_load_balancer" "m5_slb" {
  load_balancer_name = "${var.project_name}-${var.environment}-slb"
  address_type       = "internet"
  load_balancer_spec = "slb.s2.small"
  vswitch_id         = module.vpc.vswitch_ids[0]
  bandwidth          = 100

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-slb"
    Role = "load-balancer"
  })
}

resource "alicloud_slb_listener" "m5_http" {
  load_balancer_id          = alicloud_slb_load_balancer.m5_slb.id
  backend_port              = 80
  frontend_port             = 80
  protocol                  = "http"
  bandwidth                 = 100
  sticky_session            = "on"
  sticky_session_type       = "insert"
  cookie_timeout            = 86400
  health_check_connect_port = 80
  healthy_threshold         = 2
  unhealthy_threshold       = 2
  health_check_interval     = 5
  health_check_http_code    = "http_2xx,http_3xx"
}

resource "alicloud_slb_listener" "m5_https" {
  load_balancer_id          = alicloud_slb_load_balancer.m5_slb.id
  backend_port              = 443
  frontend_port             = 443
  protocol                  = "https"
  bandwidth                 = 100
  ssl_certificate_id        = alicloud_ssl_certificates_service_certificate.m5_cert.id
  sticky_session            = "on"
  sticky_session_type       = "insert"
  cookie_timeout            = 86400
  health_check_connect_port = 443
  healthy_threshold         = 2
  unhealthy_threshold       = 2
  health_check_interval     = 5
}

resource "alicloud_slb_attachment" "m5_slb_attach" {
  load_balancer_id = alicloud_slb_load_balancer.m5_slb.id
  instance_ids     = alicloud_instance.m5_ecs[*].id
  weight           = 100
}

# ─── 8. SSL 证书 ──────────────────────────────────────
resource "alicloud_ssl_certificates_service_certificate" "m5_cert" {
  certificate_name = "${var.project_name}-${var.environment}-cert"
  cert             = file(var.ssl_cert_path != "" ? var.ssl_cert_path : "/dev/null")
  key              = file(var.ssl_key_path != "" ? var.ssl_key_path : "/dev/null")

  tags = var.tags
}

variable "ssl_cert_path" {
  description = "SSL 证书文件路径"
  type        = string
  default     = ""
}

variable "ssl_key_path" {
  description = "SSL 密钥文件路径"
  type        = string
  default     = ""
}

# ─── 9. 云监控 ─────────────────────────────────────────
resource "alicloud_cms_alarm" "m5_cpu_alarm" {
  count = var.enable_cloud_monitor ? 1 : 0

  name              = "${var.project_name}-${var.environment}-cpu-high"
  project           = "acs_ecs_dashboard"
  metric            = "cpu_total"
  dimensions        = {
    instanceId = join(",", alicloud_instance.m5_ecs[*].id)
  }
  statistics        = "Average"
  period            = 300
  operator          = ">"
  threshold         = "80"
  triggered_count   = 3
  contact_groups    = ["m5-alerts"]
  effective_interval = "00:00-23:59"
  webhook           = ""
}

resource "alicloud_cms_alarm" "m5_memory_alarm" {
  count = var.enable_cloud_monitor ? 1 : 0

  name              = "${var.project_name}-${var.environment}-memory-high"
  project           = "acs_ecs_dashboard"
  metric            = "memory_usedutilization"
  dimensions        = {
    instanceId = join(",", alicloud_instance.m5_ecs[*].id)
  }
  statistics        = "Average"
  period            = 300
  operator          = ">"
  threshold         = "85"
  triggered_count   = 3
  contact_groups    = ["m5-alerts"]
  effective_interval = "00:00-23:59"
}

# ─── 10. EIP (弹性公网 IP) ─────────────────────────────
resource "alicloud_eip_address" "m5_eip" {
  count = var.ecs_instance_count

  address_name = "${var.project_name}-${var.environment}-eip-${count.index + 1}"
  bandwidth    = "100"
  isp          = "BGP"
  net_mode     = "public"
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-eip-${count.index + 1}"
  })
}

resource "alicloud_eip_association" "m5_eip_assoc" {
  count = var.ecs_instance_count

  allocation_id = alicloud_eip_address.m5_eip[count.index].id
  instance_id   = alicloud_instance.m5_ecs[count.index].id
}

# ─── 输出 ──────────────────────────────────────────────
output "ecs_public_ips" {
  value       = alicloud_instance.m5_ecs[*].public_ip
  description = "ECS 公网 IP 地址"
}

output "slb_address" {
  value       = alicloud_slb_load_balancer.m5_slb.address
  description = "SLB 负载均衡地址"
}

output "rds_connection_string" {
  value       = alicloud_db_connection.m5_db_conn.connection_string
  description = "RDS 连接地址"
  sensitive   = true
}

output "rds_password" {
  value       = random_password.rds_password.result
  description = "RDS 数据库密码"
  sensitive   = true
}

output "redis_connection_string" {
  value       = alicloud_kvstore_instance.m5_redis.connection_domain
  description = "Redis 连接地址"
  sensitive   = true
}

output "oss_assets_bucket" {
  value       = alicloud_oss_bucket.m5_assets.bucket
  description = "OSS 资源存储桶"
}

output "oss_backups_bucket" {
  value       = alicloud_oss_bucket.m5_backups.bucket
  description = "OSS 备份存储桶"
}
