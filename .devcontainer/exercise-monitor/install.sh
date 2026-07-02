#!/bin/bash

echo "Exercise Monitor: Installation started"

# Install exercise monitor
if ! cp -r /workspaces/${RepositoryName}/.devcontainer/exercise-monitor /home/vscode/.vscode-remote/data/Machine/exercise-monitor; then
  echo "Exercise Monitor: Error: failed to copy monitor files to codespace"
  exit 1
fi
echo "Exercise Monitor: Copied monitor files to codespace"

# Enable Git hook events
if ! git config --global core.hooksPath /home/vscode/.vscode-remote/data/Machine/exercise-monitor/.githooks; then
  echo "Exercise Monitor: Error: failed to set global hooksPath"
  exit 1
fi
echo "Exercise Monitor: Enabled event: post-commit"
echo "Exercise Monitor: Enabled event: post-checkout"
echo "Exercise Monitor: Enabled event: post-merge"

# Add support for running monitors in the background using tmux and inotify
if ! sudo apk add tmux; then
  echo "Exercise Monitor: Error: failed to install tmux"
  exit 1
fi
if ! sudo apk add inotify-tools; then
  echo "Exercise Monitor: Error: failed to install inotify-tools"
  exit 1
fi

# Trigger codespace created event
if ! /home/vscode/.vscode-remote/data/Machine/exercise-monitor/codespace-created.sh; then
  echo "Exercise Monitor: Warning: codespace-created event failed"
fi

echo "Exercise Monitor: Installation finished"
