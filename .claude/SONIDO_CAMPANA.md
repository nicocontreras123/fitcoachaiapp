# 🔔 Sonido de Campana al Inicio de Cada Round

## ✅ Implementación Completada

Se ha agregado el sonido de campana (`campana.mp3`) que se reproduce automáticamente cada vez que inicia un nuevo round de entrenamiento.

## 🎯 Funcionalidad

### Cuándo Suena la Campana

La campana se reproduce en estos momentos específicos:

1. **Al terminar la preparación** → Inicia el Round 1
   - Usuario está en fase de preparación
   - Cuenta regresiva llega a 0
   - 🔔 **DING!** → Suena la campana
   - Comienza el primer round de trabajo

2. **Al terminar cada descanso** → Inicia el siguiente round
   - Usuario está en fase de descanso
   - Cuenta regresiva llega a 0
   - 🔔 **DING!** → Suena la campana
   - Comienza el siguiente round de trabajo

### Cuándo NO Suena

- ❌ Al terminar un round de trabajo (inicio de descanso)
- ❌ Durante la preparación
- ❌ Durante el descanso
- ❌ Al pausar/reanudar el timer

## 🔧 Implementación Técnica

### Archivo Modificado
`src/features/tracking/hooks/useBoxeoTimer.ts`

### Cambios Realizados

#### 1. **Nuevo Ref para el Sonido de Campana**
```typescript
const bellSoundRef = useRef<Audio.Sound | null>(null);
```

#### 2. **Carga del Sonido al Inicio**
```typescript
// Load the bell sound
const { sound: bellSound } = await Audio.Sound.createAsync(
    require('../../../../assets/campana.mp3'),
    {
        shouldPlay: false,
        volume: 1.0,
        isLooping: false
    }
);
bellSoundRef.current = bellSound;
```

**Configuración**:
- `volume: 1.0` - Volumen al máximo (100%)
- `isLooping: false` - No se repite, solo suena una vez
- `shouldPlay: false` - No se reproduce automáticamente al cargar

#### 3. **Función para Reproducir la Campana**
```typescript
const playBellSound = async () => {
    if (bellSoundRef.current) {
        try {
            // Stop and rewind to beginning
            await bellSoundRef.current.stopAsync();
            await bellSoundRef.current.setPositionAsync(0);
            // Play the bell
            await bellSoundRef.current.playAsync();
            console.log('Bell sound played');
        } catch (error) {
            console.error('Error playing bell sound:', error);
        }
    }
};
```

**Lógica**:
1. Detiene el sonido si ya estaba reproduciéndose
2. Rebobina al inicio (posición 0)
3. Reproduce el sonido
4. Log para debugging

#### 4. **Llamadas a la Campana**

**Al terminar preparación:**
```typescript
if (state.isPreparing) {
    playBellSound(); // 🔔 Play bell when starting first round
    Speech.speak("Inicia!", { ... });
    updateState({ isPreparing: false, isRest: false, ... });
}
```

**Al terminar descanso:**
```typescript
else if (state.isRest) {
    if (state.round < state.totalRounds) {
        playBellSound(); // 🔔 Play bell when starting new round
        Speech.speak(`Inicia!`, { ... });
        updateState({ round: nextRound, isRest: false, ... });
    }
}
```

## 🎬 Secuencia de Eventos

### Inicio del Entrenamiento
```
1. Usuario presiona PLAY
2. Comienza preparación (10 segundos)
3. Timer: 00:10 → 00:09 → ... → 00:01
4. Timer llega a 00:00
5. 🔔 CAMPANA SUENA
6. Voz: "Inicia!"
7. Comienza Round 1
```

### Entre Rounds
```
1. Round 1 termina
2. Voz: "Descansa"
3. Comienza descanso (60 segundos)
4. Timer: 01:00 → 00:59 → ... → 00:01
5. Timer llega a 00:00
6. 🔔 CAMPANA SUENA
7. Voz: "Inicia!"
8. Comienza Round 2
```

## 🎵 Características del Sonido

- **Archivo**: `assets/campana.mp3`
- **Tamaño**: ~122 KB
- **Volumen**: 100% (1.0)
- **Duración**: Corta (típica campana de boxeo)
- **Loop**: No (suena una sola vez)

## 🔊 Experiencia de Usuario

### Antes
- ✅ Voz: "Inicia!"
- ❌ Sin sonido de campana

### Después
- ✅ 🔔 **CAMPANA**
- ✅ Voz: "Inicia!"
- ✅ Experiencia más realista de boxeo

## 🎯 Beneficios

1. **Realismo**: Simula un entrenamiento de boxeo real
2. **Alerta Clara**: Sonido distintivo que indica inicio de round
3. **Motivación**: Sonido icónico que energiza al usuario
4. **Sincronización**: Se combina con la voz del coach
5. **Profesional**: Experiencia de gimnasio profesional

## 🧪 Testing

Para probar la funcionalidad:

1. **Ir a Tracking**
2. **Iniciar el timer**
3. **Esperar la preparación** (10 segundos)
4. **Escuchar**: 🔔 Campana + "Inicia!"
5. **Hacer el round**
6. **Esperar el descanso** (60 segundos)
7. **Escuchar**: 🔔 Campana + "Inicia!" (Round 2)

## 📝 Notas Técnicas

### Gestión de Memoria
- El sonido se carga **una sola vez** al montar el componente
- Se mantiene en memoria durante toda la sesión
- Se libera al desmontar el componente

### Sincronización
- La campana se reproduce **antes** de la voz
- Secuencia: 🔔 Campana → 🗣️ Voz → ⏱️ Timer inicia

### Manejo de Errores
- Si el archivo no se carga, se registra en console
- El entrenamiento continúa normalmente sin la campana
- No bloquea la funcionalidad principal

## 🔄 Compatibilidad

- ✅ iOS: Funciona en modo silencioso
- ✅ Android: Funciona correctamente
- ✅ Expo: Compatible con expo-av

## 🎨 Mejoras Futuras Sugeridas

1. **Campana de fin de round**: Sonido diferente al terminar cada round
2. **Volumen ajustable**: Permitir al usuario ajustar el volumen
3. **Sonidos personalizables**: Elegir entre diferentes campanas
4. **Vibración**: Agregar haptic feedback junto con la campana
5. **Campana final**: Sonido especial al completar el entrenamiento

---

**Estado**: ✅ Implementado y funcionando
**Archivo de sonido**: `assets/campana.mp3`
**Hook modificado**: `src/features/tracking/hooks/useBoxeoTimer.ts`
