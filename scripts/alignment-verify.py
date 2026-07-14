#!/usr/bin/env python3
"""圈梁对齐验证器 v2 - 自动检查118模块的四道箍状态 + 质量门禁检查
   🐜 [V17: audit-quality-fuse]
   扩展内容:
   - 覆盖率检查 (扫描测试文件是否存在覆盖率报告)
   - 假阳检测 (admin-web 已知假阳数量是否增加)
   - 测试深度检查 (每模块正例/反例/边界case计数)
"""
import os, subprocess, re, sys

PROJECT = "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"

def info(msg):
    print(f"  ℹ️  {msg}")

def ok(msg):
    print(f"  ✅ {msg}")

def warn(msg):
    print(f"  ⚠️  {msg}")

def fail(msg):
    print(f"  ❌ {msg}")

# ════════════════════════════════════════════════════════════════
# 1. 四道箍对齐检查 (原有逻辑)
# ════════════════════════════════════════════════════════════════
def check_four_hoops():
    print("\n═══════════════════════════════════════════════")
    print("  🔄 四道箍对齐检查 (圈梁)")
    print("═══════════════════════════════════════════════\n")

    ok_count = total = 0
    issues = []

    for d in sorted(os.listdir(os.path.join(PROJECT, "apps/api/src/modules"))):
        dp = os.path.join(PROJECT, "apps/api/src/modules", d)
        if not os.path.isdir(dp):
            continue
        total += 1

        has_audit = os.path.exists(os.path.join(PROJECT, f"docs/knowledge/{d}-audit.md"))
        has_prd_summary = os.path.exists(os.path.join(PROJECT, f"docs/knowledge/prd-summary/{d}-audit.md")) or os.path.exists(os.path.join(PROJECT, "docs/knowledge/prd"))
        has_rb = os.path.exists(os.path.join(dp, f"{d}-ringbeam.test.ts"))
        has_test = len([f for f in os.listdir(dp) if f.endswith(('.test.ts', '.spec.ts'))]) > 0

        if has_audit and has_rb:
            ok_count += 1
        else:
            issues.append(f"{d}: audit={has_audit} rb={has_rb}")

    print(f"Total modules: {total}")
    print(f"Fully aligned: {ok_count}/{total} ({ok_count*100//total}%)")
    print(f"Issues: {len(issues)}")
    for i in issues[:10]:
        print(f"  ! {i}")
    return ok_count, total

# ════════════════════════════════════════════════════════════════
# 2. 覆盖率检查
# ════════════════════════════════════════════════════════════════
def check_coverage():
    print("\n═══════════════════════════════════════════════")
    print("  📊 覆盖率检查")
    print("═══════════════════════════════════════════════\n")

    coverage_found = False
    # 扫描常见覆盖率输出路径
    cov_paths = [
        os.path.join(PROJECT, "coverage"),
        os.path.join(PROJECT, "coverage/lcov.info"),
        os.path.join(PROJECT, "coverage/coverage-final.json"),
        os.path.join(PROJECT, "reports/coverage"),
        os.path.join(PROJECT, "reports/test-coverage"),
    ]
    for p in cov_paths:
        if os.path.exists(p):
            coverage_found = True
            if os.path.isdir(p):
                items = os.listdir(p)
                info(f"覆盖率目录: {p} ({len(items)} 个文件)")
            else:
                size = os.path.getsize(p)
                info(f"覆盖率文件: {p} ({size} bytes)")

    if coverage_found:
        ok("覆盖率报告存在，可在 CI/CD 中解析展示")
    else:
        warn("未发现覆盖率报告。请运行 pnpm test -- --coverage 或 vitest run --coverage")
        warn("期望路径: coverage/lcov.info 或 coverage/coverage-final.json")

    return coverage_found

