# PhaseTransition Component

Componente reutilizable para transiciones animadas entre fases del timer de boxeo.

## Características

- 🎨 **5 tipos de transiciones**: slide, zoom, fade, slideZoom, elastic
- ⚡ **Optimizado con Reanimated**: Usa react-native-reanimated para animaciones de 60fps
- 🥊 **Perfecto para Boxing Timer**: El tipo 'elastic' está optimizado para dar energía y dinamismo
- 🔄 **Detección automática**: Anima automáticamente cuando cambia el `phaseKey`
- 🎯 **Callbacks**: Soporte para callbacks cuando la transición termina

## Instalación

El componente ya está instalado y listo para usar. Requiere:
- `react-native-reanimated` (ya instalado)

## Uso Básico

```typescript
import { PhaseTransition } from '@/components/transitions';

function MyComponent() {
  const [phase, setPhase] = useState('warmup');

  return (
    <PhaseTransition 
      phaseKey={phase}
      type="elastic"
      duration={500}
    >
      <YourContent />
    </PhaseTransition>
  );
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `phaseKey` | `string` | **Requerido** | Clave única para cada fase. Cuando cambia, se activa la animación |
| `type` | `TransitionType` | `'elastic'` | Tipo de transición a usar |
| `duration` | `number` | `500` | Duración de la animación en milisegundos |
| `onTransitionComplete` | `() => void` | `undefined` | Callback que se ejecuta cuando termina la transición |

## Tipos de Transición

### 1. `elastic` (Recomendado para Boxing Timer)
Efecto elástico con rebote que da energía y dinamismo. Perfecto para transiciones entre fases de entrenamiento.

```typescript
<PhaseTransition phaseKey={phase} type="elastic">
  <Content />
</PhaseTransition>
```

**Características:**
- Rebote suave al entrar
- Fade in progresivo
- Movimiento vertical con spring physics
- Parámetros: damping: 18, stiffness: 120, mass: 0.8

### 2. `slideZoom`
Combinación de deslizamiento vertical y zoom. Suave y profesional.

```typescript
<PhaseTransition phaseKey={phase} type="slideZoom" duration={400}>
  <Content />
</PhaseTransition>
```

### 3. `slide`
Deslizamiento horizontal simple.

```typescript
<PhaseTransition phaseKey={phase} type="slide" duration={300}>
  <Content />
</PhaseTransition>
```

### 4. `zoom`
Efecto de zoom in/out.

```typescript
<PhaseTransition phaseKey={phase} type="zoom" duration={350}>
  <Content />
</PhaseTransition>
```

### 5. `fade`
Fade in/out simple.

```typescript
<PhaseTransition phaseKey={phase} type="fade" duration={250}>
  <Content />
</PhaseTransition>
```

## Ejemplo Completo - Boxing Timer

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import { PhaseTransition } from '@/components/transitions';

type Phase = 'preview' | 'warmup' | 'workout' | 'cooldown' | 'finished';

function BoxingTimer() {
  const [phase, setPhase] = useState<Phase>('preview');

  const renderPhaseContent = () => {
    switch (phase) {
      case 'preview':
        return <PreviewScreen />;
      case 'warmup':
        return <WarmupPhase />;
      case 'workout':
        return <WorkoutPhase />;
      case 'cooldown':
        return <CooldownPhase />;
      case 'finished':
        return <FinishedPhase />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PhaseTransition 
        phaseKey={phase}
        type="elastic"
        duration={500}
        onTransitionComplete={() => {
          console.log('Transición completada para fase:', phase);
        }}
      >
        {renderPhaseContent()}
      </PhaseTransition>
    </View>
  );
}
```

## Cómo Funciona

1. **Detección de Cambios**: El componente usa `useEffect` que escucha cambios en `phaseKey`
2. **Reset**: Cuando `phaseKey` cambia, resetea `progress` a 0
3. **Animación**: Anima `progress` de 0 a 1 usando spring (elastic) o timing (otros tipos)
4. **Interpolación**: Los valores animados se interpolan para crear los efectos visuales
5. **Callback**: Cuando termina, ejecuta `onTransitionComplete` si está definido

## Personalización

Puedes ajustar los parámetros de spring para el tipo 'elastic':

```typescript
// En PhaseTransition.tsx, líneas 48-52
progress.value = withSpring(
  1,
  {
    damping: 18,      // Más alto = menos rebote
    stiffness: 120,   // Más alto = más rápido
    mass: 0.8,        // Más alto = más lento
  }
);
```

## Rendimiento

- ✅ Usa `useNativeDriver` implícitamente a través de Reanimated
- ✅ Todas las animaciones corren en el UI thread
- ✅ 60fps garantizados en la mayoría de dispositivos
- ✅ Sin re-renders innecesarios del componente padre

## Troubleshooting

### La animación no se activa
- Asegúrate de que `phaseKey` realmente cambie de valor
- Verifica que `phaseKey` sea un string único para cada fase

### Animación muy rápida/lenta
- Ajusta el prop `duration` (solo para tipos no-elastic)
- Para 'elastic', modifica los parámetros de spring en el código

### Callback no se ejecuta
- Verifica que la función esté correctamente definida
- Asegúrate de que la animación se complete (no se interrumpa)

## Comparación con la Implementación Anterior

### Antes (Manual con Animated API)
```typescript
// 45+ líneas de código
const [slideAnim] = useState(new Animated.Value(0));
const [fadeAnim] = useState(new Animated.Value(1));
const previousPhaseRef = useRef(phase);

useEffect(() => {
  if (previousPhaseRef.current !== phase) {
    Animated.parallel([
      Animated.timing(slideAnim, { /* ... */ }),
      Animated.timing(fadeAnim, { /* ... */ }),
    ]).start(() => {
      // ...más código
    });
  }
}, [phase]);
```

### Ahora (Con PhaseTransition)
```typescript
// 1 línea de código
<PhaseTransition phaseKey={phase} type="elastic">
  {content}
</PhaseTransition>
```

**Beneficios:**
- ✅ 95% menos código
- ✅ Más fácil de mantener
- ✅ Reutilizable en otros componentes
- ✅ Mejor rendimiento (Reanimated vs Animated)
- ✅ Más tipos de transiciones disponibles
