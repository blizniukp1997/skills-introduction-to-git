#!/bin/bash

LOG_FILE="/workspaces/exercise-monitor.log"

# Get config type from argument
CONFIG_TYPE=$1

if [ -z "$CONFIG_TYPE" ]; then
  echo "Exercise Monitor: Error: config type argument is required for git-config-changed" >> "$LOG_FILE"
  exit 1
fi

if [ -z "${GITHUB_TOKEN}" ]; then
  echo "Exercise Monitor: Error: GITHUB_TOKEN is not set, skipping git-config-changed event" >> "$LOG_FILE"
  exit 1
fi

if [ -z "${GITHUB_REPOSITORY}" ]; then
  echo "Exercise Monitor: Error: GITHUB_REPOSITORY is not set, skipping git-config-changed event" >> "$LOG_FILE"
  exit 1
fi

echo "Exercise Monitor: Event: git-config-changed ($CONFIG_TYPE)" >> "$LOG_FILE"

# Send repository dispatch event
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches" \
  -d '{
    "event_type": "git-config-changed",
    "client_payload": {
      "config_type": "'"$CONFIG_TYPE"'",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
    }
  }' 2>>"$LOG_FILE")

if [ $? -ne 0 ]; then
  echo "Exercise Monitor: Error: curl failed for git-config-changed dispatch" >> "$LOG_FILE"
  exit 1
elif [ "$HTTP_STATUS" -ge 400 ] 2>/dev/null; then
  echo "Exercise Monitor: Error: git-config-changed dispatch returned HTTP $HTTP_STATUS" >> "$LOG_FILE"
  exit 1
fi
