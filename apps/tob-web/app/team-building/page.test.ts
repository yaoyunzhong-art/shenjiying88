import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

describe('TeamBuilding', () => {
  it('has Tab navigation with 3 tabs', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('活动列表') && src.includes('活动详情') && src.includes('成员表现'),
      'missing tab navigation'
    );
  });

  it('has event status display (upcoming/completed/ongoing)', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('即将开始') || src.includes('进行中') || src.includes('已完成'),
      'missing event status display'
    );
  });

  it('has event card with basic info (name/date/participants)', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('活动日期') && src.includes('参与人数'),
      'missing event card basic info'
    );
  });

  it('has TeamBuildingEvent type and MOCK_EVENTS', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(
      data.includes('TeamBuildingEvent') && data.includes('MOCK_EVENTS') && data.includes('MOCK_REPORTS'),
      'missing TeamBuildingEvent type or MOCK data'
    );
  });

  it('has EventReport type with AI generated report fields', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(
      data.includes('EventReport') && data.includes('summary') && data.includes('satisfactionScore'),
      'missing EventReport type or report fields'
    );
  });

  it('has service functions', () => {
    const service = readSource('team-building-service.ts');
    assert.ok(
      service.includes('getEvents') &&
      service.includes('getReport') &&
      service.includes('generateReport') &&
      service.includes('getMemberPerformances'),
      'missing service functions'
    );
  });
});
