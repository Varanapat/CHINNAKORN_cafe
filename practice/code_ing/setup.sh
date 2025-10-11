#!/bin/bash

echo "Detecting OS..."
OS=$(uname)

if [[ "$OS" == "Darwin" ]]; then
  echo "Running on macOS"
elif [[ "$OS" == "Linux" ]]; then
  echo "Running on Linux"
elif [[ "$OS" == MINGW* || "$OS" == CYGWIN* ]]; then
  echo "Running on Windows (Git Bash)"
else
  echo "Unknown OS: $OS"
fi

echo "Initializing project..."
npm init -y

echo "Installing dependencies..."
npm install promptpay-qr qrcode express ejs express-session cookie-parser sqlite3 nodemon

echo "✅ Done!"


# chmod +x setup.sh
# ./setup.sh
