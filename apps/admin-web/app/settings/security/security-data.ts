export interface SecurityPolicyItem {
  key: string
  value: string
}

export interface SecurityChecklistItem {
  label: string
  enabled: boolean
}

export interface SecuritySnapshotDelivery {
  deliveryMode: 'mock'
  sourceLabel: 'local-security-policy-snapshot'
  passwordPolicies: SecurityPolicyItem[]
  loginProtections: SecurityPolicyItem[]
  complianceItems: SecurityChecklistItem[]
  generatedAt: string
}

export const defaultPasswordPolicies: SecurityPolicyItem[] = [
  { key: '最小密码长度', value: '8 位' },
  { key: '需包含大写字母', value: '是' },
  { key: '需包含小写字母', value: '是' },
  { key: '需包含数字', value: '是' },
  { key: '需包含特殊字符', value: '是' },
  { key: '密码有效期', value: '90 天' },
  { key: '禁止重复次数', value: '最近 5 次' },
]

export const defaultLoginProtections: SecurityPolicyItem[] = [
  { key: '最大登录尝试次数', value: '5 次' },
  { key: '锁定时间', value: '30 分钟' },
  { key: '二次验证', value: '支持短信/邮箱验证码' },
  { key: '异常登录告警', value: '启用' },
]

export const defaultComplianceItems: SecurityChecklistItem[] = [
  { label: '启用密码策略强制验证', enabled: true },
  { label: '登录失败次数限制', enabled: true },
  { label: '账户锁定自动解除', enabled: true },
  { label: 'IP 白名单（未配置）', enabled: false },
  { label: '操作审计日志记录', enabled: true },
]

export async function loadSecuritySnapshot(): Promise<SecuritySnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'local-security-policy-snapshot',
    passwordPolicies: defaultPasswordPolicies,
    loginProtections: defaultLoginProtections,
    complianceItems: defaultComplianceItems,
    generatedAt: new Date().toISOString(),
  }
}
