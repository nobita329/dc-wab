#!/usr/bin/env bash
# Forwarder / Launcher from workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/d/run.sh" ]; then
  exec bash "$SCRIPT_DIR/d/run.sh" "$@"
else
  echo "Error: $SCRIPT_DIR/d/run.sh not found!"
  exit 1
fi

