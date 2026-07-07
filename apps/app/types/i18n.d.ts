// Type definitions for i18n 0.x
// Project: https://github.com/mashpie/i18n-node

declare module 'i18n' {
  class I18n {
    translations: Record<string, Record<string, string>>;
    defaultLocale: string;
    locale: string;
    enableFallback: boolean;

    t(key: string, options?: Record<string, string | number>): string;
  }

  export { I18n };
}
