/**
 * page.test.tsx — 导玩员工作台 L1 冒烟测试
 * 角色视角: 🎮 导玩员
 *
 * 覆盖: 正例 · 数据完整性 · 边界防御
 *
 * 采用源码静态检查（readFileSync），避开 JSX/React 运行时依赖
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('🎮 导玩员视角: 页面默认导出是函数组件', () => {
  const src = readSource();
  assert.ok(src.includes('export default function GuideWorkbenchPage'), '缺少默认导出');
});

test('🎮 导玩员视角: 使用 PageShell 组件', () => {
  const src = readSource();
  assert.ok(src.includes('PageShell'), '缺少 PageShell');
});

test('🎮 导玩员视角: 包含 "use client" 声明', () => {
  const src = readSource();
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('🎮 导玩员视角: 标题包含导玩员工作台', () => {
  const src = readSource();
  assert.ok(src.includes('导玩员工作台'), '缺少标题');
});

test('🎮 导玩员视角: 渲染 KPI 指标', () => {
  const src = readSource();
  const metrics = ['待服务', '已处理', '设备巡检', '今日接待'];
  for (const m of metrics) {
    assert.ok(src.includes(m), `缺少指标「${m}」`);
  }
});

test('🎮 导玩员视角: 渲染服务队列板块', () => {
  const src = readSource();
  assert.ok(src.includes('服务队列'), '缺少服务队列');
});

test('🎮 导玩员视角: 渲染设备巡检板块', () => {
  const src = readSource();
  assert.ok(src.includes('设备巡检'), '缺少设备巡检');
});

test('🎮 导玩员视角: 渲染完成巡检按钮', () => {
  const src = readSource();
  assert.ok(src.includes('完成巡检'), '缺少完成巡检按钮');
});

test('🎮 导玩员视角: 渲染报修按钮', () => {
  const src = readSource();
  assert.ok(src.includes('报修'), '缺少报修按钮');
});

test('🎮 导玩员视角: 引用 @m5/ui 组件', () => {
  const src = readSource();
  assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
});

/* =================================================================
 * 数据完整性
 * ================================================================= */

test('🎮 导玩员视角: 渲染设备巡检列表', () => {
  const src = readSource();
  const devices = ['拳皇街机', '赛车模拟器', '娃娃机', 'VR体验', '投篮机'];
  const foundDevices = devices.filter(d => src.includes(d));
  assert.ok(foundDevices.length >= 3, `应包含至少 3 个设备巡检项, 实际 ${foundDevices.length}`);
});

test('🎮 导玩员视角: 设备巡检包含正常/告警/故障状态', () => {
  const src = readSource();
  assert.ok(src.includes('normal'), '应包含 normal 状态');
  assert.ok(src.includes('warning'), '应包含 warning 状态');
  assert.ok(src.includes('fault'), '应包含 fault 状态');
});

test('🎮 导玩员视角: 包含服务队列数据', () => {
  const src = readSource();
  assert.ok(src.includes('generateServices'), '应包含 generateServices 函数');
  assert.ok(src.includes('ServiceItem'), '应包含 ServiceItem 类型');
});

/* =================================================================
 * 边界防御
 * ================================================================= */

test('🎮 导玩员视角: 定义 ServiceItem 类型', () => {
  const src = readSource();
  assert.ok(src.includes('interface ServiceItem'), '缺少 ServiceItem 接口');
});

test('🎮 导玩员视角: 定义 DeviceCheckStatus 类型', () => {
  const src = readSource();
  assert.ok(src.includes('type DeviceCheckStatus'), '缺少 DeviceCheckStatus 类型');
});

test('🎮 导玩员视角: 包含 SERVICE_TYPE 映射表', () => {
  const src = readSource();
  assert.ok(src.includes('SERVICE_TYPE'), '缺少 SERVICE_TYPE');
});

test('🎮 导玩员视角: 包含 STATUS_V 映射表', () => {
  const src = readSource();
  assert.ok(src.includes('STATUS_V'), '缺少 STATUS_V');
});
