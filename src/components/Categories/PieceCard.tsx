import React, { useState } from "react";
import { Image, Platform, Pressable, View, useColorScheme } from "react-native";
import { ThemedText } from "@/components/UI/ThemedText";

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

type PieceCardImageProps = {
  source: string;
  title: string;
  square: boolean;
};

/**
 * react-native-web's Image initially renders a placeholder wrapper on the
 * server, then can swap it for a loaded image before hydration in the browser.
 * A native img element is stable across that server/client boundary.
 */
function PieceCardImage({ source, title, square }: PieceCardImageProps) {
  if (Platform.OS === "web") {
    return (
      <img
        src={source}
        alt={title}
        style={{
          display: "block",
          width: "100%",
          height: square ? "100%" : 180,
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <Image
      source={{ uri: source }}
      className={square ? "w-full h-full" : "w-full"}
      style={square ? undefined : { height: 180 }}
      resizeMode="cover"
    />
  );
}

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

  const containerClassName = `${isHovered ? "bg-accent" : "bg-themed"} rounded-[2%] p-[3%] shadow-md mb-[3%] ${className ?? ""}`;
  const titleClassName = `detail-title leading-tight ${isHovered ? "text-white-or-black" : "text-secondary"}`;
  const captionClassName = `detail-body leading-relaxed mt-[1%] ${isHovered ? "text-white-or-black" : "text-themed"}`;

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
          shadowColor: colorScheme === "dark" ? "#EEA444" : "#0E668B",
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
          <PieceCardImage source={imageSource} title={title} square={squareImage} />
        </View>
      ) : null}

      {badgeText ? (
        <View className="self-start bg-tint px-[2%] py-[1%] rounded-[0.8%] mb-[1%]">
          <ThemedText inverse className="badge-text">{badgeText}</ThemedText>
        </View>
      ) : null}

      <ThemedText className={titleClassName}>{title}</ThemedText>
      {caption ? <ThemedText className={captionClassName}>{caption}</ThemedText> : null}
    </Pressable>
  );
}
