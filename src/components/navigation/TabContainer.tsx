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
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'

import { SeoHead, type SeoHeadProps } from '@/components/SEO/SeoHead'
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
  overlayIcon?: React.ReactNode;
  overlayIconDelayMs?: number;
  overlayIconEnterDurationMs?: number;
  overlayIconTranslateX?: number;
  seo?: SeoHeadProps;
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
  overlayIcon,
  overlayIconDelayMs = 0,
  overlayIconEnterDurationMs = 900,
  overlayIconTranslateX = 80,
  seo,
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
  const overlayEnter = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      bgFade.value = 1;
      overlayEnter.value = 1;
      return;
    }
    bgFade.value = withTiming(1, { duration: 1400 });
    if (overlayIcon) {
      overlayEnter.value = withDelay(
        Math.max(0, overlayIconDelayMs),
        withTiming(1, {
          duration: overlayIconEnterDurationMs,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [bgFade, overlayEnter, reduceMotion, overlayIcon, overlayIconDelayMs, overlayIconEnterDurationMs]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: bgFade.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayEnter.value,
    transform: [{ translateX: (1 - overlayEnter.value) * overlayIconTranslateX }],
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

  const derivedTitle = useMemo(() => {
    if (seo?.title) return seo.title;
    const combined = [titleA, titleB].filter(Boolean).join(' ').trim();
    return combined.length > 0 ? combined : undefined;
  }, [seo?.title, titleA, titleB]);

  const derivedDescription = useMemo(() => {
    if (seo?.description) return seo.description;
    if (leadBody && leadBody.trim().length > 0) return leadBody;
    if (leadSubBody && leadSubBody.trim().length > 0) return leadSubBody;
    return undefined;
  }, [leadBody, leadSubBody, seo?.description]);

  return (
    <View className="flex-1 flex-row bg-themed">
      <SeoHead
        title={derivedTitle}
        description={derivedDescription}
        path={seo?.path}
        canonicalUrl={seo?.canonicalUrl}
        keywords={seo?.keywords}
        image={seo?.image}
        type={seo?.type}
        noIndex={seo?.noIndex}
        structuredData={seo?.structuredData}
      />

      <Animated.View style={backgroundStyle} className="absolute inset-0">
        {resolvedBackground}
      </Animated.View>

      {overlayIcon ? (
        <Animated.View pointerEvents="none" style={overlayStyle} className="absolute inset-0">
          {overlayIcon}
        </Animated.View>
      ) : null}

      <View className="flex-1">

        <Animated.ScrollView
          className={scrollClassName}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerClassName={`page-content flex flex-col pt-[4%] pb-[12%] ${contentClassName ?? ''}`.trim()}
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