#!/usr/bin/env python3
"""
index-codebase.py · 代码库索引脚本 (Phase-19 RAG 脚手架)

目标:
  扫描 apps/api/src/modules/ 下所有 .ts 文件,用简单 regex AST 解析,
  提取 class / method / NestJS decorator,生成 chunk (800 token + 200 overlap),
  调用 embedding API 后写入 Qdrant 向量数据库。

设计依据:
  - docs/research/rag-architecture.md §3.3 (Chunk 策略) + §4 (Pipeline)

⚠️  当前为骨架版本:
  - AST 解析使用 regex (非 tree-sitter),粗粒度但够用
  - Embedding API 调用 mock (不真实发请求,只生成 fake 3072 维向量)
  - Qdrant 写入 mock (HTTP 调用占位)
  - --dry-run 模式可正常输出统计,验证扫描/分块逻辑

用法:
  python3 scripts/index-codebase.py                  # 全量索引 (mock)
  python3 scripts/index-codebase.py --dry-run        # 只统计,不写入
  python3 scripts/index-codebase.py --path apps/api/src/modules/lyt  # 单模块
  python3 scripts/index-codebase.py --changed        # 仅 git diff 修改的文件
  python3 scripts/index-codebase.py --batch-size 16  # 调整批大小

后续 Pulse:
  - Pulse-71: 接入真实 OpenAI text-embedding-3-large
  - Pulse-72: 接入 Qdrant HTTP upsert + git diff 增量
  - Pulse-73: 替换 regex AST 为 tree-sitter-typescript
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCAN_ROOT = REPO_ROOT / "apps" / "api" / "src" / "modules"
DEFAULT_CHUNK_SIZE = 800  # tokens
DEFAULT_CHUNK_OVERLAP = 200  # tokens
DEFAULT_VECTOR_DIM = 3072  # text-embedding-3-large
DEFAULT_BATCH_SIZE = 32

# ── 现有 phase / pulse (从 git 推断) ──────────────────────────────────────
PHASE_RE = re.compile(r"phase-(\d+)", re.IGNORECASE)
PULSE_RE = re.compile(r"pulse-(\d+)", re.IGNORECASE)


# ── Chunk 数据结构 ───────────────────────────────────────────────────────

@dataclass
class Chunk:
    """单个可索引的代码/文档片段"""
    chunk_id: str
    file_path: str
    language: str
    ast_type: str  # file | class | method | decorator_block | interface_field_cluster | markdown_section
    symbol_name: str
    line_range: tuple[int, int]
    phase: str
    pulse: str
    git_sha: str
    tokens: int
    is_public: bool
    is_test: bool
    content: str
    metadata: dict = field(default_factory=dict)


# ── AST 解析 (regex-based, 简单实现) ─────────────────────────────────────

# 匹配 class / abstract class
CLASS_RE = re.compile(
    r"^(?P<indent>\s*)(?:export\s+)?(?:abstract\s+)?class\s+(?P<name>\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{",
    re.MULTILINE,
)
# 匹配 method / function (粗略,包含 async / 装饰器)
METHOD_RE = re.compile(
    r"^(?P<indent>\s+)(?:@\w+(?:\([^)]*\))?\s*\n\s+)?(?:public\s+|private\s+|protected\s+|async\s+|static\s+)*(?P<name>\w+)\s*(?:<[^>]+>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{",
    re.MULTILINE,
)
# 匹配 NestJS decorator (Module / Controller / Injectable)
DECORATOR_RE = re.compile(
    r"^@(?P<name>\w+)(?:\((?P<args>[^)]*)\))?",
    re.MULTILINE,
)
# 匹配 export const / export function (顶层)
TOP_LEVEL_EXPORT_RE = re.compile(
    r"^(?:export\s+)?(?:const|function|interface|type|enum)\s+(?P<name>\w+)",
    re.MULTILINE,
)


def detect_phase_pulse(file_path: Path, text: str) -> tuple[str, str]:
    """从文件内容 + 路径推断 phase / pulse"""
    phase = "unknown"
    pulse = "unknown"
    for match in PHASE_RE.finditer(text + " " + str(file_path)):
        phase = f"phase-{match.group(1)}"
        break
    for match in PULSE_RE.finditer(text + " " + str(file_path)):
        pulse = f"pulse-{match.group(1)}"
        break
    return phase, pulse


def get_git_sha() -> str:
    """获取当前 HEAD 的 git sha"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
            timeout=5,
        )
        return result.stdout.strip()[:12] if result.returncode == 0 else "no-git"
    except Exception:
        return "no-git"


