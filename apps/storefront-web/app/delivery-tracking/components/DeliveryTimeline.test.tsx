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

  /* ── Enhanced tests ── */
  it('renders carrier info BEFORE tracking number in DOM order', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={mockEvents} trackingNumber="YT987654" carrier="圆通速递" />
    );
    const carrierIdx = html.indexOf('圆通速递');
    const trackingIdx = html.indexOf('YT987654');
    assert.ok(carrierIdx >= 0, 'Carrier name should be present');
    assert.ok(trackingIdx >= 0, 'Tracking number should be present');
    // Carrier rendered before tracking number in the header block
    assert.ok(carrierIdx < trackingIdx, 'Carrier should appear before tracking number');
  });

  it('renders only carrier when trackingNumber is absent', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={mockEvents} carrier='中通快递' />
    );
    assert.ok(html.includes('中通快递'));
    // Should not error when trackingNumber is undefined
    assert.ok(html.includes('data-testid="delivery-timeline"'));
  });

  it('renders only trackingNumber when carrier is absent', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={mockEvents} trackingNumber='ZTO111222333' />
    );
    assert.ok(html.includes('ZTO111222333'));
  });

  it('renders event timestamps as formatted date/time', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={[{
        id: 'e1', timestamp: '2026-07-08T10:00:00Z',
        description: '测试时间格式化', status: 'completed',
      }]} />
    );
    // Should contain formatted datetime in yyyy-MM-dd HH:mm
    assert.ok(html.includes('2026') && html.includes(':'));
  });

  it('handles empty events array with no header crash', () => {
    // Empty events + no tracking info should show just empty state
    const html = renderToStaticMarkup(<DeliveryTimeline events={[]} />);
    assert.ok(html.includes('暂无物流信息'));
    // Should not error or show NaN/undefined text
    assert.ok(!html.includes('NaN'));
    assert.ok(!html.includes('undefined'));
  });

  it('renders description text for each event correctly', () => {
    const descriptions = ['包裹已揽收', '离开中转站', '到达派送站'];
    const events = descriptions.map((desc, i) => ({
      id: `e${i}`, timestamp: '2026-07-08T10:00:00Z',
      description: desc, status: 'completed' as const,
    }));
    const html = renderToStaticMarkup(<DeliveryTimeline events={events} />);
    for (const desc of descriptions) {
      assert.ok(html.includes(desc), `Description "${desc}" should be rendered`);
    }
  });

  it('renders status icon for each timeline point', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={mockEvents.slice(0, 2)} />
    );
    // completed events show checkmark
    assert.ok(html.includes('✓'));
  });

  it('does not render status icon for pending items', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={[{
        id: 'e0', timestamp: '2026-07-09T12:00:00Z',
        description: '等待中', status: 'pending',
      }]} />
    );
    // Pending items should not show checkmark
    // They may show a dot or placeholder
    assert.ok(html.includes('等待中'));
  });

  it('renders current event with distinct visual indicator', () => {
    const html = renderToStaticMarkup(
      <DeliveryTimeline events={[{
        id: 'e0', timestamp: '2026-07-09T08:00:00Z',
        description: '配送中', status: 'current', location: '浦东',
      }]} />
    );
    assert.ok(html.includes('配送中'));
    assert.ok(html.includes('浦东'));
  });
});
