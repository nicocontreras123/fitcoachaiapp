# 🚀 Script de Build Preview con App Distribution

## Descripción

El script `build-preview.sh` automatiza todo el proceso de:
1. ✅ Cargar variables de entorno
2. ✅ Generar build de Android con EAS
3. ✅ Subir automáticamente a Firebase App Distribution
4. ✅ Notificar al tester por email
5. ✅ Enviar notificación a Telegram (si está configurado)

## Configuración

### Variables en el Script

```bash
FIREBASE_APP_ID="1:966076969734:android:abca88c5f9dcc1644b2487"
TESTER_EMAIL="n.contrerasorellana@gmail.com"
RELEASE_NOTES="Nueva versión de prueba - Build [fecha y hora]"
```

### Requisitos Previos

1. **Firebase CLI instalado** (el script lo instala automáticamente si no está)
2. **Autenticación en Firebase**:
   ```bash
   firebase login
   ```

## Uso

```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x build-preview.sh

# Ejecutar el build
./build-preview.sh
```

## Flujo del Script

1. **Carga variables de entorno** desde `.env`
2. **Ejecuta EAS build** en modo local
3. **Busca el APK generado** automáticamente
4. **Verifica Firebase CLI** (instala si es necesario)
5. **Sube a App Distribution** con:
   - App ID de Firebase
   - Email del tester
   - Notas de la versión con fecha/hora
6. **Notifica al tester** por email automáticamente
7. **Envía notificación a Telegram** (si existe el script)

## Salida del Script

### Build Exitoso
```
🔧 Loading environment variables from .env...
📋 Checking variables:
  EXPO_PUBLIC_API_URL: http://localhost:3000/api
  OPENAI_API_KEY: sk-proj-abc123... (hidden)
🚀 Starting EAS build...
[... proceso de build ...]
✅ Build completado exitosamente!
📦 APK encontrado: ./build-1234567890.apk
📤 Subiendo a Firebase App Distribution...
✅ APK subido exitosamente a App Distribution!
📧 Notificación enviada a: n.contrerasorellana@gmail.com
✅ Build completado y subido a App Distribution 🎉
```

### Build Fallido
```
❌ Build falló
❌ Build falló (notificación Telegram)
```

## Personalización

### Cambiar Tester

Edita la línea en `build-preview.sh`:
```bash
TESTER_EMAIL="nuevo.tester@example.com"
```

### Agregar Múltiples Testers

```bash
TESTER_EMAIL="tester1@example.com,tester2@example.com,tester3@example.com"
```

### Personalizar Notas de Versión

```bash
RELEASE_NOTES="v1.2.0 - Nuevas funcionalidades de Crashlytics"
```

### Usar Grupos de Testers

En lugar de emails individuales:
```bash
firebase appdistribution:distribute "$APK_PATH" \
    --app "$FIREBASE_APP_ID" \
    --groups "qa-team,beta-testers" \
    --release-notes "$RELEASE_NOTES"
```

## Troubleshooting

### "Firebase CLI no encontrado"
El script lo instalará automáticamente. Si falla:
```bash
npm install -g firebase-tools
firebase login
```

### "No se encontró el archivo APK"
Verifica que el build se completó correctamente. El APK debería estar en la raíz del proyecto.

### "Error al subir a App Distribution"
1. Verifica que estés autenticado: `firebase login`
2. Verifica que el App ID sea correcto
3. Verifica que el tester esté agregado en Firebase Console

### "Permission denied"
```bash
chmod +x build-preview.sh
```

## Notas

- El script usa `--local` para builds locales (requiere Android SDK)
- Si no tienes Android SDK, quita `--local` para build en la nube
- Las notificaciones de Telegram son opcionales
- El tester recibirá un email con el link de descarga automáticamente

## Comandos Útiles

```bash
# Ver testers en App Distribution
firebase appdistribution:testers:list --app $FIREBASE_APP_ID

# Agregar tester manualmente
firebase appdistribution:testers:add --app $FIREBASE_APP_ID tester@example.com

# Ver releases
firebase appdistribution:releases:list --app $FIREBASE_APP_ID
```
