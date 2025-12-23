# Mejoras de Background Timer y Audio

## 📋 Resumen de Cambios

Se han implementado dos mejoras importantes para el timer de running:

1. **✅ Timer en Segundo Plano**: El timer ahora continúa contando el tiempo incluso cuando la app está en segundo plano o la pantalla está bloqueada
2. **✅ Audio en Segundo Plano**: El coaching de voz ahora funciona con la pantalla bloqueada

---

## 🔧 Cambios Técnicos

### 1. Background Timer (`useBackgroundTimer.ts`)

**Archivo**: `src/features/tracking/hooks/useBackgroundTimer.ts`

Este hook maneja el seguimiento del tiempo cuando la app va al background:

- **AppState Monitoring**: Detecta cuando la app entra/sale del background
- **AsyncStorage**: Guarda el estado del timer (tiempo de inicio, tiempo transcurrido)
- **Cálculo de Tiempo**: Cuando la app vuelve al foreground, calcula el tiempo que pasó en background

**Cómo funciona**:
```typescript
// Al iniciar el timer
await backgroundTimer.startBackgroundTimer(0);

// Al pausar
await backgroundTimer.pauseBackgroundTimer(currentElapsed);

// Al volver del background
const totalElapsed = await backgroundTimer.getElapsedTime();
```

### 2. Background Audio (`useBackgroundAudio.ts`)

**Archivo**: `src/features/tracking/hooks/useBackgroundAudio.ts`

Configura la sesión de audio para permitir reproducción en background:

**Dos variantes disponibles**:

1. **`useBackgroundAudio()`**: Pausa otro audio cuando habla el coach
2. **`useBackgroundAudioWithMixing()`**: Permite que el coach hable sobre música (Spotify, etc.)

**Configuración aplicada**:
- ✅ `staysActiveInBackground: true` - Audio continúa en background
- ✅ `playsInSilentModeIOS: true` - Funciona en modo silencioso (iOS)
- ✅ `interruptionModeAndroid: DuckOthers` - Baja volumen de otra música
- ✅ `interruptionModeIOS: DuckOthers` - Baja volumen de otra música

### 3. Integración en Running Timer

**Archivo**: `src/features/tracking/hooks/useRunningTimer.ts`

**Cambios**:
- ✅ Importa y usa `useBackgroundTimer`
- ✅ Guarda estado cuando va al background
- ✅ Sincroniza tiempo cuando vuelve del background
- ✅ Monitorea cambios de AppState

**Flujo**:
```
1. Usuario inicia workout → backgroundTimer.startBackgroundTimer()
2. App va al background → Guarda timestamp en AsyncStorage
3. Timer JS se pausa (normal en React Native)
4. App vuelve al foreground → AppState detecta el cambio
5. Calcula tiempo transcurrido → Actualiza totalElapsedTime
6. Timer continúa desde el tiempo correcto
```

### 4. Configuración de App

**Archivo**: `app.config.js`

**Cambios en iOS**:
```javascript
UIBackgroundModes: [
    "audio",      // Permite audio en background
    "location"    // Permite GPS en background
]
```

**Nuevos permisos**:
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Para GPS en background

---

## 🎯 Uso

### En Running Tracker

El componente `RunningTrackerNew` ya está configurado:

```typescript
export function RunningTrackerNew({ workout, onComplete, onExit }: RunningTrackerProps) {
    // Habilita audio en background (con mixing para Spotify)
    useBackgroundAudioWithMixing();

    const timer = useRunningTimer({
        workout,
        prepTime: 10,
        autoSave: true,
    });
    
    // ... resto del código
}
```

### Para Otros Timers (Boxing, Gym)

Si quieres agregar estas funcionalidades a otros timers:

```typescript
// 1. Importar los hooks
import { useBackgroundTimer } from '@/features/tracking/hooks/useBackgroundTimer';
import { useBackgroundAudioWithMixing } from '@/features/tracking/hooks/useBackgroundAudio';

// 2. En tu componente
export function MyTimer() {
    // Habilitar audio en background
    useBackgroundAudioWithMixing();
    
    // Usar background timer
    const backgroundTimer = useBackgroundTimer();
    
    // Al iniciar
    await backgroundTimer.startBackgroundTimer(0);
    
    // Al pausar
    await backgroundTimer.pauseBackgroundTimer(elapsedTime);
    
    // Al detener
    await backgroundTimer.stopBackgroundTimer();
}
```

