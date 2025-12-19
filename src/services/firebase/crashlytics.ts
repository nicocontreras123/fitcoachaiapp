import crashlytics from '@react-native-firebase/crashlytics';

/**
 * Firebase Crashlytics Service
 * Provides crash reporting and error tracking functionality
 */
export const crashlyticsService = {
    /**
     * Initialize Crashlytics
     * Call this at app startup
     */
    initialize: async () => {
        try {
            // Enable Crashlytics data collection
            await crashlytics().setCrashlyticsCollectionEnabled(true);

        } catch (error) {
            console.error('❌ Failed to initialize Crashlytics:', error);
        }
    },

    /**
     * Record a non-fatal error
     * @param error - The error object
     * @param context - Optional context string
     */
    recordError: (error: Error, context?: string) => {
        try {
            if (context) {
                crashlytics().log(`Context: ${context}`);
            }
            crashlytics().recordError(error);

        } catch (e) {
            console.error('Failed to record error to Crashlytics:', e);
        }
    },

    /**
     * Force a crash (for testing only!)
     * @param message - Crash message
     */
    crash: (message: string) => {
        crashlytics().log(message);
        crashlytics().crash();
    },

    /**
     * Set user identifier for crash reports
     * @param userId - Unique user ID
     */
    setUserId: (userId: string) => {
        try {
            crashlytics().setUserId(userId);

        } catch (error) {
            console.error('Failed to set user ID:', error);
        }
    },

    /**
     * Set custom attribute
     * @param key - Attribute key
     * @param value - Attribute value
     */
    setAttribute: (key: string, value: string) => {
        try {
            crashlytics().setAttribute(key, value);
        } catch (error) {
            console.error('Failed to set attribute:', error);
        }
    },

    /**
     * Set multiple custom attributes
     * @param attributes - Object with key-value pairs
     */
    setAttributes: (attributes: Record<string, string>) => {
        try {
            crashlytics().setAttributes(attributes);
        } catch (error) {
            console.error('Failed to set attributes:', error);
        }
    },

    /**
     * Log a custom message
     * @param message - Log message
     */
    log: (message: string) => {
        try {
            crashlytics().log(message);
        } catch (error) {
            console.error('Failed to log message:', error);
        }
    },

    /**
     * Enable or disable crash reporting
     * @param enabled - Whether to enable crash reporting
     */
    setCrashlyticsCollectionEnabled: async (enabled: boolean) => {
        try {
            await crashlytics().setCrashlyticsCollectionEnabled(enabled);

        } catch (error) {
            console.error('Failed to set crashlytics collection:', error);
        }
    },

    /**
     * Check if crash reporting is enabled
     */
    isCrashlyticsCollectionEnabled: async (): Promise<boolean> => {
        try {
            return await crashlytics().isCrashlyticsCollectionEnabled();
        } catch (error) {
            console.error('Failed to check crashlytics status:', error);
            return false;
        }
    },
};

/**
 * Helper function to wrap async functions with error reporting
 * @param fn - Async function to wrap
 * @param context - Context string for error reporting
 */
export const withCrashlytics = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
): T => {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            crashlyticsService.recordError(error as Error, context);
            throw error;
        }
    }) as T;
};
