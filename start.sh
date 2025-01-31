#!/usr/bin/env bash

echo "Launching Node.js application (Unix) with error checks"
echo

# 1) Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
  echo "[Error] Node.js is not installed or not in PATH."
  echo "Please install Node.js from https://nodejs.org and try again."
  exit 1
fi

echo "Node.js is installed. Proceeding..."

# 2) Check if node_modules folder exists
if [ ! -d "node_modules" ]; then
  echo "\"node_modules\" not found. Running \"npm install\"..."
  npm install
  if [ $? -ne 0 ]; then
    echo "[Error] \"npm install\" failed."
    exit 1
  fi
fi

# Optional check if "sqlite3" module is installed
npm list sqlite3 >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "\"sqlite3\" module not found. Attempting to install..."
  npm install sqlite3
  if [ $? -ne 0 ]; then
    echo "[Error] sqlite3 module could not be installed."
    exit 1
  fi
fi

echo
echo "All checks passed. Starting application..."
echo

# 3) Launch index.js
node index.js
if [ $? -ne 0 ]; then
  echo "[Error] The application exited with an error."
  exit 1
fi

echo
echo "Application exited successfully."
