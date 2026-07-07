/**
 * user-personas.test.ts — 八类目标人群数据模块 L1 测试
 *
 * 覆盖: 正例·边界·防御·8 角色 verify
 *
 * 测试策略:
 *  - 数据完整性: 8 类人群全部定义, 必填字段非空
 *  - 接口验证: 每条数据 shape 符合 PersonaPainPoint / PersonaTrigger / PersonaSolution
 *  - 逻辑验证: matchPersonaByKeywords / getAllPersonas / getPersonasByStage
 *  - 防御: 重复触发词 / 权重范围 / 转化阶段枚举
 *  - 角色视角: 8 类投资者角色每类至少验证 1 个痛点 + 1 个 trigger
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  USER_PERSONAS,
  getAllPersonas,
  getPersonaById,
  matchPersonaByKeywords,
  getPersonasByStage,
} from './user-personas';
import type { UserPersonaId, PersonaPainPoint, PersonaTrigger, PersonaSolution } from './user-personas';

/* ============================================================
 * 1. 正例 - 数据完整性
 * ============================================================ */

describe('user-personas — 正例', () => {
  it('应包含 8 类目标人群', () => {
    const personas = getAllPersonas();
    assert.equal(personas.length, 8, '总共 8 类人群');
  });

  it('每类人群应有 8 个必填字段且值非空', () => {
    const requiredFields: (keyof typeof USER_PERSONAS['chain-investor'])[] = [
      'id', 'name', 'subtitle', 'icon', 'color', 'description',
      'painPoints', 'triggers', 'solutions', 'targetBudget',
      'targetTimeline', 'conversionStage',
    ];
    for (const persona of Object.values(USER_PERSONAS)) {
      for (const field of requiredFields) {
        const val = persona[field];
        assert.notEqual(val, undefined, `[${persona.id}] ${field} 不应为 undefined`);
        assert.notEqual(val, null, `[${persona.id}] ${field} 不应为 null`);
        if (typeof val === 'string') {
          assert.ok(val.length > 0, `[${persona.id}] ${field} 不应为空字符串`);
        }
        if (Array.isArray(val)) {
          assert.ok(val.length > 0, `[${persona.id}] ${field} 数组不应为空`);
        }
      }
    }
  });

  it('每条人群的 id 字段应与 key 匹配', () => {
    for (const [key, persona] of Object.entries(USER_PERSONAS)) {
      assert.equal(persona.id, key, `key "${key}" 与 persona.id "${persona.id}" 应一致`);
    }
  });

  it('每类人群应有至少 2 个痛点', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(persona.painPoints.length >= 2,
        `[${persona.id}] 至少 2 个痛点, 实际 ${persona.painPoints.length}`);
    }
  });

  it('每类人群应有至少 1 个 trigger', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(persona.triggers.length >= 1,
        `[${persona.id}] 至少 1 个 trigger`);
    }
  });

  it('每类人群应有至少 1 个解决方案', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(persona.solutions.length >= 1,
        `[${persona.id}] 至少 1 个解决方案`);
    }
  });
});

/* ============================================================
 * 2. 接口 shape 验证 (PersonaPainPoint / PersonaTrigger / PersonaSolution)
 * ============================================================ */

describe('user-personas — 接口 shape', () => {
  it('PersonaPainPoint 应有 title / description / priority 字段', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      for (const pp of persona.painPoints) {
        const p: PersonaPainPoint = pp;
        assert.equal(typeof p.title, 'string', `[${persona.id}] 痛点 title 应为 string`);
        assert.equal(typeof p.description, 'string', `[${persona.id}] 痛点 description 应为 string`);
        assert.match(p.priority, /^(high|medium|low)$/,
          `[${persona.id}] priority 应为 high|medium|low, 实际: ${p.priority}`);
      }
    }
  });

  it('PersonaTrigger 应有 keyword / weight 字段', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      for (const t of persona.triggers) {
        const tr: PersonaTrigger = t;
        assert.equal(typeof tr.keyword, 'string', `[${persona.id}] trigger.keyword 应为 string`);
        assert.equal(typeof tr.weight, 'number', `[${persona.id}] trigger.weight 应为 number`);
        assert.ok(tr.weight >= 1 && tr.weight <= 10,
          `[${persona.id}] trigger.weight 应在 1-10 之间, 实际: ${tr.weight}`);
      }
    }
  });

  it('PersonaSolution 应有 title / description / features 字段', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      for (const s of persona.solutions) {
        const sol: PersonaSolution = s;
        assert.equal(typeof sol.title, 'string', `[${persona.id}] solution.title 应为 string`);
        assert.equal(typeof sol.description, 'string', `[${persona.id}] solution.description 应为 string`);
        assert.ok(Array.isArray(sol.features), `[${persona.id}] solution.features 应为 array`);
        assert.ok(sol.features.length >= 1, `[${persona.id}] solution.features 至少 1 条`);
      }
    }
  });
});

