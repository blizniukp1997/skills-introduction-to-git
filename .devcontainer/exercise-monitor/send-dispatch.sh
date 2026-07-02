#!/bin/bash
# Shared utility: send a repository dispatch event to GitHub.
# Usage: send-dispatch.sh <event_type> <json_payload>
#   event_type   - the repository_dispatch event type string
#   json_payload - a full JSON body string (must include "event_type" and "client_payload")
#                  OR pass "-" to build a simple payload from event_type + CODESPACE_NAME.
#
# When called with "-" as the payload, a default payload is generated:
#   { "event_type": "<event_type>",
#     "client_payload": { "codespace_name": "$CODESPACE_NAME", "timestamp": "..." } }

EVENT_TYPE="$1"
JSON_PAYLOAD="$2"

if [ -z "$EVENT_TYPE" ]; then
  echo "Usage: send-dispatch.sh <event_type> <json_payload | ->"
  exit 1
fi

if [ "$JSON_PAYLOAD" = "-" ]; then
  JSON_PAYLOAD='{
    "event_type": "'"$EVENT_TYPE"'",
    "client_payload": {
      "codespace_name": "'"$CODESPACE_NAME"'",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
    }
  }'
fi

curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches" \
  -d "$JSON_PAYLOAD" 2>/dev/null || echo "Failed to send repository dispatch event"
