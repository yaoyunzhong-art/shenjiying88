# Anti-pattern · Edit 工具偶发未写入

> 创建: 2026-06-26 (Phase-18 Retro)
> 严重度: 🟡 中
> 关联: [lessons-learned/phase-18.md](../lessons-learned/phase-18.md) §痛点 2

## 现象

```typescript
// 1. 调用 Edit 工具修改文件
Edit(file_path, old_string, new_string)
// → 返回成功 ✅

// 2. 但是 Read 文件验证
Read(file_path)
// → 内容未变 ❌
```

实际发生 (Phase-18 期间 3+ 次):
- Edit 显示"成功"但文件未写入
- Edit 后立即 cat 文件,内容无变化
- 浪费 3-5 分钟 debug

## 影响

- 调试时间浪费
- 测试结果不一致 (用旧代码跑)
- 信任 Edit 工具的成本增加

## 解法 · Edit 后必 cat 验证 + Python 兜底

```bash
# 1. Edit 后立即验证
Edit(file_path, ...)
cat file_path | head -20
# 必须看到变化才能继续

# 2. 如果未写入 → Python 兜底
python3 -c "
with open('file.ts', 'w') as f:
    f.write(content)
"
```

### 兜底脚本模式

```python
# ✅ 最稳的写入模式
import os
content = '''... 大段代码 ...'''
path = '/abs/path/to/file.ts'
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'wrote {path}')
```

```bash
python3 /tmp/write_file.py
```

## 根治 (Phase-19)

- Edit 工具前先 Read,确保 in-context
- 重要变更用 Write 而非 Edit (Write 会覆盖,更可靠)
- CI 步骤:文件 hash 校验

## 经验

> **Edit 工具不是 100% 可靠,每次必须 cat 验证。**
> **重要变更用 Write 或 Python 脚本,绕过 Edit 工具。**