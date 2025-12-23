# Sistema de Intensidad Dinámica para Ejercicios de Boxeo

## 📊 Resumen

La barra de intensidad ahora se ajusta automáticamente según el tipo de ejercicio actual, proporcionando una representación más precisa del esfuerzo requerido.

---

## 🎯 Niveles de Intensidad

### **Técnico / Baja (40%)**
**Color sugerido**: Azul `#3b82f6`

Ejercicios enfocados en técnica, forma y precisión:
- Técnica de golpes
- Trabajo de footwork
- Defensa y esquivas
- Postura y guardia
- Shadow boxing técnico
- Desplazamientos
- Pivotes y giros

**Palabras clave detectadas**:
- técnica, forma, postura, posición
- defensa, esquiva, bloqueo, guardia
- footwork, desplazamiento, pivote, giro
- sombra, shadow, visualiza

### **Moderada (60%)**
**Color sugerido**: Amarillo `#f59e0b`

Ejercicios de combinaciones básicas a ritmo constante:
- Jab
- Directo / Cross
- Combinaciones simples (Jab-Cross)
- Ritmo sostenido

**Palabras clave detectadas**:
- jab, directo, cross, recto
- combinación, combo
- ritmo constante, mantén, sostenido

### **Alta (75%)**
**Color sugerido**: Naranja `#f97316`

Ejercicios de potencia y velocidad:
- Hook / Gancho
- Uppercut
- Combinaciones de potencia
- Trabajo explosivo
- Velocidad

**Palabras clave detectadas**:
- hook, gancho, uppercut
- power, potencia, fuerza
- explosivo, rápido, velocidad
- intenso, fuerte

### **Muy Alta (90%)**
**Color sugerido**: Rojo `#ef4444`

Ejercicios de máxima intensidad:
- Sprints
- Bursts de máxima velocidad
- HIIT / Tabata
- All out / Máximo esfuerzo

**Palabras clave detectadas**:
- sprint, burst, máximo, all out
- explosión, máxima velocidad
- hiit, intervalo, tabata

### **Estados Especiales**

- **Preparación (0%)**: Durante el countdown inicial
- **Descanso (30%)**: Entre rounds

---

## 🔧 Implementación Técnica

### Archivo: `exerciseIntensity.ts`

```typescript
calculateExerciseIntensity(exerciseName: string, description?: string): number
```

**Funcionamiento**:
1. Convierte nombre y descripción a minúsculas
2. Busca palabras clave en ambos textos
3. Cuenta coincidencias por categoría
4. Retorna intensidad basada en la categoría con más coincidencias
5. Default: 70% si no hay coincidencias

### Integración en `WorkoutPhase.tsx`

```typescript
const currentIntensity = useMemo(() => {
    if (isPreparing) return 0;
    if (isRest) return 30;
    if (!currentExercise) return 70;
    
    return calculateExerciseIntensity(
        currentExercise.name, 
        currentExercise.description
    );
}, [isPreparing, isRest, currentExercise]);
```

---

## 📝 Ejemplos

### Ejemplo 1: Ejercicio Técnico
```typescript
{
    name: "Técnica de Jab",
    description: "Enfócate en la forma correcta del golpe"
}
// Intensidad: 40% (Técnico)
```

### Ejemplo 2: Combinación Básica
```typescript
{
    name: "Jab - Cross",
    description: "Mantén un ritmo constante"
}
// Intensidad: 60% (Moderada)
```

### Ejemplo 3: Golpes de Potencia
```typescript
{
    name: "Hook - Uppercut",
    description: "Golpes explosivos con máxima potencia"
}
// Intensidad: 75% (Alta)
```

### Ejemplo 4: Máxima Intensidad
```typescript
{
    name: "Sprint de Combinaciones",
    description: "Máxima velocidad durante 30 segundos"
}
// Intensidad: 90% (Muy Alta)
```

---

## 🎨 Mejoras Futuras

### Opción 1: Intensidad por Duración
Ajustar intensidad según la duración del ejercicio:
```typescript
if (duration > 120) intensity -= 10; // Ejercicios largos = menor intensidad
if (duration < 30) intensity += 10;  // Ejercicios cortos = mayor intensidad
```

### Opción 2: Intensidad por Round
Aumentar intensidad en rounds finales:
```typescript
if (round > totalRounds * 0.8) intensity += 10; // Últimos rounds más intensos
```

### Opción 3: Colores Dinámicos
Cambiar el color de la barra según intensidad:
```typescript
<IntensityBar
    intensity={currentIntensity}
    color={getIntensityColor(currentIntensity)}
/>
```

### Opción 4: Análisis de IA
Usar OpenAI para analizar ejercicios y determinar intensidad:
```typescript
const intensity = await analyzeExerciseIntensity(exercise);
```

---

## 🧪 Testing

### Casos de Prueba

1. **Ejercicio Técnico**
   - Nombre: "Footwork y Desplazamientos"
   - Esperado: ~40%

2. **Jab Simple**
   - Nombre: "Jab - Directo"
   - Esperado: ~60%

3. **Combinación de Potencia**
   - Nombre: "Hook - Uppercut - Cross"
   - Esperado: ~75%

4. **Sprint**
   - Nombre: "Sprint de Máxima Velocidad"
   - Esperado: ~90%

5. **Descanso**
   - Estado: isRest = true
   - Esperado: 30%

6. **Preparación**
   - Estado: isPreparing = true
   - Esperado: 0%

---

## 📊 Estadísticas de Uso

La función analiza:
- ✅ Nombre del ejercicio
- ✅ Descripción del ejercicio
- ✅ ~50 palabras clave en español
- ✅ 4 categorías de intensidad
- ✅ Fallback a 70% por defecto

---

## 🔄 Actualización de Ejercicios

Para aprovechar mejor el sistema, asegúrate de que los ejercicios incluyan:

1. **Nombres descriptivos**:
   - ✅ "Hook de Potencia"
   - ❌ "Ejercicio 1"

2. **Descripciones informativas**:
   - ✅ "Golpes explosivos con máxima velocidad"
   - ❌ "Hacer golpes"

3. **Palabras clave relevantes**:
   - Técnico: "técnica", "forma", "postura"
   - Potencia: "explosivo", "potencia", "fuerza"
   - Velocidad: "rápido", "velocidad", "sprint"
