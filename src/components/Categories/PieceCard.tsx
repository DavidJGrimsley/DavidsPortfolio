import React, { useMemo, useState } from "react";
import { Image, Pressable, Text, View, useColorScheme } from "react-native";

type PieceCardProps = {
  title: string;
  caption?: string;
  imageSource?: string;
  badgeText?: string;
  onPress: () => void;
  squareImage?: boolean;
  maxWidth?: number;
  className?: string;
};

export function PieceCard({
  title,
  caption,
  imageSource,
  badgeText,
  onPress,
  squareImage = false,
  maxWidth,
  className,
}: PieceCardProps) {
  const colorScheme = useColorScheme();
  const [isHovered, setIsHovered] = useState(false);

  // Keep this simple and predictable: tint-colored shadow.
  const shadowTint = useMemo(
    () => (colorScheme === "dark" ? "#EEA444" : "#0E668B"),
    [colorScheme]
  );

  const containerClassName = `${isHovered ? "bg-accent" : "bg-themed"} rounded-[2%] p-[3%] shadow-md mb-[3%] ${className ?? ""}`;
  const titleClassName = `detail-title ${isHovered ? "text-white-or-black" : "text-themed"}`;
  const captionClassName = `detail-body mt-[1%] ${isHovered ? "text-white-or-black" : "text-secondary"}`;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className={containerClassName}
      style={({ pressed }) => [
        {
          maxWidth,
          marginBottom: 16,
          shadowColor: shadowTint,
          shadowOpacity: 0.22,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          transform: pressed ? [{ scale: 0.99 }] : undefined,
        },
      ]}
    >
      {imageSource ? (
        <View
          className={`overflow-hidden rounded-[1.2%] ${isHovered ? "bg-themed" : "bg-accent"} mb-[2%]`}
          style={squareImage ? { aspectRatio: 1 } : undefined}
        >
          <Image
            source={{ uri: imageSource }}
            className={squareImage ? "w-full h-full" : "w-full"}
            style={squareImage ? undefined : { height: 180 }}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {badgeText ? (
        <View className="self-start bg-tint px-[2%] py-[1%] rounded-[0.8%] mb-[1%]">
          <Text className="text-white-or-black text-xs font-semibold">{badgeText}</Text>
        </View>
      ) : null}

      <Text className={titleClassName}>{title}</Text>
      {caption ? <Text className={captionClassName}>{caption}</Text> : null}
    </Pressable>
  );
}
