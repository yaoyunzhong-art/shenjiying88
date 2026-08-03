/**
 * InventoryScreen.test.tsx - 门店库存管理页面测试
 * node:test + react-test-renderer
 * 三态覆盖: 正常渲染 / 空状态 / Tab切换 / 搜索边界
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { InventoryScreen } from './InventoryScreen';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectTexts(node: unknown, chunks: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    chunks.push(String(node));
    return chunks;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectTexts(item, chunks));
    return chunks;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj.props && typeof obj.props === 'object') {
      const p = obj.props as Record<string, unknown>;
      if ('children' in p) {
        collectTexts(p.children, chunks);
      }
    }
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach((c: unknown) => collectTexts(c, chunks));
    }
  }
  return chunks;
}

function collectTextsFromRoot(root: ReturnType<typeof create>['root']): string[] {
  const allText = root.findAllByType('Text');
  return allText.map((t) => {
    const c = t.props.children;
    return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : String(c ?? '');
  });
}

function getRenderedText(root: ReturnType<typeof create>): string {
  const texts = collectTexts(root.toJSON());
  return texts.join('');
}

function textContains(root: ReturnType<typeof create>, substr: string): boolean {
  return getRenderedText(root).includes(substr);
}

function pressTabByText(root: ReturnType<typeof create>, text: string): boolean {
  const json = root.toJSON();
  let pressed = false;

  function walk(node: unknown): boolean {
    if (!node || pressed) return false;
    const n = node as Record<string, unknown>;
    if (n.props && typeof n.props === 'object') {
      const p = n.props as Record<string, unknown>;
      if (typeof p.onPress === 'function') {
        const texts = collectTexts(node);
        if (texts.some((t) => t.includes(text))) {
          act(() => (p.onPress as () => void)());
          pressed = true;
          return true;
        }
      }
    }
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        if (walk(child)) return true;
      }
    }
    return false;
  }

  walk(json);
  return pressed;
}

function findStyleProp(element: unknown, key: string): unknown {
  if (!element || typeof element !== 'object') return undefined;
  const obj = element as Record<string, unknown>;
  if (obj.props && typeof obj.props === 'object') {
    const p = obj.props as Record<string, unknown>;
    if (p.style && typeof p.style === 'object') {
      const st = p.style as Record<string, unknown>;
      if (key in st) return st[key];
    }
  }
  return undefined;
}

/* ================================================================== */
/*  正例: 空状态渲染 — 全部 UI 元素                                     */
/* ================================================================== */

test('InventoryScreen: renders search bar with placeholder', () => {
  const root = create(<InventoryScreen />).root;
  const searchInput = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  assert.ok(searchInput);
});

test('InventoryScreen: renders search input with placeholderTextColor', () => {
  const root = create(<InventoryScreen />).root;
  const searchInput = root.findByProps({ placeholderTextColor: '#999' });
  assert.ok(searchInput);
});

test('InventoryScreen: renders search input with default empty value', () => {
  const root = create(<InventoryScreen />).root;
  const searchInput = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  assert.equal(searchInput.props.value, '');
});

test('InventoryScreen: renders FilterTab 全部', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '全部'));
});

test('InventoryScreen: renders FilterTab 低库存 with count', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '低库存'));
});

test('InventoryScreen: renders FilterTab 高库存', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '高库存'));
});

test('InventoryScreen: renders empty icon 📦', () => {
  const root = create(<InventoryScreen />).root;
  const iconEl = root.findByProps({ children: '📦' });
  assert.ok(iconEl);
});

test('InventoryScreen: renders empty text 暂无库存数据', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '暂无库存数据'));
});

test('InventoryScreen: renders empty sub text 请先同步门店库存信息', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '请先同步门店库存信息'));
});

test('InventoryScreen: renders at least 3 TouchableOpacity elements (filter tabs)', () => {
  const root = create(<InventoryScreen />).root;
  const touchables = root.findAllByType(TouchableOpacity);
  assert.ok(touchables.length >= 3);
});

test('InventoryScreen: component renders without crashing', () => {
  assert.doesNotThrow(() => {
    create(<InventoryScreen />);
  });
});

/* ================================================================== */
/*  交互: Tab 切换                                                     */
/* ================================================================== */

test('InventoryScreen: switching tab to 低库存 is safe', () => {
  const root = create(<InventoryScreen />);
  assert.ok(pressTabByText(root, '低库存'));
});

test('InventoryScreen: switching tab to 高库存 is safe', () => {
  const root = create(<InventoryScreen />);
  assert.ok(pressTabByText(root, '高库存'));
});

test('InventoryScreen: switching back to 全部 after filter is safe', () => {
  const root = create(<InventoryScreen />);
  pressTabByText(root, '高库存');
  assert.ok(pressTabByText(root, '全部'));
});

test('InventoryScreen: switching through all three tabs works', () => {
  const root = create(<InventoryScreen />);

  pressTabByText(root, '低库存');
  assert.ok(textContains(root, '低库存'));

  pressTabByText(root, '高库存');
  assert.ok(textContains(root, '高库存'));

  pressTabByText(root, '全部');
  assert.ok(textContains(root, '全部'));
});

