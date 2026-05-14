import { supabase } from "@/src/api/supabase";
import LeafletMap from "@/src/components/LeafletMap";
import { getDishes } from "@/src/storage/dishesStorage";
import { Dish } from "@/src/types/dish";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MapDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [dish, setDish] = useState<Dish | null>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [locMessage, setLocMessage] = useState("Cargando información...");

    useEffect(() => {
        const loadData = async () => {
            try {

                setLocMessage("Buscando el plato...");
                const { data } = await supabase.auth.getUser();
                const userId = data.user?.id;

                let foundDish = null;
                if (userId) {
                    const allDishes = await getDishes(userId);
                    foundDish = allDishes.find((d: Dish) => d.id === id);
                    if (foundDish) {
                        setDish(foundDish);
                    }
                }

                if (foundDish && foundDish.latitude != null && foundDish.longitude != null) {
                    setLocMessage("Calculando ruta...");
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const location = await Location.getCurrentPositionAsync({});
                        setUserLoc({
                            lat: location.coords.latitude,
                            lng: location.coords.longitude
                        });
                    }
                }
            } catch (e) {
                console.error("Error loading data", e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1A3A5C" />
                <Text style={styles.loadingText}>{locMessage}</Text>
            </View>
        );
    }

    if (!dish || dish.latitude == null || dish.longitude == null) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Ubicación no disponible para este plato.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{dish.name}</Text>
                <Text style={styles.headerSubtitle}>{dish.city}, {dish.country}</Text>
            </View>
            <LeafletMap
                dishLocation={{ lat: dish.latitude, lng: dish.longitude }}
                userLocation={userLoc || undefined}
                readOnly={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#1A3A5C',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#1A3A5C',
        padding: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    }
});
