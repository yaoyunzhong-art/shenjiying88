/**
 * i18n-extract.ts - Phase-20 T46
 * 用途: 翻译 key 自动提取 + 校验工具
 * 关联: phase-20-compliance/spec.md §Phase 3
 *
 * 功能:
 * - extractKeysFromSource: 从 TS 源码扫描 t('xxx') / tPlural('xxx') 调用
 * - generateTranslationTemplate: 根据已有 locale 生成缺失 locale 的模板
 * - validateTranslationFiles: 校验多个 locale 文件完整性
 */
import { I18nService, Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n.service';

/**
 * 从源码扫描翻译 key 调用
 * 识别模式: t('key'), t("key"), tPlural('key'), t(`key`)
 * @param source TS 源码
 * @returns 提取的 key 列表 (去重 + 排序)
 */
export function extractKeysFromSource(source: string): string[] {
  const keys = new Set<string>();
  // 匹配 t('...') / t("...") / t(`...`) / tPlural('...')
  const patterns = [
    /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\btPlural\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\btp\s*\(\s*['"`]([^'"`]+)['"`]/g, // tp = tPlural alias
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      keys.add(m[1]);
    }
  }
  return Array.from(keys).sort();
}

/**
 * 扫描目录下的所有 .ts 文件,聚合 key
 */
export function extractKeysFromFiles(files: Array<{ path: string; content: string }>): {
  path: string;
  keys: string[];
}[] {
  return files.map((f) => ({
    path: f.path,
    keys: extractKeysFromSource(f.content),
  }));
}

/**
 * 根据参考 locale 生成目标 locale 的空模板
 * @param referenceKeys 参考 key 列表
 * @param targetLocale 目标 locale (用于命名空间)
 * @returns 空值模板,可保存为 JSON
 */
export function generateTranslationTemplate(
  referenceKeys: string[],
  targetLocale: Locale,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of referenceKeys) {
    // 占位: TODO[locale]
    result[key] = `TODO[${targetLocale}]`;
  }
  return result;
}

/**
 * 校验翻译文件完整性
 * @param files Map<locale, translation map>
 * @param referenceLocale 参考 locale (key 来源)
 * @returns 校验报告
 */
export interface ValidationReport {
  referenceLocale: Locale;
  totalKeys: number;
  completeness: Record<Locale, {
    present: number;
    missing: number;
    missingKeys: string[];
  }>;
  /** 空值 (翻译未填写) */
  emptyValues: Record<Locale, string[]>;
}

export function validateTranslationFiles(
  files: Map<Locale, Record<string, string>>,
  referenceLocale: Locale = DEFAULT_LOCALE,
): ValidationReport {
  const refKeys = Object.keys(files.get(referenceLocale) ?? {});
  const totalKeys = refKeys.length;
  const completeness: ValidationReport['completeness'] = {
    'zh-CN': { present: 0, missing: 0, missingKeys: [] },
    'en-US': { present: 0, missing: 0, missingKeys: [] },
    'ja-JP': { present: 0, missing: 0, missingKeys: [] },
  };
  const emptyValues: Record<Locale, string[]> = {
    'zh-CN': [],
    'en-US': [],
    'ja-JP': [],
  };

  for (const loc of SUPPORTED_LOCALES) {
    const map = files.get(loc) ?? {};
    for (const key of refKeys) {
      if (key in map) {
        completeness[loc].present += 1;
        const val = map[key];
        if (!val || val.trim() === '' || val.startsWith('TODO[')) {
          emptyValues[loc].push(key);
        }
      } else {
        completeness[loc].missing += 1;
        completeness[loc].missingKeys.push(key);
      }
    }
  }

  return { referenceLocale, totalKeys, completeness, emptyValues };
}

/**
 * 合并 translations 到 I18nService (辅助函数)
 */
export function loadIntoService(svc: I18nService, files: Map<Locale, Record<string, string>>): void {
  for (const [loc, map] of files.entries()) {
    svc.registerTranslations(loc, map);
  }
}

/**
 * 从代码仓库扫描 → 与 service 已注册 key 比对 → 报告未注册 key
 * 用于 CI 检查 (missing translation)
 */
export function diffWithService(
  svc: I18nService,
  sourceKeys: string[],
  locale: Locale = DEFAULT_LOCALE,
): {
  usedInCode: string[];
  registeredInLocale: string[];
  /** 代码中用了但 service 中未注册 (会 fallback 到 en-US 或返回 key) */
  missingInLocale: string[];
  /** service 中注册但代码中无引用 (dead translations) */
  unusedInCode: string[];
} {
  const registered = svc.extractKeys(locale);
  const usedSet = new Set(sourceKeys);
  const regSet = new Set(registered);
  return {
    usedInCode: sourceKeys,
    registeredInLocale: registered,
    missingInLocale: sourceKeys.filter((k) => !regSet.has(k)),
    unusedInCode: registered.filter((k) => !usedSet.has(k)),
  };
}