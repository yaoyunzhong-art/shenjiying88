/**
 * enterprise-validators.ts
 *
 * 企业登录/注册页字段校验纯函数。
 *
 * 由来：login 与 register 两个页面把 email/password/mobile/required 等
 *       校验内联在两处，文案与规则完全相同但分散维护；任何调整需同步两处。
 * 集中后：单一来源；新增企业页面（如 forgot-password）零样板接入。
 *
 * 设计原则：
 *   - 所有 validator 返回 `string | undefined` —— undefined 表示通过
 *   - 全部纯函数，零副作用，便于测试
 *   - 工厂形式（required / passwordMin / matches）支持参数化
 */

export type Validator<V = string> = (value: V, all?: Record<string, string>) => string | undefined;

// ─── 必填 ──────────────────────────────────────────────
/** 必填：trim 后空字符串报错，文案形如 "请输入企业名称" */
export const required =
  (label: string): Validator =>
  (value) =>
    value && value.trim() ? undefined : `请输入${label}`;

// ─── Email ─────────────────────────────────────────────
const EMAIL_EMPTY_MSG = '请输入邮箱地址';
const EMAIL_INVALID_MSG = '请输入有效的邮箱地址';

/**
 * 邮箱校验：trim 后空 → 必填；非空但不含 @ → 格式错。
 *
 * 由来：register 与 login 都用 `email.includes('@')` 做粗校验，行为一致，
 *       现在集中维护。如果未来要升级为 RFC 5322 regex，只需改这一处。
 */
export const email: Validator = (value) => {
  if (!value || !value.trim()) return EMAIL_EMPTY_MSG;
  if (!value.includes('@')) return EMAIL_INVALID_MSG;
  return undefined;
};

// ─── Password ──────────────────────────────────────────
/** 密码长度下限：v.length >= n 通过；否则报 "密码长度至少n位" */
export const passwordMin =
  (n: number): Validator =>
  (value) =>
    value && value.length >= n ? undefined : `密码长度至少${n}位`;

// ─── Mobile (中国大陆) ─────────────────────────────────
const MOBILE_EMPTY_MSG = '请输入手机号';
const MOBILE_INVALID_MSG = '请输入有效的手机号';
const MOBILE_REGEX = /^1[3-9]\d{9}$/;

/**
 * 大陆手机号：以 1 开头，第二位 3-9，共 11 位。
 * 与原 register/page.tsx:82 的正则完全一致。
 */
export const mobileCN: Validator = (value) => {
  if (!value || !value.trim()) return MOBILE_EMPTY_MSG;
  if (!MOBILE_REGEX.test(value)) return MOBILE_INVALID_MSG;
  return undefined;
};

// ─── Matches ───────────────────────────────────────────
/**
 * 字段等值校验（如 confirmPassword === password）。
 * 失败文案：两次输入的${otherLabel}不一致
 */
export const matches =
  (otherField: string, otherLabel: string): Validator =>
  (value, all) => {
    if (!all) return undefined;
    return value === all[otherField] ? undefined : `两次输入的${otherLabel}不一致`;
  };
