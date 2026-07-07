"""
lessons_extractor.py · 自动抽取 lessons-learned (Pulse-68 大批量扩充)

功能:
- 从 git log 提取 commit message
- 匹配 lessons-learned 关键词 (修复 / Bug / Lessons / 反思 / Retro)
- 自动建议 lessons-learned 文件结构
- 输出 lessons/_suggested.md

用法:
    python3 knowledge/automations/lessons_extractor.py

输出:
- knowledge/lessons-learned/_suggested.md (待人工确认的 lessons)
- knowledge/_extraction_stats.json (统计)
"""

import re
import subprocess
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict


LESSONS_LEARNED_DIR = Path(__file__).parent.parent / 'lessons-learned'


KEYWORDS = [
    '修复', 'fix', 'bug', 'lesson', 'lessons', '反思', 'retro', '回顾',
    'regression', 'regress', 'P0', 'P1', 'rollback', '回滚',
    'phase', 'pulse',
]


def get_git_log(since: str = '60 days ago', limit: int = 200) -> list:
    """获取 git log"""
    result = subprocess.run(
        ['git', 'log', f'--since={since}', f'--max-count={limit}',
         '--pretty=format:%H|%ai|%s|%b%n---'],
        capture_output=True, text=True, cwd=Path(__file__).parent.parent.parent
    )
    commits = []
    for chunk in result.stdout.split('---'):
        chunk = chunk.strip()
        if not chunk:
            continue
        parts = chunk.split('|', 3)
        if len(parts) >= 3:
            commits.append({
                'sha': parts[0],
                'date': parts[1],
                'subject': parts[2],
                'body': parts[3] if len(parts) > 3 else '',
            })
    return commits


def is_lessons_commit(commit: dict) -> bool:
    """判断 commit 是否值得提取 lessons"""
    text = f"{commit['subject']} {commit['body']}".lower()
    matches = sum(1 for kw in KEYWORDS if kw.lower() in text)
    return matches >= 2


def extract_lessons(commits: list) -> list:
    """提取 lessons 候选"""
    candidates = []
    for c in commits:
        if not is_lessons_commit(c):
            continue
        # 提取 phase / pulse 标签
        phase_match = re.search(r'[Pp]hase[- ]?(\d+)', c['subject'] + c['body'])
        pulse_match = re.search(r'[Pp]ulse[- ]?(\d+)', c['subject'] + c['body'])

        candidates.append({
            'sha': c['sha'][:7],
            'date': c['date'][:10],
            'subject': c['subject'][:100],
            'phase': phase_match.group(0) if phase_match else None,
            'pulse': pulse_match.group(0) if pulse_match else None,
        })
    return candidates


def suggest_lessons_md(candidates: list) -> str:
    """生成建议的 lessons-learned markdown"""
    md = ['# Lessons Learned 自动抽取候选', '']
    md.append(f'> 自动生成 by `lessons_extractor.py`')
    md.append(f'> 时间: {datetime.now().isoformat()}')
    md.append(f'> 候选数: {len(candidates)}')
    md.append('')
    md.append('以下 commit 值得提取 lessons-learned,请人工确认并完善:')
    md.append('')

    for i, c in enumerate(candidates, 1):
        md.append(f'## {i}. {c["subject"]}')
        md.append('')
        md.append(f'- **SHA**: `{c["sha"]}`')
        md.append(f'- **日期**: {c["date"]}')
        if c['phase']:
            md.append(f'- **Phase**: {c["phase"]}')
        if c['pulse']:
            md.append(f'- **Pulse**: {c["pulse"]}')
        md.append('')
        md.append('### 建议章节')
        md.append('- [ ] 🎯 背景')
        md.append('- [ ] 📚 Lessons (主)')
        md.append('- [ ] 📝 副 Lessons')
        md.append('- [ ] 🔗 关联')
        md.append('')

    return '\n'.join(md)


def main():
    print('📊 分析 git log...')
    commits = get_git_log()
    print(f'✅ 总 commit 数: {len(commits)}')

    candidates = extract_lessons(commits)
    print(f'✅ Lessons 候选: {len(candidates)}')

    # 写入
    suggested = LESSONS_LEARNED_DIR / '_suggested.md'
    suggested.write_text(suggest_lessons_md(candidates), encoding='utf-8')
    print(f'✅ 候选文件: {suggested}')

    # 统计
    by_phase = defaultdict(int)
    by_pulse = defaultdict(int)
    for c in candidates:
        if c['phase']:
            by_phase[c['phase']] += 1
        if c['pulse']:
            by_pulse[c['pulse']] += 1

    stats = {
        'total_commits': len(commits),
        'lessons_candidates': len(candidates),
        'by_phase': dict(by_phase),
        'by_pulse': dict(by_pulse),
        'generated_at': datetime.now().isoformat(),
    }
    stats_file = LESSONS_LEARNED_DIR / '_extraction_stats.json'
    stats_file.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'✅ 统计: {stats_file}')

    print(f'\n📚 待人工确认 {len(candidates)} 条 lessons 候选')


if __name__ == '__main__':
    main()