def is_test_file(file_path: Path) -> bool:
    """是否为测试文件"""
    name = file_path.name
    return bool(
        name.endswith(".test.ts")
        or name.endswith(".spec.ts")
        or ".test." in name
        or name.endswith(".e2e.test.ts")
    )


def extract_chunks_from_ts(file_path: Path) -> list[Chunk]:
    """从 .ts 文件提取 chunk"""
    text = file_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    phase, pulse = detect_phase_pulse(file_path, text)
    git_sha = get_git_sha()
    is_test = is_test_file(file_path)
    chunks: list[Chunk] = []

    # 1) 整个文件作为兜底 chunk (极小文件 < 800 tokens)
    file_tokens = estimate_tokens(text)
    if file_tokens < DEFAULT_CHUNK_SIZE:
        chunks.append(make_chunk(
            file_path, "file", file_path.name, (1, len(lines)),
            phase, pulse, git_sha, is_test, text, file_tokens,
        ))
        return chunks

    # 2) class 提取
    for m in CLASS_RE.finditer(text):
        name = m.group("name")
        start_line = text[: m.start()].count("\n") + 1
        # 简单 brace-matching: 找下一个 { 后配对的 }
        end_line = find_block_end(lines, start_line - 1)
        content = "\n".join(lines[start_line - 1 : end_line])
        is_public = "export" in m.group(0) or not name.startswith("_")
        chunks.append(make_chunk(
            file_path, "class", name, (start_line, end_line),
            phase, pulse, git_sha, is_test, content, estimate_tokens(content),
            is_public=is_public,
        ))

    # 3) method 提取 (顶层函数 + 类内方法)
    for m in METHOD_RE.finditer(text):
        name = m.group("name")
        # 跳过 constructor 关键字错误匹配 + 常见非 method 名
        if name in {"if", "for", "while", "switch", "catch"}:
            continue
        start_line = text[: m.start()].count("\n") + 1
        end_line = find_block_end(lines, start_line - 1)
        if end_line - start_line < 2:  # 跳过单行
            continue
        content = "\n".join(lines[start_line - 1 : end_line])
        chunks.append(make_chunk(
            file_path, "method", name, (start_line, end_line),
            phase, pulse, git_sha, is_test, content, estimate_tokens(content),
        ))

    # 4) NestJS decorator 块 (@Module / @Controller / @Injectable 紧跟的 export)
    for m in DECORATOR_RE.finditer(text):
        deco_name = m.group("name")
        if deco_name not in {"Module", "Controller", "Injectable", "Processor", "Get", "Post", "Put", "Delete", "Patch"}:
            continue
        start_line = text[: m.start()].count("\n") + 1
        # 取 decorator 所在行 + 后续 30 行作为块
        end_line = min(start_line + 30, len(lines))
        content = "\n".join(lines[start_line - 1 : end_line])
        # symbol_name: 查找下一行 export class/const
        next_line_match = TOP_LEVEL_EXPORT_RE.search(text, m.end())
        sym_name = next_line_match.group("name") if next_line_match else deco_name
        chunks.append(make_chunk(
            file_path, "decorator_block", sym_name, (start_line, end_line),
            phase, pulse, git_sha, is_test, content, estimate_tokens(content),
            metadata={"decorator": deco_name},
        ))

    return chunks


