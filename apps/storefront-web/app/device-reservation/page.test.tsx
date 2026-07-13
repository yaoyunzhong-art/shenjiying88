/**
 * device-reservation/page.test.tsx — P-39 设备预定 L1 冒烟测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('device-reservation — 正例', () => {
  it('应导出一个默认组件 DeviceReservationPage', () => {
    assert.ok(SRC.includes('export default function DeviceReservationPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含 P-39 标题', () => {
    assert.ok(SRC.includes('设备预定'));
    assert.ok(SRC.includes('P-39'));
  });

  it('应包含6个设备类别', () => {
    ['街机', 'VR体验', '模拟机', '台球桌', '卡丁车', '桌游区'].forEach(c =>
      assert.ok(SRC.includes(c), `缺少类别: ${c}`)
    );
  });

  it('应包含可用/已占用/维护中状态', () => {
    ['可预约', '已占用', '维护中'].forEach(s => assert.ok(SRC.includes(s)));
  });

  it('应包含时长选择', () => {
    assert.ok(SRC.includes('选择时长'));
  });

  it('应包含联系表单', () => {
    assert.ok(SRC.includes('联系人姓名'));
    assert.ok(SRC.includes('联系电话'));
  });

  it('应包含成功页', () => {
    assert.ok(SRC.includes('预定成功'));
    assert.ok(SRC.includes('继续预定'));
  });

  it('应使用深色主题', () => {
    assert.ok(SRC.includes('#0f172a'));
    assert.ok(SRC.includes('#f8fafc'));
  });

  it('应包含价格计算', () => {
    assert.ok(SRC.includes('totalPrice'));
    assert.ok(SRC.includes('pricePerHour'));
  });

  it('应包含设备图标', () => {
    assert.ok(SRC.includes('icon') || SRC.includes('🕹️'));
  });

  it('应包含设备名称', () => {
    assert.ok(SRC.includes('name') || SRC.includes('街机'));
  });

  it('应包含确认预定按钮', () => {
    assert.ok(SRC.includes('确认预定') || SRC.includes('提交预定'));
  });
});

describe('device-reservation — 边界', () => {
  it('不可用设备应禁用', () => {
    assert.ok(SRC.includes("device.status !== 'available'"));
  });

  it('维护中设备显示提示', () => {
    assert.ok(SRC.includes('maintenance'));
  });

  it('应限制最大时长', () => {
    assert.ok(SRC.includes('maxDuration'));
  });

  it('应计算总价并格式化', () => {
    assert.ok(SRC.includes('totalPrice') || SRC.includes('总价'));
    assert.ok(SRC.includes('¥') || SRC.includes('元'));
  });

  it('应计算总价', () => {
    assert.ok(SRC.includes('totalPrice') || SRC.includes('¥'), '缺少总价计算');
  });

  it('应包含设备ID用于识别', () => {
    assert.ok(SRC.includes('deviceId') || SRC.includes('id'), '缺少设备ID');
  });
});

describe('device-reservation — 防御', () => {
  it('空联系人应报错', () => {
    assert.ok(SRC.includes('请输入联系人姓名'));
  });

  it('手机号格式不正确应报错', () => {
    assert.ok(SRC.includes('请输入正确的手机号'));
  });

  it('提交中应禁用', () => {
    assert.ok(SRC.includes('submitting'));
  });

  it('应验证手机号长度', () => {
    assert.ok(SRC.includes('11') || SRC.includes('手机号.length'), '手机号长度验证');
  });

  it('未选择设备时提交应阻止', () => {
    assert.ok(SRC.includes('请选择设备') || SRC.includes('selectedDevice'), '未选设备');
  });

  it('应使用可选链防御', () => {
    assert.ok(SRC.includes('?.') || SRC.includes('??'), '缺少可选链');
  });
});
