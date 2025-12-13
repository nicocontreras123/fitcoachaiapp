# 🥊 Sistema de Instrucciones Específicas para Boxeo

## 📋 Problema Identificado
Las instrucciones generadas por la IA eran demasiado genéricas (ej: "Jab-Cross"). Necesitábamos instrucciones **mucho más específicas** con:
- Combinaciones exactas de golpes (1-1-2, 2-3-2, etc.)
- Número de repeticiones específico
- Ejercicios complementarios (burpees, sentadillas, etc.)
- Tiempos exactos para cada actividad

## ✅ Solución Implementada

### Mejora del Prompt de OpenAI
Se modificó el archivo `src/services/openaiApi.ts` para incluir un prompt mucho más detallado que guía a la IA a generar instrucciones específicas.

### Estructura de Ejercicios Mejorada

Cada ejercicio ahora incluye:
```typescript
{
  "name": "COMBINACIÓN RÁPIDA 1-1-2",
  "duration": 30,
  "description": "Golpea jab izquierdo, jab izquierdo, cross derecho. Repite 10 veces rápido"
}
```

### Ejemplos de Instrucciones Específicas

#### 1. **Combinaciones de Golpes**
```json
{
  "name": "COMBINACIÓN RÁPIDA 1-1-2",
  "duration": 30,
  "description": "Golpea jab izquierdo, jab izquierdo, cross derecho. Repite 10 veces rápido"
}
```

```json
{
  "name": "POTENCIA 2-3-2",
  "duration": 30,
  "description": "Cross derecho, hook izquierdo, cross derecho. Máxima potencia, 8 repeticiones"
}
```

```json
{
  "name": "COMBINACIÓN AVANZADA 1-2-3-2",
  "duration": 40,
  "description": "Jab, cross, hook, cross. Repite 12 veces con buena técnica"
}
```

#### 2. **Ejercicios de Velocidad**
```json
{
  "name": "VELOCIDAD PURA",
  "duration": 20,
  "description": "Jabs continuos lo más rápido posible durante 20 segundos"
}
```

#### 3. **Ejercicios Físicos Complementarios**
```json
{
  "name": "BURPEES EXPLOSIVOS",
  "duration": 30,
  "description": "Haz 5 burpees con máxima explosividad"
}
```

#### 4. **Defensa y Contraataque**
```json
{
  "name": "DEFENSA Y CONTRAATAQUE",
  "duration": 30,
  "description": "Slip derecha + cross, slip izquierda + hook. Alterna 10 veces"
}
```

## 📚 Nomenclatura de Boxeo

La IA ahora usa la nomenclatura estándar de boxeo:
- **1** = Jab (izquierdo)
- **2** = Cross (derecho)
- **3** = Hook (gancho)
- **4** = Uppercut (ascendente)

### Combinaciones Comunes
- **1-1-2**: Jab, Jab, Cross
- **1-2**: Jab, Cross (clásico)
- **1-2-3**: Jab, Cross, Hook
- **2-3-2**: Cross, Hook, Cross
- **1-2-3-2**: Jab, Cross, Hook, Cross
- **3-3-2**: Hook, Hook, Cross
- **1-2-4-3**: Jab, Cross, Uppercut, Hook

## 🎯 Directrices para la IA

El prompt ahora incluye estas directrices específicas:

### ✅ Debe Incluir:
1. **Números exactos**: "Repite 10 veces", "Haz 5 burpees", "Durante 20 segundos"
2. **Nomenclatura de boxeo**: 1=Jab, 2=Cross, 3=Hook, 4=Uppercut
3. **Combinaciones variadas**: 1-1-2, 1-2-3, 2-3-2, 1-2-3-2, etc.
4. **Ejercicios mixtos**: Golpeo + ejercicios físicos (burpees, sentadillas, flexiones)
5. **4-6 ejercicios por round**: Variedad y progresión
6. **Duración específica**: Cada ejercicio tiene su tiempo exacto
7. **Ejercicios de defensa**: Slip, roll, duck con contraataques
8. **Variedad de intensidad**: Velocidad, potencia, técnica, resistencia

### 📊 Estructura de un Round Completo

