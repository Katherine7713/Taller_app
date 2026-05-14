import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from "@/src/api/supabase";
import { getDishes } from "@/src/storage/dishesStorage";
import { Dish } from "@/src/types/dish";

export default function DishDetailScreen() {
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

    if (!dish) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Plato no encontrado</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            <Image source={{ uri: dish.photo_uri || "" }} style={styles.image} />
            
            <View style={styles.content}>
                <Text style={styles.title}>{dish.name}</Text>
                
                <View style={styles.infoRow}>
                    <Text style={styles.cityText}>📍 {dish.city}, {dish.country}</Text>
                    <Text style={styles.dateText}>
                        {new Date(dish.created_at).toLocaleDateString()}
                    </Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => router.push({ pathname: '/map/[id]', params: { id: dish.id } } as any)}
                >
                    <Text style={styles.mapButtonText}>Ver ubicación en el Mapa</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
    image: {
        width: '100%',
        height: 350,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
        backgroundColor: 'white',
        marginTop: -20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: 500,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cityText: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 14,
        color: '#888',
    },
    mapButton: {
        backgroundColor: '#1A3A5C',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    mapButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