/* ============================================================
 * 3. 逻辑函数验证
 * ============================================================ */

describe('user-personas — 逻辑函数', () => {
  it('getPersonaById 返回正确的人群', () => {
    const p = getPersonaById('chain-investor');
    assert.ok(p, 'chain-investor 应存在');
    assert.equal(p?.id, 'chain-investor');
    assert.equal(p?.name, '连锁品牌投资者');
  });

  it('getAllPersonas 返回 8 类人群', () => {
    const all = getAllPersonas();
    assert.equal(all.length, 8);
    // 重名检查
    const names = all.map(p => p.name);
    const uniqueNames = new Set(names);
    assert.equal(uniqueNames.size, 8, '所有人群名称应唯一');
  });

  it('matchPersonaByKeywords 根据触发词正确匹配', () => {
    // 连锁扩张场景
    const result1 = matchPersonaByKeywords(['连锁', '多店']);
    assert.ok(result1.includes('chain-investor'), '匹配"连锁"应返回 chain-investor');

    // 商场场景
    const result2 = matchPersonaByKeywords(['商场', '客流']);
    assert.ok(result2.includes('commercial-property'), '匹配"商场"应返回 commercial-property');

    // 创业场景
    const result3 = matchPersonaByKeywords(['创业', '首次']);
    assert.ok(result3.includes('first-time-entrepreneur'), '匹配"创业"应返回 first-time-entrepreneur');
  });

  it('matchPersonaByKeywords 空关键词返回空排序', () => {
    const result = matchPersonaByKeywords([]);
    assert.equal(result.length, 8, '空关键词仍应返回 8 类人群');
  });

  it('matchPersonaByKeywords 不匹配关键词返回所有人群（0 分相等）', () => {
    const result = matchPersonaByKeywords(['xyznotfound123']);
    assert.equal(result.length, 8, '不匹配关键词返回全部');
  });

  it('getPersonasByStage 按转化阶段正确分组', () => {
    const awareness = getPersonasByStage('awareness');
    assert.ok(awareness.length >= 2, 'awareness 阶段至少 2 个');
    const consideration = getPersonasByStage('consideration');
    assert.ok(consideration.length >= 2, 'consideration 阶段至少 2 个');
    const decision = getPersonasByStage('decision');
    assert.ok(decision.length >= 2, 'decision 阶段至少 2 个');

    // 验证 sum
    assert.equal(awareness.length + consideration.length + decision.length, 8,
      '三阶段人群数 = 8');
  });
});

/* ============================================================
 * 4. 防御检查
 * ============================================================ */

describe('user-personas — 防御', () => {
  it('每条人群的 color 是有效的 CSS 色值', () => {
    const hexColor = /^#[0-9A-Fa-f]{6}$/;
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(hexColor.test(persona.color),
        `[${persona.id}] color "${persona.color}" 应为 #RRGGBB 格式`);
    }
  });

  it('每条人群的 conversionStage 只允许三种枚举值', () => {
    const validStages = ['awareness', 'consideration', 'decision'];
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(validStages.includes(persona.conversionStage),
        `[${persona.id}] conversionStage "${persona.conversionStage}" 非法`);
    }
  });

  it('所有 trigger weight 为整数', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      for (const t of persona.triggers) {
        assert.equal(Math.floor(t.weight), t.weight,
          `[${persona.id}] trigger "${t.keyword}" weight ${t.weight} 必须为整数`);
      }
    }
  });

  it('icon 字段是有效的 emoji 字符串', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(typeof persona.icon === 'string', `[${persona.id}] icon 应为 string`);
      assert.ok(persona.icon.length >= 1, `[${persona.id}] icon 非空`);
      // Emoji 长度: 单 emoji 2 字节, ZWJ family emoji 可达 11+ 字节
      assert.ok(Buffer.byteLength(persona.icon, 'utf-8') >= 2 && Buffer.byteLength(persona.icon, 'utf-8') <= 30,
        `[${persona.id}] icon utf-8 字节数应在 2-30 之间, 实际: ${Buffer.byteLength(persona.icon, 'utf-8')}`);
    }
  });

  it('targetBudget 和 targetTimeline 非空字符串', () => {
    for (const persona of Object.values(USER_PERSONAS)) {
      assert.ok(persona.targetBudget.length > 0, `[${persona.id}] targetBudget 非空`);
      assert.ok(persona.targetTimeline.length > 0, `[${persona.id}] targetTimeline 非空`);
    }
  });
});

