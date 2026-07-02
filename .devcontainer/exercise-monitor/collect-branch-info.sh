#!/bin/bash
# Shared utility: collect branch commit count and messages.
# Outputs two shell variables (meant to be sourced or eval'd):
#   BRANCH_COMMIT_COUNT
#   BRANCH_COMMIT_MESSAGES
#
# Usage: eval "$(collect-branch-info.sh)"

BRANCH_NAME=$(git branch --show-current)
DEFAULT_BRANCH=$(git branch --sort=committerdate --format='%(committerdate:short) %(refname:short)' | head -n 1 | cut -d' ' -f2)

if [ "$BRANCH_NAME" != "$DEFAULT_BRANCH" ]; then
  BRANCH_COMMIT_COUNT=$(git rev-list --count ${DEFAULT_BRANCH}..${BRANCH_NAME})
  BRANCH_COMMIT_MESSAGES=$(git log ${DEFAULT_BRANCH}..${BRANCH_NAME} --pretty=format:'%h%x1f%s' | jq -R -s -c 'split("\n") | map(select(length > 0)) | map(split("\u001f") | {id: .[0], message: .[1]})')
else
  BRANCH_COMMIT_COUNT=$(git rev-list --count HEAD)
  BRANCH_COMMIT_MESSAGES=$(git log --pretty=format:'%h%x1f%s' | jq -R -s -c 'split("\n") | map(select(length > 0)) | map(split("\u001f") | {id: .[0], message: .[1]})')
fi

echo "BRANCH_COMMIT_COUNT=$BRANCH_COMMIT_COUNT"
echo "BRANCH_COMMIT_MESSAGES='$BRANCH_COMMIT_MESSAGES'"
