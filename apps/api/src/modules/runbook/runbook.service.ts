// runbook.service.ts - T129-4 运维手册 - 部署/扩容/故障/灾备
import { randomUUID } from 'node:crypto'

// ── 类型定义 ─────────────────────────────────────────────────────────────────

export type RunbookCategory = 'deployment' | 'scaling' | '故障排查' | '灾难恢复' | '安全事件' | '监控告警'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type RunbookStatus = 'draft' | 'active' | 'archived'

export interface RunbookStep {
  stepNumber: number
  title: string
  description: string
  command?: string
  expectedOutput?: string
  verificationCommand?: string
  rollbackCommand?: string
  estimatedMinutes?: number
  warningMessage?: string
}

export interface Runbook {
  id: string
  title: string
  category: RunbookCategory
  severity: Severity
  applicableVersions: string[]
  prerequisites: string[]
  steps: RunbookStep[]
  estimatedTotalMinutes: number
  relatedAlerts?: string[]
  relatedRunbooks?: string[]
  status: RunbookStatus
  createdAt: Date
  updatedAt: Date
  lastTestedAt?: Date
  tags: string[]
}

export interface AlertMapping {
  alertName: string
  severity: Severity
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}

// ── 预设 Runbook 数据 ────────────────────────────────────────────────────────

