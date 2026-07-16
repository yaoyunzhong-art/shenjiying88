# dispatch-510-tree: admin-web marketing边界新fail

## 来源
- 脉冲 #510 验收发现
- 提交范围: 567aa71ad + 667146ff2 + 04e1daad7
- admin-web test: 6821 pass / 64 fail (← 之前6822/63, **+1 NEW**)

## 失败详情
| 位置 | 描述 | 期望 | 实际 |
|:----|:-----|:----:|:----:|
| marketing — 边界 | 预算为负值应能被正确处理 | 待确认 | FAIL |

## 分析
"marketing — 边界" 下 new test "预算为负值应能被正确处理" 是新功能引入的自动生成测试假阳。需要检查 marketing 模块对该场景的处理逻辑是否到位。

## 后续
- 下个脉冲验收闭环
- 连续2次同fail→P0
