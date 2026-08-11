#!/bin/bash

# Run Snoozelet on macOS. This file may be opened from Finder after setup.
set -e

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required to run Snoozelet."
  echo "Download the macOS Intel installer from: https://nodejs.org/en/download"
  echo
  read -r -p "Press Return to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing Snoozelet for this Mac (first launch only)..."
  npm install
fi

if [ ! -f data/study.sqlite ]; then
  echo "Creating the local Snoozelet database..."
  npm run db:seed
fi

echo "Starting Snoozelet at http://localhost:3000"
(sleep 3; open http://localhost:3000) &
npm run dev

