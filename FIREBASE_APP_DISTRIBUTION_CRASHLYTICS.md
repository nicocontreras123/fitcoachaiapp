# Configuración de Firebase App Distribution y Crashlytics

## 📱 App Distribution
Permite distribuir builds de prueba a testers sin pasar por las tiendas.

## 🐛 Crashlytics
Monitoreo de crashes en tiempo real para detectar y solucionar problemas.

---

## 1. Habilitar Servicios en Firebase Console

### 1.1 Habilitar Crashlytics
1. Ve a Firebase Console → Tu proyecto
2. En el menú lateral, busca **Crashlytics**
3. Haz clic en "Comenzar"
4. Sigue las instrucciones (ya está configurado con google-services.json)

### 1.2 Habilitar App Distribution
1. En el menú lateral, busca **App Distribution**
2. Haz clic en "Comenzar"
3. Ya está listo para usar

---

## 2. Configuración del Proyecto

### 2.1 Instalar Dependencias

```bash
npm install @react-native-firebase/app @react-native-firebase/crashlytics
```

### 2.2 Actualizar `app.config.js`

Ya está configurado con:
- ✅ `googleServicesFile` apuntando a tu archivo
- ✅ Variables de entorno de Firebase

### 2.3 Configurar Android Build Gradle

Necesitas hacer un prebuild para generar los archivos nativos de Android:

```bash
npx expo prebuild --platform android
```

Esto creará la carpeta `android/app/` con todos los archivos necesarios.

---

## 3. Uso de Crashlytics

### 3.1 Crear servicio de Crashlytics

Crea `src/services/firebase/crashlytics.ts`:

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

export const crashlyticsService = {
  // Registrar un error
  recordError: (error: Error, context?: string) => {
    if (context) {
      crashlytics().log(`Context: ${context}`);
    }
    crashlytics().recordError(error);
  },

  // Registrar un error fatal
  crash: (message: string) => {
    crashlytics().log(message);
    crashlytics().crash();
  },

  // Establecer ID de usuario
  setUserId: (userId: string) => {
    crashlytics().setUserId(userId);
  },

  // Establecer atributos personalizados
  setAttribute: (key: string, value: string) => {
    crashlytics().setAttribute(key, value);
  },

  // Log personalizado
  log: (message: string) => {
    crashlytics().log(message);
  },

  // Habilitar/deshabilitar recolección
  setCrashlyticsCollectionEnabled: (enabled: boolean) => {
    crashlytics().setCrashlyticsCollectionEnabled(enabled);
  },
};
```

### 3.2 Integrar en tu App

En `app/_layout.tsx` o donde manejes errores globales:

```typescript
import { crashlyticsService } from '@/services/firebase/crashlytics';

// Al inicio de la app
useEffect(() => {
  // Habilitar Crashlytics
  crashlyticsService.setCrashlyticsCollectionEnabled(true);
}, []);

// En tu error boundary o catch blocks
try {
  // tu código
} catch (error) {
  crashlyticsService.recordError(error as Error, 'Contexto del error');
}
```

### 3.3 Probar Crashlytics

Para probar que funciona:

```typescript
import { crashlyticsService } from '@/services/firebase/crashlytics';

// Forzar un crash de prueba (solo en desarrollo)
crashlyticsService.crash('Test crash from development');
```

---

## 4. Uso de App Distribution

### 4.1 Crear un Build de Distribución

#### Opción A: Con EAS Build (Recomendado)

1. Instala EAS CLI:
```bash
npm install -g eas-cli
```

2. Configura EAS:
```bash
eas build:configure
```

3. Crea un build de distribución:
```bash
eas build --platform android --profile preview
```

4. Una vez completado, sube el APK a App Distribution:
   - Ve a Firebase Console → App Distribution
   - Haz clic en "Distribuir"
   - Sube el APK generado
   - Agrega testers por email
   - Envía invitaciones

#### Opción B: Build Local

1. Genera el APK:
```bash
cd android
./gradlew assembleRelease
```

2. El APK estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

3. Súbelo manualmente a Firebase App Distribution

### 4.2 Automatizar con Firebase CLI

1. Instala Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login:
```bash
firebase login
```

3. Distribuir APK:
```bash
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app 1:966076969734:android:abca88c5f9dcc1644b2487 \
  --groups "testers" \
  --release-notes "Nueva versión de prueba"
```

---

## 5. Configuración de eas.json para App Distribution

Crea o actualiza `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 6. Comandos Útiles

### Generar Build para Distribución
```bash
# Con EAS (recomendado)
eas build --platform android --profile preview

# Local
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

### Distribuir con Firebase CLI
```bash
firebase appdistribution:distribute path/to/app.apk \
  --app YOUR_APP_ID \
  --groups "testers"
```

### Ver Crashes en Consola
```bash
# Los crashes aparecerán automáticamente en:
# Firebase Console → Crashlytics → Dashboard
```

---

## 7. Pasos Siguientes

### Para Crashlytics:
1. ✅ Instalar dependencias
2. ⬜ Hacer prebuild: `npx expo prebuild --platform android`
3. ⬜ Crear servicio de crashlytics
4. ⬜ Integrar en error boundaries
5. ⬜ Hacer build y probar

### Para App Distribution:
1. ✅ Habilitar en Firebase Console
2. ⬜ Configurar EAS Build
3. ⬜ Crear primer build de distribución
4. ⬜ Agregar testers en Firebase Console
5. ⬜ Distribuir build

---

## 8. Verificación

### Verificar que Crashlytics está funcionando:
1. Haz un build de la app
2. Fuerza un crash de prueba
3. Ve a Firebase Console → Crashlytics
4. Deberías ver el crash reportado en ~5 minutos

### Verificar App Distribution:
1. Sube un APK a App Distribution
2. Agrega tu email como tester
3. Deberías recibir un email con el link de descarga
4. Instala la app desde el link

---

## 9. Notas Importantes

⚠️ **Crashlytics solo funciona en builds de producción/release**, no en desarrollo con Expo Go.

⚠️ **App Distribution** requiere builds nativos (APK/AAB), no funciona con Expo Go.

⚠️ Necesitas hacer `npx expo prebuild` para generar los archivos nativos de Android.

⚠️ Los crashes pueden tardar hasta 5 minutos en aparecer en la consola.

---

## 10. Troubleshooting

### "Crashlytics not initialized"
- Asegúrate de haber hecho `npx expo prebuild`
- Verifica que `google-services.json` esté en `android/app/`
- Haz un clean build: `cd android && ./gradlew clean`

### "App Distribution upload failed"
- Verifica que el App ID sea correcto
- Asegúrate de estar autenticado: `firebase login`
- Verifica que el APK esté firmado correctamente

### Crashes no aparecen
- Espera 5-10 minutos
- Verifica que Crashlytics esté habilitado en Firebase Console
- Asegúrate de que sea un build de release, no debug
