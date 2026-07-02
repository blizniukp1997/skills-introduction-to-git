#!/bin/bash

# If not running in a Codespace, exit
if [ -z "${CODESPACE_NAME}" ]; then
  echo "Not running in a Codespace. Exiting."
  exit 0
fi

echo "Exercise Monitor: Event: codespace-started" >> /workspaces/exercise-monitor.log

# Build JSON payload safely using jq
PAYLOAD=$(jq -n \
  --arg event_type "codespace-started" \
  --arg codespace_name "$CODESPACE_NAME" \
  --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{
    "event_type": $event_type,
    "client_payload": {
      "codespace_name": $codespace_name,
      "timestamp": $timestamp
    }
  }')

# Send repository dispatch event
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches" \
  -d "$PAYLOAD" 2>/dev/null || echo "Failed to send repository dispatch event"

