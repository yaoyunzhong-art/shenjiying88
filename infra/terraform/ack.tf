# ═══════════════════════════════════════════════════════════════
# M5 — 阿里云 ACK (Kubernetes) 集群配置
# ═══════════════════════════════════════════════════════════════

# ─── 1. ACK 集群 ─────────────────────────────────────────────
resource "alicloud_cs_managed_kubernetes" "m5_k8s" {
  name               = "${var.project_name}-${var.environment}-k8s"
  cluster_spec       = "ack.pro.small"  # 托管版 - 专业版
  version            = "1.30.1-aliyun.1" # Kubernetes 版本
  
  # 网络配置
  pod_cidr     = "172.20.0.0/16"
  service_cidr = "172.21.0.0/20"
  
  # VPC 配置
  vpc_id  = module.vpc.vpc_id
  vswitch_ids = slice(module.vpc.vswitch_ids, 0, min(3, length(module.vpc.vswitch_ids)))
  
  # 运行时
  runtime = {
    name    = "containerd"
    version = "1.6.28"
  }
  
  # 加密配置
  enable_rrsa = true
  
  # 日志配置
  control_plane_log_components = ["apiserver", "kcm", "scheduler", "ccm"]
  
  # 标签
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-k8s"
    Role = "kubernetes-cluster"
  })
  
  depends_on = [module.vpc]
}

# ─── 2. ACK Worker 节点池 ──────────────────────────────────
resource "alicloud_cs_kubernetes_node_pool" "m5_workers" {
  name           = "${var.project_name}-${var.environment}-workers"
  cluster_id     = alicloud_cs_managed_kubernetes.m5_k8s.id
  vswitch_ids    = slice(module.vpc.vswitch_ids, 0, min(3, length(module.vpc.vswitch_ids)))
  
  # 实例配置
  instance_types       = [var.k8s_node_instance_type]
  desired_size          = var.k8s_node_count
  min_size              = 2
  max_size              = 10
  
  # 系统盘
  system_disk_category = "cloud_essd"
  system_disk_size     = var.k8s_node_disk_size
  system_disk_performance_level = "PL1"
  
  # 数据盘 (用于容器镜像和日志)
  data_disks {
    category          = "cloud_essd"
    size              = 100
    performance_level = "PL1"
  }
  
  # 运行时
  runtime_name    = "containerd"
  runtime_version = "1.6.28"
  
  # 操作系统
  platform = "AliyunLinux"
  image_id = "aliyun_3_x64_20G_alibase_20250212.vhd"
  
  # 节点标签
  labels {
    key   = "node-type"
    value = "worker"
  }
  labels {
    key   = "environment"
    value = var.environment
  }
  labels {
    key   = "project"
    value = var.project_name
  }
  
  # 污点 (可选，用于专用节点)
  # taints {
  #   key    = "dedicated"
  #   value  = "true"
  #   effect = "NoSchedule"
  # }
  
  # 滚动升级配置
  rolling_policy {
    max_surge        = "30%"
    max_unavailable  = 0
    pause            = false
  }
  
  # 自动修复
  auto_repair           = true
  auto_repair_policy {
    restart_node        = true
    repair_node         = true
  }
  
  # 自动伸缩
  # scaling_config {
  #   eip_bandwidth      = 100
  #   eip_internet_charge_type = "PayByTraffic"
  # }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-workers"
    Role = "k8s-worker"
  })
  
  depends_on = [alicloud_cs_managed_kubernetes.m5_k8s]
}

# ─── 3. ACK 组件 (Addon) ───────────────────────────────────
# CSI 插件 (存储)
resource "alicloud_cs_kubernetes_addon" "csi_plugin" {
  cluster_id = alicloud_cs_managed_kubernetes.m5_k8s.id
  name       = "csi-plugin"
  version    = "v1.30.1-ack1"
  config     = jsonencode({
    region_id = var.region
  })
  
  depends_on = [alicloud_cs_kubernetes_node_pool.m5_workers]
}

# CSI 存储控制器
resource "alicloud_cs_kubernetes_addon" "csi_provisioner" {
  cluster_id = alicloud_cs_managed_kubernetes.m5_k8s.id
  name       = "csi-provisioner"
  version    = "v1.30.1-ack1"
  config     = jsonencode({
    region_id = var.region
  })
  
  depends_on = [alicloud_cs_kubernetes_addon.csi_plugin]
}

# Terway 网络插件
resource "alicloud_cs_kubernetes_addon" "terway" {
  cluster_id = alicloud_cs_managed_kubernetes.m5_k8s.id
  name       = "terway-eniip"
  version    = "v1.9.0-ack1"
  config     = jsonencode({
    terway_eniip_virtual_type = "Veth"
  })
  
  depends_on = [alicloud_cs_kubernetes_node_pool.m5_workers]
}

# ─── 4. 集群输出 ─────────────────────────────────────────────
output "ack_cluster_id" {
  value       = alicloud_cs_managed_kubernetes.m5_k8s.id
  description = "ACK 集群 ID"
}

output "ack_cluster_name" {
  value       = alicloud_cs_managed_kubernetes.m5_k8s.name
  description = "ACK 集群名称"
}

output "ack_endpoint" {
  value       = alicloud_cs_managed_kubernetes.m5_k8s.api_server_internet
  description = "ACK API Server 公网端点"
  sensitive   = true
}

output "ack_kubeconfig" {
  value       = alicloud_cs_managed_kubernetes.m5_k8s.kube_config
  description = "ACK KubeConfig"
  sensitive   = true
}

output "ack_worker_nodes" {
  value       = alicloud_cs_kubernetes_node_pool.m5_workers.nodes
  description = "ACK Worker 节点信息"
}

output "ack_node_pool_id" {
  value       = alicloud_cs_kubernetes_node_pool.m5_workers.node_pool_id
  description = "ACK 节点池 ID"
}
