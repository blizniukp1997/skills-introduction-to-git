#!/bin/bash
# Shared handler for codespace lifecycle events (created / started).
# Usage: codespace-event.sh <event_type>
#   event_type - e.g. "codespace-created" or "codespace-started"

EVENT_TYPE="$1"

if [ -z "$EVENT_TYPE" ]; then
  echo "Usage: codespace-event.sh <event_type>"
  exit 1
fi

# If not running in a Codespace, exit
if [ -z "${CODESPACE_NAME}" ]; then
  echo "Not running in a Codespace. Exiting."
  exit 0
fi

echo "Exercise Monitor: Event: $EVENT_TYPE" >> /workspaces/exercise-monitor.log

# Get Codespace information
CODESPACE_NAME="${CODESPACE_NAME}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/send-dispatch.sh" "$EVENT_TYPE" "-"
