import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
const isConfigValid = () => {
    return firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;
};

if (!isConfigValid()) {
    console.warn('⚠️ Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

} else {
    app = getApp();
}

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (error) {
    // Auth already initialized
    auth = getAuth(app);
}

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage, firebaseConfig, isConfigValid };
