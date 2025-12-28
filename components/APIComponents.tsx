import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
  requestBody?: {
    description: string;
    example: any;
  };
  responses?: Array<{
    code: string;
    description: string;
    example?: any;
  }>;
  baseUrl: string;
  onTest?: () => void;
}

export function EndpointCard({
  method,
  path,
  summary,
  description,
  parameters,
  requestBody,
  responses,
  baseUrl,
  onTest
}: EndpointCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const methodColors: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#8b5cf6',
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const url = `${baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method !== 'GET' && requestBody) {
        options.body = JSON.stringify(testParams);
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data,
      });
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={{
      backgroundColor: accentColor,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* Method and Path Header */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{
            backgroundColor: methodColors[method],
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            marginRight: 12,
          }}>
            <ThemedText style={{ 
              color: '#fff', 
              fontWeight: 'bold',
              fontSize: RFPercentage(1.4)
            }}>
              {method}
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={{ 
            fontSize: RFPercentage(1.8),
            fontFamily: 'monospace',
            flex: 1
          }}>
            {path}
          </ThemedText>
          <ThemedText style={{ fontSize: RFPercentage(2) }}>
            {isExpanded ? '▼' : '▶'}
          </ThemedText>
        </View>
        <ThemedText style={{ fontSize: RFPercentage(1.7), opacity: 0.8 }}>
          {summary}
        </ThemedText>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={{ marginTop: 16, gap: 16 }}>
          {description && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                Description
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(1.6), opacity: 0.8 }}>
                {description}
              </ThemedText>
            </View>
          )}

          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 8 }}>
                Parameters
              </ThemedText>
              {parameters.map((param, index) => (
                <View 
                  key={index}
                  style={{
                    backgroundColor: backgroundColor,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.5) }}>
                      {param.name}
                    </ThemedText>
                    <ThemedText style={{ 
                      fontSize: RFPercentage(1.3),
                      marginLeft: 8,
                      opacity: 0.6,
                      fontFamily: 'monospace'
                    }}>
                      ({param.type})
                    </ThemedText>
                    {param.required && (
                      <View style={{
                        backgroundColor: '#ef4444',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8,
                      }}>
                        <ThemedText style={{ 
                          color: '#fff',
                          fontSize: RFPercentage(1.2),
                          fontWeight: 'bold'
                        }}>
                          REQUIRED
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.7 }}>
                    {param.description}
                  </ThemedText>
                  {param.example && (
                    <ThemedText style={{ 
                      fontSize: RFPercentage(1.3),
                      marginTop: 4,
                      opacity: 0.6,
                      fontStyle: 'italic'
                    }}>
                      Example: {JSON.stringify(param.example)}
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Request Body */}
          {requestBody && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 8 }}>
                Request Body
              </ThemedText>
              <View style={{
                backgroundColor: backgroundColor,
                padding: 12,
                borderRadius: 8,
              }}>
                <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.8, marginBottom: 8 }}>
                  {requestBody.description}
                </ThemedText>
                <ThemedText style={{ 
                  fontFamily: 'monospace',
                  fontSize: RFPercentage(1.3),
                  opacity: 0.7
                }}>
                  {JSON.stringify(requestBody.example, null, 2)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Responses */}
          {responses && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 8 }}>
                Responses
              </ThemedText>
              {responses.map((response, index) => (
                <View 
                  key={index}
                  style={{
                    backgroundColor: backgroundColor,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{
                      backgroundColor: response.code.startsWith('2') ? '#10b981' : '#ef4444',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginRight: 8,
                    }}>
                      <ThemedText style={{ 
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: RFPercentage(1.3)
                      }}>
                        {response.code}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.8 }}>
                      {response.description}
                    </ThemedText>
                  </View>
                  {response.example && (
                    <ThemedText style={{ 
                      fontFamily: 'monospace',
                      fontSize: RFPercentage(1.3),
                      opacity: 0.7,
                      marginTop: 4
                    }}>
                      {JSON.stringify(response.example, null, 2)}
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Interactive Testing Section */}
          {requestBody && (
            <View style={{
              backgroundColor: backgroundColor,
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: tintColor + '40',
            }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 12 }}>
                🧪 Try It Out
              </ThemedText>
              
              {/* Input for each parameter */}
              {Object.keys(requestBody.example).map((key) => (
                <View key={key} style={{ marginBottom: 12 }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.4), marginBottom: 4 }}>
                    {key}
                  </ThemedText>
                  <TextInput
                    style={{
                      backgroundColor: accentColor,
                      color: textColor,
                      padding: 12,
                      borderRadius: 8,
                      fontSize: RFPercentage(1.5),
                      borderWidth: 1,
                      borderColor: tintColor + '20',
                    }}
                    placeholder={String(requestBody.example[key])}
                    placeholderTextColor={textColor + '60'}
                    value={testParams[key] || ''}
                    onChangeText={(value) => {
                      setTestParams({ ...testParams, [key]: value });
                    }}
                  />
                </View>
              ))}

              {/* Test Button */}
              <Pressable
                onPress={handleTest}
                disabled={isTesting}
                style={({ pressed }) => ({
                  backgroundColor: tintColor,
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: pressed || isTesting ? 0.7 : 1,
                })}
              >
                {isTesting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ 
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: RFPercentage(1.6)
                  }}>
                    Send Request
                  </ThemedText>
                )}
              </Pressable>

              {/* Test Results */}
              {testResult && (
                <View style={{ marginTop: 16 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 8 }}>
                    Response:
                  </ThemedText>
                  <View style={{
                    backgroundColor: accentColor,
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{
                        backgroundColor: testResult.status < 300 ? '#10b981' : '#ef4444',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        marginRight: 8,
                      }}>
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: RFPercentage(1.3) }}>
                          {testResult.status}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: RFPercentage(1.4), opacity: 0.8 }}>
                        {testResult.statusText}
                      </ThemedText>
                    </View>
                    <ScrollView horizontal>
                      <ThemedText style={{ 
                        fontFamily: 'monospace',
                        fontSize: RFPercentage(1.3),
                        opacity: 0.7
                      }}>
                        {JSON.stringify(testResult.data, null, 2)}
                      </ThemedText>
                    </ScrollView>
                  </View>
                </View>
              )}

              {testError && (
                <View style={{ marginTop: 16 }}>
                  <View style={{
                    backgroundColor: '#ef4444',
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <ThemedText style={{ color: '#fff', fontSize: RFPercentage(1.4) }}>
                      ❌ Error: {testError}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
