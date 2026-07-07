#!/bin/bash
# task-sync.sh · 神机营 SaaS 任务状态同步脚本 (V2 数据质量管控版)
#
# 流程:
#   1. 数据采集 - 扫描 .trae/tasks/ 目录
#   2. 完整性校验 - 检查数据完整性、一致性、去重
#   3. 异常处理 - 分类标记、溯源分析、自动化修复
#   4. 数据存储 - 格式标准化、持久化存储
#   5. 统计报告 - 生成质量报告
#
# 输出: .trae/tasks/TASKS_STATUS.md + logs/task-sync-report.json

set -e

# ==================== 配置 ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TASKS_DIR="$REPO_ROOT/.trae/tasks"
STATUS_FILE="$TASKS_DIR/TASKS_STATUS.md"
REPORT_FILE="$REPO_ROOT/logs/task-sync-report.json"
ARCHIVE_DIR="$TASKS_DIR/archive"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
TIMESTAMP_SHORT=$(date '+%Y%m%d_%H%M%S')
LOG_PREFIX="[$(date '+%H:%M:%S')]"

# ==================== 初始化 ====================
init() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "$LOG_PREFIX 任务同步开始: $TIMESTAMP"
  echo "═══════════════════════════════════════════════════════"

  # 确保目录存在
  mkdir -p "$ARCHIVE_DIR"
  mkdir -p "$REPO_ROOT/logs"

  # 初始化统计变量
  STAT_TOTAL=0
  STAT_PENDING=0
  STAT_IN_PROGRESS=0
  STAT_COMPLETED=0
  STAT_CANCELLED=0
  STAT_UNKNOWN=0
  STAT_DUPLICATES=0
  STAT_ANOMALIES=0
  STAT_REPAIRED=0
  START_TIME=$(date +%s)

  # 全局数据数组
  TASKS_DATA=()
  CLEANED_TASKS=()
  ANOMALIES=()
}

