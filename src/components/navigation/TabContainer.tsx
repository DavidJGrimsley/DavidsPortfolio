/**
 * Layout wrapper for tab-based navigation content.
 *
 * Renders children in a horizontal row and reserves a trailing spacer column
 * (10% width) to account for additional UI (e.g., tab rail, inset padding, or
 * overlay controls).
 *
 * @param props.children - The tab content to render within the container.
 *
 * @remarks
 * Export style:
 * - `export default TabContainer` is fine for single-component modules, but it
 *   makes automated refactors and symbol-based imports slightly harder because
 *   the import name is not enforced.
 * - Prefer **named exports** (`export const TabContainer = ...`) in most
 *   codebases for consistent imports, easier tooling support, and simpler
 *   large-scale refactors. If you switch to named exports, update imports
 *   accordingly.
 */
import React, { useEffect, useMemo } from 'react'
import { Platform, View, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { TitleOfPage } from '@/components/Categories/TitleOfPage'
import { Foot } from '@/components/Foot'
import { MidLevelScreenGradient } from '@/components/Gradients'
import { ThemedText } from '@/components/UI/ThemedText'

type TabContainerProps = {
  titleA?: string;
  titleB?: string;
  lead?: React.ReactNode;
  leadBody?: string;
  leadSubBody?: string;
  children: React.ReactNode;
  showFooter?: boolean;
  contentClassName?: string;
  scrollClassName?: string;
  background?: React.ReactNode;
};

export const TabContainer = ({
  titleA,
  titleB,
  lead,
  leadBody,
  leadSubBody,
  children,
  showFooter = true,
  contentClassName,
  scrollClassName,
  background,
}: TabContainerProps) => {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  const leftInsetPercent = useMemo(() => {
    if (width >= 1440) return 0.05;
    if (width >= 1024) return 0.10;
    if (width >= 768) return 0.15;
    return 0;
  }, [width]);

  const leftInset = Math.round(width * leftInsetPercent);

  const scrollY = useSharedValue(0);
  const bgFade = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      bgFade.value = 1;
      return;
    }
    bgFade.value = withTiming(1, { duration: 1400 });
  }, [bgFade, reduceMotion]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: bgFade.value,
  }));

  const titleDelayMs = reduceMotion ? 0 : background ? 1400 : 0;

  const resolvedBackground = background ?? <MidLevelScreenGradient />;

  const resolvedLead = lead ??
    (leadBody || leadSubBody ? (
      <>
        {leadBody ? <ThemedText className="detail-body">{leadBody}</ThemedText> : null}
        {leadSubBody ? <ThemedText className="detail-subBody">{leadSubBody}</ThemedText> : null}
      </>
    ) : null);

  return (
    <View className="flex-1 flex-row bg-themed">
      <Animated.View style={backgroundStyle} className="absolute inset-0">
        {resolvedBackground}
      </Animated.View>

      <View className="flex-1">

        <Animated.ScrollView
          className={scrollClassName}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerClassName={`page-content flex flex-col pt-[8%] pb-[12%] ${contentClassName ?? ''}`.trim()}
          contentContainerStyle={{
            paddingLeft: leftInset,
            paddingRight: 0,
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {titleA || titleB ? (
            <TitleOfPage
              titleA={titleA}
              titleB={titleB}
              startDelayMs={titleDelayMs}
              scrollY={scrollY}
            >
              {resolvedLead ? <View className="page-lead mt-[2%] mb-[4%]">{resolvedLead}</View> : null}
              {children}
              {showFooter ? (
                <View className="mt-[8%] pb-[6%] w-full">
                  <Foot />
                </View>
              ) : null}
            </TitleOfPage>
          ) : (
            <>
              {resolvedLead ? <View className="page-lead mt-[2%] mb-[4%]">{resolvedLead}</View> : null}
              {children}
              {showFooter ? (
                <View className="mt-[8%] pb-[6%] w-full">
                  <Foot />
                </View>
              ) : null}
            </>
          )}
        </Animated.ScrollView>
      </View>

      {isDesktopWeb ? <View style={{ width: '10%' }} /> : null}
    </View>
  );
}