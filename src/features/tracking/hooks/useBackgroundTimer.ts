import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STATE_KEY = '@timer_background_state';

interface BackgroundTimerState {
    isActive: boolean;
    startTime: number;
    pausedTime: number;
    totalElapsed: number;
}

/**
 * Hook to manage timer that continues running in background
 * Uses AppState to track when app goes to background and calculates elapsed time
 * when returning to foreground
 */
export const useBackgroundTimer = () => {
    const appState = useRef(AppState.currentState);
    const backgroundStartTime = useRef<number | null>(null);
    const isTimerActiveRef = useRef(false);

    // Save timer state to AsyncStorage
    const saveTimerState = useCallback(async (state: BackgroundTimerState) => {
        try {
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
            console.log('⏱️ [BACKGROUND_TIMER] State saved:', state);
        } catch (error) {
            console.error('❌ [BACKGROUND_TIMER] Failed to save state:', error);
        }
    }, []);

    // Load timer state from AsyncStorage
    const loadTimerState = useCallback(async (): Promise<BackgroundTimerState | null> => {
        try {
            const stateStr = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (stateStr) {
                const state = JSON.parse(stateStr) as BackgroundTimerState;
                console.log('⏱️ [BACKGROUND_TIMER] State loaded:', state);
                return state;
            }
        } catch (error) {
            console.error('❌ [BACKGROUND_TIMER] Failed to load state:', error);
        }
        return null;
    }, []);

    // Clear timer state
    const clearTimerState = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(TIMER_STATE_KEY);
            console.log('⏱️ [BACKGROUND_TIMER] State cleared');
        } catch (error) {
            console.error('❌ [BACKGROUND_TIMER] Failed to clear state:', error);
        }
    }, []);

    // Start background timer tracking
    const startBackgroundTimer = useCallback(async (currentElapsed: number = 0) => {
        isTimerActiveRef.current = true;
        const now = Date.now();

        await saveTimerState({
            isActive: true,
            startTime: now,
            pausedTime: 0,
            totalElapsed: currentElapsed,
        });

        console.log('⏱️ [BACKGROUND_TIMER] Started tracking', { currentElapsed });
    }, [saveTimerState]);

    // Stop background timer tracking
    const stopBackgroundTimer = useCallback(async () => {
        isTimerActiveRef.current = false;
        await clearTimerState();
        console.log('⏱️ [BACKGROUND_TIMER] Stopped tracking');
    }, [clearTimerState]);

    // Pause background timer
    const pauseBackgroundTimer = useCallback(async (currentElapsed: number) => {
        isTimerActiveRef.current = false;

        await saveTimerState({
            isActive: false,
            startTime: 0,
            pausedTime: Date.now(),
            totalElapsed: currentElapsed,
        });

        console.log('⏱️ [BACKGROUND_TIMER] Paused', { currentElapsed });
    }, [saveTimerState]);

    // Calculate elapsed time including background time
    const getElapsedTime = useCallback(async (): Promise<number> => {
        const state = await loadTimerState();

        if (!state) {
            return 0;
        }

        if (!state.isActive) {
            // Timer was paused
            return state.totalElapsed;
        }

        // Timer was active - calculate time elapsed since start
        const now = Date.now();
        const backgroundElapsed = Math.floor((now - state.startTime) / 1000);
        const totalElapsed = state.totalElapsed + backgroundElapsed;

        console.log('⏱️ [BACKGROUND_TIMER] Calculated elapsed time:', {
            totalElapsed,
            backgroundElapsed,
            previousElapsed: state.totalElapsed,
        });

        return totalElapsed;
    }, [loadTimerState]);

    // Handle app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            console.log('⏱️ [BACKGROUND_TIMER] AppState changed:', {
                from: appState.current,
                to: nextAppState,
                isTimerActive: isTimerActiveRef.current,
            });

            if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
                // App is going to background
                if (isTimerActiveRef.current) {
                    backgroundStartTime.current = Date.now();
                    console.log('⏱️ [BACKGROUND_TIMER] App going to background, timer active');
                }
            }

            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App is coming to foreground
                if (isTimerActiveRef.current && backgroundStartTime.current) {
                    const backgroundDuration = Math.floor((Date.now() - backgroundStartTime.current) / 1000);
                    console.log('⏱️ [BACKGROUND_TIMER] App returning to foreground, background duration:', backgroundDuration);
                    backgroundStartTime.current = null;
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            // Clear saved state when component unmounts (app force-closed)
            clearTimerState().catch(err =>
                console.error('❌ [BACKGROUND_TIMER] Failed to clear state on unmount:', err)
            );
            console.log('⏱️ [BACKGROUND_TIMER] Component unmounted, clearing state');
        };
    }, [clearTimerState]);

    return {
        startBackgroundTimer,
        stopBackgroundTimer,
        pauseBackgroundTimer,
        getElapsedTime,
        saveTimerState,
        loadTimerState,
    };
};
