# @m5/ui 组件测试规范

## 背景
`@m5/ui` 使用 `node --import tsx --test` 原生 Node 测试运行器，不经过 JSX transpiler，因此**不能直接在测试中用 JSX `<Component />` 语法**。

## 渲染 hooks 组件的方法

必须通过 `React.createElement` + `renderToStaticMarkup` 渲染：

```tsx
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props) {
  return renderToStaticMarkup(React.createElement(Component, props));
}
```

## 常见错误
- ❌ 直接 `Component(props)` 调用 — hooks 组件会抛 `TypeError: Cannot read properties of null (reading 'useRef')`
- ❌ 直接 `Component({...props})` — 同上
- ✅ `React.createElement(Component, props)` + `renderToStaticMarkup` — 正确

## 示例
参考 `src/components/Modal.test.tsx` 的写法，所有使用 `useRef`/`useState`/`useEffect`/`useCallback` 的组件测试必须用 `React.createElement` 渲染。
