import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { styles } from '@/constants/styles';
import { RFPercentage } from 'react-native-responsive-fontsize';
import apisData from '@/assets/json/apis.json';

const QUANTUM_BASE_URL = 'https://davidjgrimsley.com/api/quantum';
const APIS_INDEX_META_URL = `${QUANTUM_BASE_URL}/portfolio/apis.json`;

type PortfolioApisIndex = {
  apis: Array<{
    id: string;
    name: string;
    version: string;
    icon: string;
    description: string;
    baseUrl: string;
    status: string;
    featured?: boolean;
    tags: string[];
    endpoints: number;
    uptime: string;
  }>;
};

const { width: screenWidth } = Dimensions.get('window');

export default function APIIndexPage() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  const [portfolioApis, setPortfolioApis] = useState<PortfolioApisIndex | null>(null);

  const handleAPIPress = (apiId: string) => {
    router.push(`/api/${apiId}` as any);
  };

  const fallbackApis = useMemo(() => apisData.apis ?? [], []);
  const apis = portfolioApis?.apis?.length ? portfolioApis.apis : fallbackApis;

  useEffect(() => {
    let isMounted = true;

    const fetchApisIndex = async () => {
      try {
        if (__DEV__) {
          console.log('[APIIndex] Fetching portfolio apis index', {
            url: APIS_INDEX_META_URL,
            fallbackCount: fallbackApis.length,
          });
        }

        const response = await fetch(APIS_INDEX_META_URL, {
          method: 'GET',
          cache: 'no-store' as any,
        });

        if (__DEV__) {
          console.log('[APIIndex] Initial response', {
            status: response.status,
            ok: response.ok,
          });
        }

        const finalResponse =
          response.status === 304
            ? await fetch(`${APIS_INDEX_META_URL}?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store' as any,
              })
            : response;

        if (__DEV__ && finalResponse !== response) {
          console.log('[APIIndex] Retried after 304 with cache-bust', {
            status: finalResponse.status,
            ok: finalResponse.ok,
          });
        }

        if (!finalResponse.ok) throw new Error(`HTTP ${finalResponse.status}`);
        const data = (await finalResponse.json()) as PortfolioApisIndex;

        if (__DEV__) {
          const apiCount = Array.isArray(data?.apis) ? data.apis.length : -1;
          console.log('[APIIndex] Parsed payload', {
            apiCount,
            firstApiId: data?.apis?.[0]?.id,
            firstApiVersion: data?.apis?.[0]?.version,
          });
        }

        if (!isMounted) return;
        setPortfolioApis(data);
      } catch (error) {
        if (__DEV__) {
          console.warn('[APIIndex] Failed to fetch portfolio apis index; using local fallback', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        if (!isMounted) return;
        setPortfolioApis(null);
      }
    };

    fetchApisIndex();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={[styles.page, { backgroundColor }]}>
      {/* Title Section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontSize: RFPercentage(4), marginBottom: 8 }}>
          Public APIs
        </ThemedText>
        <ThemedText style={{ fontSize: RFPercentage(2), opacity: 0.7 }}>
          Open APIs hosted by David Grimsley for public use
        </ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingBottom: 40,
          gap: 16
        }}
      >
        {apis.map((api) => (
          <Pressable
            key={api.id}
            onPress={() => handleAPIPress(api.id)}
            style={({ pressed }) => ({
              backgroundColor: accentColor,
              borderRadius: 12,
              padding: 20,
              opacity: pressed ? 0.8 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            })}
          >
            {/* Header with Icon and Status */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <ThemedText style={{ fontSize: RFPercentage(4) }}>
                  {api.icon}
                </ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
                    {api.name}
                  </ThemedText>
                  <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
                    v{api.version}
                  </ThemedText>
                </View>
              </View>
              
              {/* Status Badge */}
              <View style={{
                backgroundColor: api.status === 'active' ? '#10b981' : '#ef4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}>
                <ThemedText style={{ 
                  fontSize: RFPercentage(1.4), 
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {api.status === 'active' ? '● LIVE' : '● OFFLINE'}
                </ThemedText>
              </View>
            </View>

            {/* Description */}
            <ThemedText style={{ 
              fontSize: RFPercentage(1.8), 
              marginBottom: 16,
              lineHeight: RFPercentage(2.5),
              opacity: 0.8
            }}>
              {api.description}
            </ThemedText>

            {/* Stats Row */}
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 12
            }}>
              <View style={{ 
                backgroundColor: backgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
                <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                  📡 {api.endpoints} endpoints
                </ThemedText>
              </View>
              <View style={{ 
                backgroundColor: backgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
                <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                  ⚡ {api.uptime} uptime
                </ThemedText>
              </View>
            </View>

            {/* Tags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {api.tags.map((tag, index) => (
                <View 
                  key={index}
                  style={{
                    backgroundColor: tintColor + '20',
                    borderColor: tintColor + '40',
                    borderWidth: 1,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <ThemedText style={{ 
                    fontSize: RFPercentage(1.3),
                    color: tintColor,
                    fontWeight: '600'
                  }}>
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Call to Action */}
            <View style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: backgroundColor + '40',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <ThemedText style={{ 
                fontSize: RFPercentage(1.6),
                color: tintColor,
                fontWeight: 'bold'
              }}>
                View Documentation →
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.6 }}>
                Interactive testing available
              </ThemedText>
            </View>
          </Pressable>
        ))}

        {/* Coming Soon Card */}
        <View style={{
          backgroundColor: accentColor,
          borderRadius: 12,
          padding: 20,
          borderWidth: 2,
          borderColor: tintColor + '40',
          borderStyle: 'dashed',
        }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 8 }}>
            More APIs Coming Soon
          </ThemedText>
          <ThemedText style={{ fontSize: RFPercentage(1.8), opacity: 0.7 }}>
            Stay tuned for additional public APIs covering authentication, data processing, and more.
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}
