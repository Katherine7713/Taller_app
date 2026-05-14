import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    Modal
} from "react-native";
import * as Location from "expo-location";

import * as ImagePicker from "expo-image-picker";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

import { supabase } from "@/src/api/supabase";
import { useDishes } from "@/src/hooks/useDishes";
import { Dish } from "@/src/types/dish";
import { getCurrentLocation } from "@/src/utils/location";
import LeafletMap from "@/src/components/LeafletMap";

interface LocationData {
    latitude: number;
    longitude: number;
    city: string | null;
    country: string | null;
}

export default function AddDish() {
    const [name, setName] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [userId, setUserId] = useState("");
    
    // New states for location
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);

    const { addDish } = useDishes(userId);

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUserId(data.user?.id ?? "");
        };
        getUser();
    }, []);

    useEffect(() => {
        (async () => {
            await ImagePicker.requestMediaLibraryPermissionsAsync();
            await ImagePicker.requestCameraPermissionsAsync();
        })();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], 
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (permission.status !== "granted") {
            Alert.alert("Permiso denegado");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], 
            quality: 1,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const handleGetCurrentLocation = async () => {
        try {
            const loc = await getCurrentLocation();
            setLocationData({
                latitude: loc.latitude,
                longitude: loc.longitude,
                city: loc.city,
                country: loc.country
            });
            Alert.alert("Éxito", "Ubicación obtenida correctamente.");
        } catch (e) {
            Alert.alert("Error", "No se pudo obtener la ubicación.");
        }
    };

    const handleConfirmMapLocation = async () => {
        if (!tempCoords) {
            setShowMap(false);
            return;
        }
        
        try {
            const reverse = await Location.reverseGeocodeAsync({
                latitude: tempCoords.lat,
                longitude: tempCoords.lng,
            });

            setLocationData({
                latitude: tempCoords.lat,
                longitude: tempCoords.lng,
                city: reverse[0]?.city || null,
                country: reverse[0]?.country || null,
            });
            setShowMap(false);
        } catch (e) {
            Alert.alert("Error", "No se pudo obtener información de la ubicación.");
            setShowMap(false);
        }
    };

    const handleAdd = async () => {
        if (!name || !photo || !userId) {
            Alert.alert("Completa todos los campos");
            return;
        }
        
        if (!locationData) {
            Alert.alert("Falta ubicación", "Por favor obtén o selecciona la ubicación del plato.");
            return;
        }

        try {
            const newDish: Dish = {
                id: Date.now().toString(),
                user_id: userId,
                name,
                photo_uri: photo,
                city: locationData.city || "Desconocida",
                country: locationData.country || "Desconocido",
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                created_at: new Date().toISOString(),
            };

            await addDish.mutateAsync(newDish);

            setName("");
            setPhoto(null);
            setLocationData(null);

            Alert.alert("Éxito", "Plato registrado correctamente");
        } catch (e) {
            Alert.alert("Error al registrar");
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Nombre del plato"
                value={name}
                onChangeText={setName}
                style={styles.input}
            />

            {/* GALERÍA */}
            <TouchableOpacity onPress={pickImage} style={styles.buttonSecondary}>
                <Text style={styles.buttonText}>Galería</Text>
            </TouchableOpacity>

            {/* CÁMARA */}
            <TouchableOpacity onPress={takePhoto} style={styles.button}>
                <Text style={styles.buttonText}>Cámara</Text>
            </TouchableOpacity>

            {photo && (
                <Image source={{ uri: photo }} style={styles.image} />
            )}
            
            {/* UBICACIÓN */}
            <View style={styles.locationContainer}>
                <Text style={styles.locationTitle}>Ubicación</Text>
                {locationData ? (
                    <Text style={styles.locationText}>
                        📍 {locationData.city ? locationData.city + ', ' : ''}{locationData.country || 'Coordenadas seleccionadas'}
                    </Text>
                ) : (
                    <Text style={styles.locationText}>Ninguna ubicación seleccionada</Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <TouchableOpacity onPress={handleGetCurrentLocation} style={[styles.buttonSecondary, { flex: 1, marginRight: 5 }]}>
                        <Text style={styles.buttonText}>Ubicación actual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowMap(true)} style={[styles.button, { flex: 1, marginLeft: 5, marginTop: 10 }]}>
                        <Text style={styles.buttonText}>Seleccionar mapa</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* REGISTRAR */}
            <Animated.View style={[{ marginTop: 20 }, animatedStyle]}>
                <TouchableOpacity
                    onPressIn={() => (scale.value = withSpring(0.95))}
                    onPressOut={() => (scale.value = withSpring(1))}
                    onPress={handleAdd}
                    style={styles.submitButton}
                >
                    <Text style={styles.buttonText}>
                        Registrar Plato
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* MODAL MAPA */}
            <Modal visible={showMap} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMap(false)}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Elige la ubicación</Text>
                        <TouchableOpacity onPress={handleConfirmMapLocation}>
                            <Text style={styles.confirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                    <LeafletMap 
                        readOnly={false} 
                        onLocationSelect={(loc) => setTempCoords(loc)} 
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#F5F7FA",
        flex: 1,
    },
    input: {
        backgroundColor: "white",
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    button: {
        backgroundColor: "#1A3A5C",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    buttonSecondary: {
        backgroundColor: "#3B82F6",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: "#10B981",
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    image: {
        height: 150,
        borderRadius: 16,
        marginTop: 15,
    },
    locationContainer: {
        marginTop: 20,
        backgroundColor: "white",
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    locationTitle: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#333",
        marginBottom: 5,
    },
    locationText: {
        color: "#666",
        marginTop: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#EEE'
    },
    cancelText: {
        color: 'red',
        fontSize: 16,
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold'
    }
});