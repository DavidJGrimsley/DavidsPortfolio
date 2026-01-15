import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { TabContainer } from '@/components/Navigation/TabContainer';

type PublicFacingIndexWrapperProps = {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	contentClassName?: string;
};

export function PublicFacingIndexWrapper({ title, subtitle, children, contentClassName }: PublicFacingIndexWrapperProps) {
  const [titleA, ...titleRest] = title.trim().split(/\s+/);
  const titleB = titleRest.join(' ');

	return (
		<TabContainer
			titleA={titleA ?? ''}
			titleB={titleB}
			lead={subtitle ? <ThemedText className="detail-body opacity-80">{subtitle}</ThemedText> : undefined}
			contentClassName={contentClassName}
		>
			<View className="w-full flex flex-col gap-4">
				{children}
			</View>
		</TabContainer>
	);
}
