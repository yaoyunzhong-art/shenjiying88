#!/usr/bin/env bash
set -euo pipefail

ensure_m5_kubeconfig() {
  local root_dir="${1:-}"

  if [[ -n "${KUBECONFIG:-}" && -f "${KUBECONFIG:-}" ]]; then
    echo "==> Using kubeconfig: $KUBECONFIG"
    return 0
  fi

  local candidates=(
    "$HOME/.kube/m5-prod-config"
  )

  if [[ -n "$root_dir" ]]; then
    candidates+=(
      "$root_dir/infra/k8s/kubeconfig/m5-prod-config"
      "$root_dir/.kube/m5-prod-config"
    )
  fi

  local kubeconfig_path=""
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      kubeconfig_path="$candidate"
      break
    fi
  done

  if [[ -z "$kubeconfig_path" ]]; then
    echo "m5 kubeconfig not found. Expected one of: ${candidates[*]}" >&2
    return 1
  fi

  export KUBECONFIG="$kubeconfig_path"
  echo "==> Using kubeconfig: $KUBECONFIG"
}