# ==================== Step 1: 数据采集 ====================
collect_data() {
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│ Step 1: 数据采集                                     │"
  echo "└─────────────────────────────────────────────────────┘"

  RAW_FILES=()

  # 扫描任务文件
  while IFS= read -r -d '' file; do
    RAW_FILES+=("$file")
  done < <(find "$TASKS_DIR" -maxdepth 1 -name "*.md" -not -name "TASKS_STATUS.md" -not -name "TASKS_REPORT*" -print0 2>/dev/null | sort -z)

  STAT_TOTAL=${#RAW_FILES[@]}
  echo "$LOG_PREFIX 扫描到 $STAT_TOTAL 个任务文件"

  # 存储原始数据
  TASKS_DATA=()

  for file in "${RAW_FILES[@]}"; do
    TASK_ID=$(basename "$file" .md)

    # 提取元数据
    status=$(grep -E '^\s*-\s+\*\*状态\*\*' "$file" 2>/dev/null | head -1 | sed -E 's/^[^:]+:\s*//' || echo "")
    priority=$(grep -E '^\s*-\s+\*\*优先级\*\*' "$file" 2>/dev/null | head -1 | sed -E 's/^[^:]+:\s*//' || echo "")
    owner=$(grep -E '^\s*-\s+\*\*执行人\*\*' "$file" 2>/dev/null | head -1 | sed -E 's/^[^:]+:\s*//' || echo "")
    phase=$(grep -E '^\s*-\s+\*\*Phase\*\*' "$file" 2>/dev/null | head -1 | sed -E 's/^[^:]+:\s*//' || echo "")
    title=$(grep -E '^#\s+' "$file" 2>/dev/null | head -1 | sed 's/^#\s*//' || echo "")

    # 存储: taskId|status|priority|phase|owner|title|filePath
    TASKS_DATA+=("$TASK_ID|$status|$priority|$phase|$owner|$title|$file")
  done

  echo "$LOG_PREFIX 数据采集完成"
}

# ==================== Step 2: 完整性校验 ====================
validate_data() {
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│ Step 2: 完整性校验与一致性检查                       │"
  echo "└─────────────────────────────────────────────────────┘"

  VALID_TASKS=()
  ANOMALIES=()
  SEEN_IDS=()

  for task_data in "${TASKS_DATA[@]}"; do
    IFS='|' read -r task_id status priority phase owner title file <<< "$task_data"

    # ---- 2.1 唯一性校验 ----
    is_duplicate=false
    for seen_id in "${SEEN_IDS[@]}"; do
      if [[ "$seen_id" == "$task_id" ]]; then
        is_duplicate=true
        break
      fi
    done

    if [[ "$is_duplicate" == "true" ]]; then
      ((STAT_DUPLICATES++)) || true
      ANOMALIES+=("$task_id|DUPLICATE|重复任务ID: $task_id")
      continue
    fi
    SEEN_IDS+=("$task_id")

    # ---- 2.2 必填字段校验 ----
    issues=""

    # 状态字段校验
    if [[ -z "$status" ]]; then
      issues="${issues}[STATUS_MISSING]"
    elif [[ ! "$status" =~ 待派发|派发中|进行中|已完成|已取消|预备 ]]; then
      # 非标准状态值，检查是否有 emoji
      if [[ ! "$status" =~ 🟡|🔄|✅|❌ ]]; then
        issues="${issues}[STATUS_UNSTANDARD]"
      fi
    fi

    # 标题校验
    if [[ -z "$title" ]]; then
      issues="${issues}[TITLE_MISSING]"
    fi

    # ---- 2.3 数据一致性校验 ----
    # Phase 格式检查
    if [[ -n "$phase" && ! "$phase" =~ ^[0-9]+ ]]; then
      issues="${issues}[PHASE_FORMAT]"
    fi

    # ---- 2.4 异常分类处理 ----
    if [[ -n "$issues" ]]; then
      ((STAT_ANOMALIES++)) || true
      ANOMALIES+=("$task_id|ANOMALY|$issues")

      # 自动化修复尝试
      repaired=false
      if [[ "$issues" == *"[STATUS_MISSING]"* ]]; then
        # 状态缺失，根据任务名推断
        if [[ "$task_id" =~ completed|done|finish ]]; then
          status="✅ 已完成"
          repaired=true
        elif [[ "$task_id" =~ T[0-9]+-[0-9]+ ]]; then
          # 子任务默认待派发
          status="🟡 待派发"
          repaired=true
        fi
      fi

      if [[ "$repaired" == "true" ]]; then
        ((STAT_REPAIRED++)) || true
        ANOMALIES+=("$task_id|REPAIRED|自动修复: $status")
      fi
    fi

    # 添加到有效任务列表
    VALID_TASKS+=("$task_id|$status|$priority|$phase|$owner|$title")
  done

  echo "$LOG_PREFIX 校验完成: 总数=$STAT_TOTAL, 重复=$STAT_DUPLICATES, 异常=$STAT_ANOMALIES, 修复=$STAT_REPAIRED"

  # 保存有效任务数据供后续使用 (使用新数组名避免覆盖)
  CLEANED_TASKS=("${VALID_TASKS[@]}")
}

# ==================== Step 3: 异常数据处理 ====================
process_anomalies() {
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│ Step 3: 异常数据处理                                 │"
  echo "└─────────────────────────────────────────────────────┘"

  # 生成异常报告
  ANOMALY_REPORT="$TASKS_DIR/TASKS_ANOMALIES.md"
  {
    echo "# ⚠️ 任务异常报告"
    echo ""
    echo "> 生成时间: $TIMESTAMP"
    echo "> 异常总数: $STAT_ANOMALIES"
    echo ""
    echo "---"
    echo ""

    if [[ ${#ANOMALIES[@]} -eq 0 ]]; then
      echo "✅ 无异常数据"
    else
      echo "## 异常列表"
      echo ""
      echo "| 任务ID | 异常类型 | 详情 |"
      echo "|--------|----------|------|"

      for anomaly in "${ANOMALIES[@]}"; do
        IFS='|' read -r task_id anomaly_type detail <<< "$anomaly"
        echo "| $task_id | $anomaly_type | $detail |"
      done
    fi

    echo ""
    echo "---"
    echo "*此报告由 task-sync.sh 自动生成*"
  } > "$ANOMALY_REPORT"

  # 生成告警日志 (用于无法自动修复的异常)
  ALERT_LOG="$REPO_ROOT/logs/task-sync-alerts.log"
  {
    echo "[$TIMESTAMP] 任务同步告警报告"
    echo "======================================"

    for anomaly in "${ANOMALIES[@]}"; do
      IFS='|' read -r task_id anomaly_type detail <<< "$anomaly"
      if [[ "$anomaly_type" == "ANOMALY" ]]; then
        echo "🚨 [ALERT] 任务 $task_id: $detail"
      fi
    done

    echo "======================================"
  } >> "$ALERT_LOG"

  echo "$LOG_PREFIX 异常处理完成"
  echo "$LOG_PREFIX   - 异常报告: $ANOMALY_REPORT"
  echo "$LOG_PREFIX   - 告警日志: $ALERT_LOG"
}

# ==================== Step 4: 数据标准化与存储 ====================
store_data() {
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│ Step 4: 格式标准化与存储优化                         │"
  echo "└─────────────────────────────────────────────────────┘"

  # 统计状态分布
  for task_data in "${CLEANED_TASKS[@]}"; do
    IFS='|' read -r task_id status priority phase owner title <<< "$task_data"

    clean_status=$(echo "$status" | tr -d '[:space:]' | tr -d '*')
    if [[ "$clean_status" =~ 待派发|派发中|🟡|预备 ]]; then
      ((STAT_PENDING++)) || true
    elif [[ "$clean_status" =~ 进行中|🔄 ]]; then
      ((STAT_IN_PROGRESS++)) || true
    elif [[ "$clean_status" =~ 已完成|✅ ]]; then
      ((STAT_COMPLETED++)) || true
    elif [[ "$clean_status" =~ 已取消|❌ ]]; then
      ((STAT_CANCELLED++)) || true
    else
      ((STAT_UNKNOWN++)) || true
    fi
  done

  # 生成 Markdown 状态报告
  {
    cat << EOF
# 📋 神机营 SaaS 任务状态汇总

> 自动生成 by task-sync.sh · $TIMESTAMP
> 数据质量: 异常 $STAT_ANOMALIES | 自动修复 $STAT_REPAIRED | 重复 $STAT_DUPLICATES

---

## 📊 任务统计

| 状态 | 数量 |
|------|------|
| 🟡 待派发 / 派发中 | $STAT_PENDING |
| 🔄 进行中 | $STAT_IN_PROGRESS |
| ✅ 已完成 | $STAT_COMPLETED |
| ❌ 已取消 | $STAT_CANCELLED |
| ❓ 未知 | $STAT_UNKNOWN |
| **总计** | **$STAT_TOTAL** |

---

## 📝 任务详情

| 状态 | 任务ID | 优先级 | Phase | 执行人 |
|------|--------|--------|-------|--------|
EOF

    # 按任务ID排序输出
    for task_data in "${CLEANED_TASKS[@]}"; do
      IFS='|' read -r task_id status priority phase owner title <<< "$task_data"

      # 状态图标映射
      clean_status=$(echo "$status" | tr -d '[:space:]' | tr -d '*')
      if [[ "$clean_status" =~ 待派发|派发中|🟡|预备 ]]; then
        icon="🟡"
      elif [[ "$clean_status" =~ 进行中|🔄 ]]; then
        icon="🔄"
      elif [[ "$clean_status" =~ 已完成|✅ ]]; then
        icon="✅"
      elif [[ "$clean_status" =~ 已取消|❌ ]]; then
        icon="❌"
      else
        icon="❓"
      fi

      echo "| $icon | $task_id | $priority | $phase | $owner |"
    done

    echo ""
    echo "---"
    echo "*此报告由 task-sync.sh 自动生成 · $(date '+%Y-%m-%d %H:%M:%S')*"

  } > "$STATUS_FILE"

  # 生成 JSON 格式报告 (便于程序处理)
  END_TIME=$(date +%s)
  ELAPSED=$((END_TIME - START_TIME))

  cat > "$REPORT_FILE" << EOF
{
  "syncTimestamp": "$TIMESTAMP",
  "summary": {
    "total": $STAT_TOTAL,
    "pending": $STAT_PENDING,
    "inProgress": $STAT_IN_PROGRESS,
    "completed": $STAT_COMPLETED,
    "cancelled": $STAT_CANCELLED,
    "unknown": $STAT_UNKNOWN,
    "duplicates": $STAT_DUPLICATES,
    "anomalies": $STAT_ANOMALIES,
    "repaired": $STAT_REPAIRED
  },
  "qualityMetrics": {
    "anomalyRate": "$(echo "scale=2; $STAT_ANOMALIES * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")%",
    "completionRate": "$(echo "scale=2; $STAT_COMPLETED * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")%",
    "knownStatusRate": "$(echo "scale=2; ($STAT_TOTAL - $STAT_UNKNOWN) * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")%"
  },
  "performance": {
    "elapsedSeconds": $ELAPSED,
    "filesPerSecond": "$(echo "scale=2; $STAT_TOTAL / $ELAPSED" | bc 2>/dev/null || echo "0")"
  },
  "tasks": [
EOF

  # 添加任务详情到 JSON
  first=true
  for task_data in "${CLEANED_TASKS[@]}"; do
    IFS='|' read -r task_id status priority phase owner title <<< "$task_data"

    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo "," >> "$REPORT_FILE"
    fi

    cat >> "$REPORT_FILE" << EOF
    {
      "id": "$task_id",
      "status": "$status",
      "priority": "$priority",
      "phase": "$phase",
      "owner": "$owner",
      "title": "$title"
    }
EOF
  done

  cat >> "$REPORT_FILE" << EOF
  ],
  "anomalies": [
EOF

  # 添加异常到 JSON
  first=true
  for anomaly in "${ANOMALIES[@]}"; do
    IFS='|' read -r task_id anomaly_type detail <<< "$anomaly"

    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo "," >> "$REPORT_FILE"
    fi

    cat >> "$REPORT_FILE" << EOF
    {
      "taskId": "$task_id",
      "type": "$anomaly_type",
      "detail": "$detail"
    }
EOF
  done

  cat >> "$REPORT_FILE" << EOF
  ]
}
EOF

  echo "$LOG_PREFIX 存储完成:"
  echo "$LOG_PREFIX   - 状态报告: $STATUS_FILE"
  echo "$LOG_PREFIX   - JSON报告: $REPORT_FILE"
}

# ==================== Step 5: 统计报告 ====================
generate_report() {
  echo ""
  echo "┌─────────────────────────────────────────────────────┐"
  echo "│ Step 5: 统计报告                                     │"
  echo "└─────────────────────────────────────────────────────┘"

  END_TIME=$(date +%s)
  ELAPSED=$((END_TIME - START_TIME))

  echo ""
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║           📊 任务同步统计报告                         ║"
  echo "╠═══════════════════════════════════════════════════════╣"
  printf "║  时间: %-40s ║\n" "$TIMESTAMP"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  📥 数据采集                                          ║"
  printf "║    总任务数:    %-35d ║\n" "$STAT_TOTAL"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  📊 状态分布                                          ║"
  printf "║    🟡 待派发:   %-35d ║\n" "$STAT_PENDING"
  printf "║    🔄 进行中:   %-35d ║\n" "$STAT_IN_PROGRESS"
  printf "║    ✅ 已完成:   %-35d ║\n" "$STAT_COMPLETED"
  printf "║    ❌ 已取消:   %-35d ║\n" "$STAT_CANCELLED"
  printf "║    ❓ 未知:     %-35d ║\n" "$STAT_UNKNOWN"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  ⚠️  数据质量                                          ║"
  printf "║    重复数据:   %-35d ║\n" "$STAT_DUPLICATES"
  printf "║    异常数据:   %-35d ║\n" "$STAT_ANOMALIES"
  printf "║    自动修复:   %-35d ║\n" "$STAT_REPAIRED"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  📈 质量指标                                          ║"
  ANOMALY_RATE=$(echo "scale=1; $STAT_ANOMALIES * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")
  COMPLETION_RATE=$(echo "scale=1; $STAT_COMPLETED * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")
  KNOWN_RATE=$(echo "scale=1; ($STAT_TOTAL - $STAT_UNKNOWN) * 100 / $STAT_TOTAL" | bc 2>/dev/null || echo "0")
  printf "║    异常率:     %-6s %%                              ║\n" "$ANOMALY_RATE"
  printf "║    完成率:     %-6s %%                              ║\n" "$COMPLETION_RATE"
  printf "║    状态已知率: %-6s %%                              ║\n" "$KNOWN_RATE"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  ⏱️  性能指标                                          ║"
  printf "║    处理耗时:   %-35d 秒 ║\n" "$ELAPSED"
  echo "╚═══════════════════════════════════════════════════════╝"

  # Git 变更检测
  if command -v git &> /dev/null && [[ -d "$REPO_ROOT/.git" ]]; then
    cd "$REPO_ROOT"
    if git diff --quiet "$STATUS_FILE" 2>/dev/null; then
      echo ""
      echo "$LOG_PREFIX 📝 状态文件无变化"
    else
      echo ""
      echo "$LOG_PREFIX 📝 状态文件有变化"
      git diff --stat "$STATUS_FILE" 2>/dev/null || true
    fi
  fi

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "$LOG_PREFIX 任务同步完成"
  echo "═══════════════════════════════════════════════════════"
}

# ==================== 主流程 ====================
main() {
  init
  collect_data
  validate_data
  process_anomalies
  store_data
  generate_report
}

main "$@"
