import React from "react";
import {
  Animated,
  Platform,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Clipboard from "expo-clipboard";

import Ionicons from "@/components/UI/HydratedIonicon";
import FontAwesome6 from "@/components/UI/HydratedFontAwesome6";
import { ExternalLink } from "@/components/UI/ExternalLink";
import { ThemedText } from "@/components/UI/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

export const QUANTUM_SUPPORT_URL = "https://buymeacoffee.com/davidjgrimsley";
export const QUANTUM_YOUTUBE_PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLKeHno6MnYo8";
export const QUANTUM_AGENT_SKILL_COMMAND =
  "npx skills add -g davidjgrimsley/quantum-api";
export const QUANTUM_SUPPORT_BUTTON_LABEL =
  "Buy me a token - Support this and other projects";

const QUANTUM_TOKEN_GOLD = "#f4b740";

export type QuantumResourceLink = {
  label: string;
  url: string;
  description?: string;
  kind?: string;
};

type QuantumActionButtonProps = {
  href: string;
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  filled?: boolean;
  filledBorderColor?: string;
  className?: string;
};

function withOpacity(hexColor: string, opacity: number) {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 8) return hexColor;
  const alpha = Math.max(0, Math.min(1, opacity));
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function CopyableQuantumCard({
  title,
  textToCopy,
  variant = "accent",
  style,
}: {
  title: string;
  textToCopy: string;
  variant?: "accent" | "code";
  style?: StyleProp<ViewStyle>;
}) {
  const accentColor = useThemeColor({}, "accent");
  const tintColor = useThemeColor({}, "tint");
  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  const [showCopied, setShowCopied] = React.useState(false);
  const isCodeVariant = variant === "code";

  const handleCopy = React.useCallback(async () => {
    try {
      await Clipboard.setStringAsync(textToCopy);
    } catch (error) {
      console.warn("Failed to copy Quantum page value", error);
    }

    fadeAnim.setValue(0);
    setShowCopied(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => {
      setShowCopied(false);
    });
  }, [fadeAnim, textToCopy]);

  const cardStyle: StyleProp<ViewStyle> = [
    isCodeVariant
      ? {
          backgroundColor: "#121212",
          borderColor: "rgba(64, 64, 64, 0.6)",
          borderWidth: 1,
        }
      : {
          backgroundColor: accentColor,
          borderLeftColor: tintColor,
          borderLeftWidth: 4,
        },
    style,
  ];
  const valueColor = isCodeVariant ? "#34d399" : tintColor;
  const iconColor = isCodeVariant ? "#9ca3af" : tintColor;

  return (
    <Pressable
      onPress={handleCopy}
      className="relative overflow-hidden cursor-pointer p-4 rounded-lg h-full justify-between"
      style={cardStyle}
      accessibilityRole="button"
      accessibilityLabel={`Copy ${title}`}
    >
      <ThemedText
        type="defaultSemiBold"
        className={isCodeVariant ? "mb-1.5 text-neutral-300" : "mb-1.5 text-secondary"}
      >
        {title}
      </ThemedText>
      <View className="flex-row items-center justify-between gap-2">
        <ThemedText
          selectable
          className={`font-noto-sans-mono text-xs sm:text-sm break-all flex-1 ${
            isCodeVariant ? "text-emerald-400" : ""
          }`}
          style={{
            color: valueColor,
            fontFamily: Platform.OS === "web" ? "monospace" : undefined,
            flexShrink: 1,
          }}
        >
          {textToCopy}
        </ThemedText>
        <Ionicons name="copy-outline" size={20} color={iconColor} />
      </View>
      {showCopied ? (
        <Animated.View
          pointerEvents="none"
          style={{
            opacity: fadeAnim,
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <ThemedText className="font-bold text-emerald-400 text-sm">
            Copied!
          </ThemedText>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

export function QuantumActionButton({
  href,
  label,
  iconName,
  filled = false,
  filledBorderColor,
  className = "",
}: QuantumActionButtonProps) {
  const tintColor = useThemeColor({}, "tint");
  const foregroundColor = filled ? "#fff" : tintColor;

  return (
    <ExternalLink
      href={href}
      className={`min-h-[52px] rounded-lg px-5 py-3.5 flex-row items-center justify-center gap-3 border ${className}`}
      style={{
        backgroundColor: filled ? tintColor : "transparent",
        borderColor: filled ? filledBorderColor ?? tintColor : tintColor,
      }}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={foregroundColor}
        style={{ marginRight: 10 }}
      />
      <ThemedText
        className="font-bold text-base text-center"
        style={{
          color: foregroundColor,
          flexShrink: 1,
          fontSize: 16,
          lineHeight: 20,
        }}
      >
        {label}
      </ThemedText>
    </ExternalLink>
  );
}

export function QuantumSupportButton({ className = "" }: { className?: string }) {
  return (
    <ExternalLink
      href={QUANTUM_SUPPORT_URL}
      className={`min-h-[52px] rounded-lg border border-neutral-700/60 bg-[#121212] px-5 py-3.5 flex-row items-center justify-center gap-3 ${className}`}
    >
      <FontAwesome6
        name="coins"
        size={20}
        color={QUANTUM_TOKEN_GOLD}
        style={{ marginRight: 10 }}
      />
      <ThemedText
        className="font-bold text-white text-base text-center"
        style={{
          color: "#fff",
          flexShrink: 1,
          fontSize: 16,
          lineHeight: 20,
        }}
      >
        {QUANTUM_SUPPORT_BUTTON_LABEL}
      </ThemedText>
    </ExternalLink>
  );
}

export function QuantumApiActionGrid({
  baseUrl,
  docsUrl,
}: {
  baseUrl: string;
  docsUrl?: string;
}) {
  return (
    <View className="mb-7.5 gap-3">
      <View className="gap-3 lg:flex-row">
        <View className="flex-1">
          <CopyableQuantumCard title="Base URL" textToCopy={baseUrl} />
        </View>
        <View className="flex-1">
          <CopyableQuantumCard
            title="Agent Skill"
            textToCopy={QUANTUM_AGENT_SKILL_COMMAND}
            variant="code"
          />
        </View>
      </View>
      <View className="gap-3 lg:flex-row">
        {docsUrl ? (
          <View className="flex-1">
            <QuantumActionButton
              href={docsUrl}
              iconName="document-text"
              label="View Interactive API Docs (Swagger UI)"
              filled
              className="h-full"
            />
          </View>
        ) : null}
        <View className="flex-1">
          <QuantumSupportButton className="h-full" />
        </View>
      </View>
    </View>
  );
}

export function QuantumResourceLinks({ links }: { links?: readonly QuantumResourceLink[] }) {
  const accentColor = useThemeColor({}, "accent");
  const tintColor = useThemeColor({}, "tint");

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <View
      className="rounded-lg border p-4 gap-3"
      style={{
        backgroundColor: withOpacity(accentColor, 0.55),
        borderColor: withOpacity(tintColor, 0.35),
      }}
    >
      <ThemedText type="defaultSemiBold" className="text-tint">
        Downloads, source, and demos
      </ThemedText>
      <View className="gap-3 md:flex-row md:flex-wrap">
        {links.map((link) => (
          <ExternalLink
            key={`${link.kind ?? "link"}:${link.url}`}
            href={link.url}
            className="rounded-lg border p-3 md:w-[31%]"
            style={{ borderColor: withOpacity(tintColor, 0.4) }}
          >
            <View className="gap-1">
              <ThemedText className="font-bold text-tint">{link.label}</ThemedText>
              {link.description ? (
                <ThemedText className="text-sm leading-5 opacity-80">{link.description}</ThemedText>
              ) : null}
            </View>
          </ExternalLink>
        ))}
      </View>
    </View>
  );
}

export function QuantumSupportCard() {
  const accentColor = useThemeColor({}, "accent");
  const tintColor = useThemeColor({}, "tint");

  return (
    <View
      className="rounded-lg border p-4 gap-3"
      style={{
        backgroundColor: withOpacity(accentColor, 0.62),
        borderColor: withOpacity(tintColor, 0.4),
      }}
    >
      <View className="flex-row gap-3">
        <View
          className="h-11 w-11 rounded-lg items-center justify-center"
          style={{ backgroundColor: withOpacity(tintColor, 0.18) }}
        >
          <Ionicons name="heart" size={22} color={tintColor} />
        </View>
        <View className="flex-1 gap-1">
          <ThemedText type="defaultSemiBold" className="text-tint">
            Support the Quantum API work
          </ThemedText>
          <ThemedText className="text-sm md:text-base leading-6 opacity-85">
            These guides, SDKs, plugins, and demos take real testing time across engines and package ecosystems.
          </ThemedText>
        </View>
      </View>
      <QuantumSupportButton />
    </View>
  );
}

export function QuantumAgentSkillInstallCard() {
  const accentColor = useThemeColor({}, "accent");
  const tintColor = useThemeColor({}, "tint");

  return (
    <View
      className="rounded-lg border p-4 gap-3"
      style={{
        backgroundColor: withOpacity(accentColor, 0.62),
        borderColor: withOpacity(tintColor, 0.4),
      }}
    >
      <View className="flex-row gap-3">
        <View
          className="h-11 w-11 rounded-lg items-center justify-center"
          style={{ backgroundColor: withOpacity(tintColor, 0.18) }}
        >
          <Ionicons name="sparkles" size={22} color={tintColor} />
        </View>
        <View className="flex-1 gap-1">
          <ThemedText type="defaultSemiBold" className="text-tint">
            Install the Quantum API skill
          </ThemedText>
          <ThemedText className="text-sm md:text-base leading-6 opacity-85">
            Add the agent skill when you want coding assistants to find the Quantum API guides and integration notes quickly.
          </ThemedText>
        </View>
      </View>
      <CopyableQuantumCard
        title="Agent Skill"
        textToCopy={QUANTUM_AGENT_SKILL_COMMAND}
        variant="code"
      />
    </View>
  );
}
