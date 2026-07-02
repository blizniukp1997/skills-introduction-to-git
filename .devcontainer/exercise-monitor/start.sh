#!/bin/bash

LOG_FILE="/workspaces/exercise-monitor.log"

# Trigger event: codespace-started
if ! /home/vscode/.vscode-remote/data/Machine/exercise-monitor/codespace-started.sh; then
  echo "Exercise Monitor: Warning: codespace-started event failed" >> "$LOG_FILE"
fi

# Watch the Git config
if ! tmux new-session -d -s git_config_monitor '/home/vscode/.vscode-remote/data/Machine/exercise-monitor/git-config-monitor.sh'; then
  echo "Exercise Monitor: Error: failed to start git config monitor tmux session" >> "$LOG_FILE"
fi

# Show running background processes and commands to manually stop.
# tmux ls
# tmux kill-session -t git_config_monitor
# pgrep inotifywait
# for pid in $(pgrep inotifywait); do kill -- "$pid"; done

echo "Exercise Monitor: Started" >> "$LOG_FILE"
