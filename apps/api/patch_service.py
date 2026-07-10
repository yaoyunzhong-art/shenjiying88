#!/usr/bin/env python3
import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

patches = [
    # 1. getLocaleForRegion 支持 regionNameEn + 返回 language (不拼接 code)
    (
        "  getLocaleForRegion(regionName: string): string {\n    for (const [, raw] of Object.entries(REGION_CONFIGS)) {\n      const config = raw as any\n      if (config.regionName === regionName) {\n        return `${config.language}-${config.regionCode}`\n      }\n    }\n    return 'zh-CN'\n  }",
        "  getLocaleForRegion(regionName: string): string {\n    for (const [, raw] of Object.entries(REGION_CONFIGS)) {\n      const config = raw as any\n      if (config.regionName === regionName || config.regionNameEn === regionName) {\n        return config.language\n      }\n    }\n    return 'zh-CN'\n  }"
    ),
    # 2. detectCountryFromIP / resolveCountryFromIP 找不到时返回 'UNKNOWN'
    (
        "    return 'DEFAULT'\n  }",
        "    return 'UNKNOWN'\n  }"
    ),
    # 3. getIPLocaleMapping 'UNKNOWN' 时返回 'zh-CN'
    (
        "  getIPLocaleMapping(countryCode: string): string {\n    const config = REGION_CONFIGS[countryCode] || REGION_CONFIGS['DEFAULT']\n    return config.language\n  }",
        "  getIPLocaleMapping(countryCode: string): string {\n    if (countryCode === 'UNKNOWN' || !(countryCode in REGION_CONFIGS)) {\n      return 'zh-CN'\n    }\n    return REGION_CONFIGS[countryCode].language\n  }"
    ),
    # 4. isSupportedLocale 严格匹配 8 种 SupportedLanguage
    (
        "  isSupportedLocale(locale: string): boolean {\n    const supported = this.getSupportedLanguages()\n    return supported.some(l => l.code === locale)\n  }",
        "  isSupportedLocale(locale: string): boolean {\n    const allowed = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'zh-TW', 'es-ES', 'fr-FR', 'de-DE']\n    return allowed.includes(locale)\n  }"
    ),
]

total = 0
for old, new in patches:
    n = s.count(old)
    if n > 0:
        s = s.replace(old, new)
        total += n
        print(f'OK ({n}x): {old[:50]}...')
    else:
        print(f'NOT FOUND: {old[:50]}...')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)
print(f'Total patches applied: {total}')
