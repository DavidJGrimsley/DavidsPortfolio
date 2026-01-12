import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Picker } from '@react-native-picker/picker';

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
    enum?: string[];
    dependsOn?: string;
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
  const secondaryColor = useThemeColor({}, 'secondary');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [liveResponse, setLiveResponse] = useState<any>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

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
        // Convert string values to correct types based on requestBody.example
        const typedParams: Record<string, any> = {};
        Object.keys(testParams).forEach((key) => {
          const exampleValue = requestBody.example[key];
          const inputValue = testParams[key];
          
          // Convert to number if example is a number
          if (typeof exampleValue === 'number') {
            typedParams[key] = Number(inputValue);
          } else {
            typedParams[key] = inputValue;
          }
        });
        
        options.body = JSON.stringify(typedParams);
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

  const handleExpand = async () => {
    const next = !isExpanded;
    setIsExpanded(next);
    
    // Initialize testParams with default values from requestBody.example
    if (next && requestBody?.example && Object.keys(testParams).length === 0) {
      setTestParams(requestBody.example);
    }
    
    // Auto-fetch live result for GET endpoints when expanding
    if (next && method === 'GET') {
      setIsFetchingLive(true);
      setLiveError(null);
      setLiveResponse(null);
      try {
        const url = `${baseUrl}${path}`;
        const response = await fetch(url);
        const data = await response.json();
        setLiveResponse({
          status: response.status,
          statusText: response.statusText,
          data,
        });
      } catch (error) {
        setLiveError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsFetchingLive(false);
      }
    }
  };

  const withOpacity = (color: string, opacity: number) => {
    const alpha = Math.max(0, Math.min(1, opacity));
    const hex = color.replace('#', '');
    if (hex.length !== 6 && hex.length !== 8) return color;

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <View style={{
      backgroundColor: withOpacity(accentColor, 0.18),
      borderWidth: 1,
      borderColor: withOpacity(accentColor, 0.35),
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* Method and Path Header */}
      <Pressable onPress={handleExpand}>
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
              fontSize: 16
            }}>
              {method}
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={{ 
            fontSize: 20,
            fontFamily: 'monospace',
            flex: 1,
            color: secondaryColor,
          }}>
            {path}
          </ThemedText>
          <ThemedText style={{ fontSize: 20 }}>
            {isExpanded ? '▼' : '▶'}
          </ThemedText>
        </View>
        <ThemedText style={{ fontSize: 18, opacity: 0.9, color: secondaryColor }}>
          {summary}
        </ThemedText>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={{ marginTop: 16, gap: 16 }}>
          {description && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 4 }}>
                Description
              </ThemedText>
              <ThemedText style={{ fontSize: 16, opacity: 0.9, color: secondaryColor }}>
                {description}
              </ThemedText>
            </View>
          )}

          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <View>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
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
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                      {param.name}
                    </ThemedText>
                    <ThemedText style={{ 
                      fontSize: 14,
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
                          fontSize: 13,
                          fontWeight: 'bold'
                        }}>
                          REQUIRED
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ fontSize: 15, opacity: 0.78 }}>
                    {param.description}
                  </ThemedText>
                  {param.example && (
                    <ThemedText style={{ 
                      fontSize: 14,
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
              <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
                Request Body
              </ThemedText>
              <View style={{
                backgroundColor: backgroundColor,
                padding: 12,
                borderRadius: 8,
              }}>
                <ThemedText style={{ fontSize: 15, opacity: 0.85, marginBottom: 8 }}>
                  {requestBody.description}
                </ThemedText>
                <ThemedText style={{ 
                  fontFamily: 'monospace',
                  fontSize: 14,
                  opacity: 0.78
                }}>
                  {JSON.stringify(requestBody.example, null, 2)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Responses */}
          <View>
            {method !== 'GET' && <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
              Example Responses
            </ThemedText>}
            {/* For GET endpoints, show LIVE response instead of static example */}
            {method === 'GET' ? (
              <>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
                  Live API Call Response
                </ThemedText>
                <View style={{
                  backgroundColor: backgroundColor,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      backgroundColor: liveError ? '#ef4444' : (liveResponse && liveResponse.status < 300 ? '#10b981' : '#ef4444'),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginRight: 8,
                    }}>
                      <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                        {liveError ? 'ERR' : (liveResponse ? liveResponse.status : '...')}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 15, opacity: 0.85 }}>
                      {liveError ? 'Live request failed' : (liveResponse ? liveResponse.statusText : 'Fetching live response...')}
                    </ThemedText>
                  </View>
                  {isFetchingLive && (
                    <ActivityIndicator color={tintColor} />
                  )}
                  {liveError && (
                    <ThemedText style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                      {liveError}
                    </ThemedText>
                  )}
                  {liveResponse && (
                    <ScrollView horizontal>
                      <ThemedText style={{ 
                        fontFamily: 'monospace',
                        fontSize: 14,
                        opacity: 0.78,
                      }}>
                        {JSON.stringify(liveResponse.data, null, 2)}
                      </ThemedText>
                    </ScrollView>
                  )}
                </View>
              </>
            ) : (
              // Non-GET endpoints: show documented response examples
              responses && responses.length > 0 && (
                <View>
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
                            fontSize: 14
                          }}>
                            {response.code}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ fontSize: 15, opacity: 0.85 }}>
                          {response.description}
                        </ThemedText>
                      </View>
                      {response.example && (
                        <ThemedText style={{ 
                          fontFamily: 'monospace',
                          fontSize: 14,
                          opacity: 0.78,
                          marginTop: 4
                        }}>
                          {JSON.stringify(response.example, null, 2)}
                        </ThemedText>
                      )}
                    </View>
                  ))}
                </View>
              )
            )}
          </View>

          {/* Interactive Testing Section for non-GET endpoints with request body */}
          {requestBody && (
            <View style={{
              backgroundColor: backgroundColor,
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: tintColor + '40',
            }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 20, marginBottom: 12 }}>
                🧪 Try It Out
              </ThemedText>

              {/* Input fields when requestBody.example is provided */}
              {requestBody.example && (
                <View>
                  {Object.keys(requestBody.example).map((key) => {
                    // Find parameter definition for this key
                    const param = parameters?.find(p => p.name === key);
                    const hasEnum = param?.enum && param.enum.length > 0;
                    
                    // Check if this field should be shown based on dependencies
                    if (param?.dependsOn) {
                      const dependentParam = parameters?.find(p => p.enum?.includes(param.dependsOn!));
                      if (dependentParam && testParams[dependentParam.name] !== param.dependsOn) {
                        return null; // Hide this field
                      }
                    }
                    
                    return (
                      <View key={key} style={{ marginBottom: 12 }}>
                        <ThemedText style={{ fontSize: RFPercentage(1.4), marginBottom: 4 }}>
                          {key}
                          {param?.required === false && (
                            <ThemedText style={{ fontSize: RFPercentage(1.3), opacity: 0.6 }}>
                              {' '}(optional)
                            </ThemedText>
                          )}
                        </ThemedText>
                        
                        {hasEnum ? (
                          // Render dropdown for enum fields
                          <View style={{
                            backgroundColor: accentColor,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: tintColor + '20',
                            overflow: 'hidden',
                            minHeight: 50,
                            justifyContent: 'center',
                          }}>
                            <Picker
                              selectedValue={testParams[key] || param.example}
                              onValueChange={(value) => {
                                setTestParams({ ...testParams, [key]: value });
                              }}
                              style={{
                                color: textColor,
                                backgroundColor: accentColor,
                                height: 50,
                              }}
                              dropdownIconColor={textColor}
                            >
                              {param.enum!.map((option) => (
                                <Picker.Item key={option} label={option} value={option} />
                              ))}
                            </Picker>
                          </View>
                        ) : (
                          // Render text input for other fields
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
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

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
                      <View
                        style={{
                          backgroundColor: testResult.status < 300 ? '#10b981' : '#ef4444',
                          borderRadius: 4,
                          marginRight: 8,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
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