const PRESET_RUNBOOKS: Runbook[] = [
  // ── 部署类 ────────────────────────────────────────────────────────────────
  {
    id: 'deploy-api-single',
    title: '单机部署 API 服务（Ubuntu/Nginx/MySQL/Redis）',
    category: 'deployment',
    severity: 'high',
    applicableVersions: ['v2.0.0+'],
    prerequisites: ['Ubuntu 22.04 服务器', 'root 权限', 'Docker 已安装', '域名已备案'],
    steps: [
      { stepNumber: 1, title: '环境检查', description: '检查服务器环境和依赖', command: 'cat /etc/os-release && docker --version', estimatedMinutes: 2 },
      { stepNumber: 2, title: '配置域名解析', description: '配置 Nginx 域名和 SSL 证书', command: 'systemctl restart nginx', warningMessage: '确保 SSL 证书在有效期内' },
      { stepNumber: 3, title: '部署 MySQL', description: '启动 MySQL 容器并配置数据库', command: 'docker run -d -p 3306:3306 mysql:8', estimatedMinutes: 5 },
      { stepNumber: 4, title: '部署 Redis', description: '启动 Redis 容器', command: 'docker run -d -p 6379:6379 redis:7', estimatedMinutes: 2 },
      { stepNumber: 5, title: '部署 API', description: '构建并启动 API 服务', command: 'docker-compose up -d', estimatedMinutes: 10, rollbackCommand: 'docker-compose down' },
      { stepNumber: 6, title: '健康检查', description: '验证服务是否正常', command: 'curl -f http://localhost:3000/health', expectedOutput: '{"status":"ok"}' },
    ],
    estimatedTotalMinutes: 20,
    relatedAlerts: ['ALERT_service_down'],
    relatedRunbooks: ['deploy-frontend'],
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
    lastTestedAt: new Date('2024-06-01'),
    tags: ['部署', 'API', '单机', 'Docker'],
  },
  {
    id: 'deploy-k8s',
    title: 'K8s 部署（Helm Chart/滚动更新/回滚）',
    category: 'deployment',
    severity: 'critical',
    applicableVersions: ['v2.1.0+'],
    prerequisites: ['K8s 集群已就绪', 'kubectl 已配置', 'Helm 3 已安装', '镜像已推送至registry'],
    steps: [
      { stepNumber: 1, title: '添加 Helm 仓库', description: '添加并更新 Helm 仓库', command: 'helm repo add shenjiying https://charts.shenjiying.com && helm repo update', estimatedMinutes: 3 },
      { stepNumber: 2, title: '创建 Namespace', description: '创建专用命名空间', command: 'kubectl create namespace shenjiying', estimatedMinutes: 1 },
      { stepNumber: 3, title: '配置 values', description: '编辑自定义配置 values.yaml', command: 'helm show values shenjiying/api', estimatedMinutes: 5, warningMessage: '确保副本数和资源限制合理' },
      { stepNumber: 4, title: '执行部署', description: '执行 Helm 安装', command: 'helm install shenjiying-api shenjiying/api -n shenjiying -f values.yaml', estimatedMinutes: 10, rollbackCommand: 'helm rollback shenjiying-api -n shenjiying' },
      { stepNumber: 5, title: '检查 Pod 状态', description: '确认所有 Pod 运行正常', command: 'kubectl get pods -n shenjiying', expectedOutput: 'Running' },
      { stepNumber: 6, title: '滚动更新', description: '执行滚动更新部署新版本', command: 'helm upgrade shenjiying-api shenjiying/api -n shenjiying -f values.yaml --set image.tag=v2.2.0', estimatedMinutes: 15 },
    ],
    estimatedTotalMinutes: 35,
    relatedAlerts: ['ALERT_k8s_pod_crash', 'ALERT_k8s_cpu_high'],
    relatedRunbooks: ['deploy-api-single', 'dr-database-failover'],
    status: 'active',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-15'),
    lastTestedAt: new Date('2024-06-15'),
    tags: ['部署', 'Kubernetes', 'Helm', '滚动更新'],
  },
  {
    id: 'deploy-frontend',
    title: '前台部署（Nginx/CDN 配置）',
    category: 'deployment',
    severity: 'medium',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['构建产物已就绪', 'CDN 账号已开通', '域名已配置'],
    steps: [
      { stepNumber: 1, title: '构建前端', description: '执行生产环境构建', command: 'npm run build', estimatedMinutes: 5 },
      { stepNumber: 2, title: '上传 CDN', description: '上传静态资源至 CDN', command: 'ossutil cp -r dist/ oss://shenjiying-cdn/', estimatedMinutes: 10 },
      { stepNumber: 3, title: '配置缓存', description: '设置 CDN 缓存策略', command: 'ossutil set-cache-control public,max-age=31536000', warningMessage: '注意区分静态资源和 API 请求' },
      { stepNumber: 4, title: '验证部署', description: '访问前台确认部署成功', command: 'curl -I https://www.shenjiying.com', expectedOutput: '200 OK' },
    ],
    estimatedTotalMinutes: 20,
    relatedAlerts: ['ALERT_cdn_5xx'],
    status: 'active',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-05-10'),
    tags: ['部署', '前端', 'CDN', 'Nginx'],
  },

  // ── 扩容类 ────────────────────────────────────────────────────────────────
  {
    id: 'scale-k8s-hpa',
    title: 'K8s HPA 自动扩容',
    category: 'scaling',
    severity: 'high',
    applicableVersions: ['v2.1.0+'],
    prerequisites: ['Metrics Server 已部署', 'HPA 已配置'],
    steps: [
      { stepNumber: 1, title: '检查 Metrics Server', description: '确认 Metrics Server 正常运行', command: 'kubectl get pods -n kube-system -l k8s-app=metrics-server', estimatedMinutes: 2 },
      { stepNumber: 2, title: '查看当前 HPA', description: '查看现有 HPA 配置', command: 'kubectl get hpa -n shenjiying', estimatedMinutes: 1 },
      { stepNumber: 3, title: '调整 HPA 参数', description: '修改 HPA 副本数范围和阈值', command: 'kubectl patch hpa shenjiying-api -n shenjiying -p \'{"spec":{"minReplicas":3,"maxReplicas":10}}\'', estimatedMinutes: 2 },
      { stepNumber: 4, title: '手动触发扩容', description: '使用 kubectl scale 手动调整', command: 'kubectl scale deployment shenjiying-api -n shenjiying --replicas=5', estimatedMinutes: 3 },
      { stepNumber: 5, title: '观察扩容', description: '监控扩容过程', command: 'kubectl get hpa -n shenjiying -w', estimatedMinutes: 5 },
    ],
    estimatedTotalMinutes: 15,
    relatedAlerts: ['ALERT_cpu_high', 'ALERT_memory_high'],
    relatedRunbooks: ['deploy-k8s'],
    status: 'active',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-06-01'),
    tags: ['扩容', 'Kubernetes', 'HPA', '自动扩容'],
  },
  {
    id: 'scale-manual',
    title: '手动扩容流程',
    category: 'scaling',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['目标服务器已准备', '负载均衡已配置'],
    steps: [
      { stepNumber: 1, title: '评估容量', description: '分析当前负载和扩容需求', command: 'kubectl top nodes', estimatedMinutes: 5, warningMessage: '确保新节点有足够资源' },
      { stepNumber: 2, title: '准备新节点', description: '在新服务器上安装必要组件', command: 'dockerd &', estimatedMinutes: 15 },
      { stepNumber: 3, title: '加入集群', description: '将新节点加入 K8s 集群', command: 'kubeadm join', estimatedMinutes: 10 },
      { stepNumber: 4, title: '验证节点', description: '确认新节点状态正常', command: 'kubectl get nodes', expectedOutput: 'Ready' },
      { stepNumber: 5, title: '更新负载均衡', description: '将新节点加入负载均衡池', command: 'vim /etc/nginx/upstream.conf', estimatedMinutes: 5 },
    ],
    estimatedTotalMinutes: 40,
    relatedAlerts: ['ALERT_cpu_high'],
    status: 'active',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-04-20'),
    tags: ['扩容', '手动', '负载均衡'],
  },

  // ── 故障排查类 ────────────────────────────────────────────────────────────
  {
    id: 'troubleshoot-slow-api',
    title: 'API 响应慢排查（数据库/缓存/连接池）',
    category: '故障排查',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Kubectl 访问权限', '监控大盘访问权限'],
    steps: [
      { stepNumber: 1, title: '检查 API 日志', description: '查看 API 服务日志', command: 'kubectl logs -l app=api -n shenjiying --tail=100', estimatedMinutes: 3 },
      { stepNumber: 2, title: '检查数据库慢查询', description: '查询 MySQL 慢查询日志', command: 'SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;', estimatedMinutes: 5, warningMessage: '注意不要在高峰期执行 SHOW PROCESSLIST' },
      { stepNumber: 3, title: '检查 Redis 缓存', description: '查看 Redis 命中率', command: 'redis-cli info stats | grep hit_rate', estimatedMinutes: 2 },
      { stepNumber: 4, title: '检查连接池', description: '查看数据库连接池状态', command: 'curl http://localhost:3000/metrics | grep db_pool', estimatedMinutes: 2 },
      { stepNumber: 5, title: '分析索引', description: '检查慢查询涉及的表索引', command: 'EXPLAIN SELECT ...', estimatedMinutes: 10 },
      { stepNumber: 6, title: '优化或回滚', description: '根据分析结果优化或回滚版本', command: 'helm rollback shenjiying-api -n shenjiying', estimatedMinutes: 5, rollbackCommand: 'helm upgrade shenjiying-api -n shenjiying' },
    ],
    estimatedTotalMinutes: 30,
    relatedAlerts: ['ALERT_db_slow_query', 'ALERT_api_latency_high'],
    relatedRunbooks: ['troubleshoot-high-error-rate'],
    status: 'active',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-06-20'),
    lastTestedAt: new Date('2024-06-20'),
    tags: ['故障排查', 'API', '数据库', '性能'],
  },
  {
    id: 'troubleshoot-high-error-rate',
    title: '错误率飙升排查',
    category: '故障排查',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['日志系统访问权限', '告警通知权限'],
    steps: [
      { stepNumber: 1, title: '查看告警', description: '检查告警详情和错误类型', command: 'kubectl get events -n shenjiying --sort-by=.lastTimestamp', estimatedMinutes: 2 },
      { stepNumber: 2, title: '检查错误日志', description: '搜索最近的错误日志', command: 'kubectl logs -l app=api -n shenjiying | grep ERROR', estimatedMinutes: 3 },
      { stepNumber: 3, title: '检查外部依赖', description: '验证数据库和缓存连接', command: 'kubectl exec -it api-pod -n shenjiying -- ping redis', estimatedMinutes: 5 },
      { stepNumber: 4, title: '检查资源', description: '查看 CPU 和内存使用率', command: 'kubectl top pods -n shenjiying', estimatedMinutes: 2 },
      { stepNumber: 5, title: '触发告警通知', description: '必要时升级告警', command: 'curl -X POST http://alertmanager/webhook -d \'{"status":"critical"}\'', estimatedMinutes: 2, warningMessage: '确认为真实故障后再升级' },
    ],
    estimatedTotalMinutes: 15,
    relatedAlerts: ['ALERT_error_rate_high', 'ALERT_5xx_error'],
    relatedRunbooks: ['troubleshoot-slow-api', 'troubleshoot-oom'],
    status: 'active',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-06-18'),
    lastTestedAt: new Date('2024-06-18'),
    tags: ['故障排查', '错误率', '告警'],
  },
  {
    id: 'troubleshoot-oom',
    title: '内存溢出排查',
    category: '故障排查',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Pod 日志访问权限', 'Heapprof 分析工具'],
    steps: [
      { stepNumber: 1, title: '检查 Pod 状态', description: '查看 OOM 的 Pod', command: 'kubectl get pods -n shenjiying | grep OOMKilled', estimatedMinutes: 2 },
      { stepNumber: 2, title: '查看资源限制', description: '检查 Pod 的内存限制', command: 'kubectl get pod api-pod -n shenjiying -o jsonpath=\'{$.spec.containers[0].resources}\'', estimatedMinutes: 2 },
      { stepNumber: 3, title: '分析堆内存', description: '生成堆内存快照分析', command: 'kubectl exec -it api-pod -n shenjiying -- node --inspect heapdump.js', estimatedMinutes: 10, warningMessage: '生产环境谨慎使用' },
      { stepNumber: 4, title: '调整内存限制', description: '根据分析结果调整内存限制', command: 'kubectl patch deployment api -n shenjiying -p \'{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"2Gi"}}} ]}}}}\'', estimatedMinutes: 5 },
      { stepNumber: 5, title: '重启 Pod', description: '重启 Pod 应用新配置', command: 'kubectl rollout restart deployment api -n shenjiying', estimatedMinutes: 3 },
    ],
    estimatedTotalMinutes: 25,
    relatedAlerts: ['ALERT_oom_killed', 'ALERT_memory_high'],
    relatedRunbooks: ['troubleshoot-high-error-rate'],
    status: 'active',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-05-15'),
    tags: ['故障排查', 'OOM', '内存'],
  },

  // ── 灾难恢复类 ────────────────────────────────────────────────────────────
  {
    id: 'dr-database-failover',
    title: '数据库主从切换',
    category: '灾难恢复',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['数据库主从架构已配置', 'VIP 漂移已设置'],
    steps: [
      { stepNumber: 1, title: '检查主库状态', description: '确认主库是否真的故障', command: 'mysql -h primary -e "SELECT 1"', estimatedMinutes: 2, warningMessage: '确认为真实故障再切换' },
      { stepNumber: 2, title: '检查从库同步', description: '查看从库 Relay Log 应用情况', command: 'mysql -h replica -e "SHOW SLAVE STATUS\\G"', estimatedMinutes: 3 },
      { stepNumber: 3, title: '提升从库', description: '将从库提升为新的主库', command: 'mysql -h replica -e "STOP SLAVE; RESET MASTER; FAILOVER;"', estimatedMinutes: 5, rollbackCommand: 'mysql -h new-primary -e "SET GLOBAL read_only=1"' },
      { stepNumber: 4, title: '更新连接串', description: '修改应用数据库连接字符串', command: 'kubectl patch configmap api-config -n shenjiying -p \'{"data":{"DB_HOST":"replica"}}\'', estimatedMinutes: 3 },
      { stepNumber: 5, title: '重启应用', description: '重启应用使配置生效', command: 'kubectl rollout restart deployment api -n shenjiying', estimatedMinutes: 5 },
      { stepNumber: 6, title: '验证写入', description: '确认数据库写入正常', command: 'mysql -h replica -e "CREATE TABLE IF NOT EXISTS health_check (id INT);"', estimatedMinutes: 2 },
    ],
    estimatedTotalMinutes: 20,
    relatedAlerts: ['ALERT_db_down', 'ALERT_db_replication_lag'],
    relatedRunbooks: ['dr-full-data-loss'],
    status: 'active',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-06-10'),
    lastTestedAt: new Date('2024-06-10'),
    tags: ['灾难恢复', '数据库', '主从切换'],
  },
  {
    id: 'dr-full-data-loss',
    title: '数据全量恢复流程',
    category: '灾难恢复',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['备份文件可用', '恢复环境已准备'],
    steps: [
      { stepNumber: 1, title: '停止写入', description: '暂停所有写入操作', command: 'kubectl scale deployment api -n shenjiying --replicas=0', estimatedMinutes: 2, warningMessage: '确保已通知相关方' },
      { stepNumber: 2, title: '检查备份', description: '列出可用备份', command: 'aws s3 ls s3://shenjiying-backup/db/', estimatedMinutes: 3 },
      { stepNumber: 3, title: '下载备份', description: '下载最新全量备份', command: 'aws s3 cp s3://shenjiying-backup/db/full-backup-20240620.sql.gz .', estimatedMinutes: 30 },
      { stepNumber: 4, title: '恢复数据', description: '执行数据恢复', command: 'zcat full-backup-20240620.sql.gz | mysql -h db shenjiying', estimatedMinutes: 60, rollbackCommand: 'mysql -h db -e "DROP DATABASE shenjiying"' },
      { stepNumber: 5, title: '恢复增量', description: '如有增量备份，恢复到最新状态', command: 'zcat inc-backup-2024062012.sql.gz | mysql -h db shenjiying', estimatedMinutes: 30 },
      { stepNumber: 6, title: '验证数据', description: '核对数据完整性', command: 'mysql -h db shenjiying -e "SELECT COUNT(*) FROM orders"', estimatedMinutes: 5 },
      { stepNumber: 7, title: '恢复服务', description: '恢复 API 服务', command: 'kubectl scale deployment api -n shenjiying --replicas=3', estimatedMinutes: 5 },
    ],
    estimatedTotalMinutes: 135,
    relatedAlerts: ['ALERT_db_down', 'ALERT_backup_failed'],
    relatedRunbooks: ['dr-database-failover'],
    status: 'active',
    createdAt: new Date('2024-01-26'),
    updatedAt: new Date('2024-06-20'),
    tags: ['灾难恢复', '备份', '数据恢复'],
  },

  // ── 安全事件类 ────────────────────────────────────────────────────────────
  {
    id: 'security-sql-injection',
    title: 'SQL 注入检测与隔离',
    category: '安全事件',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['WAF 已部署', '数据库审计日志已开启'],
    steps: [
      { stepNumber: 1, title: '检测注入', description: '检查 WAF 日志和数据库审计日志', command: 'grep -E "UNION|SELECT|OR 1=1" /var/log/nginx/waf.log', estimatedMinutes: 5, warningMessage: '勿删除日志，作为证据保留' },
      { stepNumber: 2, title: '定位攻击源', description: '分析攻击来源 IP', command: 'grep "1.2.3.4" /var/log/nginx/access.log | tail -100', estimatedMinutes: 3 },
      { stepNumber: 3, title: '临时封禁 IP', description: '在 WAF 上封禁恶意 IP', command: 'iptables -A INPUT -s 1.2.3.4 -j DROP', estimatedMinutes: 2 },
      { stepNumber: 4, title: '检查数据泄露', description: '检查是否有敏感数据被提取', command: 'mysql -h db -e "SELECT * FROM access_log WHERE ip=\'1.2.3.4\'"', estimatedMinutes: 10 },
      { stepNumber: 5, title: '修复漏洞', description: '定位并修复注入点', command: 'grep -n "request.sql" src/handlers/', estimatedMinutes: 30 },
      { stepNumber: 6, title: '隔离受影响系统', description: '必要时隔离整个系统', command: 'kubectl scale deployment api -n shenjiying --replicas=0', estimatedMinutes: 5 },
    ],
    estimatedTotalMinutes: 55,
    relatedAlerts: ['ALERT_waf_blocked', 'ALERT_sql_injection'],
    relatedRunbooks: ['security-data-breach'],
    status: 'active',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-05-20'),
    tags: ['安全', 'SQL注入', '应急响应'],
  },
  {
    id: 'security-data-breach',
    title: '数据泄露应急响应',
    category: '安全事件',
    severity: 'critical',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['应急响应团队已组建', '取证环境已准备'],
    steps: [
      { stepNumber: 1, title: '确认泄露', description: '确认数据泄露的范围和影响', command: 'grep "sensitive_data" /var/log/audit/audit.log', estimatedMinutes: 5, warningMessage: '保持现场，不要修改任何系统' },
      { stepNumber: 2, title: '隔离系统', description: '立即隔离受影响系统', command: 'kubectl delete deployment api -n shenjiying', estimatedMinutes: 3, rollbackCommand: 'helm rollback shenjiying-api -n shenjiying' },
      { stepNumber: 3, title: '保存证据', description: '备份日志和系统状态用于取证', command: 'tar -czf forensic-$(date +%Y%m%d).tar.gz /var/log/', estimatedMinutes: 15 },
      { stepNumber: 4, title: '评估影响', description: '评估泄露的数据类型和数量', command: 'mysql -h db -e "SELECT COUNT(*) FROM user_data WHERE leaked=true"', estimatedMinutes: 10 },
      { stepNumber: 5, title: '通知相关方', description: '按照法规要求通知受影响的用户', command: 'echo "通知模板" | mail -s "安全通知" users@example.com', estimatedMinutes: 30 },
      { stepNumber: 6, title: '修复漏洞', description: '修复导致泄露的漏洞', command: 'git bisect start && git bisect bad', estimatedMinutes: 60 },
      { stepNumber: 7, title: '恢复服务', description: '在确认安全后恢复服务', command: 'helm install shenjiying-api -n shenjiying', estimatedMinutes: 30 },
    ],
    estimatedTotalMinutes: 150,
    relatedAlerts: ['ALERT_data_breach', 'ALERT_unauthorized_access'],
    relatedRunbooks: ['security-sql-injection'],
    status: 'active',
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-06-01'),
    tags: ['安全', '数据泄露', '应急响应', '合规'],
  },

  // ── 监控告警类 ────────────────────────────────────────────────────────────
  {
    id: 'monitor-setup-prometheus',
    title: 'Prometheus 告警配置',
    category: '监控告警',
    severity: 'medium',
    applicableVersions: ['v2.0.0+'],
    prerequisites: ['Prometheus 已部署', 'Alertmanager 已配置'],
    steps: [
      { stepNumber: 1, title: '创建告警规则', description: '编写 Prometheus 告警规则文件', command: 'vim /etc/prometheus/rules/api-alerts.yml', estimatedMinutes: 10, warningMessage: '阈值设置需基于历史数据调整' },
      { stepNumber: 2, title: '验证规则语法', description: '检查告警规则语法', command: 'promtool check rules /etc/prometheus/rules/api-alerts.yml', estimatedMinutes: 3 },
      { stepNumber: 3, title: '热加载配置', description: '通知 Prometheus 热加载规则', command: 'curl -X POST http://prometheus:9090/-/reload', estimatedMinutes: 2 },
      { stepNumber: 4, title: '测试告警', description: '手动触发告警测试', command: 'curl -X POST http://alertmanager/-/api/v1/alerts -d \'[{"labels":{"alertname":"TestAlert"}}]\'', estimatedMinutes: 5 },
      { stepNumber: 5, title: '配置路由规则', description: '配置 Alertmanager 告警路由', command: 'vim /etc/alertmanager/config.yml', estimatedMinutes: 10 },
      { stepNumber: 6, title: '验证告警', description: '确认告警能正常发送', command: 'curl http://alertmanager:9093/api/v1/alerts', estimatedMinutes: 3 },
    ],
    estimatedTotalMinutes: 35,
    relatedAlerts: ['ALERT_cpu_high', 'ALERT_memory_high', 'ALERT_disk_full'],
    status: 'active',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-06-05'),
    tags: ['监控', 'Prometheus', '告警', '配置'],
  },
]

