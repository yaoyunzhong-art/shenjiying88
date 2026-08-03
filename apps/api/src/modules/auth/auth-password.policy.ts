// auth-password.policy.ts · 密码强度策略
// 安全基线扫描第6项(WARN)修复 — 2026-07-21
// 定义统一的密码强度验证规则

/**
 * 密码策略配置
 *
 * 最小密码长度:    8 位
 * 字符要求:
 *   - 至少 1 个小写字母 (a-z)
 *   - 至少 1 个大写字母 (A-Z)
 *   - 至少 1 个数字 (0-9)
 *   - 至少 1 个特殊字符 ( @#$%^&* )
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  specialChars: '@#$%^&*',
} as const

const SPECIAL_CHAR_PATTERN = new RegExp(
  `[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`,
)

/**
 * 验证密码是否符合密码强度策略
 *
 * @param password - 待验证的明文密码
 * @returns { valid: boolean; message: string }
 *   valid:   true 表示通过
 *   message: 不通过时的中文提示（前端可直接展示）
 */
export function validatePasswordPolicy(password: string): { valid: boolean; message: string } {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    return {
      valid: false,
      message: `密码长度不能少于 ${PASSWORD_POLICY.minLength} 位`,
    }
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    return {
      valid: false,
      message: `密码长度不能超过 ${PASSWORD_POLICY.maxLength} 位`,
    }
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      message: '密码必须包含至少 1 个小写字母 (a-z)',
    }
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: '密码必须包含至少 1 个大写字母 (A-Z)',
    }
  }

  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) {
    return {
      valid: false,
      message: '密码必须包含至少 1 个数字 (0-9)',
    }
  }

  if (PASSWORD_POLICY.requireSpecialChar && !SPECIAL_CHAR_PATTERN.test(password)) {
    return {
      valid: false,
      message: `密码必须包含至少 1 个特殊字符 (${PASSWORD_POLICY.specialChars})`,
    }
  }

  return {
    valid: true,
    message: '✓ 密码强度符合策略要求',
  }
}

/**
 * SSO 配置占位
 *
 * todo: 生产环境替换为真实 SSO 配置
 *
 * 预期支持的 SSO 协议:
 *   - OAuth 2.0 / OIDC — 微信、Google、GitHub 等第三方登录
 *   - SAML 2.0         — 企业级 IdP 接入 (Azure AD / Okta)
 *
 * 配置示例 (待填充):
 * ```ts
 * export const ssoConfig = {
 *   oidc: {
 *     issuer:       process.env.SSO_OIDC_ISSUER,
 *     clientId:     process.env.SSO_OIDC_CLIENT_ID,
 *     clientSecret: process.env.SSO_OIDC_CLIENT_SECRET,
 *   },
 *   saml: {
 *     entryPoint:   process.env.SSO_SAML_ENTRY_POINT,
 *     cert:         process.env.SSO_SAML_CERT,
 *   },
 * }
 * ```
 */
export const SSO_CONFIG_PLACEHOLDER = {
  enabled: false,
  providers: [] as string[],
  note: '生产环境替换为真实 SSO 配置',
} as const