# ════════════════════════════════════════════════════════════════
# 3. 假阳检测 (admin-web 已知假阳)
# ════════════════════════════════════════════════════════════════
def check_false_positives():
    print("\n═══════════════════════════════════════════════")
    print("  🎭 假阳检测")
    print("═══════════════════════════════════════════════\n")

    # 检查 admin-web 测试假阳情况
    admin_web_test_dir = os.path.join(PROJECT, "apps/admin-web")
    if not os.path.isdir(admin_web_test_dir):
        warn("admin-web 目录不存在，跳过假阳检查")
        return None

    # 扫描测试文件中标记为假阳的测试 (flaky, skip, todo, false_positive 等注释)
    fp_count = 0
    fp_details = []
    for root, dirs, files in os.walk(os.path.join(admin_web_test_dir, "app")):
        for fn in files:
            if not fn.endswith(('.test.ts', '.spec.ts')):
                continue
            fpath = os.path.join(root, fn)
            try:
                with open(fpath, 'r') as f:
                    content = f.read()
                    # 查找标记为假阳/false-positive/flaky/skip 的用例
                    lines = content.split('\n')
                    for i, line in enumerate(lines, 1):
                        stripped = line.strip()
                        # 跳过空行和纯注释
                        if not stripped:
                            continue
                        # 检测假阳标记
                        fp_patterns = [
                            r'false.?positive',
                            r'FLAKY',
                            r'flaky',
                            r'@skip',
                            r'it\.skip\(',
                            r'describe\.skip\(',
                            r'todo.*false',
                            r'KNOWN_FALSE_POSITIVE',
                        ]
                        for pat in fp_patterns:
                            if re.search(pat, stripped, re.IGNORECASE):
                                rel = os.path.relpath(fpath, admin_web_test_dir)
                                fp_count += 1
                                fp_details.append(f"  {rel}:{i} | {stripped[:80]}")
                                break
            except Exception as e:
                warn(f"无法读取 {fn}: {e}")

    print(f"  admin-web 已知假阳/跳过用例: {fp_count}")
    if fp_count > 0:
        warn(f"  admin-web 有 {fp_count} 个假阳/跳过标记")
        for d in fp_details[:15]:
            print(d)
        if len(fp_details) > 15:
            print(f"  ... 还有 {len(fp_details) - 15} 条")

    # 检查已知假阳是否增加: 扫描 docs/knowledge/debt.md 的假阳记录
    debt_file = os.path.join(PROJECT, "docs/knowledge/debt.md")
    if os.path.exists(debt_file):
        with open(debt_file) as f:
            debt_content = f.read()
        recorded_fp = len(re.findall(r'false.?positive', debt_content, re.IGNORECASE))
        print(f"  debt.md 中记录的假阳: {recorded_fp}")
        if fp_count > recorded_fp:
            warn(f"  当前假阳数 ({fp_count}) 超过记录 ({recorded_fp})，需更新债务文档")
        else:
            ok(f"  假阳数合理 (≤ {recorded_fp})")
    else:
        info("未找到 debt.md，跳过债务对比")

    return fp_count

