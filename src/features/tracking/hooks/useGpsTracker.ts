import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

// Define task in global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    if (data) {
        const { locations } = data as any;
        // In a real app, you'd save this to a store or DB

    }
});

export const useGpsTracker = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [distance, setDistance] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
    const [isMoving, setIsMoving] = useState(true); // Start as true - auto-pause only after delay

    const prevLocRef = useRef<Location.LocationObject | null>(null);
    const lastMovementTimeRef = useRef<number>(Date.now());
    const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso para acceder a la ubicación denegado');
                return;
            }

            try {
                const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus.status !== 'granted') {

                }
            } catch (e) {
                console.warn("⚠️ Background location permission request failed", e);
            }
        })();
    }, []);

    const startTracking = async () => {

        setIsTracking(true);
        setIsMoving(true);
        lastMovementTimeRef.current = Date.now();

        try {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
                foregroundService: {
                    notificationTitle: "FitCoach AI",
                    notificationBody: "Rastreando tu carrera..."
                }
            });
        } catch (e) {
            console.warn("⚠️ Failed to start background location updates:", e);
            setErrorMsg("No se pudo iniciar el rastreo en segundo plano. Usando solo primer plano.");
        }

        try {
            const subscription = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 0, // Update based on time only, not distance
            }, (newLocation) => {
                setLocation(newLocation);

                // Calculate speed (m/s to km/h)
                const speedKmh = (newLocation.coords.speed || 0) * 3.6;
                setCurrentSpeed(speedKmh);

                // Check if user is moving (speed > 3 km/h = walking/running pace)
                const MOVEMENT_THRESHOLD = 3.0; // km/h - minimum walking speed
                const AUTO_PAUSE_DELAY = 15000; // 15 seconds in milliseconds

                if (speedKmh > MOVEMENT_THRESHOLD) {
                    // User is moving
                    lastMovementTimeRef.current = Date.now();
                    if (!isMoving) {
                        setIsMoving(true);
                    }
                } else {
                    // User might be stopped
                    const timeSinceLastMovement = Date.now() - lastMovementTimeRef.current;

                    if (timeSinceLastMovement > AUTO_PAUSE_DELAY && isMoving) {
                        setIsMoving(false);
                    }
                }

                // Single debug log


                // Only update distance if user is moving
                if (prevLocRef.current && speedKmh > MOVEMENT_THRESHOLD) {
                    const d = calculateDistance(
                        prevLocRef.current.coords.latitude,
                        prevLocRef.current.coords.longitude,
                        newLocation.coords.latitude,
                        newLocation.coords.longitude
                    );
                    setDistance(prev => prev + d);
                }
                prevLocRef.current = newLocation;
            });

            watchSubscriptionRef.current = subscription;

            // Fallback: If GPS doesn't update frequently, use interval
            const fallbackInterval = setInterval(() => {
                const MOVEMENT_THRESHOLD = 3.0;
                const AUTO_PAUSE_DELAY = 15000;

                // Simulate GPS update with current speed
                const timeSinceLastMovement = Date.now() - lastMovementTimeRef.current;

                if (currentSpeed < MOVEMENT_THRESHOLD && timeSinceLastMovement > AUTO_PAUSE_DELAY && isMoving) {

                    setIsMoving(false);
                } else if (currentSpeed >= MOVEMENT_THRESHOLD && !isMoving) {

                    setIsMoving(true);
                    lastMovementTimeRef.current = Date.now();
                }
            }, 1000);

            // Store interval ref for cleanup
            (watchSubscriptionRef.current as any).fallbackInterval = fallbackInterval;
        } catch (e) {
            console.error('❌ Failed to start foreground GPS watch:', e);
        }
    };

    const stopTracking = async () => {
        setIsTracking(false);

        // Stop foreground watch
        if (watchSubscriptionRef.current) {
            // Clear fallback interval if exists
            if ((watchSubscriptionRef.current as any).fallbackInterval) {
                clearInterval((watchSubscriptionRef.current as any).fallbackInterval);
            }
            watchSubscriptionRef.current.remove();
            watchSubscriptionRef.current = null;
        }

        try {
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
        } catch (e) {
            console.warn("Error stopping location updates:", e);
        }
    };

    return {
        location,
        distance,
        isTracking,
        startTracking,
        stopTracking,
        errorMsg,
        currentSpeed,
        isMoving
    };
};

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
