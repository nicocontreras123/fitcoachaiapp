# Refactorización del Timer de Boxeo

## 📁 Estructura Nueva

```
src/features/tracking/components/boxing/
├── TimerBoxeoRefactored.tsx    # Componente principal (~600 líneas, antes 1000+)
├── hooks/
│   ├── useBoxingTimerConfig.ts # Configuración del timer
│   ├── useBoxingPhaseHandlers.ts # Manejo de transiciones de fases
│   └── index.ts
├── phases/
│   ├── WarmupPhase.tsx         # UI de calentamiento
│   ├── WorkoutPhase.tsx        # UI de entrenamiento
│   ├── CooldownPhase.tsx       # UI de enfriamiento
│   ├── FinishedPhase.tsx       # UI de finalización
│   └── index.ts
└── utils/
    ├── boxingTimerHelpers.ts   # Funciones de utilidad
    └── index.ts
```

## ✨ Mejoras Realizadas

### 1. **Separación de Responsabilidades**
- **Hooks personalizados**: Lógica de negocio separada de la UI
- **Componentes de fase**: Cada fase tiene su propio componente
- **Utilidades**: Funciones puras para cálculos

### 2. **Reducción de Complejidad**
- De **1043 líneas** a **~600 líneas** en el componente principal
- Código más legible y mantenible
- Mejor testabilidad

### 3. **Hooks Extraídos**

#### `useBoxingTimerConfig`
Maneja la configuración del timer de boxeo.
```typescript
const timerConfig = useBoxingTimerConfig({
    currentWorkout,
    workoutRounds,
    prepTimeInSeconds,
    isSoundMuted,
    userData,
    onWorkoutComplete: handleFinishWorkout,
});
```

#### `useBoxingPhaseHandlers`
Maneja las transiciones entre fases y los índices de ejercicios.
```typescript
const {
    warmupIndex,
    cooldownIndex,
    handlePhaseComplete,
    resetIndices,
} = useBoxingPhaseHandlers({
    phaseTimer,
    warmup,
    cooldown,
    isActive,
    toggleTimer,
    transitionTo,
    audio,
});
```

### 4. **Componentes de Fase**

Cada fase tiene su propio componente con props bien definidas:

- **WarmupPhase**: Calentamiento y preparación
- **WorkoutPhase**: Rounds de boxeo
- **CooldownPhase**: Enfriamiento
- **FinishedPhase**: Pantalla de finalización

### 5. **Utilidades**

Funciones puras para cálculos:
- `calculateTotalTimeRemaining()`: Calcula tiempo restante
- `getPhaseColors()`: Retorna colores según la fase
- `calculateCurrentExerciseIndex()`: Calcula índice del ejercicio actual

## 🔄 Migración

Para usar el componente refactorizado:

1. **Reemplazar import**:
```typescript
// Antes
import { TimerBoxeoNew } from '@/features/tracking/components/TimerBoxeoNew';

// Después
import { TimerBoxeoNew } from '@/features/tracking/components/boxing/TimerBoxeoRefactored';
```

2. **La interfaz es idéntica**, no se requieren cambios en el uso:
```typescript
<TimerBoxeoNew
    sessionId="session-1"
    workout={workout}
    onComplete={() => }
/>
```

## 📊 Beneficios

1. **Mantenibilidad**: Código más fácil de entender y modificar
2. **Testabilidad**: Hooks y utilidades pueden ser testeados independientemente
3. **Reusabilidad**: Componentes y hooks pueden ser reutilizados
4. **Performance**: Mejor uso de `useCallback` y `useMemo`
5. **Escalabilidad**: Fácil agregar nuevas fases o funcionalidades

## 🐛 Debugging

Los logs de debug se mantienen en el componente principal y en los hooks.
Busca por:
- `🏃 [WARMUP_START]`
- `⏱️ [PHASE_TIMER]`
- `✅ [PHASE_COMPLETE]`
- `⏭️ [SKIP]` - Eventos de skip

## ⏭️ Sistema de Skip Inteligente

### Características

El sistema de skip tiene las siguientes reglas:

#### ✅ **Permitido SIN confirmación:**
- **Preparación**: Siempre permitido
- **Descansos**: Siempre permitido

#### ⚠️ **Permitido CON confirmación:**
- **Warmup**: Máximo 3 saltos
- **Cooldown**: Máximo 3 saltos

#### ❌ **NO Permitido:**
- **Workout principal**: Nunca se puede saltar
- **Finished**: Ya terminó el entrenamiento

### Uso

```typescript
const {
    canSkip,                  // boolean - si se puede saltar
    skipDisabledReason,       // string - razón si está deshabilitado
    showSkipConfirmation,     // boolean - mostrar diálogo
    skipsRemaining,           // number - saltos restantes
    handleSkipPress,          // function - manejar click en skip
    executeSkip,              // function - confirmar skip
    cancelSkip,               // function - cancelar skip
    resetSkipCounter,         // function - resetear contador
} = useSmartSkip({
    currentPhase,
    isPreparing,
    isRest,
    onSkip: handleSkipExercise,
});
```

### Componente de Confirmación

```typescript
<SkipConfirmationDialog
    visible={showSkipConfirmation}
    message={confirmationMessage}
    skipsRemaining={skipsRemaining}
    onConfirm={executeSkip}
    onCancel={cancelSkip}
/>
```

## 📝 Próximos Pasos

1. Testear el componente refactorizado
2. Migrar gradualmente desde `TimerBoxeoNew.tsx`
3. Eliminar el archivo antiguo una vez verificado
4. Agregar tests unitarios para hooks y utilidades
5. Implementar analytics para tracking de skips
