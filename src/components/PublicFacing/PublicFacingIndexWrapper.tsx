import React from 'react';
import { ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { TabContainer } from '@/components/Navigation/TabContainer';

type PublicFacingIndexWrapperProps = {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	contentClassName?: string;
};

export function PublicFacingIndexWrapper({ title, subtitle, children, contentClassName }: PublicFacingIndexWrapperProps) {
	const backgroundColor = useThemeColor({}, 'background');
	const containerClassName = 'w-full max-w-[90%] self-center';

	return (
		<TabContainer>
      <View className="flex-1" style={{ backgroundColor }}>
        <View className={`${containerClassName} px-5 pt-10 pb-5`}>
          <ThemedText type="title" className="mb-2 text-4xl">
            {title}
          </ThemedText>
          {subtitle ? <ThemedText className="text-lg opacity-70">{subtitle}</ThemedText> : null}
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName={`${containerClassName} px-5 pb-10 gap-4 ${contentClassName ?? ''}`.trim()}
        >
          {children}
        </ScrollView>
      </View>
    </TabContainer>
	);
}
