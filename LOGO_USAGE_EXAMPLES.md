# Ejemplos de Uso del Logo

## Componente Logo

El componente `Logo` está disponible en `@/components/common/Logo` y es fácil de usar en cualquier parte de la app.

## Ejemplos de Implementación

### 1. Pantalla de Bienvenida (Ya implementado)

```tsx
// app/onboarding/welcome.tsx
import { Logo } from '@/components/common/Logo';

<Animated.View entering={FadeInDown.delay(100).duration(800)} style={{ alignItems: 'center' }}>
  <Logo size="xlarge" style={{ marginBottom: 32 }} />
  <Text variant="headlineSmall">
    Tu entrenador personal inteligente.
  </Text>
</Animated.View>
```

### 2. Header de Navegación

```tsx
// Ejemplo para agregar en un header
import { Logo } from '@/components/common/Logo';

<View style={styles.header}>
  <Logo size="small" />
  <Text style={styles.headerTitle}>FitCoach AI</Text>
</View>
```

### 3. Pantalla de Carga

```tsx
// Ejemplo para loading screen
import { Logo } from '@/components/common/Logo';
import { ActivityIndicator } from 'react-native';

<View style={styles.loadingContainer}>
  <Logo size="large" />
  <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
  <Text>Cargando...</Text>
</View>
```

### 4. Auth Screen (Login/Registro)

```tsx
// app/onboarding/auth.tsx
import { Logo } from '@/components/common/Logo';

<SafeAreaView style={styles.container}>
  <View style={styles.logoContainer}>
    <Logo size="large" />
  </View>

  <View style={styles.formContainer}>
    {/* Formulario de login */}
  </View>
</SafeAreaView>
```

### 5. Modal o Dialog

```tsx
// Ejemplo para un modal de confirmación
import { Logo } from '@/components/common/Logo';
import { Modal } from 'react-native';

<Modal visible={visible}>
  <View style={styles.modalContent}>
    <Logo size="medium" style={{ marginBottom: 20 }} />
    <Text>¿Estás seguro?</Text>
    <Button>Confirmar</Button>
  </View>
</Modal>
```

### 6. Pantalla de Error

```tsx
// Ejemplo para error screen
import { Logo } from '@/components/common/Logo';

<View style={styles.errorContainer}>
  <Logo size="large" style={{ opacity: 0.5 }} />
  <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
  <Text style={styles.errorMessage}>{errorMessage}</Text>
  <Button onPress={retry}>Reintentar</Button>
</View>
```

### 7. Pantalla de Éxito

```tsx
// Ejemplo para success screen
import { Logo } from '@/components/common/Logo';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

<View style={styles.successContainer}>
  <Animated.View entering={ZoomIn.duration(500)}>
    <Logo size="large" />
  </Animated.View>

  <Animated.View entering={FadeIn.delay(300)}>
    <Text style={styles.successTitle}>¡Rutina completada!</Text>
  </Animated.View>
</View>
```

### 8. Bottom Sheet

```tsx
// Ejemplo para bottom sheet
import { Logo } from '@/components/common/Logo';
import { BottomSheet } from '@/components/common/BottomSheet';

<BottomSheet>
  <View style={styles.sheetContent}>
    <Logo size="small" style={{ alignSelf: 'center', marginBottom: 16 }} />
    <Text>Contenido del bottom sheet</Text>
  </View>
</BottomSheet>
```

## Tamaños del Logo

```tsx
<Logo size="small" />   // 40px  - Para headers, iconos pequeños
<Logo size="medium" />  // 80px  - Para cards, listas (DEFAULT)
<Logo size="large" />   // 120px - Para pantallas principales
<Logo size="xlarge" />  // 200px - Para splash, welcome screens
```

## Personalización

### Con estilos personalizados

```tsx
<Logo
  size="medium"
  style={{
    marginBottom: 20,
    opacity: 0.8,
    transform: [{ scale: 1.1 }]
  }}
/>
```

### Con animaciones

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.duration(800)}>
  <Logo size="large" />
</Animated.View>
```

### Con sombras (iOS/Android)

```tsx
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
}}>
  <Logo size="medium" />
</View>
```

## Mejores Prácticas

### ✅ DO

- Usar el componente `Logo` en lugar de importar la imagen directamente
- Elegir el tamaño apropiado según el contexto
- Dejar suficiente espacio alrededor del logo
- Usar animaciones sutiles para mejorar la UX

### ❌ DON'T

- No distorsionar el logo (mantener aspect ratio)
- No usar colores de fondo que dificulten la visibilidad
- No hacer el logo demasiado pequeño (mínimo 40px)
- No rotar o transformar el logo de formas extrañas

## Integración con Themes

El componente Logo ya está integrado con el sistema de temas:

```tsx
import { Logo } from '@/components/common/Logo';

// Automáticamente ajusta la opacidad en modo oscuro
<Logo size="large" />
```

## Accesibilidad

Para mejorar la accesibilidad, puedes agregar:

```tsx
import { Logo } from '@/components/common/Logo';
import { View } from 'react-native';

<View accessible accessibilityLabel="Logo de FitCoach AI">
  <Logo size="medium" />
</View>
```

## Performance

El logo se carga desde assets locales, por lo que:
- ✅ No hay latencia de red
- ✅ Funciona offline
- ✅ Carga instantánea
- ✅ Cacheo automático

## Troubleshooting

### El logo no aparece

1. Verifica que el archivo existe:
```bash
ls fintapp/assets/fitcoach_logo.png
```

2. Limpia el cache:
```bash
npx expo start --clear
```

3. Verifica el import:
```tsx
import { Logo } from '@/components/common/Logo';
```

### El logo se ve pixelado

Asegúrate de usar el tamaño correcto. Si necesitas un logo más grande:
1. Usa `size="xlarge"`
2. O ajusta los tamaños en `Logo.tsx`:

```tsx
const SIZES = {
  small: 40,
  medium: 80,
  large: 120,
  xlarge: 250, // Aumentar aquí
};
```

### El logo no se adapta al tema oscuro

El componente ya tiene soporte para tema oscuro. Verifica que estés usando el hook de tema:

```tsx
const { isDark } = useTheme();
```
