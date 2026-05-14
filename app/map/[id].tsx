import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from "@/src/api/supabase";
import { getDishes } from "@/src/storage/dishesStorage";
import { Dish } from "@/src/types/dish";
import LeafletMap from "@/src/components/LeafletMap";

export default function MapDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [dish, setDish] = useState<Dish | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDish = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                const userId = data.user?.id;
                
                if (userId) {
                    const allDishes = await getDishes(userId);
                    const foundDish = allDishes.find((d: Dish) => d.id === id);
                    if (foundDish) {
                        setDish(foundDish);
                    }
                }
            } catch (e) {
                console.error("Error loading dish", e);
            } finally {
                setLoading(false);
            }
        };
        
        loadDish();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1A3A5C" />
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
                initialLocation={{ lat: dish.latitude, lng: dish.longitude }}
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
