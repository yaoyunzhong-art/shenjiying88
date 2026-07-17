#!/usr/bin/env bash

discover_m5_kubeconfig() {
  local root_dir="${1:-}"
  local candidates=()

  if [[ -n "${KUBECONFIG:-}" && -f "${KUBECONFIG%%:*}" ]]; then
    printf '%s\n' "$KUBECONFIG"
    return 0
  fi

  candidates+=("$HOME/.kube/m5-prod-config")

  if [[ -n "$root_dir" ]]; then
    candidates+=("$root_dir/.tmp/ack-kubeconfig.yaml")
  fi

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

ensure_m5_kubeconfig() {
  local root_dir="${1:-}"
  local discovered=""

  discovered="$(discover_m5_kubeconfig "$root_dir")" || {
    echo "No usable m5 kubeconfig found. Checked KUBECONFIG, ~/.kube/m5-prod-config and $root_dir/.tmp/ack-kubeconfig.yaml" >&2
    return 1
  }

  export KUBECONFIG="$discovered"
  echo "==> Using kubeconfig: $KUBECONFIG"
}