---

## 📱 Comportamiento Esperado

### Escenario 1: Pantalla Bloqueada
1. Usuario inicia running workout
2. Bloquea la pantalla
3. ✅ Timer continúa contando
4. ✅ GPS sigue rastreando
5. ✅ Voz del coach sigue funcionando
6. Usuario desbloquea pantalla
7. ✅ UI muestra tiempo correcto

### Escenario 2: App en Background
1. Usuario inicia workout
2. Cambia a otra app (ej: Spotify)
3. ✅ Timer continúa contando
4. ✅ GPS sigue rastreando  
5. ✅ Voz del coach se escucha sobre la música
6. Usuario vuelve a FitCoach AI
7. ✅ Tiempo se sincroniza automáticamente

### Escenario 3: Música + Coaching
1. Usuario reproduce música en Spotify
2. Inicia workout en FitCoach AI
3. ✅ Música sigue sonando
4. ✅ Cuando el coach habla, música baja de volumen
5. ✅ Después de hablar, música vuelve a volumen normal

---

## 🐛 Debugging

### Logs a Buscar

**Background Timer**:
```
⏱️ [BACKGROUND_TIMER] State saved: {...}
⏱️ [BACKGROUND_TIMER] AppState changed: {...}
🏃 [RUNNING_TIMER] Syncing time from background: {...}
```

**Background Audio**:
```
🔊 [BACKGROUND_AUDIO] Configuring audio session...
✅ [BACKGROUND_AUDIO] Audio session configured with mixing
```

### Problemas Comunes

**1. Timer no continúa en background**
- ✅ Verificar que `backgroundTimer.startBackgroundTimer()` se llama al iniciar
- ✅ Revisar logs de AppState changes
- ✅ Verificar que AsyncStorage tiene permisos

**2. Audio no funciona con pantalla bloqueada**
- ✅ Verificar que `useBackgroundAudioWithMixing()` se llama
- ✅ En iOS: Verificar que UIBackgroundModes incluye "audio"
- ✅ Verificar permisos de audio en configuración del dispositivo

**3. Tiempo se desincroniza**
- ✅ Verificar que `getElapsedTime()` se llama al volver del background
- ✅ Revisar que el estado se actualiza correctamente
- ✅ Verificar logs de sincronización

---

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Notificaciones en Background**
   - Mostrar progreso del workout en notificación
   - Controles de play/pause en notificación

2. **Background Fetch**
   - Actualizar estadísticas periódicamente
   - Sincronizar con servidor en background

3. **Optimización de Batería**
   - Reducir frecuencia de GPS cuando no es necesario
   - Pausar automáticamente si no hay movimiento

---

## 📝 Notas Importantes

### iOS
- ✅ Requiere rebuild de la app para aplicar cambios en `app.config.js`
- ✅ Usuario debe otorgar permisos de ubicación "Siempre"
- ✅ Audio funciona en modo silencioso

### Android
- ✅ Ya tiene permisos de background location
- ✅ Puede requerir deshabilitar optimización de batería
- ✅ Funciona con "No molestar" activado

### Limitaciones
- ⚠️ JavaScript se pausa en background (por eso usamos AppState + AsyncStorage)
- ⚠️ GPS puede ser menos preciso en background
- ⚠️ Algunos dispositivos Android agresivos pueden matar la app

---

## ✅ Testing Checklist

- [ ] Timer continúa cuando pantalla se bloquea
- [ ] Timer continúa cuando app va al background
- [ ] Tiempo se sincroniza correctamente al volver
- [ ] Voz funciona con pantalla bloqueada
- [ ] Voz funciona con app en background
- [ ] Voz se mezcla correctamente con Spotify
- [ ] GPS continúa rastreando en background
- [ ] Distancia se actualiza correctamente
- [ ] No hay crashes al cambiar de app
- [ ] Batería no se drena excesivamente
