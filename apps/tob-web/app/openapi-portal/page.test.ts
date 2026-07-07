/**
 * openapi-portal/page.test.ts — OpenAPI 开发者门户 L1 冒烟测试
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

// ---- 正例 ----

describe('openapi-portal — 正例', () => {
  it('应导出一个默认组件 OpenAPIPortalPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OpenAPIPortalPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 API_CATEGORIES 分类数据', () => {
    const src = readSource();
    assert.ok(src.includes('API_CATEGORIES'), '缺少 API 分类定义');
    assert.ok(src.includes('order'), '缺少订单分类');
    assert.ok(src.includes('points'), '缺少积分分类');
    assert.ok(src.includes('coupon'), '缺少优惠券分类');
    assert.ok(src.includes('inventory'), '缺少库存分类');
    assert.ok(src.includes('user'), '缺少用户分类');
    assert.ok(src.includes('payment'), '缺少支付分类');
  });

  it('应包含 SDK_LIST 多语言 SDK 定义', () => {
    const src = readSource();
    assert.ok(src.includes('SDK_LIST'), '缺少 SDK 列表');
    assert.ok(src.includes('nodejs'), '缺少 Node.js SDK');
    assert.ok(src.includes('python'), '缺少 Python SDK');
    assert.ok(src.includes('java'), '缺少 Java SDK');
    assert.ok(src.includes('go'), '缺少 Go SDK');
  });

  it('应包含 Navbar / HeroSection / InteractiveConsole 等子组件', () => {
    const src = readSource();
    assert.ok(src.includes('function Navbar'), '缺少 Navbar 组件');
    assert.ok(src.includes('function HeroSection'), '缺少 HeroSection 组件');
    assert.ok(src.includes('function InteractiveConsole'), '缺少 InteractiveConsole 组件');
    assert.ok(src.includes('function SDKSection'), '缺少 SDKSection 组件');
    assert.ok(src.includes('function APIKeyApplication'), '缺少 APIKeyApplication 组件');
    assert.ok(src.includes('function Footer'), '缺少 Footer 组件');
  });

  it('应包含 Heartbeat 探针组件引用', () => {
    const src = readSource();
    assert.ok(src.includes('Heartbeat'), '缺少 Heartbeat 引用');
    assert.ok(src.includes('HEARTBEAT-66'), '缺少 HEARTBEAT-66 探针');
  });
});

// ---- 边界 ----

describe('openapi-portal — 边界', () => {
  it('交互式控制台包含 GET / POST / PUT / DELETE 四种方法', () => {
    const src = readSource();
    assert.ok(src.includes("'GET'"), '缺少 GET');
    assert.ok(src.includes("'POST'"), '缺少 POST');
    assert.ok(src.includes("'PUT'"), '缺少 PUT');
    assert.ok(src.includes("'DELETE'"), '缺少 DELETE');
  });

  it('控制台加载状态显示 "发送中..."', () => {
    const src = readSource();
    assert.ok(src.includes('发送中'), '缺少发送中加载状态');
  });

  it('请求发送前显示占位文案 "点击「发送请求」查看响应"', () => {
    const src = readSource();
    assert.ok(src.includes('查看响应'), '缺少空响应占位');
  });

  it('API Key 申请表单提交后显示成功状态', () => {
    const src = readSource();
    assert.ok(src.includes('submitted'), '缺少 submitted 状态变量');
    assert.ok(src.includes('申请已提交'), '缺少提交成功提示');
  });

  it('API Key 申请包含应用名称 / 描述 / 权限字段', () => {
    const src = readSource();
    assert.ok(src.includes('应用名称'), '缺少应用名称字段');
    assert.ok(src.includes('应用描述'), '缺少应用描述字段');
    assert.ok(src.includes('所需权限'), '缺少权限字段');
  });
});

// ---- 防御 ----

describe('openapi-portal — 防御', () => {
  it('Hero 区应包含 "查看文档" 和 "申请 API Key" 两个 CTA 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('查看文档'), '缺少查看文档按钮');
    assert.ok(src.includes('申请 API Key'), '缺少申请 API Key 按钮');
  });

  it('Footer 应包含 API 状态 / 文档 / 联系支持三个链接', () => {
    const src = readSource();
    assert.ok(src.includes('API 状态'), '缺少 API 状态链接');
    assert.ok(src.includes('联系支持'), '缺少联系支持链接');
  });

  it('API 分类卡片应包含 endpointCount 端点计数', () => {
    const src = readSource();
    assert.ok(src.includes('endpointCount'), '缺少端点计数');
    assert.ok(src.includes('端点'), '缺少端点显示文字');
  });

  it('SDK 安装命令应包含各语言对应的包管理器', () => {
    const src = readSource();
    assert.ok(src.includes('npm install'), '缺少 npm 安装命令');
    assert.ok(src.includes('pip install'), '缺少 pip 安装命令');
    assert.ok(src.includes('go get'), '缺少 go get 命令');
  });

  it('页面背景色应为深色主题 #0f172a', () => {
    const src = readSource();
    assert.ok(src.includes('#0f172a'), '缺少深色背景');
  });
});
