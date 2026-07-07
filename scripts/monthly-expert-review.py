#!/usr/bin/env python3
# monthly-expert-review.py - Phase-17 T10
import os, sys, json, re
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path('/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88')
EXPERTS_DIR = ROOT / 'docs' / 'experts'
GOV_DIR = ROOT / 'docs' / 'governance'
R7_R8_FILE = GOV_DIR / 'r7-r8-appointment.log'

NOW = datetime.now()
THIS_MONTH = NOW.strftime('%Y-%m')
ONE_MONTH_AGO = NOW - timedelta(days=30)


def list_experts():
    if not EXPERTS_DIR.exists():
        return []
    experts = []
    for f in sorted(EXPERTS_DIR.iterdir()):
        if f.is_file() and re.match(r'e\d{2,3}-.*\.md$', f.name):
            experts.append({
                'code': f.name.split('-')[0].upper(),
                'name': f.name,
                'path': str(f),
                'mtime': datetime.fromtimestamp(f.stat().st_mtime),
            })
    return experts


def parse_r7_r8_appointments():
    if not R7_R8_FILE.exists():
        return {'approvers': [], 'champions': []}
    content = R7_R8_FILE.read_text()
    approvers = re.findall(r'APPROVER_APPOINTED[:\s]+(\w+)', content, re.IGNORECASE)
    champions = re.findall(r'CHAMPION_APPOINTED[:\s]+(\w+)', content, re.IGNORECASE)
    return {'approvers': approvers, 'champions': champions}


def count_feedback_entries():
    feedback_dirs = [ROOT / 'docs' / 'feedback', ROOT / '.trae' / 'feedback']
    total = 0
    for d in feedback_dirs:
        if d.exists():
            total += sum(1 for f in d.iterdir() if f.is_file() and not f.name.startswith('.'))
    return total


def count_knowledge_files():
    if not (ROOT / 'docs').exists():
        return 0
    total = 0
    for f in (ROOT / 'docs').rglob('*.md'):
        if '.archive' not in str(f):
            total += 1
    return total


def main():
    print('=== Phase-17 T10 40 专家满月复盘 ===')
    print(f'日期: {NOW.strftime("%Y-%m-%d %H:%M:%S")}')
    print()

    experts = list_experts()
    print(f'专家档案: {len(experts)} / 40')

    appts = parse_r7_r8_appointments()
    approver_count = len(appts['approvers'])
    champion_count = len(appts['champions'])
    print(f'Approver 任命: {approver_count} (目标 >=5) {"PASS" if approver_count >= 5 else "WARN"}')
    print(f'Champion 任命: {champion_count} (目标 >=1) {"PASS" if champion_count >= 1 else "WARN"}')

    feedback_count = count_feedback_entries()
    print(f'专家反馈: {feedback_count} (目标 >=10) {"PASS" if feedback_count >= 10 else "WARN"}')

    kb_files = count_knowledge_files()
    print(f'知识库文件: {kb_files}')

    report_path = ROOT / 'docs' / 'experts' / f'monthly-review-{THIS_MONTH}.md'
    report_path.parent.mkdir(parents=True, exist_ok=True)

    targets_met = {
        'approver': approver_count >= 5,
        'champion': champion_count >= 1,
        'feedback': feedback_count >= 10,
        'experts': len(experts) >= 40,
    }
    overall_pass = all(targets_met.values())

    lines = []
    lines.append(f'# 40 专家满月复盘 - {THIS_MONTH}')
    lines.append('')
    lines.append(f'> 自动生成: monthly-expert-review.py')
    lines.append(f'> 日期: {NOW.strftime("%Y-%m-%d %H:%M:%S")}')
    lines.append('')
    lines.append('## 关键指标')
    lines.append('')
    lines.append('| 指标 | 实际 | 目标 | 状态 |')
    lines.append('|---|---|---|---|')
    lines.append(f'| 专家档案 | {len(experts)} / 40 | 40 | {"PASS" if targets_met["experts"] else "WARN " + str(40 - len(experts)) + " 缺失"} |')
    lines.append(f'| Approver 任命 | {approver_count} | >=5 | {"PASS" if targets_met["approver"] else "WARN"} |')
    lines.append(f'| Champion 任命 | {champion_count} | >=1 | {"PASS" if targets_met["champion"] else "WARN"} |')
    lines.append(f'| 专家反馈 | {feedback_count} | >=10 | {"PASS" if targets_met["feedback"] else "WARN"} |')
    lines.append(f'| 知识库文件 | {kb_files} | OK | OK |')
    lines.append('')
    lines.append('## Approver 名单 (' + str(approver_count) + ')')
    lines.append('')
    if appts['approvers']:
        for a in appts['approvers']:
            lines.append('- ' + a)
    else:
        lines.append('_暂无_')
    lines.append('')
    lines.append('## Champion 名单 (' + str(champion_count) + ')')
    lines.append('')
    if appts['champions']:
        for c in appts['champions']:
            lines.append('- ' + c)
    else:
        lines.append('_暂无_')
    lines.append('')
    lines.append('## 整体评估')
    lines.append('')
    lines.append('**' + ('PASS' if overall_pass else 'NEEDS IMPROVEMENT') + '**')
    lines.append('')
    lines.append('## 下月行动')
    lines.append('')
    lines.append('### 短期 (本周)')
    lines.append('')
    if not targets_met['experts']:
        lines.append(f'- 补齐 {40 - len(experts)} 个缺失专家档案')
    if not targets_met['approver']:
        lines.append(f'- 招募更多 Approver (当前 {approver_count}/5)')
    if not targets_met['feedback']:
        lines.append(f'- 收集专家反馈 (当前 {feedback_count}/10)')
    if not targets_met['champion']:
        lines.append('- 提名 Champion 候选人')
    lines.append('')
    lines.append('### 中期 (本月)')
    lines.append('')
    lines.append('- 知识库结构优化 (RAG 索引器)')
    lines.append('- AI Code Reviewer (Phase-19) 试点')
    lines.append('- 群组学习节奏升级')
    lines.append('')
    lines.append('## 关联')
    lines.append('')
    lines.append('- .trae/specs/phase-17-marketing-community/tasks.md')
    lines.append('- docs/governance/r7-r8-appointment.log')
    lines.append('- scripts/monthly-expert-review.py')
    lines.append('')
    lines.append('---')
    lines.append('> 由 T10 主任务生成 - Pulse-68 满月复盘')
    lines.append('')

    report = '\n'.join(lines)
    report_path.write_text(report, encoding='utf-8')
    print(f'复盘报告: {report_path}')

    summary_path = ROOT / '.trae' / 'handoffs' / f'monthly-review-{THIS_MONTH}.json'
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        'month': THIS_MONTH,
        'generated_at': NOW.isoformat(),
        'metrics': {
            'experts_total': len(experts),
            'approvers': approver_count,
            'champions': champion_count,
            'feedback_entries': feedback_count,
            'knowledge_files': kb_files,
        },
        'targets_met': targets_met,
        'overall_pass': overall_pass,
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f'摘要 JSON: {summary_path}')

    return 0 if overall_pass else 1


if __name__ == '__main__':
    sys.exit(main())
