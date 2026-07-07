"""
knowledge_graph_generator.py · 知识库关联图生成器 (Pulse-68 大批量扩充)

功能:
- 扫描 knowledge/**/*.md 文件
- 提取内链 (相对路径 markdown 链接)
- 生成 Mermaid 图 (knowledge graph)
- 输出 knowledge/_graph.md

用法:
    python3 knowledge/automations/knowledge_graph_generator.py

输出:
- knowledge/_graph.md (Mermaid graph TD 格式)
- knowledge/_graph_stats.json (节点数 / 边数 / 强联通分量)
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set, Tuple


KNOWLEDGE_ROOT = Path(__file__).parent.parent  # knowledge/
SUBDIRS = [
    'lessons-learned',
    'patterns',
    'best-practices',
    'anti-patterns',
    'decision-records',
    'expert-insights',
    'automations',
]


def extract_internal_links(content: str, current_file: Path) -> List[str]:
    """从 markdown 内容提取内部链接 (相对路径)"""
    # 匹配 [text](./path) 或 [text](../path)
    pattern = r'\[([^\]]+)\]\((\.{1,2}/[^)]+\.md)\)'
    matches = re.findall(pattern, content)

    links = []
    for text, path in matches:
        # 解析相对路径
        target = (current_file.parent / path).resolve()
        if KNOWLEDGE_ROOT in target.parents or target.parent == KNOWLEDGE_ROOT:
            links.append(str(target.relative_to(KNOWLEDGE_ROOT)))
    return links


def scan_knowledge_base() -> Tuple[Dict[str, List[str]], List[Tuple[str, str]]]:
    """扫描知识库,返回 (文件 → 分类, 边列表)"""
    file_to_category: Dict[str, List[str]] = defaultdict(list)
    edges: List[Tuple[str, str]] = []

    for subdir in SUBDIRS:
        subdir_path = KNOWLEDGE_ROOT / subdir
        if not subdir_path.exists():
            continue
        for md_file in subdir_path.glob('*.md'):
            rel_path = str(md_file.relative_to(KNOWLEDGE_ROOT))
            content = md_file.read_text(encoding='utf-8')

            # 节点
            file_to_category[rel_path].append(subdir)

            # 边
            for link in extract_internal_links(content, md_file):
                edges.append((rel_path, link))

    return dict(file_to_category), edges


def generate_mermaid(file_to_category: Dict[str, List[str]], edges: List[Tuple[str, str]]) -> str:
    """生成 Mermaid graph"""
    lines = ['```mermaid', 'graph TD']

    # 子库分组
    for subdir in SUBDIRS:
        files = [f for f, cats in file_to_category.items() if subdir in cats]
        if not files:
            continue
        lines.append(f'  subgraph {subdir.replace("-", "_")}["{subdir}"]')
        for f in sorted(files):
            node_id = f.replace('/', '_').replace('.', '_').replace('-', '_')
            label = Path(f).stem
            lines.append(f'    {node_id}["{label}"]')
        lines.append('  end')

    # 边
    lines.append('  %% Edges')
    for src, dst in edges:
        src_id = src.replace('/', '_').replace('.', '_').replace('-', '_')
        dst_id = dst.replace('/', '_').replace('.', '_').replace('-', '_')
        lines.append(f'  {src_id} --> {dst_id}')

    lines.append('```')
    return '\n'.join(lines)


def compute_graph_stats(edges: List[Tuple[str, str]]) -> Dict:
    """计算图统计"""
    nodes: Set[str] = set()
    for src, dst in edges:
        nodes.add(src)
        nodes.add(dst)

    # 计算入度 (被引用次数 = 重要性)
    in_degree: Dict[str, int] = defaultdict(int)
    for _, dst in edges:
        in_degree[dst] += 1

    top_referenced = sorted(in_degree.items(), key=lambda x: -x[1])[:10]

    # 出度 (引用其他文件数)
    out_degree: Dict[str, int] = defaultdict(int)
    for src, _ in edges:
        out_degree[src] += 1

    most_connected = sorted(out_degree.items(), key=lambda x: -x[1])[:10]

    return {
        'node_count': len(nodes),
        'edge_count': len(edges),
        'top_referenced': top_referenced,
        'most_connected': most_connected,
    }


def main():
    print('📊 扫描知识库...')
    file_to_category, edges = scan_knowledge_base()

    print(f'✅ 节点: {len(file_to_category)} 文件')
    print(f'✅ 边: {len(edges)} 链接')

    # 生成 Mermaid
    mermaid = generate_mermaid(file_to_category, edges)
    graph_file = KNOWLEDGE_ROOT / '_graph.md'
    graph_file.write_text(
        f'# 知识库关联图\n\n> 自动生成 by `knowledge_graph_generator.py`\n> 节点: {len(file_to_category)} | 边: {len(edges)}\n\n{mermaid}\n',
        encoding='utf-8'
    )
    print(f'✅ Mermaid 图: {graph_file}')

    # 统计
    stats = compute_graph_stats(edges)
    stats_file = KNOWLEDGE_ROOT / '_graph_stats.json'
    stats_file.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'✅ 统计 JSON: {stats_file}')

    # 输出 top 10
    print('\n📈 被引用最多 (重要性):')
    for f, cnt in stats['top_referenced']:
        print(f'  {cnt:3d}x  {f}')

    print('\n🔗 引用最多 (关联广):')
    for f, cnt in stats['most_connected']:
        print(f'  {cnt:3d}  {f}')


if __name__ == '__main__':
    main()
