# FitCoach AI

Aplicación móvil de entrenamiento personal impulsada por IA, desarrollada con React Native + Expo.

## Stack Técnico

- **React Native** con Expo SDK 54
- **TypeScript** estricto
- **Zustand** para state management
- **Expo Router** para navegación (file-based routing)
- **NativeWind** (TailwindCSS para React Native)
- **Zod** para validación de formularios
- **AsyncStorage** para persistencia local

## Características Implementadas (MVP)

### ✅ Onboarding Flow Completo

- Pantalla de bienvenida
- Formulario multi-step con validación
- Captura de datos: personales, deporte, nivel, objetivos
- Persistencia con AsyncStorage
- Validación con Zod schemas

### ✅ Sistema de Notificaciones

- **Notificaciones de fin de semana**: Domingo a las 8:00 PM para recordar generar nueva rutina
- **Notificaciones diarias**: 7:00 AM en días con entrenamiento programado
- Permisos automáticos en iOS y Android
- Configuración de canales de notificación (Android)
- Programación automática al generar rutinas semanales

**Archivos relacionados:**
- `src/services/notificationService.ts`: Servicio principal de notificaciones
- `app.config.js`: Configuración de permisos y plugin de expo-notifications
- `src/features/workouts/store/useWorkoutStore.ts`: Integración con generación de rutinas
- `src/features/workouts/screens/RutinasScreen.tsx`: Solicitud de permisos

### 🏗️ Próximas Features

- Generación de rutinas con OpenAI
- Timer de boxeo con rounds configurables
- Tracking de running con GPS
- Historial de entrenamientos
- Perfil y configuración

## Estructura del Proyecto

```
/
├── app/                        # Expo Router (file-based routing)
│   ├── (tabs)/                # Tabs de la app principal
│   ├── onboarding/            # Flow de onboarding
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Entry point
├── src/
│   ├── components/
│   │   └── common/           # Componentes reutilizables
│   ├── features/             # Módulos por feature
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── workouts/
│   │   └── tracking/
│   ├── services/             # Servicios (storage, API)
│   ├── config/               # Configuración (env)
│   └── types/                # Tipos TypeScript globales
├── assets/                   # Imágenes, fuentes, etc.
└── global.css               # Estilos globales de NativeWind
```

## Instalación y Setup

### 1. Prerequisitos

- Node.js 18+ instalado
- npm o yarn
- Expo CLI (se instala automáticamente)
- Para iOS: Xcode y simulador de iOS
- Para Android: Android Studio y emulador Android
- Opcional: Expo Go app en tu teléfono para testing

### 2. Clonar e Instalar Dependencias

```bash
# Las dependencias ya están instaladas, pero si necesitas reinstalar:
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.local.example .env.local

# Editar .env.local y agregar tu API key de Anthropic
# ANTHROPIC_API_KEY=tu_api_key_aqui
```

Para obtener tu API key:

1. Visita https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Genera una API key en Settings > API Keys
4. Pega la key en `.env.local`

**Nota:** Por ahora la app funciona sin API key (onboarding completo). Las features de IA se implementarán en la siguiente fase.

### 4. Ejecutar el Proyecto

```bash
# Iniciar el servidor de desarrollo
npm start

# O directamente en plataforma específica:
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

### 5. Testing en Dispositivo Real

1. Instala **Expo Go** desde App Store (iOS) o Play Store (Android)
2. Ejecuta `npm start`
3. Escanea el QR code con tu cámara (iOS) o con Expo Go (Android)

## Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run ios        # Ejecutar en iOS
npm run android    # Ejecutar en Android
npm run web        # Ejecutar en web
npm run lint       # Ejecutar ESLint
npm run lint:fix   # Ejecutar ESLint y auto-fix
npm run format     # Formatear código con Prettier
npm run type-check # Verificar tipos TypeScript
```

## Arquitectura y Patrones

### State Management (Zustand)

Stores separados por feature:

- `useUserStore`: Datos del usuario y onboarding
- `useOnboardingStore`: Estado del flujo de onboarding

### Validación (Zod)

Schemas de validación en `src/features/*/schemas/`:

- Validación type-safe
- Mensajes de error personalizados en español
- Integración con TypeScript para types inferidos

### Persistencia (AsyncStorage)

Service layer en `src/services/storage.ts`:

- API unificada para get/set/remove
- Type-safe con generics
- Manejo centralizado de errores

### Navegación (Expo Router)

File-based routing:

- `/app/(tabs)/*` → Tabs principales
- `/app/onboarding/*` → Flow de onboarding
- Navigation type-safe con TypeScript

## Próximos Pasos

1. **Integración con OpenAI API**
   - Service layer para llamadas a OpenAI
   - Generación de rutinas personalizadas
   - Manejo de streaming responses

2. **Timer de Boxeo**
   - Componente de timer visual
   - Configuración de rounds
   - Sonidos con expo-av

3. **Tracking de Running**
   - Integración con expo-location
   - Tracking GPS en tiempo real
   - Notificaciones de voz con expo-speech

4. **Historial y Analytics**
   - Guardar workouts completados
   - Estadísticas y gráficos
   - Exportar datos

## Troubleshooting

### Error: "Metro bundler not found"

```bash
npx expo start --clear
```

### Error de dependencias

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de permisos en iOS

Verifica que `app.json` tenga los permisos en `ios.infoPlist`

### Error de permisos en Android

Verifica que `app.json` tenga los permisos en `android.permissions`

## Contribuir

Este es un proyecto MVP. Para agregar features:

1. Crear feature en `src/features/nombre-feature/`
2. Seguir la estructura: components, screens, store, types, schemas
3. Agregar tipos TypeScript
4. Documentar en README

## Licencia

MIT
