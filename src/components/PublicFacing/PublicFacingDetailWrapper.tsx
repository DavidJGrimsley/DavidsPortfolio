import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { BackgroundGradient } from '@/components/Gradients';

type PublicFacingDetailWrapperProps = ScrollViewProps & {
	children: React.ReactNode;
	contentClassName?: string;
};

export function PublicFacingDetailWrapper({
	children,
	contentClassName,
	contentContainerClassName,
	showsHorizontalScrollIndicator,
	...rest
}: PublicFacingDetailWrapperProps) {
	const mergedContentClassName = `flex-grow bg-themed ${contentContainerClassName ?? ''}`.trim();

	return (
		<ScrollView
			{...rest}
			showsHorizontalScrollIndicator={showsHorizontalScrollIndicator ?? false}
			contentContainerClassName={mergedContentClassName}
		>
			<BackgroundGradient />
			<View className={`flex-1 w-full max-w-[90%] self-center bg-transparent px-5 py-7.5 pb-15 ${contentClassName ?? ''}`.trim()}>
				{children}
			</View>
		</ScrollView>
	);
}