// ── 预设告警映射 ────────────────────────────────────────────────────────────

const PRESET_ALERT_MAPPINGS: AlertMapping[] = [
  {
    alertName: 'ALERT_cpu_high',
    severity: 'high',
    possibleCauses: ['流量突增', '内存泄漏导致 CPU 占用升高', '定时任务同时执行'],
    runbookId: 'troubleshoot-high-error-rate',
    autoAction: 'scale-k8s-hpa',
  },
  {
    alertName: 'ALERT_db_slow_query',
    severity: 'high',
    possibleCauses: ['缺少索引', '查询语句效率低', '数据库负载过高'],
    runbookId: 'troubleshoot-slow-api',
    autoAction: 'kill-slow-queries',
  },
  {
    alertName: 'ALERT_payment_failed',
    severity: 'critical',
    possibleCauses: ['支付渠道服务不可用', '接口超时', '签名验证失败'],
    runbookId: 'troubleshoot-payment',
    autoAction: 'failover-payment-gateway',
  },
]

// ── RunbookService ───────────────────────────────────────────────────────────

export class RunbookService {
  private readonly runbooks = new Map<string, Runbook>()
  private readonly alertMappings = new Map<string, AlertMapping>()

  constructor() {
    // 初始化预设 Runbook
    for (const runbook of PRESET_RUNBOOKS) {
      this.runbooks.set(runbook.id, { ...runbook })
    }

    // 初始化预设告警映射
    for (const mapping of PRESET_ALERT_MAPPINGS) {
      this.alertMappings.set(mapping.alertName, { ...mapping })
    }
  }

