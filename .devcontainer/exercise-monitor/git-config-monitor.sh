#!/bin/bash

LOG_FILE="/workspaces/exercise-monitor.log"

if ! command -v inotifywait &>/dev/null; then
  echo "Exercise Monitor: Error: inotifywait is not installed, git-config-monitor cannot start" >> "$LOG_FILE"
  exit 1
fi

# Monitor global config changes
inotifywait -m --include '\.gitconfig$' -e close_write,move,delete /home/vscode 2>>"$LOG_FILE" | \
while read -r file; do
  config_type="global"
  if ! /home/vscode/.vscode-remote/data/Machine/exercise-monitor/git-config-changed.sh $config_type; then
    echo "Exercise Monitor: Warning: git-config-changed (global) dispatch failed" >> "$LOG_FILE"
  fi
done &

# Monitor .git/config changes in repos of /workspaces directory
inotifywait -m -r --include '\.git/config$' -e close_write,move,delete /workspaces 2>>"$LOG_FILE" | \
while read -r file; do
  config_type="repository"
  if ! /home/vscode/.vscode-remote/data/Machine/exercise-monitor/git-config-changed.sh $config_type; then
    echo "Exercise Monitor: Warning: git-config-changed (repository) dispatch failed" >> "$LOG_FILE"
  fi
done &

echo "Exercise Monitor: Enabled event: git-config-changed" >> "$LOG_FILE"

# Heartbeat to keep above monitors alive
while true; do
  sleep $((60*5)) # 5 minutes
  echo "Exercise Monitor: heartbeat: git-config-monitor" >> "$LOG_FILE"
done