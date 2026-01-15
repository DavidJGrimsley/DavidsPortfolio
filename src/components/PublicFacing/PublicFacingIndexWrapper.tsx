import React from 'react';
import { ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { TabContainer } from '@/components/Navigation/TabContainer';
import { TitleOfPage } from '@/components/Categories/TitleOfPage';

type PublicFacingIndexWrapperProps = {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	contentClassName?: string;
};

export function PublicFacingIndexWrapper({ title, subtitle, children, contentClassName }: PublicFacingIndexWrapperProps) {
	const backgroundColor = useThemeColor({}, 'background');
  const [titleA, ...titleRest] = title.trim().split(/\s+/);
  const titleB = titleRest.join(' ');

	return (
		<TabContainer>
      <View className="flex-1" style={{ backgroundColor }}>
        <TitleOfPage titleA={titleA ?? ''} titleB={titleB}>
          <ScrollView
            showsVerticalScrollIndicator={false}
					contentContainerClassName={`page-content pb-10 gap-4 ${contentClassName ?? ''}`.trim()}
          >
					{subtitle ? (
						<View className="page-lead mb-2">
							<ThemedText className="detail-body opacity-80">{subtitle}</ThemedText>
						</View>
					) : null}
            {children}
          </ScrollView>
        </TitleOfPage>
      </View>
    </TabContainer>
	);
}
