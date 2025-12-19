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

# Firebase App Distribution configuration
FIREBASE_APP_ID="1:966076969734:android:abca88c5f9dcc1644b2487"
TESTER_EMAIL="n.contrerasorellana@gmail.com"
RELEASE_NOTES="Nueva versión de prueba - Build $(date '+%Y-%m-%d %H:%M')"

# Run EAS build
echo "🚀 Starting EAS build..."
eas build -p android --profile preview --local

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente!"
    
    # Find the most recent APK file
    APK_PATH=$(find . -name "*.apk" -type f -print0 | xargs -0 ls -t | head -n 1)
    
    if [ -z "$APK_PATH" ]; then
        echo "❌ No se encontró el archivo APK"
        exit 1
    fi
    
    echo "📦 APK encontrado: $APK_PATH"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo "⚠️  Firebase CLI no está instalado. Instalando..."
        npm install -g firebase-tools
    fi
    
    # Upload to Firebase App Distribution
    echo "📤 Subiendo a Firebase App Distribution..."
    firebase appdistribution:distribute "$APK_PATH" \
        --app "$FIREBASE_APP_ID" \
        --testers "$TESTER_EMAIL" \
        --release-notes "$RELEASE_NOTES"
    
    if [ $? -eq 0 ]; then
        echo "✅ APK subido exitosamente a App Distribution!"
        echo "📧 Notificación enviada a: $TESTER_EMAIL"
        
        # Send Telegram notification if script exists
        if [ -f "./notify-telegram.sh" ]; then
            ./notify-telegram.sh "✅ Build completado y subido a App Distribution 🎉"
        fi
    else
        echo "❌ Error al subir a App Distribution"
        exit 1
    fi
else
    echo "❌ Build falló"
    
    # Send Telegram notification if script exists
    if [ -f "./notify-telegram.sh" ]; then
        ./notify-telegram.sh "❌ Build falló"
    fi
    
    exit 1
fi