# ════════════════════════════════════════════════════════════════
# 4. 测试深度检查 (正例/反例/边界)
# ════════════════════════════════════════════════════════════════
def check_test_depth():
    print("\n═══════════════════════════════════════════════")
    print("  📏 测试深度检查 (正例/反例/边界)")
    print("═══════════════════════════════════════════════\n")

    modules_dir = os.path.join(PROJECT, "apps/api/src/modules")
    if not os.path.isdir(modules_dir):
        warn("modules 目录不存在")
        return

    total_pos = total_neg = total_bound = 0
    total_it = 0
    module_stats = []

    for d in sorted(os.listdir(modules_dir)):
        dp = os.path.join(modules_dir, d)
        if not os.path.isdir(dp):
            continue

        pos = neg = bound = 0
        test_files = [f for f in os.listdir(dp) if f.endswith(('.test.ts', '.spec.ts'))]
        if not test_files:
            module_stats.append((d, 0, 0, 0, 0))
            continue

        it_count = 0
        for tf in test_files:
            try:
                with open(os.path.join(dp, tf)) as f:
                    content = f.read()
                # 统计 it() 用例数
                its = re.findall(r"\bit\s*\(['\"]", content)
                it_count += len(its)

                # 正例: "应该/应当/AC-/{无否定前缀的it描述}"
                pos_matches = re.findall(r"\bit\s*\(\s*['\"](?!.*(?:错误|失败|异常|无效|不存在|异常|越界|超限|边界|limit|error|invalid|negative|timeout))", content, re.IGNORECASE)
                pos += len(pos_matches)

                # 反例: 描述中包含错误/失败/异常/无效/不存在/error/fail/invalid
                neg_matches = re.findall(r"\bit\s*\(\s*['\"](?:.*(?:错误|失败|异常|无效|不存在|无权限|拒绝|error|fail|invalid|bad_|unauthorized|forbidden))", content, re.IGNORECASE)
                neg += len(neg_matches)

                # 边界: 描述中包含边界/越界/超限/极限/边界/limit/edge/overflow/empty/max/min/threshold
                bound_matches = re.findall(r"\bit\s*\(\s*['\"](?:.*(?:边界|越界|超限|极限|empty|max_|min_|threshold|edge case|overflow|bound|临界))", content, re.IGNORECASE)
                bound += len(bound_matches)
            except Exception:
                pass

        module_stats.append((d, it_count, pos, neg, bound))
        total_it += it_count
        total_pos += pos
        total_neg += neg
        total_bound += bound

    print(f"  总模块: {len(module_stats)} | 总用例: {total_it}")
    print(f"  正例: {total_pos} | 反例: {total_neg} | 边界: {total_bound}")
    print()

    # 输出各模块统计
    header = f"{'模块':<25} {'用例数':>8} {'正例':>6} {'反例':>6} {'边界':>6} {'深度分':>8}"
    print(header)
    print("-" * len(header))

    quality_issues = []
    for d, its, pos, neg, bound in sorted(module_stats, key=lambda x: -x[1]):
        depth_score = pos + neg * 3 + bound * 5  # 反例权重3, 边界权重5
        status = "🟢" if depth_score >= 10 else ("🟡" if depth_score >= 3 else "🔴")
        print(f"{status} {d:<22} {its:>8} {pos:>6} {neg:>6} {bound:>6} {depth_score:>8}")
        if depth_score < 3 and its > 0:
            quality_issues.append(d)

    print()
    if quality_issues:
        warn(f"以下模块测试深度不足 (深度分<3): {', '.join(quality_issues[:10])}")
    else:
        ok("所有有测试的模块均满足最低深度要求")

    return total_pos, total_neg, total_bound

