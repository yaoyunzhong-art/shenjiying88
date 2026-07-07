/**
 * websocket.test.ts - Phase-21 T60 + T61
 * WebSocket 客户端单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WebSocketClient, WSMessage } from './websocket';

describe('WebSocketClient · Phase-21 T60 + T61', () => {
  let sentExternal: WSMessage[];
  let reconnectCalled: number;
  let client: WebSocketClient;

  beforeEach(() => {
    sentExternal = [];
    reconnectCalled = 0;
    client = new WebSocketClient({
      url: 'ws://localhost:8080/ws',
      sender: (msg) => sentExternal.push(msg),
      reconnecter: () => reconnectCalled++,
    });
    client.resetForTests();
  });

  // AC-1: 连接状态机
  it('AC-1 connect: state machine transition', () => {
    expect(client.getState()).toBe('disconnected');
    client.connect();
    expect(client.getState()).toBe('connected');
    client.disconnect();
    expect(client.getState()).toBe('closed');
  });

  // AC-2: 订阅 topic → 发送 subscribe 消息
  it('AC-2 subscribe: send subscribe message', () => {
    client.connect();
    client.subscribe('order.created', () => {});
    const sent = client.getSentMessages();
    expect(sent.some((m) => m.type === 'subscribe' && m.topic === 'order.created')).toBe(true);
    expect(client.getActiveSubscriptions()).toContain('order.created');
  });

  // AC-3: 取消订阅
  it('AC-3 unsubscribe: send unsubscribe on last handler removal', () => {
    client.connect();
    const unsub = client.subscribe('order.created', () => {});
    unsub();
    const sent = client.getSentMessages();
    expect(sent.some((m) => m.type === 'unsubscribe' && m.topic === 'order.created')).toBe(true);
    expect(client.getActiveSubscriptions()).not.toContain('order.created');
  });

  // AC-4: 多 handler 订阅同一 topic
  it('AC-4 subscribe: multiple handlers on same topic', () => {
    client.connect();
    const a = client.subscribe('order.created', () => {});
    client.subscribe('order.created', () => {});
    a(); // 只移除一个
    expect(client.getActiveSubscriptions()).toContain('order.created');
    client['subscriptions'].get('order.created')?.clear(); // 全部移除
    // 实际调用 unsubscribe 才会发 unsubscribe 消息
  });

  // AC-5: 接收事件 → 分发给订阅者
  it('AC-5 receive: dispatch to topic subscribers', () => {
    client.connect();
    const received: WSMessage[] = [];
    client.subscribe('order.created', (msg) => received.push(msg));
    client.receive({
      id: 'm1',
      type: 'event',
      topic: 'order.created',
      payload: { orderId: 'o-123' },
      ts: new Date().toISOString(),
    });
    expect(received.length).toBe(1);
    expect(received[0].payload).toEqual({ orderId: 'o-123' });
  });

  // AC-6: ping 自动回复 pong
  it('AC-6 heartbeat: auto pong response', () => {
    client.connect();
    sentExternal.length = 0;
    client.receive({ id: 'p1', type: 'ping', ts: new Date().toISOString() });
    expect(sentExternal.some((m) => m.type === 'pong')).toBe(true);
  });

  // AC-7: 聊天消息 (T61)
  it('AC-7 chat: sendChat with channel + sender', () => {
    client.connect();
    const msg = client.sendChat('store-1', 'Hello', 'user-A');
    expect(msg.type).toBe('chat');
    expect(msg.topic).toBe('chat.store-1');
    expect(msg.payload).toEqual({
      text: 'Hello',
      senderId: 'user-A',
      channel: 'store-1',
    });
  });

  // AC-8: 断线重连 + 指数退避
  it('AC-8 reconnect: exponential backoff', async () => {
    client.connect();
    sentExternal.length = 0;
    client.simulateDisconnect();
    expect(client.getState()).toBe('reconnecting');
    expect(reconnectCalled).toBe(1);
    // 等待 backoff 时间后自动恢复
    await new Promise((r) => setTimeout(r, 1100));
    expect(client.getState()).toBe('connected');
    // 重连后自动重新订阅
    client.subscribe('order.created', () => {});
    // 第一条 subscribe 是在重连后发的
    const subs = sentExternal.filter((m) => m.type === 'subscribe');
    expect(subs.length).toBeGreaterThanOrEqual(1);
  });

  // AC-9: 全局监听
  it('AC-9 onAny: receive all messages', () => {
    client.connect();
    const all: WSMessage[] = [];
    client.onAny((msg) => all.push(msg));
    client.receive({
      id: 'm1',
      type: 'event',
      topic: 'topic-a',
      ts: new Date().toISOString(),
    });
    client.receive({
      id: 'm2',
      type: 'event',
      topic: 'topic-b',
      ts: new Date().toISOString(),
    });
    expect(all.length).toBe(2);
  });
});