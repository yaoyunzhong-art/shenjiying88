/**
 * WP-01A · 超时降级与错误包装测试
 *
 * 覆盖：
 * - 错误类型分类（network / protocol / business / unknown）
 * - 超时降级配置验证
 * - 降级后的缓存/fallback 行为模拟
 */
import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { MockLytAdapter } from './adapters/mock-lyt.adapter';
import { LytNotImplementedError, RealLytAdapter } from './adapters/real-lyt.adapter';

describe('WP-01A: 超时降级与错误包装', () => {
  const adapter = new MockLytAdapter();

  // ── 错误类型分类 ──────────────────────────────

  describe('错误分类: network', () => {
    it('TimeoutError 归类为 network', () => {
      const err = new Error('request timed out');
      err.name = 'TimeoutError';
      const info = adapter.wrapError(err, { path: '/orders' });
      assert.equal(info.category, 'network');
      assert.equal(info.code, 'LYT_TIMEOUT');
      assert.equal(info.retryable, true);
    });

    it('AbortError 归类为 network', () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      const info = adapter.wrapError(err, { path: '/orders' });
      assert.equal(info.category, 'network');
      assert.equal(info.code, 'LYT_ABORTED');
      assert.equal(info.retryable, true);
    });

    it('ECONNREFUSED 归类为 network', () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:8080');
      const info = adapter.wrapError(err, { path: '/connect' });
      assert.equal(info.category, 'network');
      assert.equal(info.code, 'LYT_CONNECTION_REFUSED');
    });
  });

  describe('错误分类: business', () => {
    it('"invalid" 消息归类为 business', () => {
      const err = new Error('invalid member id');
      const info = adapter.wrapError(err);
      assert.equal(info.category, 'business');
      assert.equal(info.retryable, false);
    });

    it('"rejected" 消息归类为 business', () => {
      const err = new Error('payment rejected: insufficient balance');
      const info = adapter.wrapError(err);
      assert.equal(info.category, 'business');
    });

    it('"denied" 消息归类为 business', () => {
      const err = new Error('access denied for operation');
      const info = adapter.wrapError(err);
      assert.equal(info.category, 'business');
    });
  });

  describe('错误分类: protocol', () => {
    it('JSON parse 错误归类为 protocol', () => {
      const err = new Error('Unexpected token < in JSON at position 0');
      const info = adapter.wrapError(err);
      assert.equal(info.category, 'protocol');
      assert.equal(info.retryable, false);
    });
  });

  describe('错误分类: unknown', () => {
    it('无匹配关键词的 Error 归类为 unknown', () => {
      const err = new Error('something unexpected happened');
      const info = adapter.wrapError(err);
      assert.equal(info.category, 'unknown');
    });

    it('非 Error 对象归类为 unknown', () => {
      const info = adapter.wrapError('raw error string');
      assert.equal(info.category, 'unknown');
    });

    it('null 归类为 unknown', () => {
      const info = adapter.wrapError(null);
      assert.equal(info.category, 'unknown');
    });
  });

  // ── 超时降级配置 ──────────────────────────────

  describe('超时降级配置', () => {
    it('Mock 取到默认降级配置', () => {
      const cfg = adapter.getTimeoutDowngradeConfig();
      assert.equal(cfg.connectTimeoutMs, 3000);
      assert.equal(cfg.readTimeoutMs, 5000);
      assert.equal(cfg.useCacheOnTimeout, true);
      assert.equal(cfg.useFallbackOnTimeout, true);
      assert.equal(cfg.downgradeLogLevel, 'warn');
    });

    it('降级配置包含缓存 TTL', () => {
      const cfg = adapter.getTimeoutDowngradeConfig();
      assert.equal(cfg.cacheTtlMs, 60000);
    });

    it('RealLytAdapter 也可获取降级配置', () => {
      const { ConfigService } = require('@nestjs/config');
      const realAdapter = new RealLytAdapter(new ConfigService());
      const cfg = realAdapter.getTimeoutDowngradeConfig();
      assert.equal(cfg.connectTimeoutMs, 5000);
      assert.equal(cfg.readTimeoutMs, 10000);
      assert.equal(cfg.useCacheOnTimeout, true);
      assert.equal(cfg.useFallbackOnTimeout, true);
      assert.equal(cfg.downgradeLogLevel, 'warn');
    });
  });

  // ── NotImplementedError ────────────────────────

  describe('LytNotImplementedError (BLK-LYT-001)', () => {
    it('包含正确的 blockerId', () => {
      const err = new LytNotImplementedError('testMethod', 'TestAdapter');
      assert.equal(err.blockerId, 'BLK-LYT-001');
      assert.ok(err.message.includes('testMethod'));
      assert.ok(err.message.includes('TestAdapter'));
      assert.ok(err.message.includes('blocked by missing LYT api spec'));
    });

    it('methodName 可查询', () => {
      const err = new LytNotImplementedError('query', 'RealLytAdapter');
      assert.equal(err.methodName, 'query');
      assert.equal(err.adapterName, 'RealLytAdapter');
    });
  });

  // ── isRetryable ────────────────────────────────

  describe('isRetryable', () => {
    it('network 错误可重试', () => {
      const info = adapter.wrapError(new Error('timeout'));
      assert.equal(adapter.isRetryable(info), true);
    });

    it('business 错误不可重试', () => {
      const info = adapter.wrapError(new Error('invalid data'));
      assert.equal(adapter.isRetryable(info), false);
    });

    it('protocol 错误不可重试', () => {
      const info = adapter.wrapError(new Error('parse error'));
      assert.equal(adapter.isRetryable(info), false);
    });

    it('unknown 错误不可重试', () => {
      const info = adapter.wrapError('unknown error');
      assert.equal(adapter.isRetryable(info), false);
    });
  });
});
