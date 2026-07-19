-- 导入14条知识赋能卡片到 empower_card 表
-- 来源: docs/knowledge/usage-stats.md (2026-07-19)
-- ADR-045 · 导入时间: 2026-07-19 11:55

INSERT INTO empower_card (tag, summary, source, module_mapping, freshness_score, quote_count, last_quoted_at, confidence)
VALUES
('竞品', '订阅制会员收入全国平均22%', 'ZVZO2026搜索', '竞品分析', 100, 0, NULL, 80),
('技术', 'PRD对齐测试: ringbeam正反边', '内部成熟模式', 'P-38', 100, 1, NOW(), 95),
('技术', 'NestJS模块: 装饰器/exports/异常', 'NestJS官方', '全模块', 100, 2, NOW(), 95),
('技术', '渲染测试三态: loading/empty/error', 'React Testing Library', 'storefront', 100, 1, NOW(), 90),
('技术', 'G4体验标准: 三态覆盖', '2026-07-19审查报告', 'storefront', 100, 1, NOW(), 90),
('竞品', '全球电玩城市场680亿美元', 'ZVZO2026', '竞品分析', 100, 0, NULL, 70),
('用户', '25-34岁占47.3%核心用户', 'ZVZO/中研普华', '用户研究', 100, 0, NULL, 75),
('合规', 'GA/T 2380-2026 schema隔离', '国家标准', '安全合规', 100, 0, NULL, 95),
('技术', 'RLS 8护栏模式', 'NestJS Courses', 'P-31', 100, 0, NULL, 85),
('市场', '下沉市场新增3,000家空间', '行业报告', '市场分析', 100, 0, NULL, 60),
('竞品', 'SaaS化渗透率<20%', '行业调研', '竞品分析', 100, 0, NULL, 65),
('技术', 'Next.js: Server Components不单元测试', 'Alvin Quach', 'storefront', 100, 0, NULL, 70),
('技术', 'P-38财务模块: 成本现金流边界', 'PRD对齐', 'P-38', 100, 1, NOW(), 90),
('技术', '三件套: cost-flow边界case', '内部最佳实践', 'P-38', 100, 1, NOW(), 90)
ON CONFLICT DO NOTHING;

-- 引用日志（对应已发生的引用）
INSERT INTO empower_card_quote_log (card_id, task_name, module_name, quoted_by, quoted_at)
SELECT c.id, 'api-test-enhance-noon', c.module_mapping, '龙虾哥', NOW() - INTERVAL '1 hour'
FROM empower_card c WHERE c.summary LIKE '%NestJS模块%'
ON CONFLICT DO NOTHING;

INSERT INTO empower_card_quote_log (card_id, task_name, module_name, quoted_by, quoted_at)
SELECT c.id, 'api-module-thin-2', c.module_mapping, '龙虾哥', NOW() - INTERVAL '30 minutes'
FROM empower_card c WHERE c.summary LIKE '%NestJS模块%'
ON CONFLICT DO NOTHING;

-- 统计确认
SELECT '📊 导入完成' as status;
SELECT COUNT(*) || ' 条知识卡片' as result FROM empower_card;
SELECT COUNT(*) || ' 条引用日志' as result FROM empower_card_quote_log;
