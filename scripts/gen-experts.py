#!/usr/bin/env python3
"""
gen-experts.py - 批量生成 E1-E40 专家档案 (V5.1 编制)

Usage: python3 scripts/gen-experts.py
"""
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
EXPERTS_DIR = ROOT / "experts"

EXPERT_TABLE = [
    ("E1", "陈架构", "系统架构"),
    ("E2", "李安全", "信息安全"),
    ("E3", "王硬件", "硬件工程"),
    ("E4", "张营销", "营销策略"),
    ("E5", "赵数据", "数据科学"),
    ("E6", "刘合规", "法律合规"),
    ("E7", "孙体验", "用户体验"),
    ("E8", "周运营", "实体商业运营"),
    ("E9", "吴AI", "AI算法"),
    ("E10", "郑财务", "财务风控"),
    ("E11", "钱店长", "门店店长"),
    ("E12", "孙导购", "资深导购"),
    ("E13", "李收银", "收银前台"),
    ("E14", "赵场地", "场地维护"),
    ("E15", "吴内容", "新媒体运营"),
    ("E16", "郑社群", "社群运营"),
    ("E17", "周活动", "活动策划"),
    ("E18", "刘总助", "总经理助理"),
    ("E19", "陈老板", "顶层负责人"),
    ("E20", "王培训", "培训主管"),
    ("E21", "张设计", "视觉设计"),
    ("E22", "杨物流", "仓储物流"),
    ("E23", "朱客服", "客户服务"),
    ("E24", "马招商", "渠道拓展"),
    ("E25", "牛保洁", "保洁后勤"),
    ("E26", "赵租户", "大型租户(5品牌35店)"),
    ("E27", "钱租户", "中型租户(3品牌15店)"),
    ("E28", "孙租户", "小型租户(单品牌2店)"),
    ("E29", "李股东", "租户投资人"),
    ("E30", "周品牌", "高端品牌总负责人"),
    ("E31", "吴品牌", "流量品牌总负责人"),
    ("E32", "郑品牌", "亲子品牌总负责人"),
    ("E33", "王品牌", "联名品牌总负责人"),
    ("E34", "冯经理", "品牌运营经理"),
    ("E35", "褚采购", "供应链采购"),
    ("E36", "卫审计", "第三方审计"),
    ("E37", "蒋媒体", "行业媒体"),
    ("E38", "沈监管", "监管机构代表"),
    ("E39", "韩开发", "ISV开发者"),
    ("E40", "杨客户", "资深会员代表"),
]

DOMAIN_MAP = {
    "系统架构": "backend",
    "信息安全": "security",
    "硬件工程": "ops",
    "营销策略": "frontend",
    "数据科学": "data",
    "法律合规": "legal",
    "用户体验": "ux",
    "实体商业运营": "frontend",
    "AI算法": "data",
    "财务风控": "finance",
    "门店店长": "frontend",
    "资深导购": "frontend",
    "收银前台": "frontend",
    "场地维护": "ops",
    "新媒体运营": "frontend",
    "社群运营": "frontend",
    "活动策划": "frontend",
    "总经理助理": "frontend",
    "顶层负责人": "frontend",
    "培训主管": "ux",
    "视觉设计": "ux",
    "仓储物流": "ops",
    "客户服务": "frontend",
    "渠道拓展": "frontend",
    "保洁后勤": "ops",
    "大型租户(5品牌35店)": "frontend",
    "中型租户(3品牌15店)": "frontend",
    "小型租户(单品牌2店)": "frontend",
    "租户投资人": "finance",
    "高端品牌总负责人": "frontend",
    "流量品牌总负责人": "frontend",
    "亲子品牌总负责人": "frontend",
    "联名品牌总负责人": "frontend",
    "品牌运营经理": "frontend",
    "供应链采购": "ops",
    "第三方审计": "finance",
    "行业媒体": "frontend",
    "监管机构代表": "legal",
    "ISV开发者": "backend",
    "资深会员代表": "ux",
}

TEMPLATE = """# 专家 {eid} · {name}

## 元信息
- **编号**: {eid}
- **姓名**: {name}
- **领域**: {domain}
- **初始级别**: Observer
- **入职日期**: 2026-06-25
- **联系方式**: 待补充

## 关注的产品域
- {focus}

## 当前活跃度
- 最近 30 天提交反馈: 0 条
- 投票次数: 0
- 采纳率: 0%

## 反馈日志 (按日期倒序)
| 日期 | 类型 | 内容摘要 | 采纳状态 |
|---|---|---|---|
| (暂无) | | | |

## 投票记录
| RFC 编号 | 投票 | 级别 | 理由 | 日期 |
|---|---|---|---|---|
| (暂无) | | | | |

## 升级事件
- (无)

## 关联 Phase
- 待 Phase Owner 分配

## 关注的关键问题
- (由 {name} 自行补充 3-5 个最关心的产品/业务问题)

---

> 本档案基于 V5.1 编制自动生成,生成日期: 2026-06-25
> 由 `scripts/gen-experts.py` 脚本生成
"""


def main():
    EXPERTS_DIR.mkdir(exist_ok=True)
    (EXPERTS_DIR / "templates").mkdir(exist_ok=True)

    for eid, name, domain in EXPERT_TABLE:
        focus = DOMAIN_MAP.get(domain, "frontend")
        content = TEMPLATE.format(
            eid=eid, name=name, domain=domain, focus=focus
        )
        # 文件名: E1-chen-arch.md
        slug_map = {
            "陈架构": "chen-arch", "李安全": "li-security", "王硬件": "wang-hardware",
            "张营销": "zhang-marketing", "赵数据": "zhao-data", "刘合规": "liu-legal",
            "孙体验": "sun-ux", "周运营": "zhou-ops", "吴AI": "wu-ai",
            "郑财务": "zheng-finance", "钱店长": "qian-store", "孙导购": "sun-guide",
            "李收银": "li-cashier", "赵场地": "zhao-venue", "吴内容": "wu-content",
            "郑社群": "zheng-community", "周活动": "zhou-event", "刘总助": "liu-assistant",
            "陈老板": "chen-boss", "王培训": "wang-training", "张设计": "zhang-design",
            "杨物流": "yang-logistics", "朱客服": "zhu-cs", "马招商": "ma-bd",
            "牛保洁": "niu-cleaning", "赵租户": "zhao-tenant-l", "钱租户": "qian-tenant-m",
            "孙租户": "sun-tenant-s", "李股东": "li-investor", "周品牌": "zhou-brand-premium",
            "吴品牌": "wu-brand-traffic", "郑品牌": "zheng-brand-kids", "王品牌": "wang-brand-collab",
            "冯经理": "feng-manager", "褚采购": "chu-procurement", "卫审计": "wei-audit",
            "蒋媒体": "jiang-media", "沈监管": "shen-regulator", "韩开发": "han-isv",
            "杨客户": "yang-member",
        }
        slug = slug_map.get(name, name.lower())
        path = EXPERTS_DIR / f"{eid}-{slug}.md"
        path.write_text(content, encoding="utf-8")
        print(f"  ✓ {path.relative_to(ROOT)}")

    print(f"\n[done] Generated {len(EXPERT_TABLE)} expert profiles in {EXPERTS_DIR}")


if __name__ == "__main__":
    main()