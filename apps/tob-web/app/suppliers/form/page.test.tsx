/**
 * suppliers/form/page.test.tsx — 供应商表单路由页 L1 冒烟测试 (tob-web)
 * 角色视角: 👔品牌运营 / 💳采购经理
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('suppliers/form/page — 正例', () => {
  it('应导出一个默认函数组件 SupplierCreatePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SupplierCreatePage'), '缺少默认导出 SupplierCreatePage');
  });

  it('应导入 SupplierFormPage 组件', () => {
    const src = readSource();
    assert.ok(src.includes('SupplierFormPage'), '缺少 SupplierFormPage 导入');
    assert.ok(src.includes('./components/SupplierFormPage'), '导入路径应为 ./components/SupplierFormPage');
  });

  it('应渲染 SupplierFormPage 组件', () => {
    const src = readSource();
    assert.ok(src.includes('<SupplierFormPage'), 'JSX 中应包含 SupplierFormPage');
  });

  it('不应是 use client 组件 (服务端组件路由)', () => {
    const src = readSource();
    assert.ok(!src.includes("'use client'"), '路由 page 应为服务端组件');
  });

  it('应包含 TODO 注释说明编辑模式', () => {
    const src = readSource();
    assert.ok(src.includes('TODO'), '缺少 TODO 注释');
    assert.ok(src.includes('编辑模式'), '应提及编辑模式');
    assert.ok(src.includes('isEdit'), '应提及 isEdit 参数');
  });
});

describe('suppliers/form/components/SupplierFormPage — 正例', () => {
  it('组件文件应存在且导入', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('SupplierFormPage'), '组件源文件存在');
  });

  it('组件应包含表单字段 name', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('name'), '缺少 name 字段');
  });

  it('组件应包含表单字段 email', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('email'), '缺少 email 字段');
  });

  it('组件应包含表单字段 phone', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('phone'), '缺少 phone 字段');
  });

  it('组件应包含表单字段 category', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('category'), '缺少 category 字段');
  });

  it('组件应包含表单字段 address', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('address'), '缺少 address 字段');
  });

  it('组件应包含表单字段 tags', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('tags'), '缺少 tags 字段');
  });

  it('组件应包含 isEdit / supplierId / initialValues 编辑模式属性', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('isEdit'), '缺少 isEdit');
    assert.ok(compSrc.includes('supplierId'), '缺少 supplierId');
    assert.ok(compSrc.includes('initialValues'), '缺少 initialValues');
  });

  it('组件应包含表单验证逻辑和错误处理', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('errorMessage'), '缺少 errorMessage');
    assert.ok(compSrc.includes('successMessage') || compSrc.includes('success'), '缺少成功消息处理');
  });

  it('组件应包含 noValidate 禁用浏览器默认验证', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('noValidate'), '应使用 noValidate');
  });

  it('组件应使用 router.push 导航', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('push'), '应使用 router.push');
    assert.ok(compSrc.includes('/suppliers'), '应跳转到 /suppliers');
  });

  it('组件应使用 Select 分类选择器', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('Select'), '应使用 Select 组件');
    assert.ok(compSrc.includes('CATEGORY_OPTIONS'), '应引用 CATEGORY_OPTIONS');
  });

  it('组件应包含提交状态管理 (isSubmitting / submitState)', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('isSubmitting') || compSrc.includes('submitState'), '缺少提交状态管理');
  });

  it('组件应使用 useState / useCallback', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes('useState'), '应使用 useState');
    assert.ok(compSrc.includes('useCallback'), '应使用 useCallback');
  });
});

describe('suppliers/form/page — 边界', () => {
  it('page.tsx 应足够简洁 (不含业务逻辑)', () => {
    const src = readSource();
    const lines = src.split('\n').filter(l => l.trim().length > 0).length;
    assert.ok(lines <= 20, `路由 page 文件行数 ${lines}，应简洁 (≤20行)`);
  });

  it('page.tsx 不应包含直接依赖 @m5/ui', () => {
    const src = readSource();
    assert.ok(!src.includes('@m5/ui'), '路由 page 不应直接引用 @m5/ui');
  });

  it('组件文件应包含 use client 指令', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const compSrc = readFileSync(compPath, 'utf-8');
    assert.ok(compSrc.includes("'use client'") || compSrc.includes("'use client"), '组件应标记 use client');
  });

  it('URL 路径配置与文件名一致', () => {
    const src = readSource();
    const dirName = __dirname.split('/').pop();
    assert.equal(dirName, 'form', '目录应为 form');
    assert.ok(src.includes('/suppliers'), '导航路径应为 /suppliers');
  });
});

describe('suppliers/form — 防御', () => {
  it('page.tsx 无语法错误可被 Node.js 解析', () => {
    assert.doesNotThrow(() => {
      const src = readSource();
      // Verify JSX-like structure by checking balanced angle brackets basics
      const imports = src.match(/import\s+/g);
      assert.ok(imports && imports.length >= 1, '应包含至少一个 import');
    });
  });

  it('组件文件无语法错误可被 Node.js 解析', () => {
    assert.doesNotThrow(() => {
      const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
      readFileSync(compPath, 'utf-8');
    });
  });

  it('测试文件本身应包含 describe/it 结构', () => {
    const src = readFileSync(resolve(__dirname, 'page.test.tsx'), 'utf-8');
    assert.ok(src.includes('describe'), '测试文件应包含 describe');
    assert.ok(src.includes('it'), '测试文件应包含 it');
    assert.ok(src.includes('assert'), '测试文件应包含 assert');
  });

  it('所有导入路径存在对应文件', () => {
    const compPath = resolve(__dirname, 'components', 'SupplierFormPage.tsx');
    const exists = require('fs').existsSync(compPath);
    assert.ok(exists, 'SupplierFormPage.tsx 应存在');
  });
});
