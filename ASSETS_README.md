# Guía de Assets e Iconos de FitCoach AI

## Estructura de Assets

```
fintapp/assets/
├── fitcoach_logo.png      # Logo principal de la app (1415x1536)
├── splashscreen.png       # Splash screen (1536x2752)
├── icon.png               # Icono de la app (1024x1024 recomendado)
├── adaptive-icon.png      # Icono adaptivo para Android
├── appstore.png           # Logo para App Store
├── playstore.png          # Logo para Play Store
├── favicon.png            # Favicon para web
├── splash.png             # Splash alternativo
├── campana.mp3            # Sonido de campana
└── tictac.mp3            # Sonido de tick tac
```

## Uso del Logo en la App

### Componente Logo

El logo está disponible como un componente reutilizable:

```tsx
import { Logo } from '@/components/common/Logo';

// Tamaños disponibles: 'small' | 'medium' | 'large' | 'xlarge'
<Logo size="medium" />
<Logo size="large" style={{ marginBottom: 20 }} />
```

**Tamaños:**
- `small`: 40px
- `medium`: 80px (por defecto)
- `large`: 120px
- `xlarge`: 200px

### Implementado en:
- ✅ Pantalla de bienvenida (`/onboarding/welcome`)
- ✅ Splash screen (configurado en `app.json`)

## Configuración de App Icons

### Actualizar iconos de la app

Si necesitas actualizar los iconos principales de la app:

1. **Preparar el logo:**
   - Tamaño: 1024x1024px
   - Formato: PNG con fondo transparente
   - Nombre: `icon.png`

2. **Generar iconos automáticamente:**

```bash
# Instalar herramienta de generación de iconos
npm install -g @expo/image-utils

# Generar todos los tamaños necesarios
npx expo-optimize

# O usar un servicio online:
# https://www.appicon.co/
# https://icon.kitchen/
```

3. **Estructura de iconos requeridos:**

**iOS:**
- App Icon: 1024x1024 (requerido en App Store Connect)
- Assets.xcassets/AppIcon.appiconset/

**Android:**
- Adaptive Icon:
  - Foreground: 1024x1024 (con transparencia)
  - Background: Color sólido o imagen
- drawable-*dpi/ic_launcher.png (múltiples resoluciones)

### Adaptive Icon para Android

El `adaptive-icon.png` debe tener:
- Tamaño: 1024x1024px
- Zona segura: contenido importante en el círculo central de 832x832px
- Márgenes: 96px en cada lado

```json
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

## Splash Screen

### Configuración actual:

```json
{
  "splash": {
    "image": "./assets/splashscreen.png",
    "resizeMode": "contain",
    "backgroundColor": "#0ea5e9"
  }
}
```

### Especificaciones del Splash Screen:

**Tamaño recomendado:**
- 1242x2436 (iPhone X)
- 1536x2752 (actual)

**Zona segura:**
- El logo debe estar en el centro
- Dejar márgenes de al menos 200px arriba y abajo

### Cambiar el color de fondo:

Edita `app.json`:
```json
"backgroundColor": "#TU_COLOR_AQUI"
```

## App Store y Play Store

### App Store (iOS)

**App Icon:**
- Tamaño: 1024x1024px
- Formato: PNG sin transparencia
- Archivo: `appstore.png`

**Screenshots requeridos:**
- 6.7": 1290x2796 (iPhone 15 Pro Max)
- 6.5": 1242x2688 (iPhone 11 Pro Max)
- 5.5": 1242x2208 (iPhone 8 Plus)
- 12.9" iPad Pro: 2048x2732

### Play Store (Android)

**App Icon:**
- Tamaño: 512x512px
- Formato: PNG con transparencia
- Archivo: `playstore.png`

**Feature Graphic:**
- Tamaño: 1024x500px
- Formato: PNG o JPG
- Sin transparencia

**Screenshots requeridos:**
- Teléfono: 1080x1920 o 1080x2340
- Tablet 7": 1200x1920
- Tablet 10": 1600x2560

## Regenerar Assets

### Método 1: Expo Image Optimization

```bash
# Optimizar todas las imágenes
npx expo-optimize

# Generar splash screens para todas las plataformas
npx expo prebuild --clean
```

### Método 2: Manual con Herramientas Online

**Generadores de iconos recomendados:**
1. [App Icon Generator](https://www.appicon.co/)
   - Sube tu logo 1024x1024
   - Descarga todos los tamaños para iOS y Android

2. [Icon Kitchen](https://icon.kitchen/)
   - Especializado en Android Adaptive Icons
   - Previsualización en diferentes formas

3. [MakeAppIcon](https://makeappicon.com/)
   - Genera iconos para ambas plataformas
   - Incluye splash screens

### Método 3: Usar eas-cli

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar el proyecto
eas build:configure

# Build para generar todos los assets
eas build --platform all --profile development
```

## Actualizar después de cambios

Después de actualizar los assets, ejecuta:

```bash
# Limpiar cache de Expo
npx expo start --clear

# Si usas Android
cd android && ./gradlew clean && cd ..

# Si usas iOS
cd ios && pod install && cd ..
```

## Troubleshooting

### El logo no aparece

1. Verifica que el archivo existe:
```bash
ls -la fintapp/assets/fitcoach_logo.png
```

2. Limpia el cache:
```bash
npx expo start --clear
```

3. Verifica el import en el componente:
```tsx
require('@/assets/fitcoach_logo.png')
```

### El splash screen no se actualiza

1. Reinstala la app completamente
2. En iOS: elimina DerivedData
3. En Android: ejecuta `./gradlew clean`

### Los iconos no cambian en el dispositivo

1. Desinstala completamente la app
2. Limpia el build:
```bash
npx expo prebuild --clean
```
3. Reinstala la app

## Recursos Adicionales

- [Expo Icon and Splash Documentation](https://docs.expo.dev/guides/app-icons/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [App Store Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)
- [Play Store Graphic Assets](https://support.google.com/googleplay/android-developer/answer/9866151)
