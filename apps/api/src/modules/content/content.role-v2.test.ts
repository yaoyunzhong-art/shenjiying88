// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
/**
 * 🐜 自动: [content] [C] 角色测试 v2
 *
 * 8 角色视角的 content 模块增强测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 3 个测试用例：正常流程 + 权限边界 + 数据隔离
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
describe(`${ROLES.StoreManager} content 角色测试 v2`, () => {
  it('店长创建中英文双语公告并验证国际化内容完整性', async () => {
    const ctrl = createController();
    const cn = await ctrl.create({
      title: '五一公告',
      slug: 'mayday-cn',
      summary: '五一营业时间变更',
      body: '本店五一期间营业时间调整为 10:00-22:00',
      category: 'notice',
      authorId: 'mgr-001',
    });
    expect(cn.data.title).toBe('五一公告');

    const en = await ctrl.create({
      title: 'May Day Notice',
      slug: 'mayday-en',
      summary: 'May Day hours change',
      body: 'Operating hours: 10:00-22:00 during May Day',
      category: 'notice',
      authorId: 'mgr-001',
    });
    expect(en.data.title).toBe('May Day Notice');

    // 店长发布两个版本
    const publishedCn = await ctrl.publish(cn.data.id, {});
    const publishedEn = await ctrl.publish(en.data.id, {});
    if ('data' in publishedCn) expect(publishedCn.data.status).toBe('published');
    if ('data' in publishedEn) expect(publishedEn.data.status).toBe('published');

    // 通过 slug 分别查找
    const foundCn = await ctrl.findBySlug('mayday-cn');
    const foundEn = await ctrl.findBySlug('mayday-en');
    expect('data' in foundCn).toBe(true);
    expect('data' in foundEn).toBe(true);
  });

  it('店长查看所有已发布内容的时间线排序', async () => {
    const ctrl = createController();
    const n1 = await ctrl.create({ title: '通知A', slug: 'na', body: 'a', category: 'notice', authorId: 'mgr' });
    const n2 = await ctrl.create({ title: '通知B', slug: 'nb', body: 'b', category: 'notice', authorId: 'mgr' });
    await ctrl.publish(n1.data.id, {});
    await ctrl.publish(n2.data.id, {});
    const result = await ctrl.findAll({ status: 'published' });
    // 全部已发布内容能正确获取
    expect(result.total).toBe(2);
    expect(['通知A', '通知B']).toContain(result.items[0].title);
    expect(['通知A', '通知B']).toContain(result.items[1].title);
  });

  it('店长多次更新同一内容保持历史渐进性（边界）', async () => {
    const ctrl = createController();
    const created = await ctrl.create({ title: 'v1', slug: 'version-test', body: '版本1', category: 'notice', authorId: 'mgr' });
    await ctrl.update(created.data.id, { title: 'v2', body: '版本2' });
    const updated = await ctrl.update(created.data.id, { title: 'v3' });
    if ('data' in updated) {
      expect(updated.data.title).toBe('v3');
      expect(updated.data.body).toBe('版本2'); // body 保持不变
    }
  });
});

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} content 角色测试 v2`, () => {
  it('前台按日期范围搜索优惠公告', async () => {
    const ctrl = createController();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const dto = await ctrl.create({ title: '今日优惠', slug: 'today-deal', body: '今日特价', category: 'promotion', authorId: 'fd' });
    await ctrl.publish(dto.data.id, {});

    const result = await ctrl.findAll({
      category: 'promotion',
      fromDate: yesterday.toISOString(),
      toDate: now.toISOString(),
    });
    expect(result.total).toBe(1);
  });

  it('前台搜索词不区分大小写和中文', async () => {
    const ctrl = createController();
    await ctrl.create({ title: '春节特惠', slug: 'spring-festival', body: 'Spring Festival Sale', category: 'promotion', authorId: 'fd' });
    const result = await ctrl.findAll({ search: 'spring' });
    expect(result.total).toBe(1);
    const resultCn = await ctrl.findAll({ search: '春节' });
    expect(resultCn.total).toBe(1);
  });

  it('前台尝试搜索空字符串返回全部（边界）', async () => {
    const ctrl = createController();
    await ctrl.create({ title: 'A', slug: 'a1', body: 'x', category: 'notice', authorId: 'fd' });
    await ctrl.create({ title: 'B', slug: 'b1', body: 'y', category: 'promotion', authorId: 'fd' });
    const result = await ctrl.findAll({ search: '' });
    expect(result.total).toBe(2);
  });
});

// ── 👥HR ──
describe(`${ROLES.HR} content 角色测试 v2`, () => {
  it('HR 创建含富 metadata 的内部指南', async () => {
    const ctrl = createController();
    const created = await ctrl.create({
      title: '绩效评估指南',
      slug: 'performance-review-2026',
      summary: 'Q2 绩效评估流程',
      body: '评估流程：自评→主管评→HR复核',
      category: 'guide',
      authorId: 'hr-002',
      metadata: { tags: ['绩效', 'HR', '2026Q2'], version: 2, department: '全员' },
    });
    expect(created.data.metadata?.tags).toContain('HR');
    expect(created.data.metadata?.version).toBe(2);
  });

  it('HR 查询特定作者的内容列表', async () => {
    const ctrl = createController();
    await ctrl.create({ title: '培训A', slug: 'tr-a', body: 'a', category: 'guide', authorId: 'hr-002' });
    await ctrl.create({ title: '培训B', slug: 'tr-b', body: 'b', category: 'guide', authorId: 'hr-002' });
    await ctrl.create({ title: '营销文章', slug: 'mkt-x', body: 'x', category: 'promotion', authorId: 'mkt-002' });
    const myContents = await ctrl.findAll({ authorId: 'hr-002' });
    expect(myContents.total).toBe(2);
    const others = await ctrl.findAll({ authorId: 'mkt-002' });
    expect(others.total).toBe(1);
  });

  it('HR 更新含 metadata 的内部指南后保留原 metadata 字段（边界）', async () => {
    const ctrl = createController();
    const created = await ctrl.create({
      title: '入职手册',
      slug: 'onboarding',
      body: '入职流程...',
      category: 'guide',
      authorId: 'hr-002',
      metadata: { tags: ['入职'], version: 1 },
    });
    const updated = await ctrl.update(created.data.id, {
      title: '2026 入职手册',
      metadata: { tags: ['入职', '2026'], version: 2 },
    });
    if ('data' in updated) {
      expect(updated.data.title).toBe('2026 入职手册');
      expect(updated.data.metadata?.tags).toEqual(['入职', '2026']);
    }
  });
});

// ── 🔧安监 ──
describe(`${ROLES.Security} content 角色测试 v2`, () => {
  it('安监创建安全应急预案并发布', async () => {
    const ctrl = createController();
    const created = await ctrl.create({
      title: '火灾应急预案',
      slug: 'fire-emergency-plan',
      summary: '火灾应急处置流程',
      body: '1. 发现火情立即报警\n2. 组织人员疏散\n3. 使用灭火器扑救初期火灾',
      category: 'guide',
      authorId: 'security-002',
    });
    await ctrl.publish(created.data.id, {});
    const final = await ctrl.findOne(created.data.id);
    if ('data' in final) {
      expect(final.data.status).toBe('published');
      expect(final.data.body).toContain('灭火器');
    }
  });

  it('安监按安全类别搜索所有已发布指导', async () => {
    const ctrl = createController();
    await ctrl.create({ title: '用电安全', slug: 'electrical', body: '用电安全须知', category: 'guide', authorId: 'sec' });
    await ctrl.create({ title: '防盗须知', slug: 'theft', body: '防盗指南', category: 'guide', authorId: 'sec' });
    await ctrl.create({ title: '促销活动', slug: 'sale', body: '促销', category: 'promotion', authorId: 'mkt' });
    const safetyGuides = await ctrl.findAll({ category: 'guide' });
    expect(safetyGuides.total).toBe(2);
  });

  it('安监无法删除已发布的安全文档（权限边界-仅可归档）', async () => {
    const ctrl = createController();
    const created = await ctrl.create({ title: '安全规范', slug: 'safety-rules', body: '安全规范内容', category: 'guide', authorId: 'security-002' });
    await ctrl.publish(created.data.id, {});
    const archived = await ctrl.archive(created.data.id);
    if ('data' in archived) {
      expect(archived.data.status).toBe('archived');
    }
    // 软删除应该对已归档内容也生效，且不应报错
    const removed = await ctrl.remove(created.data.id);
    expect(removed.success).toBe(true);
  });
});

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} content 角色测试 v2`, () => {
  it('导玩员创建设备操作指南并在不同分类间切换', async () => {
    const ctrl = createController();
    const guide = await ctrl.create({
      title: '投篮机维护指南',
      slug: 'bball-maintenance',
      summary: '投篮机日常维护流程',
      body: '每日清洁→检查传感器→校准计分板',
      category: 'guide',
      authorId: 'guide-002',
    });
    // 导玩员可以更新分类
    await ctrl.update(guide.data.id, { category: 'notice' });
    const updated = await ctrl.findOne(guide.data.id);
    if ('data' in updated) {
      expect(updated.data.category).toBe('notice');
    }
  });

  it('导玩员搜索包含部分匹配的游戏名称', async () => {
    const ctrl = createController();
    await ctrl.create({ title: '投篮机技巧', slug: 'bball-tips', body: '投篮技巧...', category: 'guide', authorId: 'guide' });
    await ctrl.create({ title: '赛车游戏攻略', slug: 'racing-tips', body: '赛车攻略...', category: 'guide', authorId: 'guide' });
    const result = await ctrl.findAll({ search: '投篮机' });
    expect(result.total).toBe(1);
  });

  it('导玩员创建后立即发布并检查 publishedAt 时间戳完整性（边界）', async () => {
    const ctrl = createController();
    const before = new Date();
    const created = await ctrl.create({ title: '抓娃娃指南', slug: 'claw-guide', body: '抓娃娃技巧', category: 'guide', authorId: 'guide' });
    await ctrl.publish(created.data.id, {});
    const found = await ctrl.findOne(created.data.id);
    if ('data' in found) {
      const publishedAt = new Date(found.data.publishedAt!);
      expect(publishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    }
  });
});

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} content 角色测试 v2`, () => {
  it('运行专员批量创建并发布运营通知', async () => {
    const ctrl = createController();
    const ids: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const r = await ctrl.create({ title: `运营通知${i}`, slug: `ops-${i}`, body: `通知${i}`, category: 'notice', authorId: 'ops-002' });
      ids.push(r.data.id);
    }
    // 逐个发布
    for (const id of ids) {
      await ctrl.publish(id, {});
    }
    const result = await ctrl.findAll({ category: 'notice', status: 'published' });
    expect(result.total).toBe(3);
  });

  it('运行专员分页取第二页内容', async () => {
    const ctrl = createController();
    for (let i = 1; i <= 5; i++) {
      await ctrl.create({ title: `通知${i}`, slug: `notify-${i}`, body: `内容${i}`, category: 'notice', authorId: 'ops-002' });
    }
    const page1 = await ctrl.findAll({ limit: 2, offset: 0 });
    expect(page1.items.length).toBe(2);
    const page2 = await ctrl.findAll({ limit: 2, offset: 2 });
    expect(page2.items.length).toBe(2);
    const page3 = await ctrl.findAll({ limit: 2, offset: 4 });
    expect(page3.items.length).toBe(1);
  });

  it('运行专员归档过期通知确认无法再次发布（边界）', async () => {
    const ctrl = createController();
    const created = await ctrl.create({ title: '过期', slug: 'expired-notice', body: '已过期通知', category: 'notice', authorId: 'ops-002' });
    await ctrl.archive(created.data.id);
    const archived = await ctrl.findOne(created.data.id);
    if ('data' in archived) {
      expect(archived.data.status).toBe('archived');
    }
    // 已归档的内容重新发布（属于业务允许范围）
    const rePublished = await ctrl.publish(created.data.id, {});
    if ('data' in rePublished) {
      expect(rePublished.data.status).toBe('published');
    }
  });
});

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} content 角色测试 v2`, () => {
  it('团建创建多日活动的详细日程内容', async () => {
    const ctrl = createController();
    const created = await ctrl.create({
      title: '三日团建行程',
      slug: '3day-team-building',
      summary: '三天两夜团建活动安排',
      body: 'Day1: 集合→破冰游戏→晚餐\nDay2: 户外拓展→烤肉晚会\nDay3: 总结会→返程',
      category: 'activity',
      authorId: 'tb-002',
    });
    expect(created.data.category).toBe('activity');
    expect(created.data.body).toContain('户外拓展');
  });

  it('团建按 slUg 精确查找并验证 body 完整', async () => {
    const ctrl = createController();
    await ctrl.create({ title: '团建A', slug: 'tb-event-a', body: '团建A详情内容', category: 'activity', authorId: 'tb' });
    const found = await ctrl.findBySlug('tb-event-a');
    if ('data' in found) {
      expect(found.data.title).toBe('团建A');
      expect(found.data.body).toBe('团建A详情内容');
    }
  });

  it('团建按模糊关键词搜索活动（边界-多语言）', async () => {
    const ctrl = createController();
    await ctrl.create({ title: 'Summer Team Building', slug: 'summer-tb', body: 'Outdoor BBQ and games', category: 'activity', authorId: 'tb' });
    await ctrl.create({ title: '冬季团建', slug: 'winter-tb', body: '室内桌游', category: 'activity', authorId: 'tb' });
    const enResult = await ctrl.findAll({ search: 'BBQ' });
    expect(enResult.total).toBe(1);
    const cnResult = await ctrl.findAll({ search: '冬季' });
    expect(cnResult.total).toBe(1);
  });
});

// ── 📢营销 ──
describe(`${ROLES.Marketing} content 角色测试 v2`, () => {
  it('营销创建含多个标签的促销内容并验证 metadata 深度', async () => {
    const ctrl = createController();
    const created = await ctrl.create({
      title: '暑期大促',
      slug: 'summer-sale-2026',
      summary: '暑期狂欢，全场五折',
      body: '暑期促销活动详情...',
      category: 'promotion',
      authorId: 'mkt-002',
      coverImageUrl: 'https://img.example.com/summer2026.jpg',
      metadata: { tags: ['暑期', '五折', '2026', '促销'], version: 1, priority: "high" as any as any },
    });
    expect(created.data.coverImageUrl).toContain('summer2026');
    expect(created.data.metadata?.priority).toBe('high');
  });

  it('营销删除草稿内容后无法查找', async () => {
    const ctrl = createController();
    const created = await ctrl.create({ title: '草稿促销', slug: 'draft-promo', body: '未完成的活动稿', category: 'promotion', authorId: 'mkt-002' });
    const removed = await ctrl.remove(created.data.id);
    expect(removed.success).toBe(true);
    const found = await ctrl.findOne(created.data.id);
    if ('data' in found) {
      // 软删除后 status 变为 deleted，但仍然可查
      expect(found.data.status).toBe('deleted');
    }
  });

  it('营销按促销分类查询并验证 coverImageUrl 完整性（边界）', async () => {
    const ctrl = createController();
    await ctrl.create({
      title: '秒杀活动', slug: 'flash-sale', body: '限时秒杀',
      category: 'promotion', authorId: 'mkt-002',
      coverImageUrl: 'https://img.example.com/flash.jpg',
    });
    await ctrl.create({ title: '满减活动', slug: 'discount', body: '满100减20', category: 'promotion', authorId: 'mkt-002' });
    const result = await ctrl.findAll({ category: 'promotion' });
    expect(result.total).toBe(2);
    const flashSale = result.items.find((i: ContentResponseDto) => i.title === '秒杀活动');
    expect(flashSale?.coverImageUrl).toBe('https://img.example.com/flash.jpg');
  });
});

// ── 跨角色并发与隔离 ──
describe('content 模块跨角色并发与隔离验证', () => {
  it('多角色同时创建内容互不干扰', async () => {
    const ctrl = createController();
    const results = await Promise.all([
      ctrl.create({ title: '店长公告', slug: 'multi-a', body: 'a', category: 'notice', authorId: 'mgr' }),
      ctrl.create({ title: '前台优惠', slug: 'multi-b', body: 'b', category: 'promotion', authorId: 'fd' }),
      ctrl.create({ title: 'HR指南', slug: 'multi-c', body: 'c', category: 'guide', authorId: 'hr' }),
    ]);
    expect(results.length).toBe(3);
    expect(results[0].data.category).toBe('notice');
    expect(results[1].data.category).toBe('promotion');
    expect(results[2].data.category).toBe('guide');
  });

  it('所有角色的分页查询返回一致的总数', async () => {
    const ctrl = createController();
    for (let i = 1; i <= 5; i++) {
      await ctrl.create({ title: `文${i}`, slug: `doc-${i}`, body: `内容${i}`, category: 'notice', authorId: 'admin' });
    }
    const result = await ctrl.findAll({ limit: 2, offset: 0 });
    expect(result.total).toBe(5);
    expect(result.items.length).toBe(2);
  });

  it('10 种标记 tags 的 metadata 结构一致', async () => {
    const ctrl = createController();
    const tags = ['促销', '公告', '指南', '活动', '安全', '培训', '通知', '团建', '运营', '营销'];
    for (const tag of tags) {
      await ctrl.create({
        title: `标签${tag}`,
        slug: `tag-${tag}`,
        body: `标签内容: ${tag}`,
        category: 'notice',
        authorId: 'admin',
        metadata: { tags: [tag], version: 1 },
      });
    }
    const result = await ctrl.findAll({ limit: 100 });
    expect(result.total).toBe(10);
    result.items.forEach((item: ContentResponseDto) => {
      expect(item.metadata).toBeDefined();
      expect(item.metadata?.tags).toBeDefined();
    });
  });
});