def find_block_end(lines: list[str], start_idx: int) -> int:
    """简单 brace-matching 找块结束行 (1-indexed)"""
    depth = 0
    started = False
    for i in range(start_idx, len(lines)):
        for ch in lines[i]:
            if ch == "{":
                depth += 1
                started = True
            elif ch == "}":
                depth -= 1
                if started and depth == 0:
                    return i + 1
    return len(lines)


def make_chunk(
    file_path: Path,
    ast_type: str,
    symbol_name: str,
    line_range: tuple[int, int],
    phase: str,
    pulse: str,
    git_sha: str,
    is_test: bool,
    content: str,
    tokens: int,
    is_public: bool = True,
    metadata: dict | None = None,
) -> Chunk:
    """构造 Chunk (idempotent by hash)"""
    # 用 file_path + symbol + line_range 生成稳定 id
    id_source = f"{file_path}:{symbol_name}:{line_range[0]}-{line_range[1]}"
    chunk_id = hashlib.sha256(id_source.encode("utf-8")).hexdigest()[:24]
    return Chunk(
        chunk_id=chunk_id,
        file_path=str(file_path.relative_to(REPO_ROOT)),
        language="typescript",
        ast_type=ast_type,
        symbol_name=symbol_name,
        line_range=line_range,
        phase=phase,
        pulse=pulse,
        git_sha=git_sha,
        tokens=tokens,
        is_public=is_public,
        is_test=is_test,
        content=content,
        metadata=metadata or {},
    )