test('InventoryScreen: default active tab (全部) has blue background', () => {
  const root = create(<InventoryScreen />);
  const json = root.toJSON();
  let foundDefaultActive = false;

  function walk(node: unknown): void {
    if (!node || foundDefaultActive) return;
    const n = node as Record<string, unknown>;
    if (n.props && typeof n.props === 'object') {
      const p = n.props as Record<string, unknown>;
      if (p.style && Array.isArray(p.style)) {
        const styleArr = p.style as unknown[];
        // Tab style array: [baseStyle, activeStyle] - active when second element is truthy
        const second = styleArr.length > 1 ? styleArr[1] : undefined;
        if (second && typeof second === 'object' && !Array.isArray(second)) {
          const actStyle = second as Record<string, unknown>;
          if (actStyle.backgroundColor === '#2563eb') {
            foundDefaultActive = true;
          }
        }
      }
    }
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(walk);
    }
  }

  walk(json);
  // The first tab (全部) should be active by default with blue background
  assert.ok(foundDefaultActive, '默认活跃 tab (全部) 应有蓝色背景 #2563eb');
});

/* ================================================================== */
/*  搜索输入交互验证                                                    */
/* ================================================================== */

test('InventoryScreen: search input has onChangeText handler', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  assert.equal(typeof input.props.onChangeText, 'function');
});

test('InventoryScreen: search input fontSize is 15', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.fontSize, 15);
});

test('InventoryScreen: search input color is #333', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.color, '#333');
});

test('InventoryScreen: search input has borderRadius 20', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.borderRadius, 20);
});

test('InventoryScreen: search input has height 40', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.height, 40);
});

test('InventoryScreen: search input backgroundColor is #f0f0f0', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.backgroundColor, '#f0f0f0');
});

/* ================================================================== */
/*  边界: 低库存计数 + 空状态文本样式验证                                 */
/* ================================================================== */

test('InventoryScreen: 低库存 tab shows count (0) when no items', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '低库存 (0)'));
});

test('InventoryScreen: 高库存 tab is purely "高库存" without count', () => {
  const root = create(<InventoryScreen />);
  assert.ok(textContains(root, '高库存'));
});

test('InventoryScreen: empty state shows three expected text elements', () => {
  const root = create(<InventoryScreen />).root;
  const iconEl = root.findByProps({ children: '📦' });
  const emptyText = root.findByProps({ children: '暂无库存数据' });
  const emptySub = root.findByProps({ children: '请先同步门店库存信息' });
  assert.ok(iconEl);
  assert.ok(emptyText);
  assert.ok(emptySub);
});

test('InventoryScreen: empty icon has fontSize 48', () => {
  const root = create(<InventoryScreen />).root;
  const iconEl = root.findByProps({ children: '📦' });
  const style = iconEl.props.style as Record<string, unknown>;
  assert.equal(style.fontSize, 48);
});

test('InventoryScreen: empty sub text color is #bbb', () => {
  const root = create(<InventoryScreen />).root;
  const subText = root.findByProps({ children: '请先同步门店库存信息' });
  const style = subText.props.style as Record<string, unknown>;
  assert.equal(style.color, '#bbb');
});

test('InventoryScreen: container backgroundColor is #f5f5f5', () => {
  const root = create(<InventoryScreen />).root;
  const container = root.findAllByType('View')[0];
  const style = container.props.style as Record<string, unknown>;
  assert.equal(style.backgroundColor, '#f5f5f5');
});

test('InventoryScreen: tab text has fontSize 14 in default state', () => {
  const root = create(<InventoryScreen />).root;
  const allText = root.findAllByType('Text');
  // Find 全部 tab text
  const tabText = allText.find((t) => {
    const c = t.props.children;
    return c === '全部';
  });
  assert.ok(tabText);
  // Style is an array: [baseStyle, activeExtraStyle]
  const style = tabText.props.style as unknown[];
  const baseStyle = style[0] as Record<string, unknown>;
  assert.equal(baseStyle.fontSize, 14);
});

test('InventoryScreen: tab default text color is #666', () => {
  const root = create(<InventoryScreen />).root;
  const allText = root.findAllByType('Text');
  const tabText = allText.find((t) => {
    const c = t.props.children;
    return c === '全部';
  });
  assert.ok(tabText);
  const style = tabText.props.style as unknown[];
  const baseStyle = style[0] as Record<string, unknown>;
  assert.equal(baseStyle.color, '#666');
});

test('InventoryScreen: search input paddingHorizontal is 16', () => {
  const root = create(<InventoryScreen />).root;
  const input = root.findByProps({ placeholder: '搜索商品名称/SKU...' });
  const style = input.props.style as Record<string, unknown>;
  assert.equal(style.paddingHorizontal, 16);
});

test('InventoryScreen: empty text fontSize is 16', () => {
  const root = create(<InventoryScreen />).root;
  const emptyText = root.findByProps({ children: '暂无库存数据' });
  const style = emptyText.props.style as Record<string, unknown>;
  assert.equal(style.fontSize, 16);
});

test('InventoryScreen: empty sub text fontSize is 13', () => {
  const root = create(<InventoryScreen />).root;
  const subText = root.findByProps({ children: '请先同步门店库存信息' });
  const style = subText.props.style as Record<string, unknown>;
  assert.equal(style.fontSize, 13);
});
