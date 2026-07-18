// Test setup (ESM): happy-dom environment + module mocks
// Loaded via `node --import ./.test-setup.mjs` before tests

import { Window } from 'happy-dom';
import React from 'react';

const window = new Window({ url: 'http://localhost' });
const document = window.document;

// Some page components use 'use client' with automatic JSX transform but
// the test environment needs React in scope for @testing-library/react renders
// Polyfill React.use() for pages using React 19's use() hook
if (!React.use) {
  React.use = (p) => p; // Return as-is; if test passes plain object, destructuring works
}
globalThis.React = React;

Object.assign(globalThis, {
  window,
  document,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLTextAreaElement: window.HTMLTextAreaElement,
  HTMLSelectElement: window.HTMLSelectElement,
  HTMLButtonElement: window.HTMLButtonElement,
  Node: window.Node,
  Element: window.Element,
  self: window,
});

// next/navigation mock via ESM hook
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Module = require('module');

const navPath = Module._resolveFilename('next/navigation', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

// Also mock next/link — renders as a plain span
const linkPath = Module._resolveFilename('next/link', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextLink = ({ children, href, ...props }) => {
  return React.createElement('a', { ...props, 'data-href': href, href }, children);
};

require.cache[linkPath] = {
  id: linkPath,
  filename: linkPath,
  loaded: true,
  exports: { default: MockNextLink, __esModule: true },
};

const mockNavModule = {
  __esModule: true,
  ReadonlyURLSearchParams: class {},
  RedirectType: { push: 'push', replace: 'replace' },
  notFound: () => {},
  redirect: (url) => { throw new Error('redirect: ' + url); },
  permanentRedirect: (url) => { throw new Error('permanentRedirect: ' + url); },
  useParams: () => ({}),
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, back: () => {}, replace: () => {}, prefetch: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  forbidden: () => { throw new Error('forbidden'); },
  unauthorized: () => { throw new Error('unauthorized'); },
};

require.cache[navPath] = {
  id: navPath,
  filename: navPath,
  loaded: true,
  exports: mockNavModule,
};

// Mock next/image
const imagePath = Module._resolveFilename('next/image', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

const MockNextImage = ({ src, alt, ...props }) => {
  return React.createElement('img', { ...props, src, alt });
};

require.cache[imagePath] = {
  id: imagePath,
  filename: imagePath,
  loaded: true,
  exports: { default: MockNextImage },
};

// Mock @m5/ui components for rendering tests
// CJS __export pattern doesn't interop well with static ESM named imports through tsx
const uiPath = Module._resolveFilename('@m5/ui', {
  id: '<preload>',
  filename: '<preload>',
  paths: Module._nodeModulePaths(process.cwd()),
});

function makeMockComponent(displayName) {
  const C = (props) => {
    const { children, ...rest } = props;
    return React.createElement('div', { 'data-mock': displayName }, children);
  };
  C.displayName = displayName;
  return C;
}

function makeMockHook(fn) {
  return fn;
}

const mockUiModule = {
  __esModule: true,
  PageShell: ({ title, subtitle, children }) => {
    return React.createElement('div', { 'data-mock': 'PageShell' },
      React.createElement('h1', null, title),
      subtitle ? React.createElement('p', { 'data-testid': 'page-subtitle' }, subtitle) : null,
      children,
    );
  },
  StatusBadge: ({ label, variant, size, dot }) => {
    return React.createElement('span', {
      'data-testid': 'StatusBadge',
      'data-label': label,
      'data-variant': variant,
      'data-size': size,
      'data-dot': dot ? 'true' : 'false',
      style: {},
    }, label);
  },
  Tabs: ({ items, activeKey, onChange, variant, size }) => {
    return React.createElement('div', { 'data-mock': 'Tabs', role: 'tablist' },
      ...(items || []).map((item) =>
        React.createElement('button', {
          key: item.key,
          role: 'tab',
          'data-tab-key': item.key,
          'aria-selected': item.key === activeKey ? 'true' : 'false',
          onClick: () => onChange?.(item.key),
        }, `${item.label}${item.count != null ? ` (${item.count})` : ''}`)
      )
    );
  },
  SearchFilterInput: ({ value, onChange, placeholder, width }) => {
    return React.createElement('input', {
      'data-mock': 'SearchFilterInput',
      type: 'text',
      value,
      placeholder: placeholder || '',
      onChange: (e) => onChange?.(e.target.value),
      style: width ? { width } : {},
    });
  },
  DataTable: ({ columns, items, rowKey, title, striped, compact }) => {
    return React.createElement('div', { 'data-mock': 'DataTable' },
      title ? React.createElement('div', { 'data-testid': 'table-title' }, title) : null,
      React.createElement('table', { 'data-testid': 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            ...(columns || []).map((col) =>
              React.createElement('th', { key: col.key, 'data-column': col.key }, col.title || col.header || col.key)
            )
          )
        ),
        React.createElement('tbody', null,
          ...(items || []).map((item, idx) =>
            React.createElement('tr', { key: rowKey ? rowKey(item) : idx },
              ...(columns || []).map((col) =>
                React.createElement('td', { key: col.key },
                  col.render ? col.render(item, idx) : String(item[col.dataKey] ?? '')
                )
              )
            )
          )
        )
      )
    );
  },
  Pagination: ({ page, total, onPageChange, pageSize }) => {
    const totalPages = Math.ceil(total / (pageSize || 10));
    return React.createElement('div', { 'data-mock': 'Pagination' },
      `共 ${total} 条，第 ${page}/${totalPages} 页`
    );
  },
  EmptyState: ({ title, description }) => {
    return React.createElement('div', { 'data-mock': 'EmptyState' },
      title ? React.createElement('h3', null, title) : null,
      description ? React.createElement('p', null, description) : null,
    );
  },
  usePagination: (totalOrOptions, pageSizeArg, initialPageArg = 1) => {
    let options;
    if (typeof totalOrOptions === 'object') {
      options = totalOrOptions;
    } else {
      options = {};
    }
    const [page, setPage] = React.useState(options.initialPage ?? 1);
    const [pageSize, setPageSize] = React.useState(options.initialPageSize ?? 10);
    return {
      page,
      pageSize,
      totalPages: 1,
      setPage,
      setPageSize,
      total: 0,
      resetPage: () => setPage(1),
      paginate: (items) => items,
    };
  },
  useSortedItems: (items, _columns, sortConfig) => {
    if (!items) return [];
    if (!sortConfig) return items;
    const sorted = [...items];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  },
  useSearchFilter: (initialValue) => {
    const [value, setValue] = React.useState(initialValue ?? '');
    return { value, debouncedValue: value, setValue };
  },
  Card: ({ children, style, ...props }) => {
    return React.createElement('div', { 'data-mock': 'Card', style: style || {}, ...props }, children);
  },
  StatCard: ({ label, value, variant, suffix, icon }) => {
    return React.createElement('div', { 'data-mock': 'StatCard', 'data-label': String(label ?? ''), 'data-value': String(value ?? '') },
      label ? React.createElement('div', { 'data-testid': 'stat-label' }, String(label)) : null,
      value !== undefined ? React.createElement('div', { 'data-testid': 'stat-value' }, String(value)) : null,
      suffix ? React.createElement('span', null, suffix) : null,
    );
  },
  Button: ({ children, onClick, variant, size }) => {
    return React.createElement('button', { 'data-mock': 'Button', onClick }, children);
  },
  Spinner: () => React.createElement('div', { 'data-mock': 'Spinner' }, 'Loading...'),
  Select: ({ value, onChange, options, placeholder, children }) => {
    return React.createElement('select', { 'data-mock': 'Select', value, onChange }, children);
  },
  Modal: ({ open, onClose, children, title }) => {
    if (!open) return null;
    return React.createElement('div', { 'data-mock': 'Modal' },
      title ? React.createElement('h2', null, title) : null,
      children,
      React.createElement('button', { onClick: onClose, 'data-testid': 'modal-close' }, 'Close'),
    );
  },
  FormSubmitFeedback: ({ success, error, onDismissSuccess, onRetry, onDismissError }) => {
    if (success) return React.createElement('div', { 'data-mock': 'FormSubmitFeedback', 'data-type': 'success' }, success);
    if (error) return React.createElement('div', { 'data-mock': 'FormSubmitFeedback', 'data-type': 'error' },
      error,
      React.createElement('button', { onClick: onRetry, 'data-testid': 'retry-btn' }, '重试'),
    );
    return null;
  },
  SubmitButton: ({ children, variant, loading, type, onClick, disabled }) => {
    return React.createElement('div', { 'data-mock': 'SubmitButton', 'data-variant': variant, 'data-loading': loading ? 'true' : 'false' },
      loading ? '提交中…' : children
    );
  },
  WorkspaceBreadcrumb: ({ workspaceLabel, workspaceHref, detailLabel }) => {
    return React.createElement('nav', { 'data-mock': 'WorkspaceBreadcrumb' },
      React.createElement('a', { href: workspaceHref }, workspaceLabel),
      ' / ',
      React.createElement('span', null, detailLabel)
    );
  },
  FormField: ({ label, error, children }) => React.createElement('div', { 'data-mock': 'FormField' },
    label ? React.createElement('label', null, label) : null,
    children,
    error ? React.createElement('span', { style: { color: 'red' } }, error) : null,
  ),

  /** 表单验证函数 — 运行全部 rules，返回错误映射 */
  validateFormFields: (fields, values) => {
    const errors = {};
    for (const f of fields) {
      if (f.required && (!values[f.key] || values[f.key] === '')) {
        errors[f.key] = '此字段不能为空';
        continue;
      }
      if (f.rules) {
        for (const rule of f.rules) {
          const msg = rule.validate(values[f.key]);
          if (msg) {
            errors[f.key] = msg;
            break;
          }
        }
      }
    }
    return errors;
  },

  /** 表单页骨架组件 mock */
  FormPageScaffold: ({ meta, fields, onSubmit, onSuccess, submitLabel, submitVariant, backUrl, topActions, footer, onChange, disabled }) => {
    const [values, setValues] = React.useState({});
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [submitResult, setSubmitResult] = React.useState(null);

    const handleChange = (key, value) => {
      const next = { ...values, [key]: value };
      setValues(next);
      onChange?.(key, value);
      if (errors[key]) {
        const nextErrors = { ...errors };
        delete nextErrors[key];
        setErrors(nextErrors);
      }
    };

    const handleSubmitClick = async () => {
      let allErrors = {};
      for (const f of fields) {
        if (f.required && (!values[f.key] || values[f.key] === '')) {
          allErrors[f.key] = '此字段不能为空';
        } else if (f.rules) {
          for (const rule of f.rules) {
            const msg = rule.validate(values[f.key]);
            if (msg) {
              allErrors[f.key] = msg;
              break;
            }
          }
        }
      }

      for (const f of fields) {
        if (f.required && (!values[f.key] || values[f.key] === '' || (typeof values[f.key] === 'string' && !values[f.key].trim()))) {
          allErrors[f.key] = '此字段不能为空';
        }
      }

      setErrors(allErrors);

      if (Object.keys(allErrors).length === 0) {
        setLoading(true);
        try {
          const result = await onSubmit(values);
          setSubmitResult({ type: 'success', message: result?.message });
          setLoading(false);
          if (result && onSuccess) {
            onSuccess(result);
          }
        } catch (err) {
          setSubmitResult({ type: 'error', message: err.message });
          setErrors({ __form__: err.message });
          setLoading(false);
        }
      }
    };

    const errorsList = Object.values(errors).filter(Boolean);

    return React.createElement('div', { 'data-mock': 'FormPageScaffold', 'data-submit-status': submitResult?.type || 'idle' },
      React.createElement('h1', { 'data-testid': 'form-title' }, meta.title),
      meta.description ? React.createElement('p', { 'data-testid': 'form-description' }, meta.description) : null,
      topActions ? React.createElement('div', { 'data-mock': 'FormPageScaffold-topActions' }, topActions) : null,
      React.createElement('div', { 'data-mock': 'FormPageScaffold-fields' },
        ...fields.map((f) =>
          React.createElement('div', { key: f.key, 'data-field-key': f.key },
            React.createElement('label', null, f.label),
            React.createElement('input', {
              'data-testid': `field-${f.key}`,
              placeholder: f.placeholder || '',
              'aria-label': f.label,
              value: values[f.key] || '',
              onChange: (e) => handleChange(f.key, e.target.value),
            }),
            f.helper ? React.createElement('span', { 'data-testid': `helper-${f.key}` }, f.helper) : null,
            errors[f.key] ? React.createElement('span', { 'data-testid': 'error-${f.key}', style: { color: 'red' } }, errors[f.key]) : null,
          )
        )
      ),
      errorsList.length > 0 ? React.createElement('div', { 'data-testid': 'form-errors' },
        ...errorsList.map((e, i) => React.createElement('div', { key: i, style: { color: 'red' } }, e))
      ) : null,
      footer ? React.createElement('div', { 'data-mock': 'FormPageScaffold-footer' }, footer) : null,
      React.createElement('button', {
        'data-testid': 'submit-btn',
        disabled: disabled || loading,
        onClick: handleSubmitClick,
      }, loading ? '提交中…' : (submitLabel || '提交')),
    );
  },

  /** Toast 钩子 mock */
  useToast: () => ({ success: () => {}, error: () => {}, warning: () => {}, info: () => {} }),

  // DataTableSortConfig type export not needed at runtime
};

require.cache[uiPath] = {
  id: uiPath,
  filename: uiPath,
  loaded: true,
  exports: mockUiModule,
};

console.log('[test-setup] happy-dom initialized (ESM), next/navigation + next/link + next/image + @m5/ui mocked');
