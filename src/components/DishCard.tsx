import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeOut } from "react-native-reanimated";
import { Dish } from "../types/dish";

export default function DishCard({
    item,
    onDelete,
}: {
    item: Dish;
    onDelete: (id: string) => void;
}) {
    const router = useRouter();
    if (!item) return null;

    return (
        <Animated.View exiting={FadeOut}>
            <Swipeable
                renderRightActions={() => (
                    <View
                        style={{
                            backgroundColor: "red",
                            justifyContent: "center",
                            padding: 20,
                            borderRadius: 10,
                        }}
                    />
                )}
                onSwipeableOpen={() => onDelete(item?.id)}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/dish/[id]', params: { id: item.id } } as any)}
                >
                    <View
                        style={{
                            margin: 10,
                            padding: 10,
                            backgroundColor: "#fff",
                            borderRadius: 15,
                        }}
                    >
                        <Image
                            source={{ uri: item.photo_uri || "" }}
                            style={{
                                width: "100%",
                                height: 200,
                                borderRadius: 10,
                            }}
                        />
                        <Text>{item.name}</Text>
                        <Text>{item.city}</Text>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        </Animated.View>
    );
}