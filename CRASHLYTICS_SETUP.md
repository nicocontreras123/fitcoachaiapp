# ✅ Configuración de Firebase Crashlytics - Pasos Finales

## 📋 Resumen
Crashlytics te permite monitorear crashes y errores en tiempo real en tu app.

---

## 🎯 Pasos para Activar Crashlytics

### 1. ✅ Ya Completado
- ✅ Proyecto Firebase creado
- ✅ `google-services.json` en `android/src/`
- ✅ Dependencias instalándose: `@react-native-firebase/app` y `@react-native-firebase/crashlytics`
- ✅ `app.config.js` configurado con `googleServicesFile`
- ✅ Servicio de Crashlytics creado en `src/services/firebase/crashlytics.ts`

### 2. ⏳ Habilitar Crashlytics en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **fitcoachai-prd**
3. En el menú lateral, busca **Crashlytics**
4. Haz clic en **"Comenzar"**
5. Sigue las instrucciones (básicamente solo confirmar)

### 3. 🔨 Generar Archivos Nativos de Android

Crashlytics necesita archivos nativos de Android. Ejecuta:

```bash
npx expo prebuild --platform android --clean
```

Esto creará la carpeta `android/app/` con todos los archivos necesarios.

### 4. 🔗 Integrar Crashlytics en tu App

Abre `app/_layout.tsx` y agrega al inicio:

```typescript
import { crashlyticsService } from '@/services/firebase/crashlytics';
import { useEffect } from 'react';

// Dentro del componente RootLayout, antes del return
useEffect(() => {
  // Inicializar Crashlytics
  crashlyticsService.initialize();
}, []);
```

### 5. 🧪 Probar Crashlytics

#### Opción A: Crear un Build de Prueba

```bash
# Generar APK de release
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

#### Opción B: Usar EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar EAS
eas build:configure

# Crear build de preview
eas build --platform android --profile preview
```

### 6. 🎯 Forzar un Crash de Prueba

Una vez instalada la app desde el build, agrega un botón de prueba:

```typescript
import { crashlyticsService } from '@/services/firebase/crashlytics';

// En cualquier pantalla de prueba
<Pressable onPress={() => {
  crashlyticsService.crash('Test crash from app');
}}>
  <Text>Test Crash</Text>
</Pressable>
```

**Importante**: Los crashes solo se reportan en builds de **release**, no en desarrollo.

### 7. 📊 Ver Crashes en Firebase Console

1. Ve a Firebase Console → Crashlytics
2. Espera 5-10 minutos después del crash
3. Deberías ver el crash reportado con detalles completos

---

## 🔧 Uso de Crashlytics en tu Código

### Registrar Errores No Fatales

```typescript
import { crashlyticsService } from '@/services/firebase/crashlytics';

try {
  // Tu código que puede fallar
  await someAsyncOperation();
} catch (error) {
  // Registrar el error en Crashlytics
  crashlyticsService.recordError(error as Error, 'Error en someAsyncOperation');
  // Manejar el error...
}
```

### Establecer ID de Usuario

```typescript
// Cuando el usuario inicie sesión
crashlyticsService.setUserId(user.uid);
```

### Agregar Contexto Personalizado

```typescript
// Agregar atributos que ayuden a debuggear
crashlyticsService.setAttribute('screen', 'Dashboard');
crashlyticsService.setAttribute('userType', 'premium');
```

### Logs Personalizados

```typescript
// Agregar logs que aparecerán en el reporte de crash
crashlyticsService.log('Usuario completó workout de boxeo');
```

---

## 📝 Checklist Final

- [ ] Habilitar Crashlytics en Firebase Console
- [ ] Ejecutar `npx expo prebuild --platform android --clean`
- [ ] Integrar inicialización en `app/_layout.tsx`
- [ ] Crear un build de release (local o con EAS)
- [ ] Instalar el APK en un dispositivo
- [ ] Probar un crash forzado
- [ ] Verificar que aparezca en Firebase Console

---

## 🚨 Notas Importantes

⚠️ **Crashlytics NO funciona con Expo Go** - Necesitas un build nativo

⚠️ **Solo funciona en builds de release** - Los crashes en debug no se reportan

⚠️ **Los crashes tardan 5-10 minutos** en aparecer en la consola

⚠️ **Necesitas hacer prebuild** para generar archivos nativos de Android

---

## 🆘 Troubleshooting

### "Crashlytics not initialized"
```bash
# Asegúrate de haber hecho prebuild
npx expo prebuild --platform android --clean

# Verifica que google-services.json esté en android/app/
ls -la android/app/google-services.json
```

### Crashes no aparecen en la consola
- Espera 10 minutos
- Verifica que sea un build de **release**, no debug
- Asegúrate de haber habilitado Crashlytics en Firebase Console
- Verifica que tengas conexión a internet en el dispositivo

### Error al hacer prebuild
```bash
# Limpia y vuelve a intentar
rm -rf android ios
npx expo prebuild --platform android --clean
```

---

## 🎉 ¡Listo!

Una vez completados estos pasos, Crashlytics estará monitoreando todos los crashes de tu app en producción.

**Próximo comando a ejecutar:**
```bash
npx expo prebuild --platform android --clean
```
