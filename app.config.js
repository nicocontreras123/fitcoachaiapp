require('dotenv').config();

module.exports = ({ config }) => ({
    ...config,
    name: "FitCoach AI",
    slug: "fitcoach-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
        image: "./assets/fitcoach_logo.png",
        resizeMode: "contain",
        backgroundColor: "#102216"
    },
    assetBundlePatterns: [
        "**/*"
    ],
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.fitcoach.ai",
        infoPlist: {
            NSLocationWhenInUseUsageDescription: "FitCoach AI needs your location to track your running workouts and provide accurate distance and pace information.",
            NSMicrophoneUsageDescription: "FitCoach AI needs microphone access to provide voice feedback during your workouts.",
            NSUserNotificationsUsageDescription: "FitCoach AI needs permission to send you reminders about your daily workouts and weekly routine updates.",
            LSApplicationQueriesSchemes: ["spotify"]
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        package: "com.fitcoach.ai",
        googleServicesFile: "./google-services.json",
        permissions: [
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "ACCESS_BACKGROUND_LOCATION",
            "FOREGROUND_SERVICE",
            "FOREGROUND_SERVICE_LOCATION",
            "RECORD_AUDIO",
            "POST_NOTIFICATIONS"
        ]
    },
    web: {
        favicon: "./assets/favicon.png"
    },
    plugins: [
        "expo-router",
        [
            "expo-location",
            {
                locationAlwaysAndWhenInUsePermission: "Allow FitCoach AI to use your location to track running workouts."
            }
        ],
        [
            "expo-notifications",
            {
                icon: "./assets/icon.png",
                color: "#102216",
                sounds: ["default"],
                mode: "production"
            }
        ],
        "expo-font",
        "expo-web-browser",
        "expo-audio",
        "expo-asset",
        "@react-native-firebase/app",
        "@react-native-firebase/crashlytics"
    ],
    scheme: "fitcoach",
    experiments: {
        typedRoutes: true
    },
    extra: {
        // OpenAI Configuration
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
        OPENAI_MODEL: process.env.OPENAI_MODEL,

        // Supabase Configuration (existing)
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        // Google OAuth (existing)
        EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

        // API Configuration
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,

        eas: {
            projectId: "efcc7a53-8b28-4e98-8221-e54b8c0cf34a"
        }
    }
});
