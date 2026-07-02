#!/bin/bash

LOG_FILE="/workspaces/exercise-monitor.log"

# If not running in a Codespace, exit
if [ -z "${CODESPACE_NAME}" ]; then
  echo "Not running in a Codespace. Exiting."
  exit 0
fi

if [ -z "${GITHUB_TOKEN}" ]; then
  echo "Exercise Monitor: Error: GITHUB_TOKEN is not set, skipping codespace-created event" >> "$LOG_FILE"
  exit 1
fi

if [ -z "${GITHUB_REPOSITORY}" ]; then
  echo "Exercise Monitor: Error: GITHUB_REPOSITORY is not set, skipping codespace-created event" >> "$LOG_FILE"
  exit 1
fi

echo "Exercise Monitor: Event: codespace-created" >> "$LOG_FILE"

# Send repository dispatch event
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches" \
  -d '{
    "event_type": "codespace-created",
    "client_payload": {
      "codespace_name": "'"$CODESPACE_NAME"'",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
    }
  }' 2>>"$LOG_FILE")

if [ $? -ne 0 ]; then
  echo "Exercise Monitor: Error: curl failed for codespace-created dispatch" >> "$LOG_FILE"
  exit 1
elif [ "$HTTP_STATUS" -ge 400 ] 2>/dev/null; then
  echo "Exercise Monitor: Error: codespace-created dispatch returned HTTP $HTTP_STATUS" >> "$LOG_FILE"
  exit 1
fi

