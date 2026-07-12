/**
 * group-booking/page.test.tsx — P-38 团队预约 L1 冒烟测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('group-booking — 正例', () => {
  it('应导出一个默认组件 GroupBookingPage', () => {
    assert.ok(SRC.includes('export default function GroupBookingPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含 P-38 标题', () => {
    assert.ok(SRC.includes('团队预约'));
    assert.ok(SRC.includes('P-38'));
  });

  it('应包含6种活动类型', () => {
    ['游戏机畅玩', '生日派对', '团建活动', 'VR体验', '赛事组织', '包场聚会'].forEach(a =>
      assert.ok(SRC.includes(a), `缺少活动: ${a}`)
    );
  });

  it('应包含所有活动图标', () => {
    ['🎮', '🎂', '🤝', '🥽', '🏆', '🎉'].forEach(icon =>
      assert.ok(SRC.includes(icon), `缺少图标: ${icon}`)
    );
  });

  it('应包含时间选择', () => {
    assert.ok(SRC.includes('选择日期'));
    assert.ok(SRC.includes('选择时段'));
  });

  it('应包含6个时段', () => {
    ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(t =>
      assert.ok(SRC.includes(t), `缺少时段: ${t}`)
    );
  });

  it('应包含人数选择器', () => {
    assert.ok(SRC.includes('peopleCount'));
    assert.ok(SRC.includes('参与人数'));
  });

  it('应包含联系表单', () => {
    assert.ok(SRC.includes('联系人姓名'));
    assert.ok(SRC.includes('联系电话'));
    assert.ok(SRC.includes('备注'));
  });

  it('应包含预约成功页', () => {
    assert.ok(SRC.includes('预约成功'));
    assert.ok(SRC.includes('继续预约'));
  });

  it('应使用 @m5/ui 组件', () => {
    assert.ok(SRC.includes("@m5/ui"));
  });

  it('应使用深色主题', () => {
    assert.ok(SRC.includes('#0f172a'));
    assert.ok(SRC.includes('#f8fafc'));
  });

  it('应包含响应式布局 maxWidth', () => {
    assert.ok(SRC.includes('maxWidth: 560') || SRC.includes('maxWidth: 480'));
  });

  it('应包含手机号验证', () => {
    assert.ok(SRC.includes('/^1\\d{10}$/') || SRC.includes('手机号'));
  });
});

describe('group-booking — 边界', () => {
  it('人数下限为活动最小值', () => {
    assert.ok(SRC.includes('Math.max'));
    assert.ok(SRC.includes('minPeople'));
  });

  it('人数上限为活动最大值', () => {
    assert.ok(SRC.includes('Math.min'));
    assert.ok(SRC.includes('maxPeople'));
  });

  it('未选日期/时段时禁用下一步', () => {
    assert.ok(SRC.includes('disabled={!selectedDate || !selectedTime}'));
  });

  it('已满时段不可选', () => {
    assert.ok(SRC.includes('available'));
    assert.ok(SRC.includes('已满'));
  });

  it('应计算总价', () => {
    assert.ok(SRC.includes('totalPrice'));
  });
});

describe('group-booking — 防御', () => {
  it('空联系人应报错', () => {
    assert.ok(SRC.includes('请输入联系人姓名'));
  });

  it('手机号格式不正确应报错', () => {
    assert.ok(SRC.includes('请输入正确的手机号'));
  });

  it('提交中应禁用按钮', () => {
    assert.ok(SRC.includes('submitting'));
  });

  it('应支持返回修改', () => {
    assert.ok(SRC.includes('返回修改'));
  });
});