def estimate_tokens(text: str) -> int:
    """粗略估算 token 数 (英文 4 chars/token, 中文 1.5 chars/token)"""
    chinese_chars = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
    other_chars = len(text) - chinese_chars
    return max(1, chinese_chars // 2 + other_chars // 4)


# ── 嵌入 + 写入 (mock) ──────────────────────────────────────────────────

def embed_texts_mock(texts: list[str]) -> list[list[float]]:
    """Mock embedding: 返回 3072 维伪向量 (基于文本 hash)"""
    vectors: list[list[float]] = []
    for text in texts:
        h = hashlib.sha256(text.encode("utf-8")).digest()
        # 扩展为 3072 维 (hash 32 bytes × 96 = 3072)
        buf = (h * 96)[: 3072]
        vec = [(b - 128) / 128.0 for b in buf]
        # 归一化
        norm = sum(x * x for x in vec) ** 0.5 or 1
        vec = [x / norm for x in vec]
        vectors.append(vec)
    return vectors


def batched(iterable: Iterable, n: int) -> Iterable[list]:
    """按 n 分批"""
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= n:
            yield batch
            batch = []
    if batch:
        yield batch


def upsert_qdrant_mock(chunks: list[Chunk], vectors: list[list[float]], qdrant_url: str) -> tuple[int, int]:
    """Mock Qdrant upsert (真实实现由 Pulse-72 替换)"""
    # ⚠️  当前仅模拟: 不真实 HTTP 请求,只验证数据结构
    if not qdrant_url:
        return 0, len(chunks)
    # TODO[Pulse-72]: requests.put(f"{qdrant_url}/collections/code_chunks/points", json={...})
    return len(chunks), 0


# ── 主流程 ───────────────────────────────────────────────────────────────

def collect_files(scan_root: Path, only_changed: bool = False) -> list[Path]:
    """收集待扫描的 .ts 文件"""
    if only_changed:
        try:
            result = subprocess.run(
                ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
                timeout=10,
            )
            changed = {REPO_ROOT / p for p in result.stdout.strip().splitlines() if p.endswith(".ts")}
            return sorted(p for p in changed if p.exists() and str(p).startswith(str(scan_root)))
        except Exception:
            pass
    return sorted(scan_root.rglob("*.ts"))


def index_files(
    files: list[Path],
    batch_size: int,
    qdrant_url: str,
    embed_url: str,
    dry_run: bool,
) -> dict:
    """扫描 + 切块 + embed + upsert"""
    start = time.time()
    by_ast_type: dict[str, int] = {}
    by_phase: dict[str, int] = {}
    chunks: list[Chunk] = []
    failed = 0

    for f in files:
        try:
            file_chunks = extract_chunks_from_ts(f)
            chunks.extend(file_chunks)
        except Exception as e:
            failed += 1
            print(f"  ! parse error: {f.relative_to(REPO_ROOT)}: {e}", file=sys.stderr)

    for c in chunks:
        by_ast_type[c.ast_type] = by_ast_type.get(c.ast_type, 0) + 1
        by_phase[c.phase] = by_phase.get(c.phase, 0) + 1

    written = 0
    if not dry_run and chunks:
        for batch in batched(chunks, batch_size):
            texts = [c.content for c in batch]
            vectors = embed_texts_mock(texts)  # Pulse-71 替换为真实 API
            w, _f = upsert_qdrant_mock(batch, vectors, qdrant_url)
            written += w

    return {
        "filesScanned": len(files),
        "chunksGenerated": len(chunks),
        "chunksWritten": written if not dry_run else 0,
        "chunksFailed": failed,
        "totalLatencyMs": int((time.time() - start) * 1000),
        "byAstType": by_ast_type,
        "byPhase": by_phase,
        "dryRun": dry_run,
    }


def print_stats(stats: dict) -> None:
    """格式化打印统计"""
    print()
    print("=" * 60)
    print("  📊 索引统计 " + ("(DRY-RUN)" if stats["dryRun"] else "(WRITE)"))
    print("=" * 60)
    print(f"  扫描文件数:           {stats['filesScanned']}")
    print(f"  生成 chunk 数:        {stats['chunksGenerated']}")
    print(f"  写入 chunk 数:        {stats['chunksWritten']}")
    print(f"  失败数:               {stats['chunksFailed']}")
    print(f"  总耗时:               {stats['totalLatencyMs']} ms")
    print()
    print("  按 AST 类型:")
    for k, v in sorted(stats["byAstType"].items(), key=lambda x: -x[1]):
        print(f"    {k:<32s} {v:>5d}")
    print()
    print("  按 Phase 分布:")
    for k, v in sorted(stats["byPhase"].items(), key=lambda x: -x[1]):
        print(f"    {k:<32s} {v:>5d}")
    print("=" * 60)


def main() -> int:
    parser = argparse.ArgumentParser(description="代码库索引脚本 (Phase-19 RAG)")
    parser.add_argument("--path", type=str, help="自定义扫描根路径 (相对仓库根)")
    parser.add_argument("--dry-run", action="store_true", help="只统计,不写入")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="embedding 批大小")
    parser.add_argument("--qdrant-url", type=str, default=os.getenv("QDRANT_URL", ""), help="Qdrant base URL")
    parser.add_argument("--embed-url", type=str, default=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"), help="Embedding API base URL")
    parser.add_argument("--changed", action="store_true", help="仅索引 git diff 修改的文件")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式 (供 CI 调用)")
    args = parser.parse_args()

    scan_root = Path(args.path) if args.path else DEFAULT_SCAN_ROOT
    if not scan_root.is_absolute():
        scan_root = REPO_ROOT / scan_root

    if not scan_root.exists():
        print(f"❌ 扫描路径不存在: {scan_root}", file=sys.stderr)
        return 1

    print(f"🔍 扫描根路径: {scan_root.relative_to(REPO_ROOT)}")
    print(f"   模式:       {'DRY-RUN' if args.dry_run else 'WRITE'}")
    print(f"   批大小:     {args.batch_size}")
    print(f"   Qdrant:     {args.qdrant_url or '(mock)'}")
    print(f"   Embedding:  {args.embed_url}")

    files = collect_files(scan_root, only_changed=args.changed)
    print(f"   命中文件:   {len(files)} 个 .ts 文件")

    stats = index_files(
        files=files,
        batch_size=args.batch_size,
        qdrant_url=args.qdrant_url,
        embed_url=args.embed_url,
        dry_run=args.dry_run,
    )

    if args.json:
        print(json.dumps(stats, indent=2, ensure_ascii=False))
    else:
        print_stats(stats)

    return 0 if stats["chunksFailed"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())