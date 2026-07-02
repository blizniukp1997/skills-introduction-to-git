#!/bin/bash

# Get config type from argument
CONFIG_TYPE=$1

echo "Exercise Monitor: Event: git-config-changed ($CONFIG_TYPE)" >> /workspaces/exercise-monitor.log

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/send-dispatch.sh" "git-config-changed" '{
    "event_type": "git-config-changed",
    "client_payload": {
      "config_type": "'"$CONFIG_TYPE"'",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
    }
  }'
