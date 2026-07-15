# ═══════════════════════════════════════════════════════════════
# M5 — ACK 存储类配置 (StorageClass)
# ═══════════════════════════════════════════════════════════════

# ─── 1. ESSD PL0 StorageClass ────────────────────────────────
resource "kubernetes_storage_class" "essd_pl0" {
  metadata {
    name = "alibabacloud-disk-topology-alltype"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }
  
  storage_provisioner = "diskplugin.csi.alibabacloud.com"
  reclaim_policy      = "Delete"
  volume_binding_mode = "WaitForFirstConsumer"
  
  parameters = {
    type               = "cloud_essd"
    regionId           = var.region
    encrypted          = "true"
    performanceLevel   = "PL0"
  }
  
  mount_options = [
    "debug"
  ]
  
  depends_on = [alicloud_cs_managed_kubernetes.m5_k8s]
}

# ─── 2. ESSD PL1 StorageClass (高性能) ───────────────────────
resource "kubernetes_storage_class" "essd_pl1" {
  metadata {
    name = "essd-pl1"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "false"
    }
  }
  
  storage_provisioner = "diskplugin.csi.alibabacloud.com"
  reclaim_policy      = "Delete"
  volume_binding_mode = "WaitForFirstConsumer"
  
  parameters = {
    type               = "cloud_essd"
    regionId           = var.region
    encrypted          = "true"
    performanceLevel   = "PL1"
  }
  
  depends_on = [alicloud_cs_managed_kubernetes.m5_k8s]
}

# ─── 3. ESSD PL3 StorageClass (超高性能) ─────────────────────
resource "kubernetes_storage_class" "essd_pl3" {
  metadata {
    name = "essd-pl3"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "false"
    }
  }
  
  storage_provisioner = "diskplugin.csi.alibabacloud.com"
  reclaim_policy      = "Delete"
  volume_binding_mode = "WaitForFirstConsumer"
  
  parameters = {
    type               = "cloud_essd"
    regionId           = var.region
    encrypted          = "true"
    performanceLevel   = "PL3"
  }
  
  depends_on = [alicloud_cs_managed_kubernetes.m5_k8s]
}

# ─── 4. NAS StorageClass (共享存储) ─────────────────────────
resource "kubernetes_storage_class" "nas" {
  metadata {
    name = "nas"
  }
  
  storage_provisioner = "nasplugin.csi.alibabacloud.com"
  reclaim_policy      = "Retain"
  volume_binding_mode = "Immediate"
  
  parameters = {
    server           = alicloud_nas_file_system.m5_nas.mount_targets[0].domain_name
    path             = "/"
    vers             = "3"
    options          = "nolock,tcp,noresvport"
  }
  
  depends_on = [
    alicloud_cs_managed_kubernetes.m5_k8s,
    alicloud_nas_file_system.m5_nas
  ]
}

# ─── 5. OSS StorageClass (对象存储) ─────────────────────────
resource "kubernetes_storage_class" "oss" {
  metadata {
    name = "oss"
  }
  
  storage_provisioner = "ossplugin.csi.alibabacloud.com"
  reclaim_policy      = "Retain"
  volume_binding_mode = "Immediate"
  
  parameters = {
    bucket            = alicloud_oss_bucket.m5_assets.id
    endpoint          = alicloud_oss_bucket.m5_assets.extranet_endpoint
    akId             = alicloud_ram_access_key.m5_oss.id
    akSecret         = alicloud_ram_access_key.m5_oss.secret
  }
  
  depends_on = [
    alicloud_cs_managed_kubernetes.m5_k8s,
    alicloud_oss_bucket.m5_assets
  ]
}

# ─── 6. NAS 文件系统 ────────────────────────────────────────
resource "alicloud_nas_file_system" "m5_nas" {
  protocol_type    = "NFS"
  storage_type    = "Performance"
  encrypt_type    = 1  # 加密
  file_system_type = "standard"
  
  description = "${var.project_name}-${var.environment}-nas"
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-nas"
    Role = "shared-storage"
  })
}

resource "alicloud_nas_mount_target" "m5_nas_mt" {
  file_system_id    = alicloud_nas_file_system.m5_nas.id
  access_group_name = alicloud_nas_access_group.m5_nas_ag.name
  vswitch_id        = module.vpc.vswitch_ids[0]
  security_group_id = alicloud_security_group.m5_sg.id
}

resource "alicloud_nas_access_group" "m5_nas_ag" {
  access_group_name = "${var.project_name}-${var.environment}-nas-ag"
  access_group_type = "Vpc"
}

resource "alicloud_nas_access_rule" "m5_nas_ar" {
  access_group_name = alicloud_nas_access_group.m5_nas_ag.name
  source_cidr_ip    = var.vpc_cidr
  rw_access_type    = "RDWR"
  user_access_type  = "no_squash"
  priority          = 1
}

# ─── 7. OSS RAM 访问密钥 ────────────────────────────────────
resource "alicloud_ram_user" "m5_oss" {
  name     = "${var.project_name}-${var.environment}-oss"
  comments = "OSS access for M5"
  force    = true
}

resource "alicloud_ram_access_key" "m5_oss" {
  user_name   = alicloud_ram_user.m5_oss.name
  secret_file = "/dev/null"
}

resource "alicloud_ram_policy" "m5_oss" {
  policy_name = "${var.project_name}-${var.environment}-oss"
  policy_document = jsonencode({
    Version = "1"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "oss:GetObject",
          "oss:PutObject",
          "oss:DeleteObject",
          "oss:ListObjects",
          "oss:ListParts",
          "oss:AbortMultipartUpload"
        ]
        Resource = [
          "acs:oss:*:*:${alicloud_oss_bucket.m5_assets.id}",
          "acs:oss:*:*:${alicloud_oss_bucket.m5_assets.id}/*"
        ]
      }
    ]
  })
}

resource "alicloud_ram_user_policy_attachment" "m5_oss" {
  policy_name = alicloud_ram_policy.m5_oss.policy_name
  policy_type = "Custom"
  user_name   = alicloud_ram_user.m5_oss.name
}