  // ── Runbook 管理 ─────────────────────────────────────────────────────────

  /** 创建 Runbook */
  create(runbook: Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>): Runbook {
    const now = new Date()
    const newRunbook: Runbook = {
      ...runbook,
      id: `runbook-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    }
    this.runbooks.set(newRunbook.id, newRunbook)
    return newRunbook
  }

  /** 获取 Runbook */
  get(id: string): Runbook | null {
    return this.runbooks.get(id) ?? null
  }

  /** 列出所有 Runbook（支持分类筛选）*/
  list(filter?: {
    category?: RunbookCategory
    severity?: Severity
    status?: RunbookStatus
    tag?: string
  }): Runbook[] {
    let result = Array.from(this.runbooks.values())

    if (filter?.category) {
      result = result.filter((r) => r.category === filter.category)
    }
    if (filter?.severity) {
      result = result.filter((r) => r.severity === filter.severity)
    }
    if (filter?.status) {
      result = result.filter((r) => r.status === filter.status)
    }
    if (filter?.tag) {
      result = result.filter((r) => r.tags.includes(filter.tag!))
    }

    return result
  }

  /** 更新 Runbook */
  update(id: string, updates: Partial<Runbook>): Runbook {
    const existing = this.runbooks.get(id)
    if (!existing) {
      throw new Error(`Runbook not found: ${id}`)
    }

    const updated: Runbook = {
      ...existing,
      ...updates,
      id: existing.id, // 不可修改
      createdAt: existing.createdAt, // 不可修改
      updatedAt: new Date(),
    }
    this.runbooks.set(id, updated)
    return updated
  }

  /** 删除 Runbook */
  delete(id: string): void {
    if (!this.runbooks.has(id)) {
      throw new Error(`Runbook not found: ${id}`)
    }
    this.runbooks.delete(id)
  }

  // ── 告警映射 ─────────────────────────────────────────────────────────────

  /** 绑定告警到 Runbook */
  mapAlert(
    alertName: string,
    runbookId: string,
    possibleCauses: string[],
    severity: Severity,
    autoAction?: string,
  ): AlertMapping {
    const mapping: AlertMapping = {
      alertName,
      runbookId,
      possibleCauses,
      severity,
      autoAction,
    }
    this.alertMappings.set(alertName, mapping)
    return mapping
  }

  /** 根据告警查找 Runbook */
  findByAlert(alertName: string): AlertMapping | null {
    return this.alertMappings.get(alertName) ?? null
  }

  // ── 执行辅助 ─────────────────────────────────────────────────────────────

  /** 生成执行报告（Markdown）*/
  generateExecutionReport(
    runbookId: string,
    executionLog: {
      step: number
      startedAt: Date
      completedAt?: Date
      success?: boolean
      output?: string
      error?: string
    }[],
  ): string {
    const runbook = this.runbooks.get(runbookId)
    if (!runbook) {
      throw new Error(`Runbook not found: ${runbookId}`)
    }

    const lines: string[] = []
    lines.push(`# Runbook 执行报告`)
    lines.push('')
    lines.push(`**Runbook**: ${runbook.title}`)
    lines.push(`**执行时间**: ${new Date().toISOString()}`)
    lines.push(`**总计步骤**: ${runbook.steps.length}`)
    lines.push('')
    lines.push('---')
    lines.push('')

    let successCount = 0
    let failCount = 0

    for (const log of executionLog) {
      const step = runbook.steps.find((s) => s.stepNumber === log.step)
      if (!step) continue

      const status = log.success ? '✅ 成功' : log.error ? '❌ 失败' : '⏳ 进行中'
      lines.push(`## 步骤 ${log.step}: ${step.title}`)
      lines.push('')
      lines.push(`**状态**: ${status}`)
      lines.push(`**开始时间**: ${log.startedAt.toISOString()}`)
      if (log.completedAt) {
        const duration = Math.round(
          (log.completedAt.getTime() - log.startedAt.getTime()) / 1000 / 60,
        )
        lines.push(`**耗时**: ${duration} 分钟`)
      }
      if (log.output) {
        lines.push('')
        lines.push('**输出**:')
        lines.push('```')
        lines.push(log.output)
        lines.push('```')
      }
      if (log.error) {
        lines.push('')
        lines.push('**错误**:')
        lines.push('```')
        lines.push(log.error)
        lines.push('```')
      }
      lines.push('')

      if (log.success) successCount++
      else if (log.error) failCount++
    }

    lines.push('---')
    lines.push('')
    lines.push('## 执行摘要')
    lines.push('')
    lines.push(`- **成功**: ${successCount}`)
    lines.push(`- **失败**: ${failCount}`)
    lines.push(`- **进行中**: ${executionLog.length - successCount - failCount}`)
    lines.push('')

    return lines.join('\n')
  }

  /** 获取关键步骤列表（执行前预览）*/
  getCriticalSteps(runbookId: string): RunbookStep[] {
    const runbook = this.runbooks.get(runbookId)
    if (!runbook) {
      throw new Error(`Runbook not found: ${runbookId}`)
    }

    // 关键步骤定义：包含 rollbackCommand 或 warningMessage 的步骤
    return runbook.steps.filter(
      (step) => step.rollbackCommand || step.warningMessage,
    )
  }

  /** 验证 Runbook 是否可执行 */
  validate(
    runbookId: string,
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const runbook = this.runbooks.get(runbookId)
    const errors: string[] = []
    const warnings: string[] = []

    if (!runbook) {
      errors.push(`Runbook not found: ${runbookId}`)
      return { valid: false, errors, warnings }
    }

    if (!runbook.title) {
      errors.push('标题不能为空')
    }

    if (runbook.steps.length === 0) {
      errors.push('必须包含至少一个步骤')
    }

    for (const step of runbook.steps) {
      if (!step.title) {
        errors.push(`步骤 ${step.stepNumber} 缺少标题`)
      }
      if (!step.description) {
        warnings.push(`步骤 ${step.stepNumber} 缺少描述`)
      }
      if (!step.command && !step.description) {
        warnings.push(`步骤 ${step.stepNumber} 既没有命令也没有描述`)
      }
    }

    if (runbook.prerequisites.length === 0) {
      warnings.push('缺少前置条件说明')
    }

    if (!runbook.lastTestedAt) {
      warnings.push('Runbook 尚未测试过')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // ── 搜索 ─────────────────────────────────────────────────────────────────

  /** 搜索 Runbook */
  search(keyword: string): Runbook[] {
    const lowerKeyword = keyword.toLowerCase()
    const results: Runbook[] = []

    for (const runbook of this.runbooks.values()) {
      // 搜索标题
      if (runbook.title.toLowerCase().includes(lowerKeyword)) {
        results.push(runbook)
        continue
      }

      // 搜索标签
      if (runbook.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))) {
        results.push(runbook)
        continue
      }

      // 搜索步骤描述
      if (
        runbook.steps.some(
          (step) =>
            step.title.toLowerCase().includes(lowerKeyword) ||
            step.description.toLowerCase().includes(lowerKeyword),
        )
      ) {
        results.push(runbook)
        continue
      }

      // 搜索前置条件
      if (
        runbook.prerequisites.some((p) => p.toLowerCase().includes(lowerKeyword))
      ) {
        results.push(runbook)
        continue
      }
    }

    return results
  }
}
