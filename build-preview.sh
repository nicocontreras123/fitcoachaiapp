#!/bin/bash

echo "🔧 Loading environment variables from .env..."

# Load .env and export variables
set -a
source .env
set +a

# Verify variables are loaded
echo "📋 Checking variables:"
echo "  EXPO_PUBLIC_API_URL: ${EXPO_PUBLIC_API_URL:-NOT SET}"
echo "  OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}... (hidden)"

# Run EAS build
echo "🚀 Starting EAS build..."
eas build -p android --profile preview --local && ./notify-telegram.sh "✅ Build completado 🎉"
