import React, { forwardRef } from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { Article, Main } from '@expo/html-elements';
import { BackgroundGradient } from '@/components/Gradients';
import { SeoHead, type SeoHeadProps } from '@/components/SEO/SeoHead';

type PublicFacingDetailWrapperProps = ScrollViewProps & {
	children: React.ReactNode;
	contentClassName?: string;
	floatingContent?: React.ReactNode;
	viewportRef?: React.Ref<View>;
	seo?: SeoHeadProps;
};

export const PublicFacingDetailWrapper = forwardRef<ScrollView, PublicFacingDetailWrapperProps>(function PublicFacingDetailWrapper({
	children,
	contentClassName,
	contentContainerClassName,
	floatingContent,
	viewportRef,
	showsHorizontalScrollIndicator,
	seo,
	...rest
}, ref) {
	const mergedContentClassName = `flex-grow bg-themed ${contentContainerClassName ?? ''}`.trim();
	const scrollView = (
		<ScrollView
			ref={ref}
			{...rest}
			showsHorizontalScrollIndicator={showsHorizontalScrollIndicator ?? false}
			contentContainerClassName={mergedContentClassName}
		>
			<BackgroundGradient />
			<Main className={`flex-1 w-full max-w-[90%] self-center bg-transparent px-5 py-7.5 pb-15 ${contentClassName ?? ''}`.trim()}>
				<Article className="flex-1 w-full">
					{children}
				</Article>
			</Main>
		</ScrollView>
	);

	return (
		<>
			{seo ? <SeoHead {...seo} /> : null}
			{floatingContent || viewportRef ? (
				<View ref={viewportRef} style={{ flex: 1 }}>
					{scrollView}
					{floatingContent ? (
						<View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 102 }}>
							{floatingContent}
						</View>
					) : null}
				</View>
			) : scrollView}
		</>
	);
});
