#!/usr/bin/env python3
"""
rfc-finalize.py · RFC 投票自动归档脚本 (Pulse-67 闭环)

功能:
  - 检查所有 voting 中 RFC 是否达到通过门槛:
    · ≥3 Approver 同意 (累计权重 ≥3.0)
    · 0 Champion 否决
  - 满足 → 更新 voting-record.md (默认 dry-run; --apply 才会写)
    · §1.1 当前活跃 RFC 表: 状态 → ✅ 通过
    · §2.x 投票历史: 决议日期 + 统计
    · §6 RFC 索引: 决议日期 / 实施 Owner
  - 不满足 → 输出阻塞原因 (不写文件)
  - 幂等: 重复运行 dry-run 无副作用; --apply 仅在状态变化时写入

用法:
  python3 scripts/rfc-finalize.py                       # 检查所有 RFC (dry-run)
  python3 scripts/rfc-finalize.py --rfc R7             # 单个 RFC (dry-run)
  python3 scripts/rfc-finalize.py --apply              # 实际更新 voting-record.md
  python3 scripts/rfc-finalize.py --rfc R6 --apply     # 归档已通过的 R6
  python3 scripts/rfc-finalize.py --threshold 3.0     # 自定义通过门槛

关联: docs/process/voting-record.md · scripts/rfc-monitor.py
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[1]
VOTING_DIR = REPO_ROOT / "rfcs" / "voting"
VOTING_RECORD = REPO_ROOT / "docs" / "process" / "voting-record.md"
MONITOR = REPO_ROOT / "scripts" / "rfc-monitor.py"
TZ = ZoneInfo("Asia/Shanghai")

DEFAULT_THRESHOLD = 3.0  # 同意权重门槛

# ---------- 工具函数 ----------


def now_str() -> str:
    return datetime.now(TZ).strftime("%Y-%m-%d %H:%M CST")


def load_monitor_data() -> list[dict]:
    """调用 rfc-monitor.py --json 获取所有 RFC 结构化数据。"""
    if not MONITOR.exists():
        print(f"❌ 未找到 {MONITOR}", file=sys.stderr)
        sys.exit(1)
    result = subprocess.run(
        [sys.executable, str(MONITOR), "--json"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        print(f"❌ rfc-monitor.py 失败: {result.stderr}", file=sys.stderr)
        sys.exit(2)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析失败: {e}", file=sys.stderr)
        sys.exit(2)


def check_pass_conditions(info: dict, threshold: float) -> dict:
    """检查 RFC 是否满足通过门槛。返回 {
        'pass': bool,
        'agree_weight': float,
        'reject_weight': float,
        'agree_votes': int,
        'reject_votes': int,
        'veto': bool,
        'reasons': list[str]
    }"""
    votes = info.get("votes", [])
    agree_w = sum(v["weight"] for v in votes if v["vote"] == "agree")
    reject_w = sum(v["weight"] for v in votes if v["vote"] == "reject")
    veto = any(v["vote"] == "veto" for v in votes)
    agree_n = sum(1 for v in votes if v["vote"] == "agree")
    reject_n = sum(1 for v in votes if v["vote"] == "reject")

    reasons = []
    if agree_w < threshold:
        reasons.append(
            f"同意权重不足 ({agree_w:.1f} < {threshold:.1f}); 需 ≥3 Approver 同意"
        )
    if veto:
        reasons.append("存在 Champion 否决 (权重 2.0, 一票否决)")
    # 截止时间检查 (仅在 dry-run 时提示, 不强制 — Champion 可手动归档)
    deadline_iso = info.get("deadline_iso")
    if deadline_iso:
        try:
            deadline = datetime.fromisoformat(deadline_iso)
            now = datetime.now(TZ)
            if now < deadline:
                reasons.append(
                    f"投票窗口未结束 (截止 {deadline.strftime('%Y-%m-%d %H:%M %Z')}, "
                    f"提前归档需 Champion 签字)"
                )
        except ValueError:
            pass

    return {
        "pass": len(reasons) == 0,
        "agree_weight": agree_w,
        "reject_weight": reject_w,
        "agree_votes": agree_n,
        "reject_votes": reject_n,
        "veto": veto,
        "reasons": reasons,
    }


# ---------- voting-record.md 更新逻辑 ----------


def update_section_1_1(text: str, rfc_id: str) -> str:
    """更新 §1.1 当前活跃 RFC 表中的状态列。"""
    lines = text.split("\n")
    out = []
    in_active_table = False
    for line in lines:
        # 进入活跃 RFC 表
        if "### 1.1" in line or "### 1.1 " in line:
            in_active_table = True
            out.append(line)
            continue
        # 离开
        if in_active_table and line.startswith("###") and "1.1" not in line:
            in_active_table = False
        if in_active_table and line.startswith("|") and rfc_id in line.split("|")[1].strip():
            # 修改最后一列的状态
            cells = line.rstrip("\n").rstrip().rstrip("|").split("|")
            if len(cells) >= 6:
                # 保留行首 "|" 不动, 重建
                cells[-1] = f" ✅ 通过 ({info_pass_label(text, rfc_id)})"
                # 还原 "|" 包裹
                line = "|" + "|".join(cells) + "|"
        out.append(line)
    return "\n".join(out)


def info_pass_label(text: str, rfc_id: str) -> str:
    """读取 §2.x R{id} 章节的同意总权重, 拼成 "4.5 权重, 无 Champion 否决"。"""
    sec = re.search(
        rf"###\s+2\.\d+\s+(?:·\s*)?{re.escape(rfc_id)}\b[^\n]*\n(.*?)(?=\n###\s+2\.|\n##\s|\Z)",
        text, re.DOTALL,
    )
    if not sec:
        return "已通过"
    body = sec.group(1)
    agree_m = re.search(r"-\s*\*\*同意总权重\*\*[:：]\s*([\d.]+)", body)
    veto_m = re.search(r"-\s*\*\*Champion\s*否决\*\*[:：]\s*(.+)", body)
    agree = float(agree_m.group(1)) if agree_m else 0.0
    veto_status = veto_m.group(1).strip() if veto_m else "无"
    veto_note = "无 Champion 否决" if "无" in veto_status else "有 Champion 否决"
    return f"{agree:.1f} 权重, {veto_note}"


def update_section_2_x(text: str, rfc_id: str, condition: dict, owner: str = "") -> str:
    """更新 §2.x 投票历史的决议日期 / 实施 Owner。

    兼容 "### 2.2 R7 · Approver 招募" 和 "### 2.2 · R7 ..." 两种写法。
    """
    pat = re.compile(
        rf"(###\s+2\.\d+\s+(?:·\s*)?{re.escape(rfc_id)}\b[^\n]*\n)"
        rf"(> 状态:[^\n]*\n)?"
    )
    m = pat.search(text)
    if not m:
        return text
    section_start = m.start()
    section_end_match = re.search(r"\n###\s+2\.\d+|\n##\s", text[m.end():])
    section_end = m.end() + (section_end_match.start() if section_end_match else len(text) - m.end())
    section_text = text[section_start:section_end]

    # 更新 "> 状态: ..." 行
    now = datetime.now(TZ).strftime("%Y-%m-%d %H:%M CST")
    status_line = f"> 状态: ✅ **通过** · 通过日期: {now}\n"
    if re.search(r"> 状态:[^\n]*\n", section_text):
        section_text = re.sub(r"> 状态:[^\n]*\n", status_line, section_text, count=1)
    else:
        # 在标题后插入
        title_end = section_text.find("\n")
        section_text = section_text[:title_end + 1] + "\n" + status_line + section_text[title_end + 1:]

    # 更新"决议:"行
    if "**决议**:" in section_text:
        section_text = re.sub(
            r"-\s*\*\*决议\*\*[:：]\s*[^\n]*",
            f"- **决议**: ✅ **通过** (自动归档 {now})",
            section_text, count=1,
        )
    # 更新"决议日期:"行
    if "**决议日期**:" in section_text:
        section_text = re.sub(
            r"-\s*\*\*决议日期\*\*[:：]\s*[^\n]*",
            f"- **决议日期**: {now}",
            section_text, count=1,
        )

    # 更新 §2.x 中的 "统计" 区: "决议: 待定" → "决议: ✅ 通过 (...)"
    section_text = re.sub(
        r"-\s*\*\*决议\*\*[:：]\s*待定",
        f"- **决议**: ✅ 通过 ({now}, 权重 {condition['agree_weight']:.1f}, "
        f"{'有' if condition['veto'] else '无'} Champion 否决)",
        section_text, count=1,
    )

    return text[:section_start] + section_text + text[section_end:]


def update_section_6(text: str, rfc_id: str, owner: str = "") -> str:
    """更新 §6 RFC 索引的状态列与决议日期。"""
    lines = text.split("\n")
    out = []
    in_section_6 = False
    for line in lines:
        if "## 6. " in line and "RFC 索引" in line:
            in_section_6 = True
            out.append(line)
            continue
        if in_section_6 and line.startswith("## "):
            in_section_6 = False
        if in_section_6 and line.startswith("|") and f"| **{rfc_id}**" in line:
            cells = line.rstrip("\n").rstrip().rstrip("|").split("|")
            # 列顺序: RFC | 标题 | 提交人 | 提交日期 | 状态 | 决议日期 | 实施 Owner
            if len(cells) >= 7:
                cells[4] = " ✅ 通过"
                cells[5] = f" {datetime.now(TZ).strftime('%Y-%m-%d')}"
                if owner:
                    cells[6] = f" {owner}"
                line = "|" + "|".join(cells) + "|"
        out.append(line)
    return "\n".join(out)


def apply_finalization(rfc_id: str, condition: dict, owner: str = "") -> bool:
    """实际更新 voting-record.md。返回是否真的改了内容 (用于幂等)。"""
    if not VOTING_RECORD.exists():
        print(f"❌ 未找到 {VOTING_RECORD}", file=sys.stderr)
        return False
    original = VOTING_RECORD.read_text(encoding="utf-8")
    new_text = original
    new_text = update_section_1_1(new_text, rfc_id)
    new_text = update_section_2_x(new_text, rfc_id, condition, owner)
    new_text = update_section_6(new_text, rfc_id, owner)

    if new_text == original:
        return False
    VOTING_RECORD.write_text(new_text, encoding="utf-8")
    return True


# ---------- 输出 ----------


def render_result(rfc: dict, condition: dict, owner: str, would_apply: bool, applied: bool) -> str:
    icon = "✅" if condition["pass"] else "🛑"
    lines = []
    lines.append(f"{icon} RFC {rfc['id']} · {rfc['title']}")
    lines.append(f"   提交人:     {rfc.get('submitter') or '-'}")
    lines.append(f"   投票截止:   {rfc.get('deadline') or '-'}")
    lines.append(f"   当前状态:   {rfc.get('status_icon')}")
    lines.append(f"   同意票:     {condition['agree_votes']} 票 (权重 {condition['agree_weight']:.1f})")
    lines.append(f"   反对票:     {condition['reject_votes']} 票 (权重 {condition['reject_weight']:.1f})")
    lines.append(f"   否决:       {'有 🛑' if condition['veto'] else '无 ✅'}")
    lines.append("")
    if condition["pass"]:
        lines.append(f"   ✅ 满足通过门槛 (≥3 Approver 同意 + 0 Champion 否决)")
        if would_apply:
            if applied:
                lines.append(f"   📝 已写入 voting-record.md (幂等写入)")
            else:
                lines.append(f"   🔒 DRY-RUN: 未写入 voting-record.md, 加 --apply 生效")
        else:
            lines.append(f"   ⚠️  跳过归档 (--apply 未指定)")
    else:
        lines.append(f"   ❌ 不满足通过门槛:")
        for r in condition["reasons"]:
            lines.append(f"      - {r}")
    return "\n".join(lines)


# ---------- main ----------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="RFC 投票自动归档 (默认 dry-run)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="示例:\n"
               "  python3 scripts/rfc-finalize.py                 # dry-run, 检查所有 RFC\n"
               "  python3 scripts/rfc-finalize.py --rfc R7        # dry-run, 单个 RFC\n"
               "  python3 scripts/rfc-finalize.py --apply         # 实际更新 voting-record.md\n"
               "  python3 scripts/rfc-finalize.py --rfc R6 --apply  # 归档 R6\n",
    )
    parser.add_argument("--rfc", metavar="RXX", help="只检查/归档单个 RFC")
    parser.add_argument("--apply", action="store_true",
                        help="实际更新 voting-record.md (默认 dry-run)")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                        help=f"通过门槛 (默认 {DEFAULT_THRESHOLD})")
    parser.add_argument("--owner", default="",
                        help="实施 Owner (写入 §6 索引, 可选)")
    args = parser.parse_args()

    print("=== rfc-finalize.py · RFC 投票自动归档 ===")
    print(f"模式: {'APPLY' if args.apply else 'DRY-RUN'}")
    print(f"门槛: 同意权重 ≥ {args.threshold}")
    print(f"时区: Asia/Shanghai (now={datetime.now(TZ).strftime('%Y-%m-%d %H:%M %Z')})")
    print()

    data = load_monitor_data()
    if args.rfc:
        target = args.rfc.upper()
        data = [r for r in data if r["id"] == target]
        if not data:
            print(f"❌ 未找到 RFC {target}", file=sys.stderr)
            return 2

    pass_count = 0
    fail_count = 0
    for rfc in data:
        # 跳过已通过 / 已否决 / 已撤回 (只在 voting 或 blocked 状态才考虑归档)
        if rfc.get("status") not in ("voting", "blocked"):
            print(f"⏭️  RFC {rfc['id']} 当前状态 {rfc.get('status_icon')}, 跳过")
            print()
            continue

        cond = check_pass_conditions(rfc, args.threshold)
        applied = False
        if cond["pass"] and args.apply:
            owner = args.owner or rfc.get("submitter", "")
            applied = apply_finalization(rfc["id"], cond, owner)
        print(render_result(rfc, cond, args.owner, args.apply, applied))
        print()
        if cond["pass"]:
            pass_count += 1
        else:
            fail_count += 1

    print("------------------------------------------------------------")
    print(f"📊 汇总: {pass_count} 通过 / {fail_count} 阻塞 / 总计 {len(data)}")
    if not args.apply:
        print("ℹ️  当前为 DRY-RUN, 加 --apply 才会写入 voting-record.md")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
