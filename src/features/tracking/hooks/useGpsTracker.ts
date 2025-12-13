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
        console.log('Received new locations', locations);
    }
});

export const useGpsTracker = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [distance, setDistance] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const prevLocRef = useRef<Location.LocationObject | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            try {
                const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus.status !== 'granted') {
                    console.log("Background permission denied");
                }
            } catch (e) {
                console.warn("Background location permission request failed", e);
            }
        })();
    }, []);

    const startTracking = async () => {
        setIsTracking(true);
        try {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
                foregroundService: {
                    notificationTitle: "FitCoach AI",
                    notificationBody: "Tracking your run..."
                }
            });
        } catch (e) {
            console.warn("Failed to start background location updates:", e);
            setErrorMsg("Could not start background tracking. Using foreground only.");
        }

        // Also watch in foreground for UI updates
        Location.watchPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
        }, (newLocation) => {
            setLocation(newLocation);

            if (prevLocRef.current) {
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
    };

    const stopTracking = async () => {
        setIsTracking(false);
        try {
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
        } catch (e) {
            console.warn("Error stopping location updates:", e);
        }
    };

    return { location, distance, isTracking, startTracking, stopTracking, errorMsg };
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
