# Guía de Implementación de Firebase en FitCoach AI

## 📋 Índice
1. [Instalación de Dependencias](#1-instalación-de-dependencias)
2. [Configuración de Firebase Console](#2-configuración-de-firebase-console)
3. [Configuración de Archivos](#3-configuración-de-archivos)
4. [Implementación del Código](#4-implementación-del-código)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Testing](#6-testing)

---

## 1. Instalación de Dependencias

Ejecuta los siguientes comandos en la terminal:

```bash
# Instalar Firebase SDK
npm install firebase

# Instalar dependencias de autenticación de Expo
npm install expo-auth-session expo-crypto expo-web-browser

# Para notificaciones push (opcional)
npm install expo-notifications
```

---

## 2. Configuración de Firebase Console

### 2.1 Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombre del proyecto: `fitcoach-ai` (o el que prefieras)
4. Habilita Google Analytics (recomendado)
5. Selecciona tu cuenta de Analytics
6. Haz clic en "Crear proyecto"

### 2.2 Agregar App Android

1. En el dashboard del proyecto, haz clic en el ícono de Android
2. **Package name**: `com.fitcoach.ai` (debe coincidir con `app.config.js`)
3. **App nickname**: FitCoach AI
4. **SHA-1**: Obtén ejecutando:
   ```bash
   cd android && ./gradlew signingReport
   ```
5. Descarga el archivo `google-services.json`
6. Colócalo en: `android/app/google-services.json`

### 2.3 Agregar App iOS

1. En el dashboard del proyecto, haz clic en el ícono de iOS
2. **Bundle ID**: `com.fitcoach.ai` (debe coincidir con `app.config.js`)
3. **App nickname**: FitCoach AI
4. Descarga el archivo `GoogleService-Info.plist`
5. Colócalo en: `ios/GoogleService-Info.plist`

### 2.4 Habilitar Servicios

En Firebase Console, habilita:

#### Authentication
1. Ve a **Authentication** → **Sign-in method**
2. Habilita:
   - ✅ **Email/Password**
   - ✅ **Google** (configura OAuth)
   
   Para Google OAuth:
   - Agrega tu email de soporte
   - Copia el **Client ID** para configuración posterior

#### Firestore Database
1. Ve a **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona **Modo de producción** (configuraremos reglas después)
4. Selecciona ubicación: `us-central1` (o la más cercana)

#### Storage (opcional, para imágenes de perfil)
1. Ve a **Storage**
2. Haz clic en "Comenzar"
3. Usa las reglas de seguridad por defecto

---

## 3. Configuración de Archivos

### 3.1 Actualizar `app.config.js`

```javascript
module.exports = ({ config }) => ({
    ...config,
    // ... configuración existente
    android: {
        ...config.android,
        googleServicesFile: "./google-services.json",
        package: "com.fitcoach.ai",
    },
    ios: {
        ...config.ios,
        googleServicesFile: "./GoogleService-Info.plist",
        bundleIdentifier: "com.fitcoach.ai",
    },
    plugins: [
        ...(config.plugins || []),
        "@react-native-firebase/app",
        "@react-native-firebase/auth",
    ],
});
```

### 3.2 Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
# Firebase Web Config
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# Google OAuth (para autenticación)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu_web_client_id.apps.googleusercontent.com
```

**Nota**: Obtén estos valores de Firebase Console → Project Settings → General → Your apps

---

## 4. Implementación del Código

### 4.1 Crear `src/config/firebase.ts`

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Auth already initialized
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
```

### 4.2 Actualizar `app.config.js` para variables de entorno

```javascript
require('dotenv').config();

module.exports = ({ config }) => ({
    ...config,
    extra: {
        ...config.extra,
        firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
        googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
});
```

### 4.3 Crear servicio de autenticación `src/services/firebase/auth.ts`

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  // Email/Password Sign Up
  signUpWithEmail: async (email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Email/Password Sign In
  signInWithEmail: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Google Sign In
  signInWithGoogle: async (): Promise<User> => {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    
    if (!webClientId) {
      throw new Error('Google Web Client ID not configured');
    }

    const [request, response, promptAsync] = Google.useAuthRequest({
      webClientId,
    });

    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    }

    throw new Error('Google sign in failed');
  },

  // Sign Out
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
};
```

### 4.4 Crear servicio de Firestore `src/services/firebase/firestore.ts`

```typescript
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const firestoreService = {
  // Users
  createUser: async (userId: string, userData: any) => {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  getUser: async (userId: string) => {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? docSnap.data() : null;
  },

  updateUser: async (userId: string, userData: any) => {
    await updateDoc(doc(db, 'users', userId), {
      ...userData,
      updatedAt: Timestamp.now(),
    });
  },

  // Workouts
  saveWorkout: async (userId: string, workoutData: any) => {
    const workoutRef = doc(collection(db, 'workouts'));
    await setDoc(workoutRef, {
      userId,
      ...workoutData,
      createdAt: Timestamp.now(),
    });
    return workoutRef.id;
  },

  getUserWorkouts: async (userId: string) => {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Weekly Routines
  saveWeeklyRoutine: async (userId: string, routineData: any) => {
    const routineRef = doc(collection(db, 'weeklyRoutines'));
    await setDoc(routineRef, {
      userId,
      ...routineData,
      createdAt: Timestamp.now(),
    });
    return routineRef.id;
  },

  getActiveRoutine: async (userId: string) => {
    const q = query(
      collection(db, 'weeklyRoutines'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.data() || null;
  },
};
```

---

## 5. Variables de Entorno

### 5.1 Agregar `.env` al `.gitignore`

```
# Environment variables
.env
.env.local
.env.*.local
```

### 5.2 Crear `.env.example`

```env
# Firebase Web Config
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

---

## 6. Testing

### 6.1 Probar Autenticación

```typescript
import { authService } from '@/services/firebase/auth';

// Test sign up
const user = await authService.signUpWithEmail('test@example.com', 'password123');


// Test sign in
const signedInUser = await authService.signInWithEmail('test@example.com', 'password123');

```

### 6.2 Probar Firestore

```typescript
import { firestoreService } from '@/services/firebase/firestore';

// Test create user
await firestoreService.createUser('user123', {
  name: 'Test User',
  email: 'test@example.com',
});

// Test get user
const userData = await firestoreService.getUser('user123');

```

---

## 7. Reglas de Seguridad de Firestore

En Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workouts collection
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Weekly Routines collection
    match /weeklyRoutines/{routineId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 8. Comandos Útiles

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# Rebuild para Android
cd android && ./gradlew clean && cd ..
npm run android

# Rebuild para iOS
cd ios && pod install && cd ..
npm run ios

# Verificar configuración
npx expo-doctor
```

---

## 9. Troubleshooting

### Error: "Firebase app not initialized"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que `app.config.js` esté leyendo las variables

### Error: "Google Sign In failed"
- Verifica que el `googleWebClientId` sea correcto
- Asegúrate de haber habilitado Google en Firebase Console
- Verifica que el SHA-1 esté configurado correctamente

### Error: "Permission denied" en Firestore
- Revisa las reglas de seguridad en Firebase Console
- Asegúrate de que el usuario esté autenticado

---

## 10. Próximos Pasos

1. ✅ Instalar dependencias
2. ✅ Configurar Firebase Console
3. ✅ Crear archivos de configuración
4. ✅ Implementar servicios
5. ⬜ Migrar backend actual a Firebase
6. ⬜ Implementar notificaciones push
7. ⬜ Configurar Analytics
8. ⬜ Implementar Cloud Functions (si es necesario)

---

**¿Necesitas ayuda?** Consulta la [documentación oficial de Firebase](https://firebase.google.com/docs)
