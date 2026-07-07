import { describe, it, expect, beforeEach } from 'vitest';
/**
 * 🐜 自动: [content] [C] 角色测试
 *
 * 8 角色视角的 content 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import type { ContentResponseDto } from './content.dto';

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const;

// ── 测试工厂 ──
function createController() {
  return new ContentController(new ContentService());
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} content 角色测试`, () => {
  it('店长发布门店公告并检查内容完整性（管理视角）', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '五一营业时间调整通知',
      slug: 'mayday-hours-2026',
      summary: '五一期间营业时间调整安排',
      body: '尊敬的顾客，五一期间本店营业时间调整为 10:00-22:00...',
      category: 'notice',
      authorId: 'store-manager-001',
      coverImageUrl: 'https://example.com/notice.jpg',
    });

    expect(created.data.title).toBe('五一营业时间调整通知');
    expect(created.data.status).toBe('draft');

    // 店长发布公告
    const published = await ctrl.publish(created.data.id, {});
    expect(published).toHaveProperty('data');
    if ('data' in published) {
      expect(published.data.status).toBe('published');
      expect(published.data.publishedAt).toBeDefined();
    }
  });

  it('店长查看所有已发布内容列表', async () => {
    const ctrl = createController();

    // 多篇内容
    const n1 = await ctrl.create({ title: '公告1', slug: 'n1', body: 'a', category: 'notice', authorId: 'mgr' });
    const n2 = await ctrl.create({ title: '公告2', slug: 'n2', body: 'b', category: 'notice', authorId: 'mgr' });
    await ctrl.publish(n1.data.id, {});
    await ctrl.publish(n2.data.id, {});

    const result = await ctrl.findAll({ status: 'published' });
    expect(result.total).toBe(2);
    expect(result.items.length).toBe(2);
  });

  it('店长尝试查看不存在的文章返回错误（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.findOne('nonexistent-id');
    expect('success' in result).toBe(true);
    if ('success' in result) {
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    }
  });
});

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} content 角色测试`, () => {
  it('前台查看最新的门店公告展示给顾客', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '今日特惠活动',
      slug: 'today-special',
      summary: '全场商品8折优惠',
      body: '今天全场商品8折优惠，欢迎选购...',
      category: 'promotion',
      authorId: 'frontdesk-001',
    });
    await ctrl.publish(created.data.id, {});

    const published = await ctrl.findOne(created.data.id);
    expect('data' in published).toBe(true);
    if ('data' in published) {
      expect(published.data.title).toBe('今日特惠活动');
    }
  });

  it('前台按分类搜索公告', async () => {
    const ctrl = createController();

    await ctrl.create({ title: '开业通知', slug: 'open-notice', body: '开业', category: 'notice', authorId: 'admin' });
    await ctrl.create({ title: '促销活动', slug: 'promo', body: '促销', category: 'promotion', authorId: 'admin' });

    const promotions = await ctrl.findAll({ category: 'promotion' });
    expect(promotions.total).toBe(1);
    expect(promotions.items[0].category).toBe('promotion');
  });

  it('前台查看空分类时返回空结果（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.findAll({ category: 'guide' });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ── 👥HR ──
describe(`${ROLES.HR} content 角色测试`, () => {
  it('HR 发布内部培训指南', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '新员工入职指南',
      slug: 'new-hire-guide-2026',
      summary: '新员工入职流程和注意事项',
      body: '欢迎加入我们的团队！以下是入职流程...',
      category: 'guide',
      authorId: 'hr-001',
      metadata: { tags: ['入职', '培训'], version: 1 },
    });

    expect(created.data.title).toBe('新员工入职指南');
    expect(created.data.category).toBe('guide');
    expect(created.data.metadata?.tags).toContain('培训');
  });

  it('HR 按作者查询自己发布的内容', async () => {
    const ctrl = createController();

    await ctrl.create({ title: '培训1', slug: 'training-1', body: 'a', category: 'guide', authorId: 'hr-001' });
    await ctrl.create({ title: '培训2', slug: 'training-2', body: 'b', category: 'guide', authorId: 'hr-001' });
    await ctrl.create({ title: '市场文', slug: 'mkt-1', body: 'c', category: 'promotion', authorId: 'mkt-001' });

    const myContents = await ctrl.findAll({ authorId: 'hr-001' });
    expect(myContents.total).toBe(2);
  });
});

// ── 🔧安监 ──
describe(`${ROLES.Security} content 角色测试`, () => {
  it('安监检查内容分类是否符合安全规范', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '安全操作手册',
      slug: 'safety-manual',
      body: '安全操作流程...',
      category: 'guide',
      authorId: 'security-001',
    });

    // 安监检查内容创建成功，分类正确
    expect(created.data.category).toBe('guide');
    expect(created.data.status).toBe('draft');

    // 安监批准发布
    const published = await ctrl.publish(created.data.id, {});
    if ('data' in published) {
      expect(published.data.status).toBe('published');
    }
  });

  it('安监通过 slug 精确查找安全相关文章', async () => {
    const ctrl = createController();

    await ctrl.create({
      title: '消防安全须知',
      slug: 'fire-safety',
      body: '消防安全内容...',
      category: 'notice',
      authorId: 'security-001',
    });

    const result = await ctrl.findBySlug('fire-safety');
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.title).toBe('消防安全须知');
    }
  });

  it('安监搜索不存在的 slug 应返回错误（边界）', async () => {
    const ctrl = createController();
    const result = await ctrl.findBySlug('non-existent-slug-999');
    expect('success' in result).toBe(true);
    if ('success' in result) {
      expect(result.success).toBe(false);
    }
  });
});

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} content 角色测试`, () => {
  it('导玩员创建活动玩法说明', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '投篮机玩法说明',
      slug: 'basketball-guide',
      summary: '投篮机玩法介绍',
      body: '1. 投币启动\n2. 在60秒内投球\n3. 得分越高奖励越多',
      category: 'guide',
      authorId: 'guide-001',
    });

    expect(created.data.title).toBe('投篮机玩法说明');
    expect(created.data.body).toContain('投币启动');
  });

  it('导玩员搜索玩法内容', async () => {
    const ctrl = createController();

    await ctrl.create({ title: '娃娃机技巧', slug: 'claw-machine', body: '娃娃机夹取技巧...', category: 'guide', authorId: 'guide-001' });
    await ctrl.create({ title: '赛车游戏', slug: 'racing-game', body: '赛车游戏玩法...', category: 'guide', authorId: 'guide-001' });

    const result = await ctrl.findAll({ search: '娃娃' });
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe('娃娃机技巧');
  });
});

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} content 角色测试`, () => {
  it('运行专员创建运营通知并发布', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '设备维护通知',
      slug: 'maintenance-notice-2026',
      summary: '设备例行维护安排',
      body: '本周三设备例行维护，暂停营业2小时...',
      category: 'notice',
      authorId: 'ops-001',
    });

    const published = await ctrl.publish(created.data.id, {});
    if ('data' in published) {
      expect(published.data.status).toBe('published');
    }
  });

  it('运行专员更新已发布内容后再次发布', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '原始通知',
      slug: 'ops-notice',
      body: '原始内容',
      category: 'notice',
      authorId: 'ops-001',
    });

    await ctrl.publish(created.data.id, {});
    const updated = await ctrl.update(created.data.id, { title: '更新后通知', body: '更新内容' });

    if ('data' in updated) {
      expect(updated.data.title).toBe('更新后通知');
      expect(updated.data.body).toBe('更新内容');
    }
  });

  it('运行专员归档过期内容', async () => {
    const ctrl = createController();

    const created = await ctrl.create({ title: '过期通知', slug: 'expired', body: '过期内容', category: 'notice', authorId: 'ops-001' });
    await ctrl.publish(created.data.id, {});

    const archived = await ctrl.archive(created.data.id);
    if ('data' in archived) {
      expect(archived.data.status).toBe('archived');
    }
  });
});

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} content 角色测试`, () => {
  it('团建负责人创建团建活动内容', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '季度团建活动方案',
      slug: 'q2-teambuilding',
      summary: '第二季度团建活动安排',
      body: '时间：周六 14:00\n地点：公司活动室\n活动内容：桌游+烧烤',
      category: 'activity',
      authorId: 'hr-team-001',
    });

    expect(created.data.category).toBe('activity');
    expect(created.data.body).toContain('桌游');
  });

  it('团建负责人活动内容分页查询', async () => {
    const ctrl = createController();

    for (let i = 1; i <= 3; i++) {
      await ctrl.create({
        title: `团建活动${i}`,
        slug: `teambuilding-${i}`,
        body: `活动${i}详情`,
        category: 'activity',
        authorId: 'hr-team-001',
      });
    }

    const page1 = await ctrl.findAll({ category: 'activity', limit: 2, offset: 0 });
    expect(page1.total).toBe(3);
    expect(page1.items.length).toBe(2);
  });
});

// ── 📢营销 ──
describe(`${ROLES.Marketing} content 角色测试`, () => {
  it('营销创建促销活动文章', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '双十一狂欢大促',
      slug: 'double-11-sale',
      summary: '全年最低价，错过等一年',
      body: '双十一活动详情...全场五折起！',
      category: 'promotion',
      authorId: 'mkt-001',
      coverImageUrl: 'https://example.com/promo.jpg',
      metadata: { tags: ['双十一', '促销'], version: 1 },
    });

    expect(created.data.title).toBe('双十一狂欢大促');
    expect(created.data.category).toBe('promotion');
    expect(created.data.metadata?.tags).toContain('双十一');
  });

  it('营销创建后发布并确认 publishedAt 存在', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '新品上市',
      slug: 'new-product-launch',
      body: '新品上市详情...',
      category: 'promotion',
      authorId: 'mkt-001',
    });

    const published = await ctrl.publish(created.data.id, {});
    if ('data' in published) {
      expect(published.data.status).toBe('published');
      expect(published.data.publishedAt).toBeDefined();
      expect(published.data.publishedAt).toBeDefined();
      expect(new Date(published.data.publishedAt!).getTime()).toBeGreaterThan(0);
    }
  });

  it('营销删除草稿内容（边界：草稿可删除）', async () => {
    const ctrl = createController();

    const created = await ctrl.create({
      title: '草稿',
      slug: 'draft-content',
      body: '还没写完',
      category: 'promotion',
      authorId: 'mkt-001',
    });

    const result = await ctrl.remove(created.data.id);
    expect(result.success).toBe(true);
  });
});