```json
{
  "roundNumber": 1,
  "workTime": 180,
  "restTime": 60,
  "exercises": [
    {
      "name": "COMBINACIÓN RÁPIDA 1-1-2",
      "duration": 30,
      "description": "Golpea jab izquierdo, jab izquierdo, cross derecho. Repite 10 veces rápido"
    },
    {
      "name": "POTENCIA 2-3-2",
      "duration": 30,
      "description": "Cross derecho, hook izquierdo, cross derecho. Máxima potencia, 8 repeticiones"
    },
    {
      "name": "VELOCIDAD PURA",
      "duration": 20,
      "description": "Jabs continuos lo más rápido posible durante 20 segundos"
    },
    {
      "name": "BURPEES EXPLOSIVOS",
      "duration": 30,
      "description": "Haz 5 burpees con máxima explosividad"
    },
    {
      "name": "COMBINACIÓN AVANZADA 1-2-3-2",
      "duration": 40,
      "description": "Jab, cross, hook, cross. Repite 12 veces con buena técnica"
    },
    {
      "name": "DEFENSA Y CONTRAATAQUE",
      "duration": 30,
      "description": "Slip derecha + cross, slip izquierda + hook. Alterna 10 veces"
    }
  ]
}
```

**Total**: 180 segundos (3 minutos) = suma de todas las duraciones

## 🔄 Cómo se Muestra en la App

Con el componente `TimerBoxeo` mejorado:

1. **Durante el round**, se muestran los ejercicios uno por uno con fade
2. **Cada 3 segundos** cambia al siguiente ejercicio
3. **Se muestra**:
   - Nombre del ejercicio (ej: "COMBINACIÓN RÁPIDA 1-1-2")
   - Descripción específica (ej: "Golpea jab izquierdo, jab izquierdo, cross derecho. Repite 10 veces rápido")
   - Indicador de progreso (EJERCICIO 1/6)

## 🎨 Ejemplo Visual en la App

```
┌─────────────────────────────────┐
│      ROUND 1 / 12               │
│                                 │
│         02:45                   │
│    🥊 TRABAJO INTENSO           │
│                                 │
│  ┌───────────────────────────┐  │
│  │ EJERCICIO 2/6             │  │
│  │                           │  │
│  │ POTENCIA 2-3-2            │  │
│  │                           │  │
│  │ Cross derecho, hook       │  │
│  │ izquierdo, cross derecho. │  │
│  │ Máxima potencia,          │  │
│  │ 8 repeticiones            │  │
│  │                           │  │
│  │ ⚫ 🔴 ⚫ ⚫ ⚫ ⚫           │  │
│  └───────────────────────────┘  │
│                                 │
│    ▶️  ⏭️  🔄                  │
└─────────────────────────────────┘
```

## 🚀 Beneficios

### Para el Usuario:
✅ **Instrucciones claras**: Sabe exactamente qué hacer
✅ **Números específicos**: No hay ambigüedad
✅ **Variedad**: Cada round es diferente
✅ **Progresión**: Mezcla de intensidades
✅ **Motivación**: Instrucciones dinámicas y específicas

### Para el Entrenamiento:
✅ **Estructura clara**: Cada ejercicio tiene su tiempo
✅ **Balance**: Golpeo + físico + defensa
✅ **Intensidad variable**: Velocidad, potencia, técnica
✅ **Profesional**: Usa nomenclatura estándar de boxeo

## 📝 Próximos Pasos

Para generar una nueva rutina con estas instrucciones específicas:

1. **Ir a la pantalla de Rutinas**
2. **Generar nueva rutina semanal**
3. **La IA ahora generará ejercicios específicos** siguiendo el nuevo prompt
4. **En la sesión de entrenamiento** verás las instrucciones detalladas rotando automáticamente

## 🔍 Verificación

Para verificar que funciona:
1. Genera una nueva rutina
2. Selecciona un día con entrenamiento de boxeo
3. Ve a "Tracking" y inicia el timer
4. Observa cómo las instrucciones específicas aparecen con fade cada 3 segundos

---

**Nota**: Las rutinas ya generadas anteriormente seguirán usando el formato antiguo. Solo las **nuevas rutinas** generadas después de este cambio tendrán las instrucciones específicas.
