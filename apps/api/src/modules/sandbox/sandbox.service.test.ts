// sandbox.service.test.ts - T116-2
// 沙箱环境管理服务单元测试

import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxService } from './sandbox.service';

describe('SandboxService', () => {
  let service: SandboxService;

  beforeEach(() => {
    service = new SandboxService();
  });

  // ── createEnvironment ─────────────────────────────────────────────────────

  describe('createEnvironment', () => {
    it('应为租户创建沙箱环境并返回环境对象', () => {
      const env = service.createEnvironment('tenant-1', { name: '测试环境' });
      expect(env.envId).toBeTruthy();
      expect(env.envId).toMatch(/^env-/);
      expect(env.tenantId).toBe('tenant-1');
      expect(env.name).toBe('测试环境');
      expect(env.status).toBe('RUNNING');
      expect(env.createdAt).toBeTruthy();
    });

    it('应为不同租户分别创建环境', () => {
      const env1 = service.createEnvironment('t1', { name: 'Env A' });
      const env2 = service.createEnvironment('t2', { name: 'Env B' });
      expect(env1.envId).not.toBe(env2.envId);
      expect(env1.tenantId).toBe('t1');
      expect(env2.tenantId).toBe('t2');
    });
  });

  // ── listEnvironments ─────────────────────────────────────────────────────

  describe('listEnvironments', () => {
    it('没有环境时返回空数组', () => {
      const list = service.listEnvironments('any-tenant');
      expect(list).toEqual([]);
    });

    it('应返回指定租户的所有环境', () => {
      service.createEnvironment('t1', { name: 'E1' });
      service.createEnvironment('t1', { name: 'E2' });
      service.createEnvironment('t2', { name: 'E3' });
      const t1list = service.listEnvironments('t1');
      const t2list = service.listEnvironments('t2');
      expect(t1list).toHaveLength(2);
      expect(t2list).toHaveLength(1);
    });
  });

  // ── getEnvironment ───────────────────────────────────────────────────────

  describe('getEnvironment', () => {
    it('应返回指定环境', () => {
      const created = service.createEnvironment('t1', { name: 'Test' });
      const found = service.getEnvironment(created.envId);
      expect(found).toBeDefined();
      expect(found!.name).toBe('Test');
    });

    it('不存在的环境返回 undefined', () => {
      expect(service.getEnvironment('env-nonexistent')).toBeUndefined();
    });
  });

  // ── stopEnvironment ──────────────────────────────────────────────────────

  describe('stopEnvironment', () => {
    it('应停止存在的环境', () => {
      const env = service.createEnvironment('t1', { name: 'Test' });
      const result = service.stopEnvironment(env.envId);
      expect(result).toBe(true);
      expect(service.getEnvironment(env.envId)!.status).toBe('STOPPED');
    });

    it('不存在的环境返回 false', () => {
      expect(service.stopEnvironment('env-missing')).toBe(false);
    });
  });

  // ── startEnvironment ─────────────────────────────────────────────────────

  describe('startEnvironment', () => {
    it('应启动已停止的环境', () => {
      const env = service.createEnvironment('t1', { name: 'Test' });
      service.stopEnvironment(env.envId);
      const result = service.startEnvironment(env.envId);
      expect(result).toBe(true);
      expect(service.getEnvironment(env.envId)!.status).toBe('RUNNING');
    });

    it('不存在的环境返回 false', () => {
      expect(service.startEnvironment('env-missing')).toBe(false);
    });
  });

  // ── deleteEnvironment ────────────────────────────────────────────────────

  describe('deleteEnvironment', () => {
    it('应删除存在的环境', () => {
      const env = service.createEnvironment('t1', { name: 'Test' });
      const result = service.deleteEnvironment(env.envId);
      expect(result).toBe(true);
      expect(service.getEnvironment(env.envId)).toBeUndefined();
    });

    it('不存在的环境返回 false', () => {
      expect(service.deleteEnvironment('env-missing')).toBe(false);
    });
  });

  // ── 边界情况 ──────────────────────────────────────────────────────────────

  describe('边界情况', () => {
    it('大量环境应能正常列出', () => {
      for (let i = 0; i < 100; i++) {
        service.createEnvironment('t1', { name: `Env-${i}` });
      }
      expect(service.listEnvironments('t1')).toHaveLength(100);
    });

    it('同一租户多次创建返回不同 envId', () => {
      const a = service.createEnvironment('t1', { name: 'A' });
      const b = service.createEnvironment('t1', { name: 'B' });
      expect(a.envId).not.toBe(b.envId);
    });
  });
});
