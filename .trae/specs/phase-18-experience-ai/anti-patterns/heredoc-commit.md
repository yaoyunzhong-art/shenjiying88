# Anti-pattern · Heredoc Commit 痛点

> 创建: 2026-06-26 (Phase-18 Retro)
> 严重度: 🟡 中
> 关联: [lessons-learned/phase-18.md](../lessons-learned/phase-18.md) §痛点 1

## 现象

```bash
# ❌ 反例 - IDE 频繁改坏
git commit -m "$(cat <<'EOF'
多行 commit message
有特殊字符 & 引号 ' 中文
EOF
)"
```

实际发生:
- IDE 自动重格式化 heredoc
- 三引号 `'中文'` 被拆成 `'中文 '`
- 多行内容被合并成一行
- 整个 commit 信息丢失或错乱

## 影响

- 浪费 5+ 分钟 debug
- commit message 错乱影响项目历史
- 测试半途中断,需重新执行

## 解法 · Python subprocess

```python
# ✅ 正例 - 完全绕开 shell heredoc
import subprocess
result = subprocess.run(
    ["git", "commit", "-m", MSG],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
```

### 优势

- MSG 是 Python 普通字符串,IDE 不会乱改
- 多行 / 引号 / 中文全部稳定
- 失败时 stderr 完整捕获
- 可作为 CI 步骤

### 工作流

```bash
# 1. Write 写 Python 脚本到 /tmp
# 2. python3 /tmp/commit_xxx.py
# 3. 验证 git log --oneline -5
```

## 根治 (Phase-19)

- 引入 **git-cz** (Conventional Commits 工具)
- 引入 **commitlint** (commit message lint)
- 引入 **commit template 文件** (`.gitmessage.txt`)
- CI 自动校验 commit 格式

## 经验

> **shell heredoc 复杂 commit 必失败,Python subprocess 是当前最稳路径。**
> **Phase-19 引入 git-cz 彻底解决。**