/* ============================================================
 * 5. 8 角色视角验证
 * ============================================================ */

describe('user-personas — 8 角色视角', () => {
  it('chain-investor (连锁品牌投资者): 应有选址慢 + 管理难痛点, 有"连锁" trigger', () => {
    const p = getPersonaById('chain-investor')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('选址')), '应含选址痛点');
    assert.ok(titles.some(t => t.includes('管理')), '应含管理痛点');
    assert.ok(p.triggers.some(t => t.keyword === '连锁'), '应有"连锁" trigger');
    assert.ok(p.triggers.find(t => t.keyword === '连锁')?.weight === 9, '"连锁"权重为 9');
  });

  it('commercial-property (商业地产开发商): 客流下降 + 坪效提升, "商场" trigger', () => {
    const p = getPersonaById('commercial-property')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('客流') || t.includes('坪效')), '应含客流/坪效痛点');
    assert.ok(p.triggers.some(t => t.keyword === '商场'), '应有"商场" trigger');
    assert.equal(p.conversionStage, 'decision', '商业地产应为 decision 阶段');
  });

  it('first-time-entrepreneur (初次创业者): 经验不足 + 风险担忧, "创业" trigger', () => {
    const p = getPersonaById('first-time-entrepreneur')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('经验不足') || t.includes('风险')), '应含经验/风险痛点');
    assert.ok(p.triggers.some(t => t.keyword === '创业'), '应有"创业" trigger');
    assert.equal(p.conversionStage, 'awareness', '创业者应为 awareness 阶段');
    assert.equal(p.targetBudget, '15万-50万', '预算区间正确');
  });

  it('government-project (政府/文旅项目): 合规复杂 + 运营要求, "招标" trigger', () => {
    const p = getPersonaById('government-project')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('合规') || t.includes('运营')), '应含合规/运营痛点');
    assert.ok(p.triggers.some(t => t.keyword === '招标'), '应有"招标" trigger');
    assert.ok(p.targetBudget.includes('200万'), '预算 >= 200 万');
  });

  it('traditional-entertainment (传统娱乐转型): 同质化 + 竞争压力, "转型" trigger', () => {
    const p = getPersonaById('traditional-entertainment')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('同质化') || t.includes('竞争')), '应含同质化/竞争痛点');
    assert.ok(p.triggers.some(t => t.keyword === '转型'), '应有"转型" trigger');
    assert.equal(p.conversionStage, 'consideration', '传统娱乐应为 consideration');
  });

  it('family-venue (亲子业态投资者): 同质化 + 安全要求, "亲子" trigger', () => {
    const p = getPersonaById('family-venue')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('同质化') || t.includes('安全')), '应含同质化/安全痛点');
    assert.ok(p.triggers.some(t => t.keyword === '亲子'), '应有"亲子" trigger');
    assert.ok(p.solutions.some(s => s.title.includes('亲子')), '解决方案含"亲子"');
  });

  it('hospitality (酒店/民宿业者): 增值服务单一 + 客单价难提升, "酒店" trigger', () => {
    const p = getPersonaById('hospitality')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('增值服务') || t.includes('客单价')), '应含增值服务/客单价痛点');
    assert.ok(p.triggers.some(t => t.keyword === '酒店'), '应有"酒店" trigger');
    assert.ok(p.targetTimeline.includes('周'), '酒店方案时间以周计');
  });

  it('overseas-market (海外市场进入者): 本地化困难 + 供应链, "海外" trigger', () => {
    const p = getPersonaById('overseas-market')!;
    const titles = p.painPoints.map(x => x.title);
    assert.ok(titles.some(t => t.includes('本地化') || t.includes('供应链')), '应含本地化/供应链痛点');
    assert.ok(p.triggers.some(t => t.keyword === '海外'), '应有"海外" trigger');
    assert.equal(p.conversionStage, 'awareness', '海外市场应为 awareness');
  });
});
