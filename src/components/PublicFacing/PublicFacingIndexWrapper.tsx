import React from 'react';
import { View } from 'react-native';
import { TabContainer } from '@/components/Navigation/TabContainer';

type PublicFacingIndexWrapperProps = {
	title: string;
	leadBody?: string;
	leadSubBody?: string;
	children: React.ReactNode;
	contentClassName?: string;
};

export function PublicFacingIndexWrapper({ title, leadBody, leadSubBody, children, contentClassName }: PublicFacingIndexWrapperProps) {
  const [titleA, ...titleRest] = title.trim().split(/\s+/);
  const titleB = titleRest.join(' ');

	return (
		<TabContainer
			titleA={titleA ?? ''}
			titleB={titleB}
			leadBody={leadBody}
			leadSubBody={leadSubBody}
			contentClassName={contentClassName}
		>
			<View className="w-full flex flex-col gap-4">
				{children}
			</View>
		</TabContainer>
	);
}
