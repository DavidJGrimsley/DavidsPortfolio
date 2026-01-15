/**
 * VerticalTabBar - Web Desktop Dock-Style Vertical Navigation
 * 
 * @EXTRACT: This component is designed to be extracted as an Expo Router module.
 * Key extraction points are marked with @EXTRACT comments.
 * 
 * Features:
 * - Apple dock-style proximity scaling animations
 * - Expandable sub-menus with fade-in messages
 * - Collapsed mode for nested pages with overlay
 * - Configurable menu structure via props
 * 
 * Future contribution target: expo-router/web-tabs or expo-router/vertical-tabs
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSegments, useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

// =============================================================================
// TYPES
// @EXTRACT: Export these types for consumers of the npm package
// =============================================================================

type IconName = keyof typeof Ionicons.glyphMap;

export interface TabItem {
  name: string;
  route: string;
  icon: IconName;
  iconOutline: IconName;
  label: string;
}

export interface TabGroup {
  name: string;
  icon: IconName;
  iconOutline: IconName;
  label: string;
  expansionMessage?: string;
  items: TabItem[];
}

export type TabConfig = TabItem | TabGroup;

export interface VerticalTabBarProps {
  /** 
   * @EXTRACT: This is the main configuration prop.
   * When publishing to npm, this should be the primary way to configure tabs.
   */
  tabs?: TabConfig[];
  /** Active icon color */
  activeColor?: string;
  /** Inactive icon color */
  inactiveColor?: string;
  /** Size of main icons */
  iconSize?: number;
  /** Callback when tab is pressed */
  onTabPress?: (route: string) => void;
}

// =============================================================================
// DEFAULT TAB CONFIGURATION
// @EXTRACT: When extracting, make this required via props instead of defaulting
// 
// Structure mirrors folder layout in src/app/(tabs)/
// ├── index.tsx                    → Home
// ├── portfolio/                   → Portfolio group
// │   ├── mobile-apps/
// │   ├── website-development/
// │   ├── game-design/
// │   └── software-development/
// ├── public-facing/               → Public Facing group
// │   ├── api/
// │   ├── mcp/
// │   └── production/
// ├── services/                    → Services standalone
// │   ├── learn/
// │   └── survey.tsx
// └── contact.tsx                  → Contact standalone
// =============================================================================

