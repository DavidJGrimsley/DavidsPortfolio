import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, View } from "react-native";
import { ThemedText } from "@/components/UI/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";

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
  square: boolean;
};

/**
 * react-native-web's Image can render a different placeholder wrapper between
 * the server response and browser hydration. Web cards use a CSS background on
 * the stable container View instead; native keeps the Image component.
 */
function PieceCardImage({ source, square }: PieceCardImageProps) {
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
  const [hasHydrated, setHasHydrated] = useState(false);
  const canUseHoverState = Platform.OS !== "web" || hasHydrated;
  const showHoveredState = canUseHoverState && isHovered;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const containerClassName = `${showHoveredState ? "bg-accent" : "bg-themed"} rounded-[2%] p-[3%] shadow-md mb-[3%] ${className ?? ""}`;
  const titleClassName = `detail-title leading-tight ${showHoveredState ? "text-white-or-black" : "text-secondary"}`;
  const captionClassName = `detail-body leading-relaxed mt-[1%] ${showHoveredState ? "text-white-or-black" : "text-themed"}`;
  const imageContainerStyle = Platform.OS === "web" && imageSource
    ? {
        ...(squareImage ? { aspectRatio: 1 } : { height: 180 }),
        backgroundImage: `url(${JSON.stringify(imageSource)})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      } as any
    : squareImage ? { aspectRatio: 1 } : undefined;

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
          className={`overflow-hidden rounded-[1.2%] ${showHoveredState ? "bg-themed" : "bg-accent"} mb-[2%]`}
          style={imageContainerStyle}
        >
          {Platform.OS === "web" ? null : <PieceCardImage source={imageSource} square={squareImage} />}
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
