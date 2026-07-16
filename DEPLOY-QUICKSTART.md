# M5 Platform - 5分钟快速部署指南

> **适用对象**: 大飞哥  
> **预计时间**: 5分钟准备 + 15分钟部署  
> **目标**: 一键部署阿里云 ACK 生产集群

---

## ⚡ 超简流程 (只需3步)

### 第1步: 复制粘贴这4条命令 (2分钟)

打开你的 Mac 终端，复制粘贴下面全部内容：

```bash
# 1. 下载 Terraform
cd ~/Downloads
curl -LO https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_darwin_arm64.zip

# 2. 解压
unzip -o terraform_1.9.8_darwin_arm64.zip

# 3. 移动到可执行目录
mkdir -p ~/.local/bin
mv terraform ~/.local/bin/

# 4. 验证安装成功
export PATH="$HOME/.local/bin:$PATH"
terraform version
```

**预期看到**：
```
Terraform v1.9.8
on darwin_arm64
```

---

### 第2步: 配置阿里云 (1分钟)

```bash
# 设置环境变量（把 xxx 换成你的 AccessKey）
export ALICLOUD_ACCESS_KEY="你的AccessKey ID"
export ALICLOUD_SECRET_KEY="你的AccessKey Secret"
export ALICLOUD_REGION="cn-hangzhou"
export PATH="$HOME/.local/bin:$PATH"

# 验证配置
echo "AccessKey: ${ALICLOUD_ACCESS_KEY:0:6}..."
```

---

### 第3步: 一键部署 (15分钟)

```bash
# 进入项目目录
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/terraform

# 执行部署
export PATH="$HOME/.local/bin:$PATH"
export ALICLOUD_ACCESS_KEY="你的AccessKey ID"
export ALICLOUD_SECRET_KEY="你的AccessKey Secret"
export ALICLOUD_REGION="cn-hangzhou"
./deploy.sh
```

**然后**：
1. 看到提示时输入 `yes` 确认
2. 等待 10-15 分钟
3. 看到 `✅ 部署完成！` 就是成功了！

---

## ✅ 部署成功标志

你会看到类似这样的输出：

```
═══════════════════════════════════════════════════════════════════════
  Phase 1 部署完成!
═══════════════════════════════════════════════════════════════════════

[SUCCESS] 集群已创建: m5-prod-cluster
[INFO] 集群ID: c-xxxxxxxxx
[INFO] API Endpoint: https://xxx.kubernetes.aliyuncs.com
[INFO] 节点数量: 9 (2系统 + 4应用 + 3数据)

下一步: Phase 2 - 数据库与缓存部署
```

---

## 🆘 遇到问题怎么办？

### 问题1: "command not found: terraform"

**解决**：
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 问题2: "AccessKey invalid"

**解决**：检查 AccessKey 是否输错，重新设置环境变量

### 问题3: "terraform apply 卡住"

**解决**：这是正常的！创建 ACK 集群需要 10-15 分钟，耐心等待

### 问题4: 其他问题

**联系树哥**：把报错截图发给我，我帮您解决！

---

## 📋 部署完成后

### 验证集群

```bash
# 配置 kubectl
export KUBECONFIG=~/.kube/m5-prod-config

# 查看集群信息
kubectl cluster-info

# 查看节点
kubectl get nodes

# 查看系统 Pod
kubectl get pods -n kube-system
```

### 查看阿里云控制台

1. 登录 [阿里云控制台](https://www.aliyun.com)
2. 进入 **容器服务 ACK**
3. 看到 `m5-prod-cluster` 集群状态为 **运行中** ✓

---

## 🎉 恭喜！

您已成功部署 M5 Platform 生产环境的基础设施！

下一步：继续 Phase 2 - 数据库与缓存部署

---

**有问题随时联系树哥！** 🚀
