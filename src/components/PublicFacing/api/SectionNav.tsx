import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, type Href } from "expo-router";
import { Nav } from "@expo/html-elements";
import Ionicons from "@/components/UI/HydratedIonicon";
import { ThemedText } from "@/components/UI/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useReducedMotion,
} from "react-native-reanimated";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SectionNavItem = { id: string; label: string };

const SectionTargetContext = createContext<((id: string) => (view: View | null) => void) | null>(null);

export function SectionNavTargets({ registerTarget, children }: { registerTarget: (id: string) => (view: View | null) => void; children: React.ReactNode }) {
  return <SectionTargetContext.Provider value={registerTarget}>{children}</SectionTargetContext.Provider>;
}

export function useSectionTarget(id: string) {
  const register = useContext(SectionTargetContext);
  return register?.(id);
}

export function useSectionNav() {
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const inlineRef = useRef<View>(null);
  const targetsRef = useRef<Record<string, View | null>>({});
  const scrollYRef = useRef(0);
  const measuringRef = useRef(false);
  const pendingSelectionRef = useRef(false);
  const [isPast, setIsPast] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const measureInline = useCallback(() => {
    if (measuringRef.current) return;
    measuringRef.current = true;
    inlineRef.current?.measureInWindow((_x, y, _width, height) => {
      viewportRef.current?.measureInWindow((_sx, scrollTop) => {
        const past = y + height <= scrollTop + 8;
        if (past) pendingSelectionRef.current = false;
        if (past || !pendingSelectionRef.current) {
          setIsPast(past);
          if (!past) setIsOpen(false);
        }
        measuringRef.current = false;
      });
    });
    // A measurement is not possible until both views have mounted.
    if (!inlineRef.current || !viewportRef.current) measuringRef.current = false;
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
    measureInline();
  }, [measureInline]);

  const registerTarget = useCallback((id: string) => (view: View | null) => {
    targetsRef.current[id] = view;
  }, []);

  const navigateTo = useCallback((id: string) => {
    pendingSelectionRef.current = !isPast;
    setIsPast(true);
    setIsOpen(false);

    if (Platform.OS === "web") {
      if (typeof document !== "undefined") {
        document.getElementById(id)?.scrollIntoView({
          behavior: reduceMotion ? "instant" : "smooth",
          block: "start",
        });
      }
      return;
    }

    const target = targetsRef.current[id];
    target?.measureInWindow((_x, targetY) => {
      viewportRef.current?.measureInWindow((_sx, scrollTop) => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollYRef.current + targetY - scrollTop),
          animated: !reduceMotion,
        });
      });
    });
  }, [isPast, reduceMotion]);

  useEffect(() => {
    const frame = requestAnimationFrame(measureInline);
    return () => cancelAnimationFrame(frame);
  }, [measureInline]);

  return {
    scrollRef,
    viewportRef,
    inlineRef,
    onScroll,
    measureInline,
    registerTarget,
    controller: { isPast, isOpen, setIsOpen, navigateTo, reduceMotion },
  };
}

export type SectionNavController = ReturnType<typeof useSectionNav>["controller"];

function SectionLinks({
  items,
  routePath,
  onNavigate,
  floating,
}: {
  items: SectionNavItem[];
  routePath: string;
  onNavigate: (id: string) => void;
  floating: boolean;
}) {
  return (
    <Nav accessibilityLabel="Section navigation" style={{ flexDirection: floating ? "column" : "row", flexWrap: floating ? "nowrap" : "wrap", gap: 8 }}>
      {items.map(({ id, label }) => {
        const content = <ThemedText style={{ color: "#fff", fontSize: 15 }}>{label}</ThemedText>;
        const style = {
          minHeight: 44,
          justifyContent: "center" as const,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.55)",
          borderRadius: 7,
          paddingHorizontal: 12,
          paddingVertical: 8,
        };
        if (Platform.OS === "web") {
          return (
            <Link
              key={id}
              href={`${routePath}#${id}` as Href}
              onPress={() => onNavigate(id)}
              style={style}
            >
              {content}
            </Link>
          );
        }
        return (
          <Pressable key={id} accessibilityRole="link" onPress={() => onNavigate(id)} style={style}>
            {content}
          </Pressable>
        );
      })}
    </Nav>
  );
}

export function SectionNav({
  items,
  routePath,
  controller,
  inlineRef,
  measureInline,
}: {
  items: SectionNavItem[];
  routePath: string;
  controller: SectionNavController;
  inlineRef: React.Ref<View>;
  measureInline: () => void;
}) {
  const accentColor = useThemeColor({}, "accent");
  if (items.length === 0) return null;

  return (
    <View
      ref={inlineRef}
      onLayout={measureInline}
      style={{ marginBottom: 30, padding: 16, borderWidth: 1, borderColor: "#fff", borderRadius: 10, backgroundColor: accentColor }}
    >
      <SectionLinks items={items} routePath={routePath} onNavigate={controller.navigateTo} floating={false} />
    </View>
  );
}

export function FloatingSectionNav({
  items,
  routePath,
  controller,
}: {
  items: SectionNavItem[];
  routePath: string;
  controller: SectionNavController;
}) {
  const accentColor = useThemeColor({}, "accent");
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const containerRef = useRef<View>(null);
  const { isOpen, setIsOpen } = controller;

  useEffect(() => {
    if (!isOpen || Platform.OS !== "web" || typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const element = containerRef.current as unknown as HTMLElement | null;
      if (element && !element.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, setIsOpen]);

  if (!controller.isPast || items.length === 0) return null;

  const webEvents = Platform.OS === "web" ? {
    onMouseEnter: () => setIsOpen(true),
    onMouseLeave: () => setIsOpen(false),
    onBlurCapture: () => requestAnimationFrame(() => {
      const element = containerRef.current as unknown as HTMLElement | null;
      if (typeof document !== "undefined" && !element?.contains(document.activeElement)) setIsOpen(false);
    }),
  } : {};

  return (
    <View
      ref={containerRef}
      {...webEvents}
      style={{
        position: Platform.OS === "web" ? "fixed" as "absolute" : "absolute",
        top: Platform.OS === "web" ? 20 : insets.top + 20,
        left: 20,
        zIndex: 103,
        alignItems: "flex-start",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Section navigation"
        accessibilityState={{ expanded: controller.isOpen }}
        onFocus={() => setIsOpen(true)}
        onPress={() => setIsOpen(Platform.OS === "web" ? true : !isOpen)}
        style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#fff", borderRadius: 10, backgroundColor: accentColor }}
      >
        <Ionicons name={controller.isOpen ? "chevron-up" : "chevron-down"} size={23} color="#fff" />
      </Pressable>
      {controller.isOpen ? (
        <Animated.View
          entering={controller.reduceMotion ? FadeIn.duration(120) : FadeInDown.duration(180)}
          exiting={controller.reduceMotion ? FadeOut.duration(100) : FadeOutUp.duration(150)}
          style={{ width: Math.min(360, width - 40), maxHeight: Math.max(160, height - insets.top - 92), borderWidth: 1, borderColor: "#fff", borderRadius: 10, backgroundColor: accentColor, marginTop: 4, padding: 8 }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator style={{ maxHeight: Math.max(144, height - insets.top - 108) }}>
            <SectionLinks items={items} routePath={routePath} onNavigate={controller.navigateTo} floating />
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}
