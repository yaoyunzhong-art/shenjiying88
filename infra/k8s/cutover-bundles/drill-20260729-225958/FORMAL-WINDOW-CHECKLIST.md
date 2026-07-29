# Formal Window Checklist

## External Materials

- [ ] DNS provider access for `m5-platform.com`
- [ ] Final production hosts confirmed for `api / admin / storefront / tob`
- [ ] PEM material ready: `fullchain.pem` and `privkey.pem`, or an equivalent live `m5-tls` secret source
- [ ] `m5-tls` manifest rendered or live cluster secret verified
- [ ] Four public A records point to the production NLB IPs

## Run Order

1. Run `run-g8-formal-window-ready.sh` without `--execute-apply` to confirm readiness.
2. During the formal window, run the same entry with `--execute-apply --execute-rollback`.
3. Archive `infra/k8s/cutover-logs/<window-id>/` as the single evidence directory.
4. Update the G8 acceptance record, resign checklist, and weekly RYG board with the final log directory.

## Done Standard

- `00-formal-ready.log` exists and ends with a passed readiness gate
- `02-server-dry-run.log`, `03-apply.log`, `04-verify.log`, and `05-rollback.log` all exist
- `SUMMARY.md` points to the exact log set used during the formal window
- The acceptance record explicitly links the final log directory
