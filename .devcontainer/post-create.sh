#!/bin/bash

# Only use paging if the results are longer than one screen.
# Do this before installing the exercise monitor
git config --global pager.log false
git config --global core.pager "less -FX"

# Install exercise monitor - Do this last to avoid accidental triggers during startup.
if ! /workspaces/${RepositoryName}/.devcontainer/exercise-monitor/install.sh; then
  echo "Warning: Exercise monitor installation failed"
fi

# Delete the .git folder in the exercise repo to prevent from showing in version control
rm -R -f /workspaces/${RepositoryName}/.git

# Create sample project if it doesn't exist
REPO_DIR="/workspaces/stack-overflown"
if [ ! -d "$REPO_DIR" ]; then
  #  Create project folder
  if ! mkdir -p "$REPO_DIR"; then
    echo "Error: failed to create project directory $REPO_DIR"
    exit 1
  fi

  # Copy sample source code
  if ! cp -r /workspaces/${RepositoryName}/src/. $REPO_DIR/src/; then
    echo "Error: failed to copy source files to $REPO_DIR/src/"
    exit 1
  fi
fi