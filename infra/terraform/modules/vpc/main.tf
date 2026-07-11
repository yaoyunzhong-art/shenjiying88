# ═══════════════════════════════════════════════════════════════
# M5 — VPC Module
# ═══════════════════════════════════════════════════════════════

variable "region" {
  description = "阿里云区域"
  type        = string
}

variable "environment" {
  description = "环境"
  type        = string
}

variable "project_name" {
  description = "项目名称"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
}

variable "vswitch_cidrs" {
  description = "交换机 CIDR 列表"
  type        = list(string)
}

variable "availability_zones" {
  description = "可用区列表"
  type        = list(string)
}

variable "tags" {
  description = "资源标签"
  type        = map(string)
}

# ─── VPC ───────────────────────────────────────────────
resource "alicloud_vpc" "m5_vpc" {
  vpc_name   = "${var.project_name}-${var.environment}-vpc"
  cidr_block = var.vpc_cidr

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
}

# ─── 交换机 ────────────────────────────────────────────
resource "alicloud_vswitch" "m5_vswitches" {
  count = length(var.vswitch_cidrs)

  vpc_id       = alicloud_vpc.m5_vpc.id
  cidr_block   = var.vswitch_cidrs[count.index]
  zone_id      = var.availability_zones[count.index % length(var.availability_zones)]
  vswitch_name = "${var.project_name}-${var.environment}-vsw-${count.index + 1}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vsw-${count.index + 1}"
    AZ   = var.availability_zones[count.index % length(var.availability_zones)]
  })
}

# ─── NAT 网关 ──────────────────────────────────────────
resource "alicloud_nat_gateway" "m5_nat" {
  vpc_id           = alicloud_vpc.m5_vpc.id
  nat_gateway_name = "${var.project_name}-${var.environment}-nat"
  payment_type     = "PayAsYouGo"
  nat_type         = "Enhanced"
  vswitch_id       = alicloud_vswitch.m5_vswitches[0].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-nat"
  })
}

resource "alicloud_eip_address" "nat_eip" {
  address_name = "${var.project_name}-${var.environment}-nat-eip"
  bandwidth    = "50"
  isp          = "BGP"
  net_mode     = "public"
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip"
  })
}

resource "alicloud_eip_association" "nat_eip_assoc" {
  allocation_id = alicloud_eip_address.nat_eip.id
  instance_id   = alicloud_nat_gateway.m5_nat.id
}

resource "alicloud_snat_entry" "m5_snat" {
  snat_table_id     = alicloud_nat_gateway.m5_nat.snat_table_ids
  source_vswitch_id = alicloud_vswitch.m5_vswitches[0].id
  snat_ip           = alicloud_eip_address.nat_eip.ip_address
}

# ─── 路由表 ────────────────────────────────────────────
resource "alicloud_route_entry" "nat_default_route" {
  route_table_id        = alicloud_vpc.m5_vpc.route_table_id
  destination_cidrblock = "0.0.0.0/0"
  nexthop_type          = "NatGateway"
  nexthop_id            = alicloud_nat_gateway.m5_nat.id
}

# ─── 输出 ──────────────────────────────────────────────
output "vpc_id" {
  value = alicloud_vpc.m5_vpc.id
}

output "vswitch_ids" {
  value = alicloud_vswitch.m5_vswitches[*].id
}

output "nat_gateway_id" {
  value = alicloud_nat_gateway.m5_nat.id
}

output "nat_eip" {
  value = alicloud_eip_address.nat_eip.ip_address
}
