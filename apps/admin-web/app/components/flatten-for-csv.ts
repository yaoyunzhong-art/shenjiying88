/**
 * flattenForCsv 把任意 JS 值拍扁成 CSV 友好的 Record<string, unknown>。
 *
 * 规则：
 * - null / undefined  →  { [prefix]: '' }
 * - 基本类型（含 Date） →  { [prefix || 'value']: 序列化后的值 }
 *   - Date → ISO 字符串
 * - 数组：
 *   - 如果所有元素都是标量（含 Date）→ { [prefix || 'value']: '|'-分隔的字符串 }
 *   - 否则按 index 拍扁每个元素，前缀 `${prefix || 'item'}[${index}]`
 * - 普通对象：递归拍扁每个字段，前缀 `${prefix ? prefix + '.' : ''}${key}`
 *
 * 该函数是纯函数，方便单测；不含 DOM / 浏览器 API。
 */
export function flattenForCsv(value: unknown, prefix = ''): Record<string, unknown> {
  if (value == null) {
    return prefix ? { [prefix]: '' } : {};
  }
  if (typeof value !== 'object' || value instanceof Date) {
    return { [prefix || 'value']: value instanceof Date ? value.toISOString() : value };
  }
  if (Array.isArray(value)) {
    if (value.every((v) => v == null || typeof v !== 'object' || v instanceof Date)) {
      return {
        [prefix || 'value']: value
          .map((v) => (v instanceof Date ? v.toISOString() : v == null ? '' : String(v)))
          .join('|')
      };
    }
    const out: Record<string, unknown> = {};
    value.forEach((item, index) => {
      const child = flattenForCsv(item, `${prefix || 'item'}[${index}]`);
      for (const [k, v] of Object.entries(child)) {
        out[k] = v;
      }
    });
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const child = flattenForCsv(v, prefix ? `${prefix}.${k}` : k);
    for (const [ck, cv] of Object.entries(child)) {
      out[ck] = cv;
    }
  }
  return out;
}

/**
 * 把拍扁后的记录转成 CSV 字符串。Record 的 key 决定表头顺序。
 *
 * - 数组输入会逐行输出（每行一个元素）。
 * - 单元格含逗号 / 引号 / 换行时用 RFC 4180 风格加引号。
 * - 输出首部带 UTF-8 BOM 字符（U+FEFF），Excel 打开不会乱码。
 */
export function recordsToCsv(record: unknown): string {
  if (record == null) {
    return '\uFEFF';
  }
  const header = collectHeader(record);
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  if (Array.isArray(record)) {
    for (let i = 0; i < record.length; i += 1) {
      const row = flattenForCsv(record[i], `item[${i}]`);
      lines.push(header.map((h) => escape(row[h])).join(','));
    }
  } else {
    const row = flattenForCsv(record);
    lines.push(header.map((h) => escape(row[h])).join(','));
  }
  return '\uFEFF' + lines.join('\n');
}

/**
 * 收集所有行都用到的 key，作为 CSV 表头。key 按出现顺序去重。
 * - 对象记录：直接拍扁取 key
 * - 数组记录：每个元素都用 `${item[N]}` 前缀拍扁，取所有 key 的并集
 */
function collectHeader(record: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const consume = (row: Record<string, unknown>) => {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  };
  if (Array.isArray(record)) {
    for (let i = 0; i < record.length; i += 1) {
      consume(flattenForCsv(record[i], `item[${i}]`));
    }
  } else {
    consume(flattenForCsv(record));
  }
  return out;
}
