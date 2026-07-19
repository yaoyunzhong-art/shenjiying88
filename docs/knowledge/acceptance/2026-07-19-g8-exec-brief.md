# 2026-07-19 · G8 老板汇报版

> 主题: `G8` 正式窗口当前是否可发起
> 结论: `现在还不可以`
> 依据窗口: `formal-window-20260719-154427`

## 现状

- `G8` 正式窗口 readiness 已真实执行，结果失败
- 真实证据:
  - [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
  - [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)
- 当前实锤阻塞:
  - 历史失败窗口仍基于旧 `m5-platform.com` 口径
  - `sportsant.net` 企业域名与 `api/admin/store/tob.sportsant.net` host 已确认
  - 阿里云 DNS 中四个主机记录已存在，剩余主阻塞为 live `m5-tls` secret 缺失与新版 readiness 未复绿

## 风险

- 当前发起真实 `apply` 会直接违反门禁
- TLS 未就位会导致正式证书链不成立
- 旧域名口径若未清退，会导致窗口证据与正式发布口径分叉

## 需要谁拍板

- `E41`: 维持 `sportsant.net` 阿里云解析口径并配合新版复检
- `E52 / E46`: 提供 `sportsant.net + *.sportsant.net` 正式证书或直接下发 live `m5-tls`
- `E49`: 以 `sportsant.net` 口径重跑新版 readiness

## 最快恢复路径

1. 保持 `sportsant.net` 作为唯一企业级正式域名
2. 提供 `sportsant.net + *.sportsant.net` 正式证书并落地 `m5-tls`
3. 重跑 `run-g8-formal-window-ready.sh`
4. readiness 全绿后再进入真实 `--execute-apply --execute-rollback`

## 一句话判断

- 当前不是代码未完成，而是外部公网资产未到位；在 `DNS + TLS + host` 三项解阻前，`G8` 不允许进入真实窗口。
