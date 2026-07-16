# M5 Platform V17+V18 生产部署指南

> **部署方式**: 本地 Terraform 部署  
> **目标环境**: 阿里云 ACK 生产集群  
> **部署范围**: V17 (7模块) + V18 (6模块) = 13模块  
> **预计耗时**: 15-20分钟

---

## 📋 前置要求

### 1. 系统要求

| 项目 | 要求 |
|------|------|
| **操作系统** | macOS 12+ (Intel/Apple Silicon) |
| **磁盘空间** | 至少 2GB 可用空间 |
| **网络** | 可访问阿里云 (aliyun.com) |

### 2. 阿里云账号要求

- [x] 已注册阿里云账号
- [x] 已完成**实名认证**（个人或企业）
- [x] 账户余额 ≥ ¥100（用于部署费用）
- [x] 已开通**访问控制 (RAM)** 服务

### 3. 必须的工具

| 工具 | 版本要求 | 用途 |
|------|----------|------|
| **Terraform** | ≥ 1.5.0 | 基础设施即代码部署 |
| **aliyun CLI** | ≥ 3.0.0 | 阿里云命令行工具 |
| **jq** | ≥ 1.6 | JSON 处理工具 |
| **curl** | 系统自带 | 下载文件 |
| **unzip** | 系统自带 | 解压文件 |

---

## 🚀 快速开始

### 步骤 1: 安装必要工具 (约 3-5 分钟)

打开终端，执行以下命令：

```bash
# 1. 安装 Homebrew (如果还没有)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 aliyun CLI 和 jq
brew install aliyun-cli jq

# 3. 安装 Terraform (官方方式)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 4. 验证安装
terraform version
aliyun version
jq --version
```

**预期输出**：
```
Terraform v1.9.8
aliyun-cli 3.0.x
jq-1.7.x
```

---

### 步骤 2: 配置阿里云凭据 (约 2 分钟)

#### 方式 A: 使用 aliyun CLI 配置（推荐）

```bash
# 执行配置向导
aliyun configure

# 按提示输入：
# Access Key ID: 您的AccessKey ID
# Access Key Secret: 您的AccessKey Secret
# Default Region: cn-hangzhou
# Default Output: json
```

#### 方式 B: 使用环境变量

```bash
# 编辑 ~/.zshrc 或 ~/.bash_profile
export ALICLOUD_ACCESS_KEY="您的AccessKey ID"
export ALICLOUD_SECRET_KEY="您的AccessKey Secret"
export ALICLOUD_REGION="cn-hangzhou"

# 使配置生效
source ~/.zshrc
```

#### 验证配置

```bash
# 测试阿里云连接
aliyun sts GetCallerIdentity

# 预期输出：您的账号信息
```

---

### 步骤 3: 执行部署 (约 10-15 分钟)

```bash
# 1. 进入部署目录
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/terraform

# 2. 初始化 Terraform
terraform init

# 3. 预览部署计划（检查将要创建的资源）
terraform plan

# 4. 执行部署
terraform apply

# 5. 输入 yes 确认部署
```

**部署过程说明**：
```
⏳ 创建 VPC 网络              ~ 1-2 分钟
⏳ 创建 ACK 托管集群         ~ 5-8 分钟
⏳ 创建节点池                ~ 3-5 分钟
⏳ 配置网络组件              ~ 1-2 分钟
✅ 部署完成！
```

---

### 步骤 4: 验证部署 (约 2 分钟)

```bash
# 1. 配置 kubectl
export KUBECONFIG="~/.kube/m5-prod-config"
aliyun cs GET /k8s/[cluster-id]/user_config | jq -r '.config' > ~/.kube/m5-prod-config

# 2. 验证集群连接
kubectl cluster-info

# 预期输出：
# Kubernetes control plane is running at https://xxx
# CoreDNS is running at https://xxx

# 3. 查看节点状态
kubectl get nodes

# 预期输出：
# NAME                          STATUS   ROLES    AGE   VERSION
# cn-hangzhou.xxx   Ready    <none>   5m    v1.28.3

# 4. 查看系统 Pod
kubectl get pods -n kube-system

# 所有 Pod 状态应为 Running
```

---

## 📁 部署完成后

### 获取部署输出

```bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/terraform

# 查看所有输出
terraform output

# 查看特定输出
terraform output cluster_id
terraform output cluster_endpoint
terraform output vpc_id
```

### 保存 KubeConfig

```bash
# 获取集群访问配置
mkdir -p ~/.kube
terraform output -raw kubeconfig > ~/.kube/m5-prod-config

# 添加到环境变量（可选）
echo 'export KUBECONFIG=~/.kube/m5-prod-config' >> ~/.zshrc
source ~/.zshrc
```

---

## ⚠️ 常见问题

### Q1: terraform init 失败，提示 "provider not found"

**解决**：
```bash
terraform init -upgrade
```

### Q2: terraform apply 失败，提示 "Account not authorized"

**解决**：检查阿里云凭据配置
```bash
aliyun configure
# 重新输入 AccessKey ID 和 Secret
```

### Q3: 集群创建超时

**解决**：阿里云资源配额不足，联系阿里云客服提升配额

### Q4: kubectl 无法连接集群

**解决**：
```bash
# 重新获取 kubeconfig
aliyun cs GET /k8s/[cluster-id]/user_config | jq -r '.config' > ~/.kube/config

# 或从 Terraform 输出获取
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/terraform
terraform output -raw kubeconfig > ~/.kube/m5-prod-config
export KUBECONFIG=~/.kube/m5-prod-config
```

---

## 📞 获取帮助

如遇到问题，请收集以下信息：

```bash
# 1. Terraform 版本
terraform version

# 2. 阿里云 CLI 版本
aliyun version

# 3. 当前目录
pwd
ls -la

# 4. Terraform 状态
terraform state list

# 5. 最近的错误日志
terraform show
```

---

## ✅ 部署清单

完成部署后，请检查：

- [ ] Terraform 已安装
- [ ] aliyun CLI 已配置
- [ ] `terraform init` 成功
- [ ] `terraform apply` 成功
- [ ] ACK 集群状态为 **Running**
- [ ] 所有节点状态为 **Ready**
- [ ] KubeConfig 已保存
- [ ] `kubectl cluster-info` 成功

---

**🎉 恭喜！M5 Platform V17+V18 生产环境部署完成！**

下一步：Phase 2 - 数据库与缓存部署
