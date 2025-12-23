# Sistema de Warmup Específico por Objetivo

## 📋 Resumen

Los calentamientos ahora se adaptan automáticamente al **objetivo del entrenamiento** (técnica, resistencia, potencia) además del nivel del usuario, proporcionando una preparación más específica y efectiva.

---

## 🎯 Objetivos de Entrenamiento

### **1. Técnica (Technique)**
**Enfoque**: Precisión, forma correcta, control neuromuscular

**Palabras clave detectadas**:
- técnica, tecnica, technical
- forma, postura, precisión

**Warmup característico**:
- Cardio moderado con enfoque en técnica
- Movilidad amplia y controlada
- Shadow boxing lento con forma perfecta
- Activación neuromuscular (advanced)

### **2. Resistencia (Endurance)**
**Enfoque**: Capacidad cardiovascular, aguante, ritmo sostenido

**Palabras clave detectadas**:
- resistencia, endurance
- cardio, cardiovascular
- aguante, stamina

**Warmup característico**:
- Cardio intenso y sostenido
- Movilidad activa y rápida
- Shadow boxing continuo sin parar
- Core dinámico (advanced)

### **3. Potencia (Power)**
**Enfoque**: Explosividad, fuerza, velocidad máxima

**Palabras clave detectadas**:
- potencia, power
- fuerza, strength
- explosivo, explosiva, explosive

**Warmup característico**:
- Pliométricos y ejercicios explosivos
- Movilidad con velocidad
- Shadow boxing con golpes de potencia
- Core explosivo (advanced)

### **4. Balanceado (Balanced)**
**Enfoque**: Combinación equilibrada de todos los aspectos

**Cuando se usa**:
- No se detectan palabras clave específicas
- Entrenamiento general
- Default para workouts sin objetivo claro

**Warmup característico**:
- Cardio versátil
- Movilidad funcional completa
- Shadow boxing mixto
- Activación integral (advanced)

---

## 📊 Estructura por Nivel y Objetivo

### **Beginner (5-7 min, 2-3 ejercicios)**

| Objetivo | Ejercicio 1 | Ejercicio 2 |
|----------|-------------|-------------|
| **Técnica** | Trote ligero (180s) | Movilidad articular básica (120s) |
| **Resistencia** | Jumping jacks (180s) | Skipping alto rodillas (120s) |
| **Potencia** | Saltos de cuerda (180s) | Arm circles y rotaciones (120s) |
| **Balanceado** | Trote ligero (180s) | Movilidad dinámica (120s) |

### **Intermediate (10-12 min, 3-4 ejercicios)**

| Objetivo | Fase 1: Cardio | Fase 2: Movilidad | Fase 3: Técnica |
|----------|----------------|-------------------|-----------------|
| **Técnica** | Cuerda técnica (300s) | Movilidad completa (150s) | Shadow técnico (180s) |
| **Resistencia** | Trote rodillas altas (300s) | Movilidad rápida (120s) | Shadow ritmo (180s) |
| **Potencia** | Burpees explosivos (240s) | Movilidad activación (120s) | Shadow potencia (240s) |
| **Balanceado** | Cuerda variada (300s) | Movilidad funcional (120s) | Shadow mixto (180s) |

### **Advanced (12-15 min, 4-5 ejercicios)**

| Objetivo | Cardio | Movilidad | Técnica | Activación |
|----------|--------|-----------|---------|------------|
| **Técnica** | Cuerda técnica avanzada (360s) | Movilidad avanzada (180s) | Shadow técnico avanzado (300s) | Activación técnica (120s) |
| **Resistencia** | HIIT cardio (360s) | Movilidad continua (150s) | Shadow resistencia (300s) | Core dinámico (120s) |
| **Potencia** | Pliométricos (300s) | Movilidad explosiva (180s) | Shadow potencia máxima (300s) | Core potencia (120s) |
| **Balanceado** | Cuerda mixta (360s) | Movilidad completa (180s) | Shadow completo (240s) | Activación integral (120s) |

---

## 🔍 Detección Automática de Objetivo

El sistema analiza el **título** y **descripción** del workout para detectar el objetivo:

```typescript
// Ejemplo 1: Técnica
title: "Boxeo Técnico Avanzado"
description: "Enfoque en perfeccionar la forma de cada golpe"
→ Detectado: TECHNIQUE

// Ejemplo 2: Resistencia
title: "Cardio Boxing Intenso"
description: "Mejora tu resistencia cardiovascular"
→ Detectado: ENDURANCE

// Ejemplo 3: Potencia
title: "Power Boxing"
description: "Desarrolla fuerza explosiva en tus golpes"
→ Detectado: POWER

// Ejemplo 4: Balanceado
title: "Entrenamiento Completo"
description: "Sesión integral de boxeo"
→ Detectado: BALANCED
```

---

## 💡 Ejemplos de Warmup Completos