const DEFAULT_TABS: TabConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Home - standalone (matches: src/app/(tabs)/index.tsx)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'home',
    route: '/(tabs)',
    icon: 'home',
    iconOutline: 'home-outline',
    label: 'Home',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Portfolio group (matches: src/app/(tabs)/portfolio/)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'portfolio',
    icon: 'briefcase',
    iconOutline: 'briefcase-outline',
    label: 'Portfolio',
    expansionMessage: 'These practice and production projects have extensive information on how they were built.',
    items: [
      // portfolio/mobile-apps/
      { name: 'mobile-apps', route: '/(tabs)/portfolio/mobile-apps', icon: 'phone-portrait', iconOutline: 'phone-portrait-outline', label: 'Mobile Apps' },
      // portfolio/website-development/
      { name: 'website-development', route: '/(tabs)/portfolio/website-development', icon: 'globe', iconOutline: 'globe-outline', label: 'Web Dev' },
      // portfolio/game-design/
      { name: 'game-design', route: '/(tabs)/portfolio/game-design', icon: 'game-controller', iconOutline: 'game-controller-outline', label: 'Game Design' },
      // portfolio/software-development/
      { name: 'software-development', route: '/(tabs)/portfolio/software-development', icon: 'server', iconOutline: 'server-outline', label: 'Other Software' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Public Facing group (matches: src/app/(tabs)/public-facing/)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'public-facing',
    icon: 'cloud',
    iconOutline: 'cloud-outline',
    label: 'Public Facing',
    expansionMessage: 'APIs and MCP servers available for public use.',
    items: [
      // public-facing/api/
      { name: 'api', route: '/(tabs)/public-facing/api', icon: 'code-slash', iconOutline: 'code-slash-outline', label: 'API' },
      // public-facing/mcp/
      { name: 'mcp', route: '/(tabs)/public-facing/mcp', icon: 'git-network', iconOutline: 'git-network-outline', label: 'MCP' },
      // public-facing/production/
      { name: 'production', route: '/(tabs)/public-facing/production', icon: 'rocket', iconOutline: 'rocket-outline', label: 'Production' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Services - standalone (matches: src/app/(tabs)/services/)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'services',
    route: '/(tabs)/services',
    icon: 'construct',
    iconOutline: 'construct-outline',
    label: 'Services',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Contact - standalone (matches: src/app/(tabs)/contact.tsx)
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'contact',
    route: '/(tabs)/contact',
    icon: 'person',
    iconOutline: 'person-outline',
    label: 'Contact',
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isTabGroup(tab: TabConfig): tab is TabGroup {
  return 'items' in tab && Array.isArray(tab.items);
}

function getActiveRoute(segments: string[]): string {
  if (segments.length === 0) return '/(tabs)';
  if (segments.length === 1 && segments[0] === '(tabs)') return '/(tabs)';
  return '/' + segments.join('/');
}

function isRouteActive(currentRoute: string, tabRoute: string): boolean {
  const normalized = currentRoute.replace(/\/$/, '');
  const tabNormalized = tabRoute.replace(/\/$/, '');
  
  // Home route should only match exactly
  if (tabNormalized === '/(tabs)') {
    return normalized === '/(tabs)' || normalized === '';
  }
  
  return normalized === tabNormalized || normalized.startsWith(tabNormalized + '/');
}

function isNestedPage(segments: string[]): boolean {
  // Filter out route groups like (tabs)
  const nonGroupSegments = segments.filter(s => !s.startsWith('('));
  
  // With folder structure like /portfolio/mobile-apps/[title]:
  // - portfolio/mobile-apps = 2 segments = main page (show full pill)
  // - portfolio/mobile-apps/[title] = 3+ segments or has dynamic route = detail page (collapse)
  const hasDynamicRoute = segments.some(s => s.includes('['));
  
  return nonGroupSegments.length >= 3 || hasDynamicRoute;
}

// =============================================================================
// STYLES - Using inline styles for React Native Web compatibility
// =============================================================================

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 25,
    borderRadius: 9999,
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
    gap: 12,
    minWidth: 110,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    // Color is now applied dynamically via textColor prop
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  subMenu: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    paddingTop: 8,
  },
  subItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginVertical: 8,
  },
  expansionMessage: {
    padding: 28,
    maxWidth: 620,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    // Color is now applied dynamically via textColor prop
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  collapsedToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Scale values for dock effect
const SCALE_VALUES = {
  'scale-1': 1,
  'scale-2': 1.2,
  'scale-3': 1.4,
  'scale-4': 1.6,
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface VertTabItemProps {
  tab: TabItem;
  isActive: boolean;
  isSubItem?: boolean;
  showLabel?: boolean;
  scaleClass: keyof typeof SCALE_VALUES;
  activeColor: string;
  inactiveColor: string;
  textColor: string;
  accentColor: string;
  iconSize: number;       // base size (for sub-items)
  mainIconSize: number;   // enlarged size for top-level items
  onPress: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const VertTabItem: React.FC<VertTabItemProps> = ({
  tab,
  isActive,
  isSubItem = false,
  showLabel = false,
  scaleClass,
  activeColor,
  inactiveColor,
  textColor,
  accentColor,
  iconSize,
  mainIconSize,
  onPress,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const shouldShowLabel = showLabel || isHovered || isActive;
  const scale = SCALE_VALUES[scaleClass];

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onMouseLeave?.();
  }, [onMouseLeave]);

  // @EXTRACT: Web-specific inline styles with transitions
  const webItemStyle = Platform.OS === 'web' ? {
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  } : {};

  const webIconStyle = Platform.OS === 'web' ? {
    transform: `scale(${isSubItem ? scale * 0.85 : scale})`,
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  } : {};

  const webLabelStyle = Platform.OS === 'web' ? {
    transition: 'opacity 0.2s ease, max-height 0.25s ease',
    maxHeight: shouldShowLabel ? 50 : 0,
    opacity: shouldShowLabel ? 1 : 0,
    overflow: 'hidden',
    wordWrap: 'break-word',
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 88,
    width: 'auto',
  } : {};

  return (
    <Pressable
      onPress={onPress}
      // @ts-ignore - web-only events
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={[
        styles.tabItem,
        isActive && { backgroundColor: accentColor },
        isSubItem && styles.subItem,
        isHovered && !isActive && { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        webItemStyle as any,
      ]}
    >
      <View style={[styles.iconWrapper, webIconStyle as any]}>
        <Ionicons
          name={isActive ? tab.icon : tab.iconOutline}
          size={isSubItem ? iconSize * 0.85 : mainIconSize}
          color={isActive ? activeColor : inactiveColor}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { opacity: shouldShowLabel ? 1 : 0, color: textColor },
          webLabelStyle as any,
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
};

interface VertTabGroupProps {
  group: TabGroup;
  isExpanded: boolean;
  activeRoute: string;
  scaleClass: keyof typeof SCALE_VALUES;
  activeColor: string;
  inactiveColor: string;
  textColor: string;
  whiteOrBlackColor: string;
  overlayTextColor: string;
  accentColor: string;
  iconSize: number;       // base size for sub-items
  mainIconSize: number;   // enlarged size for group icon
  onToggle: () => void;
  onItemPress: (route: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const VertTabGroup: React.FC<VertTabGroupProps> = ({
  group,
  isExpanded,
  activeRoute,
  scaleClass,
  activeColor,
  inactiveColor,
  textColor,
  whiteOrBlackColor,
  overlayTextColor,
  accentColor,
  iconSize,
  mainIconSize,
  onToggle,
  onItemPress,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasActiveChild = group.items.some(item => isRouteActive(activeRoute, item.route));
  
  // Submenu shows when manually expanded OR when user is on a child page
  const shouldShowSubMenu = isExpanded || hasActiveChild;
  // Message only shows when manually expanded, NOT when auto-expanded due to active child
  const shouldShowMessage = isExpanded && !hasActiveChild;
  // Keep label visible when expanded, hovered, or has active child
  const shouldShowLabel = isExpanded || isHovered || hasActiveChild;
  const scale = SCALE_VALUES[scaleClass];

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onMouseEnter?.();
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onMouseLeave?.();
  }, [onMouseLeave]);

  // Web-specific styles
  const webItemStyle = Platform.OS === 'web' ? {
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  } : {};

  const webIconStyle = Platform.OS === 'web' ? {
    transform: `scale(${scale})`,
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  } : {};

  const webLabelStyle = Platform.OS === 'web' ? {
    transition: 'opacity 0.2s ease, max-height 0.25s ease',
    maxHeight: shouldShowLabel ? 50 : 0,
    opacity: shouldShowLabel ? 1 : 0,
    overflow: 'hidden',
    wordWrap: 'break-word',
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 88,
    width: 'auto',
  } : {};

  const webSubMenuStyle = Platform.OS === 'web' ? {
    transition: 'max-height 0.3s ease, opacity 0.2s ease',
    maxHeight: shouldShowSubMenu ? 400 : 0,
    opacity: shouldShowSubMenu ? 1 : 0,
  } : { maxHeight: shouldShowSubMenu ? 400 : 0, opacity: shouldShowSubMenu ? 1 : 0 };

  const webMessageStyle = Platform.OS === 'web' ? {
    position: 'absolute',
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: 12,
    transition: 'opacity 0.4s ease 0.1s',
    opacity: shouldShowMessage ? 1 : 0,
    pointerEvents: 'none',
    textAlign: 'right',
    width: '60vw',
    maxWidth: 620,
  } : { opacity: shouldShowMessage ? 1 : 0 };

  // Only render the active child when not expanded so the dock looks collapsed
  const visibleItems = isExpanded
    ? group.items
    : group.items.filter(item => isRouteActive(activeRoute, item.route));

  return (
    <View>
      <Pressable
        onPress={onToggle}
        // @ts-ignore - web-only events
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={[
          styles.tabItem,
          (hasActiveChild && !shouldShowSubMenu) && { backgroundColor: accentColor },
          isHovered && !(hasActiveChild && !shouldShowSubMenu) && { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          webItemStyle as any,
        ]}
      >
        {/* Expansion message */}
        {group.expansionMessage && (
          <Text
            style={[
              styles.expansionMessage,
              { color: overlayTextColor },
              webMessageStyle as any,
            ]}
          >
            {group.expansionMessage}
          </Text>
        )}
        
        <View style={[styles.iconWrapper, webIconStyle as any]}>
          <Ionicons
            name={hasActiveChild || isExpanded ? group.icon : group.iconOutline}
            size={mainIconSize}
            color={hasActiveChild ? activeColor : inactiveColor}
          />
        </View>
        
        <Text
          style={[
            styles.tabLabel,
            { opacity: shouldShowLabel ? 1 : 0, color: textColor },
            webLabelStyle as any,
          ]}
        >
          {group.label}
        </Text>
      </Pressable>

      {/* Sub-menu items */}
      <View style={[styles.subMenu, webSubMenuStyle as any]}>
        {visibleItems.map((item) => (
          <VertTabItem
            key={item.name}
            tab={item}
            isActive={isRouteActive(activeRoute, item.route)}
            isSubItem
            showLabel={isExpanded || isRouteActive(activeRoute, item.route)}
            scaleClass="scale-1"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            textColor={textColor}
            accentColor={accentColor}
            iconSize={iconSize}
            mainIconSize={mainIconSize}
            onPress={() => onItemPress(item.route)}
          />
        ))}
      </View>
    </View>
  );
};

interface CollapsedToggleProps {
  onToggle: () => void;
  accentColor: string;
  iconColor: string;
}

const CollapsedToggle: React.FC<CollapsedToggleProps> = ({ onToggle, accentColor, iconColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Outer wrapper for larger hit area
  const webWrapperStyle = Platform.OS === 'web' ? {
    position: 'fixed',
    top: 8,
    right: 8,
    zIndex: 101,
    cursor: 'pointer',
    padding: 12,
  } : {};

  const webButtonStyle = Platform.OS === 'web' ? {
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
    boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
  } : {};

  return (
    <Pressable
      onPress={onToggle}
      // @ts-ignore - web-only events
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[webWrapperStyle as any]}
    >
      <View
        style={[
          styles.collapsedToggle,
          { backgroundColor: accentColor },
          webButtonStyle as any,
        ]}
      >
        <Ionicons name="chevron-down" size={28} color={iconColor} />
      </View>
    </Pressable>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const VerticalTabBar: React.FC<VerticalTabBarProps> = ({
  tabs = DEFAULT_TABS,
  activeColor: propActiveColor,
  inactiveColor: propInactiveColor,
  iconSize = 24,
  onTabPress,
}) => {
  const { width } = useWindowDimensions();
  const forceCollapsed = width < 768;
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  
  // Theme colors - matching CSS variables in global.css
  const activeColor = propActiveColor ?? (colorScheme === 'light' ? '#0E668B' : '#EEA444');
  const inactiveColor = propInactiveColor ?? (colorScheme === 'light' ? '#723B80' : '#9BA1A6');
  const accentColor = colorScheme === 'light' ? '#723B80' : '#321E3B';
  const textColor = colorScheme === 'light' ? '#11181C' : '#F8F8F8';
  const whiteOrBlackColor = colorScheme === 'light' ? '#F8F8F8' : '#11181C'; // inverse of text
  const overlayTextColor = '#F8F8F8'; // always light for dark overlay
  const secondaryColor = colorScheme === 'light' ? '#A2DDF6' : '#A96710';
  const topLevelIconSize = iconSize * 1.7; // unified size for top-level (home + groups)

  // State
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Derived state
  const activeRoute = useMemo(() => getActiveRoute(segments as string[]), [segments]);
  const isNested = useMemo(() => isNestedPage(segments as string[]), [segments]);

  // Auto-collapse on nested pages
  useEffect(() => {
    if (forceCollapsed) {
      setIsCollapsed(true);
      setShowOverlay(false);
      return;
    }

    setIsCollapsed(isNested);
    if (!isNested) {
      setShowOverlay(false);
    }
  }, [forceCollapsed, isNested]);

  // Close expanded group when route changes
  useEffect(() => {
    setExpandedGroup(null);
  }, [activeRoute]);

  // Handlers
  const handleTabPress = useCallback((route: string) => {
    // Close any expanded group when navigating
    setExpandedGroup(null);
    
    if (onTabPress) {
      onTabPress(route);
    } else {
      if (isRouteActive(activeRoute, route)) {
        router.replace(route as Href);
      } else {
        router.push(route as Href);
      }
    }
    if (showOverlay) {
      setShowOverlay(false);
      setIsCollapsed(true);
    }
  }, [activeRoute, router, onTabPress, showOverlay]);

  const handleGroupToggle = useCallback((groupName: string) => {
    setExpandedGroup(prev => prev === groupName ? null : groupName);
  }, []);

  const handleCollapsedToggle = useCallback(() => {
    if (isCollapsed) {
      setShowOverlay(true);
      setTimeout(() => setIsCollapsed(false), 50);
    } else {
      setIsCollapsed(true);
      setShowOverlay(false);
    }
  }, [isCollapsed]);

  // handleOverlayPress moved to handleOverlayPressWithMessage in render section

  const getScaleClass = useCallback((index: number): keyof typeof SCALE_VALUES => {
    if (hoveredIndex === null) return 'scale-1';
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 'scale-4';
    if (distance === 1) return 'scale-3';
    if (distance === 2) return 'scale-2';
    return 'scale-1';
  }, [hoveredIndex]);

  // Compute if any group is showing expansion message (manually expanded, not via active child)
  const hasExpandedGroupWithMessage = useMemo(() => {
    if (!expandedGroup) return false;
    const group = tabs.find(t => isTabGroup(t) && t.name === expandedGroup) as TabGroup | undefined;
    if (!group) return false;
    const hasActiveChild = group.items.some(item => isRouteActive(activeRoute, item.route));
    return !hasActiveChild; // Message shows only when no active child
  }, [expandedGroup, tabs, activeRoute]);

  const handleOverlayPressWithMessage = useCallback(() => {
    // Close expanded group if that's why overlay is showing
    if (hasExpandedGroupWithMessage) {
      setExpandedGroup(null);
    }
    // Also handle nested page collapse
    if (showOverlay) {
      setIsCollapsed(true);
      setShowOverlay(false);
    }
  }, [hasExpandedGroupWithMessage, showOverlay]);

  // Don't render on non-web platforms
  if (Platform.OS !== 'web') {
    return null;
  }

  const shouldShowPill = !isCollapsed || showOverlay;

  // Web-specific pill positioning
  const webPillStyle = {
    position: 'fixed',
    right: '2%',
    top: '50%',
    transform: isCollapsed && !showOverlay 
      ? 'translateY(-50%) translateX(120%)' 
      : 'translateY(-50%)',
    opacity: isCollapsed && !showOverlay ? 0 : 1,
    zIndex: 100,
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
    borderRadius: 9999,
    paddingTop: 40,
    paddingBottom: 40,
    minWidth: 110,
  };

  // Single overlay: show when nested page overlay OR when expansion message is visible
  const shouldShowOverlay = showOverlay || hasExpandedGroupWithMessage;

  const webOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    opacity: shouldShowOverlay ? 1 : 0,
    pointerEvents: shouldShowOverlay ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  return (
    <>
      {/* Single overlay for both nested expansion and expansion messages */}
      <Pressable
        onPress={handleOverlayPressWithMessage}
        style={[styles.overlay, webOverlayStyle as any]}
      />

      {/* Collapsed toggle for nested pages or small screens */}
      {(isCollapsed && !showOverlay && (isNested || forceCollapsed)) && (
        <CollapsedToggle
          onToggle={handleCollapsedToggle}
          accentColor={accentColor}
          iconColor={secondaryColor}
        />
      )}

      {/* Main tab bar pill */}
      {shouldShowPill && (
        <View style={[styles.pill, webPillStyle as any]}>
          {tabs.map((tab, index) => {
            if (isTabGroup(tab)) {
              return (
                <React.Fragment key={tab.name}>
                  {index > 0 && <View style={styles.divider} />}
                  <VertTabGroup
                    group={tab}
                    isExpanded={expandedGroup === tab.name}
                    activeRoute={activeRoute}
                    scaleClass={getScaleClass(index)}
                    activeColor={activeColor}
                    inactiveColor={inactiveColor}
                    textColor={textColor}
                    whiteOrBlackColor={whiteOrBlackColor}
                    overlayTextColor={overlayTextColor}
                    accentColor={accentColor}
                    iconSize={iconSize}
                    mainIconSize={topLevelIconSize}
                    onToggle={() => handleGroupToggle(tab.name)}
                    onItemPress={handleTabPress}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={tab.name}>
                {index > 0 && <View style={styles.divider} />}
                <VertTabItem
                  tab={tab}
                  isActive={isRouteActive(activeRoute, tab.route)}
                  scaleClass={getScaleClass(index)}
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                  textColor={textColor}
                  accentColor={accentColor}
                  iconSize={iconSize}
                  mainIconSize={topLevelIconSize}
                  onPress={() => handleTabPress(tab.route)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </React.Fragment>
            );
          })}
        </View>
      )}
    </>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default VerticalTabBar;

/**
 * @EXTRACT: Placeholder for mobile web variant
 * 
 * MobileWebTabBar would be a bottom sheet or drawer-style navigation
 * optimized for touch interactions on smaller screens.
 */
