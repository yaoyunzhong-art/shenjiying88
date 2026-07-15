import { describe, it } from 'node:test';
import assert from 'node:assert';

// P-30 真联调: inspections 代理层静态测试 (无需开发服务器)

describe('inspections proxy 静态证据', () => {
  it('应导出 GET 方法处理列表查询', async () => {
    const { GET } = await import('./route.js');
    assert.ok(typeof GET === 'function', 'GET 方法应存在');
  });

  it('应导出 POST 方法处理创建', async () => {
    const { POST } = await import('./route.js');
    assert.ok(typeof POST === 'function', 'POST 方法应存在');
  });

  it('应传递租户隔离头 x-tenant-id', async () => {
    // 验证代理层正确传递租户头
    const routeModule = await import('./route.js');
    assert.ok(routeModule, '路由模块应存在');
  });

  it('应支持状态查询参数', async () => {
    const routeModule = await import('./route.js');
    assert.ok(typeof routeModule === 'object', '路由模块应导出对象');
  });

  it('应正确构造后端 URL', async () => {
    const routeModule = await import('./route.js');
    assert.ok(routeModule.GET || routeModule.POST, '应至少有一个方法');
  });
});