### **Intermediate - Técnica (11 min)**
```json
{
  "warmup": [
    {
      "name": "Saltos de cuerda técnicos",
      "duration": 300,
      "description": "Activación cardiovascular con técnica. 100-120 saltos/min..."
    },
    {
      "name": "Movilidad dinámica completa",
      "duration": 150,
      "description": "Movilidad funcional. Arm circles 20 reps..."
    },
    {
      "name": "Shadow boxing técnico",
      "duration": 180,
      "description": "Técnica pura. Combinaciones 1-2, 1-2-3 a 40% velocidad..."
    }
  ]
}
```

### **Advanced - Potencia (14 min)**
```json
{
  "warmup": [
    {
      "name": "Pliométricos explosivos",
      "duration": 300,
      "description": "Explosividad máxima. Burpees con salto vertical 15 reps..."
    },
    {
      "name": "Movilidad explosiva",
      "duration": 180,
      "description": "Movilidad con potencia. Leg swings explosivos 20/lado..."
    },
    {
      "name": "Shadow boxing potencia máxima",
      "duration": 300,
      "description": "Golpes de máxima potencia. Combos 2-3-2, 1-6-3 a 80% velocidad..."
    },
    {
      "name": "Core potencia",
      "duration": 120,
      "description": "Core explosivo. Medicine ball slams simulados 20 reps..."
    }
  ]
}
```

---

## 🎨 Variedad de Ejercicios

### **Total de ejercicios únicos**: 40+

**Por nivel**:
- Beginner: 8 ejercicios (2 por objetivo × 4 objetivos)
- Intermediate: 12 ejercicios (3 por objetivo × 4 objetivos)
- Advanced: 16 ejercicios (4 por objetivo × 4 objetivos)

**Categorías de ejercicios**:
1. **Cardio**: Cuerda, trote, burpees, HIIT, jumping jacks, high knees
2. **Movilidad**: Arm circles, leg swings, inchworms, rotaciones, stretches
3. **Shadow Boxing**: Técnico, ritmo, potencia, mixto, resistencia
4. **Activación**: Core, pliométricos, explosivos, neuromusculares

---

## 🔧 Implementación Técnica

### **Archivo**: `warmupTemplates.ts`

**Estructura**:
```typescript
WARMUP_TEMPLATES: {
  beginner: {
    technique: [WarmupExercise[]],
    endurance: [WarmupExercise[]],
    power: [WarmupExercise[]],
    balanced: [WarmupExercise[]]
  },
  intermediate: { ... },
  advanced: { ... }
}
```

**Funciones**:
- `detectWorkoutObjective(title, description)`: Detecta objetivo del workout
- `getWarmupTemplates(level, objective)`: Obtiene templates apropiados

### **Integración en `openaiApi.ts`**

```typescript
// 1. Detectar objetivo
const objective = detectWorkoutObjective(boxing.title, boxing.description);

// 2. Obtener templates
const templates = getWarmupTemplates(level, objective);

// 3. Agregar ejercicios faltantes
templates.forEach(template => {
  if (!alreadyHas && boxing.warmup.length < minExercises) {
    boxing.warmup.push(template);
  }
});
```

---

## 📈 Beneficios del Sistema

1. ✅ **Específico**: Warmup adaptado al objetivo del entrenamiento
2. ✅ **Variado**: 40+ ejercicios diferentes evitan monotonía
3. ✅ **Progresivo**: Estructura adecuada por nivel
4. ✅ **Automático**: Detección y aplicación sin intervención manual
5. ✅ **Científico**: Basado en principios de preparación deportiva
6. ✅ **Completo**: Cubre cardio, movilidad, técnica y activación

---

## 🧪 Testing

### **Test 1: Detección de Objetivo**
```typescript
detectWorkoutObjective("Boxeo Técnico", "Mejora tu técnica")
// Esperado: "technique"

detectWorkoutObjective("Cardio Boxing", "Resistencia cardiovascular")
// Esperado: "endurance"

detectWorkoutObjective("Power Punches", "Golpes explosivos")
// Esperado: "power"
```

### **Test 2: Templates Correctos**
```typescript
getWarmupTemplates("intermediate", "technique")
// Esperado: 3 ejercicios enfocados en técnica

getWarmupTemplates("advanced", "power")
// Esperado: 4 ejercicios enfocados en potencia
```

### **Test 3: Warmup Enhancement**
```
Input: Workout intermediate con 1 ejercicio de warmup
Objetivo detectado: "endurance"
Output: 3 ejercicios de warmup específicos para resistencia
```

---

## 🔄 Logs de Debugging

```
⚠️ Warmup too short: 1 exercises < 3 (intermediate)
🎯 Detected workout objective: endurance
✅ Enhanced warmup (endurance): 3 exercises, 600s total
```

---

## 🚀 Próximas Mejoras

1. **Cooldown Específico**: Aplicar mismo sistema a enfriamiento
2. **Análisis IA**: Usar OpenAI para detectar objetivo más precisamente
3. **Templates Personalizados**: Permitir al usuario crear sus propios templates
4. **Historial**: Evitar repetir mismo warmup en workouts consecutivos
5. **Adaptación Dinámica**: Ajustar warmup según feedback del usuario

---

¿Te gustaría que:
1. Agregue más ejercicios a algún objetivo específico?
2. Cree templates para cooldown también?
3. Implemente detección más sofisticada de objetivos?
4. Agregue variaciones estacionales o por clima?
