#!/usr/bin/env bash
set -e
echo "--- Installing server dependencies ---"
cd server && npm install --include=dev && cd ..
echo "--- Building server ---"
cd server && npm run build && cd ..
echo "--- Installing client dependencies ---"
cd client && npm install --include=dev && cd ..
echo "--- Building client ---"
cd client && npm run build && cd ..
echo "--- Build complete ---"