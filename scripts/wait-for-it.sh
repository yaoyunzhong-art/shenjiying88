#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# wait-for-it.sh — TCP wait-for-host utility
#
# 用法:
#   ./wait-for-it.sh host:port [-t timeout] [-- command args]
#   ./wait-for-it.sh postgres:5432 -t 30 -- echo "PostgreSQL is up"
#
# 来源: https://github.com/vishnubob/wait-for-it (MIT)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

WAITFORIT_cmdname=${0##*/}

usage() {
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname host:port [-t timeout] [-- command args]
    -t TIMEOUT     Timeout in seconds, zero for no timeout
    -q             Quiet mode
    -- COMMAND ARGS    Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for() {
    if [[ "$WAITFORIT_TIMEOUT" -gt 0 ]]; then
        echo "$WAITFORIT_cmdname: waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    else
        echo "$WAITFORIT_cmdname: waiting for $WAITFORIT_HOST:$WAITFORIT_PORT without a timeout"
    fi
    WAITFORIT_start_ts=$(date +%s)
    while :
    do
        if [[ "$WAITFORIT_ISBUSY" -eq 1 ]]; then
            nc -z "$WAITFORIT_HOST" "$WAITFORIT_PORT"
            WAITFORIT_result=$?
        else
            (echo -n > /dev/tcp/"$WAITFORIT_HOST"/"$WAITFORIT_PORT") >/dev/null 2>&1
            WAITFORIT_result=$?
        fi
        if [[ $WAITFORIT_result -eq 0 ]]; then
            WAITFORIT_end_ts=$(date +%s)
            echo "$WAITFORIT_cmdname: $WAITFORIT_HOST:$WAITFORIT_PORT is available after $((WAITFORIT_end_ts - WAITFORIT_start_ts)) seconds"
            break
        fi
        sleep 1
    done
    return $WAITFORIT_result
}

wait_for_wrapper() {
    if [[ "$WAITFORIT_QUIET" -eq 1 ]]; then
        timeout "$WAITFORIT_TIMEOUT" "$0" --quiet --child --host="$WAITFORIT_HOST" --port="$WAITFORIT_PORT" --timeout="$WAITFORIT_TIMEOUT" &
    else
        timeout "$WAITFORIT_TIMEOUT" "$0" --child --host="$WAITFORIT_HOST" --port="$WAITFORIT_PORT" --timeout="$WAITFORIT_TIMEOUT" &
    fi
    WAITFORIT_pid=$!
    trap "kill -INT $WAITFORIT_pid 2>/dev/null" INT
    wait "$WAITFORIT_pid"
    WAITFORIT_result=$?
    if [[ $WAITFORIT_result -ne 0 ]]; then
        echo "$WAITFORIT_cmdname: timeout occurred after waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    fi
    return $WAITFORIT_result
}

while [[ $# -gt 0 ]]
do
    case "$1" in
        *:* )
        WAITFORIT_hostport=(${1//:/ })
        WAITFORIT_HOST=${WAITFORIT_hostport[0]}
        WAITFORIT_PORT=${WAITFORIT_hostport[1]}
        shift 1
        ;;
        --child)
        WAITFORIT_CHILD=1
        shift 1
        ;;
        -q|--quiet)
        WAITFORIT_QUIET=1
        shift 1
        ;;
        -t)
        WAITFORIT_TIMEOUT="$2"
        if [[ "$WAITFORIT_TIMEOUT" == "" ]]; then break; fi
        shift 2
        ;;
        --timeout=*)
        WAITFORIT_TIMEOUT="${1#*=}"
        shift 1
        ;;
        --host=*)
        WAITFORIT_HOST="${1#*=}"
        shift 1
        ;;
        --port=*)
        WAITFORIT_PORT="${1#*=}"
        shift 1
        ;;
        --)
        shift
        WAITFORIT_CLI=("$@")
        break
        ;;
        -h|--help)
        usage
        ;;
        *)
        echo "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$WAITFORIT_TIMEOUT" -eq 0 ]]; then
    WAITFORIT_TIMEOUT=15
fi

if [[ "$WAITFORIT_HOST" == "" || "$WAITFORIT_PORT" == "" ]]; then
    echo "$WAITFORIT_cmdname: you need to provide a host and port to test"
    usage
fi

if [[ "$WAITFORIT_CHILD" -eq 1 ]]; then
    wait_for
    WAITFORIT_result=$?
    exit "$WAITFORIT_result"
else
    if [[ "$WAITFORIT_TIMEOUT" -gt 0 ]]; then
        wait_for_wrapper
    else
        wait_for
    fi
fi

WAITFORIT_result=$?

if [[ "${#WAITFORIT_CLI[@]}" -gt 0 ]]; then
    exec "${WAITFORIT_CLI[@]}"
else
    exit "$WAITFORIT_result"
fi
