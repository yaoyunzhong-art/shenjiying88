/**
 * DeliveryTimeline 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeliveryTimeline, type TrackingEvent } from './DeliveryTimeline';

describe('DeliveryTimeline', () => {
  const mockEvents: TrackingEvent[] = [
    { id: 'e1', timestamp: '2026-07-08T10:00:00Z', description: '包裹已揽收', status: 'completed', location: '深圳分拣中心' },
    { id: 'e2', timestamp: '2026-07-08T14:30:00Z', description: '离开中转站', status: 'completed', location: '广州中转站' },
    { id: 'e3', timestamp: '2026-07-08T18:00:00Z', description: '到达派送站', status: 'current', location: '上海浦东派送站' },
    { id: 'e4', timestamp: '2026-07-09T08:00:00Z', description: '派送中', status: 'pending', location: '上海浦东' },
    { id: 'e5', timestamp: '2026-07-09T12:00:00Z', description: '已签收', status: 'pending', location: '上海浦东' },
  ];

  it('renders timeline container', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={mockEvents} />);
    assert.ok(html.includes('data-testid="delivery-timeline"'));
  });

  it('renders all events', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={mockEvents} />);
    assert.ok(html.includes('包裹已揽收'));
    assert.ok(html.includes('离开中转站'));
    assert.ok(html.includes('到达派送站'));
    assert.ok(html.includes('派送中'));
    assert.ok(html.includes('已签收'));
  });

  it('renders tracking number and carrier', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={mockEvents} trackingNumber="SF1234567890" carrier="顺丰速运" />
    );
    assert.ok(html.includes('SF1234567890'));
    assert.ok(html.includes('顺丰速运'));
  });

  it('shows empty state when no events', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={[]} />);
    assert.ok(html.includes('暂无物流信息'));
    assert.ok(html.includes('data-testid="delivery-timeline-empty"'));
  });

  it('does not show empty state when events exist', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={mockEvents} />);
    assert.ok(!html.includes('暂无物流信息'));
  });

  it('renders event locations', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={mockEvents} />);
    assert.ok(html.includes('深圳分拣中心'));
    assert.ok(html.includes('广州中转站'));
    assert.ok(html.includes('上海浦东'));
  });

  it('renders completed dot with checkmark', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={[mockEvents[0]]} />);
    assert.ok(html.includes('✓'));
  });

  it('renders note when provided', () => {
    const eventsWithNote: TrackingEvent[] = [
      { id: 'e1', timestamp: '2026-07-08T10:00:00Z', description: '已签收', status: 'completed', note: '家人代签' },
    ];
    const html = renderToStaticMarkup(<DeliveryTimeline events={eventsWithNote} />);
    assert.ok(html.includes('家人代签'));
  });

  it('handles undefined/null events gracefully', () => {
    const html = renderToStaticMarkup(<DeliveryTimeline events={undefined as unknown as TrackingEvent[]} />);
    assert.ok(html.includes('暂无物流信息'));
  });
});
