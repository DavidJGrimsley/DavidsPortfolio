import React from "react";
import { ScrollView, View } from "react-native";

import Ionicons from "@/components/UI/HydratedIonicon";
import { ExternalLink } from "@/components/UI/ExternalLink";
import { ThemedText } from "@/components/UI/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

export const QUANTUM_SUPPORT_URL = "https://buymeacoffee.com/davidjgrimsley";
export const QUANTUM_YOUTUBE_PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLKeHno6MnYo8";
export const QUANTUM_AGENT_SKILL_COMMAND =
  "npx skills add -g davidjgrimsley/quantum-api";

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

export function QuantumActionButton({
  href,
  label,
  iconName,
  filled = false,
  className = "",
}: QuantumActionButtonProps) {
  const tintColor = useThemeColor({}, "tint");
  const foregroundColor = filled ? "#fff" : tintColor;

  return (
    <ExternalLink
      href={href}
      className={`rounded-lg px-4 py-3 flex-row items-center justify-center gap-2 border ${className}`}
      style={{
        backgroundColor: filled ? tintColor : "transparent",
        borderColor: filled ? tintColor : withOpacity(tintColor, 0.45),
      }}
    >
      <Ionicons name={iconName} size={18} color={foregroundColor} />
      <ThemedText className="font-bold text-sm text-center" style={{ color: foregroundColor }}>
        {label}
      </ThemedText>
    </ExternalLink>
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
            <ThemedText className="font-bold text-tint mb-1">{link.label}</ThemedText>
            {link.description ? (
              <ThemedText className="text-sm leading-5 opacity-80">{link.description}</ThemedText>
            ) : null}
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
      <QuantumActionButton
        href={QUANTUM_SUPPORT_URL}
        iconName="cafe"
        label="Buy me a coffee"
        filled
      />
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
      <View className="rounded-lg bg-(--color-code-bg) border border-(--color-code-border)">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedText
            selectable
            className="font-noto-sans-mono text-sm md:text-base text-(--color-code-text) leading-6 p-4"
          >
            {QUANTUM_AGENT_SKILL_COMMAND}
          </ThemedText>
        </ScrollView>
      </View>
    </View>
  );
}
