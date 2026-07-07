/**
 * 把 workspace / detailId 这种"用户能输入"的字符串 sanitize 成安全的
 * 文件名段。所有非字母 / 数字 / 下划线 / 横线都替换为 '-'，保证：
 * - 跨平台（macOS / Windows / Linux 都能保存）
 * - 不含路径分隔符（避免 ../ 逃逸）
 * - 不含 NUL 字节
 *
 * 该函数是纯函数，方便单测。
 */
export function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\u4e00-\u9fff-]/g, '-');
}