# ════════════════════════════════════════════════════════════════
# 5. 🔐 安全门扫描 — 🐜 [V17: security-gates]
# ════════════════════════════════════════════════════════════════
def run_security_scan():
    """
    🐜 [V17: security-gates] 安全门扫描 — SAST + 密钥扫描

    在验收pipeline中嵌入安全扫描闸门.
    调用: scripts/security-scan.sh (独立shell版本)
    内联: 直接Python实现grep扫描 (shell不可用时回退)
    """
    import datetime

    date_str = datetime.date.today().isoformat()
    report_path = os.path.join(PROJECT, f"docs/knowledge/security-scan-{date_str}.md")

    print("\n" + "=" * 60)
    print("🔐 安全门扫描 · 🐜 [V17: security-gates]")
    print("=" * 60)

    # ── 优先调用独立shell脚本 ──────────────────────────
    script_path = os.path.join(PROJECT, "scripts/security-scan.sh")
    if os.path.exists(script_path):
        info(f"发现安全扫描脚本: {script_path}")
        info("委托执行...")
        result = subprocess.run(
            ["bash", script_path],
            cwd=PROJECT,
            capture_output=True,
            text=True,
            timeout=120
        )

        # Shell输出的扫描结果
        for line in result.stdout.split('\n'):
            print(line)
        if result.stderr:
            for line in result.stderr.split('\n'):
                print(f"  ⚠️ {line}")

        # 报告文件验证
        if os.path.exists(report_path):
            size = os.path.getsize(report_path)
            info(f"安全报告已写入: {report_path} ({size} bytes)")

        if result.returncode == 0:
            ok("安全门通过")
        elif result.returncode == 1:
            fail("安全门阻断 — 发现高危问题! 检查 docs/knowledge/security-scan-*.md")
        elif result.returncode == 2:
            fail("安全门提醒 — 发现中危问题")
        else:
            fail(f"安全门提醒 — 返回码 {result.returncode}")

        return result.returncode == 0

    # ── 备用: Python内联扫描 ─────────────────────────
    warn("独立脚本未找到,执行Python内联扫描...")

    secrets = []
    tokens = []

    # 1. 密钥扫描
    api_src = os.path.join(PROJECT, "apps/api/src")
    for root, dirs, files in os.walk(api_src):
        for f in files:
            if not f.endswith(".ts"):
                continue
            if ".test.ts" in f or ".spec.ts" in f:
                continue
            fp = os.path.join(root, f)
            try:
                with open(fp, "r", errors="ignore") as fh:
                    for lineno, line in enumerate(fh, 1):
                        if re.search(r'password\s*=\s*"[^"]{5,}"', line):
                            if any(kw in line for kw in ["example", "sample", "test", "mock", "fake"]):
                                continue
                            rel = os.path.relpath(fp, PROJECT)
                            secrets.append(f"{rel}:{lineno}: {line.strip()[:60]}")
                            if len(secrets) >= 20:
                                break
            except Exception:
                pass

    # 2. Token扫描
    apps_dir = os.path.join(PROJECT, "apps")
    for root, dirs, files in os.walk(apps_dir):
        for f in files:
            if not f.endswith(".ts"):
                continue
            if ".test.ts" in f or ".spec.ts" in f:
                continue
            fp = os.path.join(root, f)
            try:
                with open(fp, "r", errors="ignore") as fh:
                    for lineno, line in enumerate(fh, 1):
                        if re.search(r'token\s*=\s*"[^"]{10,}"', line):
                            rel = os.path.relpath(fp, PROJECT)
                            tokens.append(f"{rel}:{lineno}: {line.strip()[:60]}")
                            if len(tokens) >= 20:
                                break
            except Exception:
                pass

    # ── Python内联结果 ──────────────────────────────
    print(f"\n  硬编码密码检查: {'🔴 ' + str(len(secrets)) + '处发现' if secrets else '✅ 无发现'}")
    for s in secrets[:5]:
        print(f"    ! {s}")
    if len(secrets) > 5:
        print(f"    ... 还有{len(secrets)-5}处")

    print(f"\n  硬编码Token检查: {'🔴 ' + str(len(tokens)) + '处发现' if tokens else '✅ 无发现'}")
    for t in tokens[:5]:
        print(f"    ! {t}")
    if len(tokens) > 5:
        print(f"    ... 还有{len(tokens)-5}处")

    # ── Python内联写报告 ────────────────────────────
    os.makedirs(os.path.join(PROJECT, "docs/knowledge"), exist_ok=True)
    with open(report_path, "w") as rp:
        rp.write(f"# 🔐 安全扫描报告 (Python内联)\n\n")
        rp.write(f"> 扫描时间: {datetime.datetime.now().isoformat()}\n")
        rp.write(f"> 项目: shenjiying88 (V17)\n\n")
        rp.write(f"## 📊 汇总\n\n")
        rp.write(f"| 检查项 | 结果 |\n")
        rp.write(f"|--------|:----:|\n")
        rp.write(f"| 硬编码密码 | {'🔴 ' + str(len(secrets)) if secrets else '🟢 0'} |\n")
        rp.write(f"| 硬编码Token | {'🔴 ' + str(len(tokens)) if tokens else '🟢 0'} |\n")
        rp.write(f"\n> 🐜 [V17: security-gates]\n")

    total = len(secrets) + len(tokens)
    if total > 0:
        fail(f"安全门阻断 — 发现 {total} 个问题!")
        info(f"报告: {report_path}")
        return False

    ok("安全门通过")
    return True


# ════════════════════════════════════════════════════════════════
# 主流程
# ════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("🐜 圈梁对齐验证器 v2")
    print("   路线: V17 | 质量门禁 + 测试深度 + 安全门扫描")
    print()

    # 安全门扫描 (--security) 或 --full 模式
    if "--security" in sys.argv or "--full" in sys.argv:
        run_security_scan()

    if "--security" in sys.argv and "--full" not in sys.argv:
        # 仅安全扫描，跳过质量门禁
        sys.exit(0)

    check_four_hoops()
    check_coverage()
    check_false_positives()
    check_test_depth()

    print("\n═══════════════════════════════════════════════")
    print("  ✅ 质量门禁检查完成")
    print("═══════════════════════════════════════════════\n")
