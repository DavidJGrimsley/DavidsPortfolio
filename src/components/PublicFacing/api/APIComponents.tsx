import React, { useState } from 'react';
import { View, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Picker } from '@react-native-picker/picker';

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  displayPath?: string;
  summary: string;
  description?: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
    enum?: string[];
    dependsOn?: string;
  }[];
  requestBody?: {
    description: string;
    example: any;
  };
  responses?: {
    code: string;
    description: string;
    example?: any;
  }[];
  baseUrl: string;
  auth?: 'public' | 'api_key' | 'bearer_jwt';
  extraHeaders?: Record<string, string>;
  liveDisabledReason?: string;
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

function joinEndpointUrl(baseUrl: string, path: string) {
  const trimmedPath = path.trim();
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedBase = normalizeUrl(baseUrl);
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  const isV1Path = normalizedPath === '/v1' || normalizedPath.startsWith('/v1/');
  const baseMatch = normalizedBase.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);

  if (!baseMatch) {
    if (isV1Path && normalizedBase.endsWith('/v1')) {
      return `${normalizedBase}${normalizedPath.slice('/v1'.length)}`;
    }

    return `${normalizedBase}${normalizedPath}`;
  }

  const origin = baseMatch[1];
  const basePath = (baseMatch[2] ?? '').replace(/\/+$/, '');

  if (isV1Path && basePath.endsWith('/v1')) {
    return `${origin}${basePath}${normalizedPath.slice('/v1'.length)}`;
  }

  if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
    return `${origin}${normalizedPath}`;
  }

  return `${origin}${basePath}${normalizedPath}`;
}

async function parseJsonResponse(response: Response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    const contentType = response.headers.get('content-type') ?? 'unknown content-type';
    const preview = rawBody.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(
      `Expected JSON response but received ${contentType} (HTTP ${response.status}). Preview: ${preview}`
    );
  }
}

const GATE_TYPE_OPTIONS = ['bit_flip', 'phase_flip', 'rotation'] as const;

function isRadiansAngleField(fieldName: string) {
  return fieldName === 'rotation_angle_rad' || fieldName.endsWith('_angle_rad');
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function EndpointCard({
  method,
  path,
  displayPath,
  summary,
  description,
  parameters,
  requestBody,
  responses,
  baseUrl,
  auth = 'public',
  extraHeaders,
  liveDisabledReason
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
  const [angleInputUnit, setAngleInputUnit] = useState<'deg' | 'rad'>('deg');
  const authLabel =
    auth === 'api_key'
      ? 'Requires API key'
      : auth === 'bearer_jwt'
        ? 'Requires Bearer JWT'
        : 'Public endpoint';
  const shouldDisableLiveCalls = Boolean(liveDisabledReason);

  const methodColors: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#8b5cf6',
  };

  const getGateTypeValue = () => {
    const directValue = testParams.gate_type;
    if (typeof directValue === 'string' && directValue.trim().length > 0) {
      return directValue.trim();
    }
    const fallbackValue = requestBody?.example?.gate_type;
    if (typeof fallbackValue === 'string' && fallbackValue.trim().length > 0) {
      return fallbackValue.trim();
    }
    return '';
  };

  const shouldIncludeField = (
    key: string,
    param?: { dependsOn?: string; enum?: string[]; name: string },
  ) => {
    if (key === 'rotation_angle_rad' && getGateTypeValue() !== 'rotation') {
      return false;
    }

    if (param?.dependsOn) {
      const dependentParam = parameters?.find((p) => p.enum?.includes(param.dependsOn!));
      if (dependentParam && testParams[dependentParam.name] !== param.dependsOn) {
        return false;
      }
    }

    return true;
  };

  const resolveEnumOptions = (
    key: string,
    param?: { enum?: string[] },
  ): string[] | undefined => {
    if (param?.enum && param.enum.length > 0) {
      return param.enum;
    }
    if (key === 'gate_type') {
      return [...GATE_TYPE_OPTIONS];
    }
    return undefined;
  };

  const formatInputValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const formatAnglePlaceholderValue = (key: string, value: unknown) => {
    if (
      isRadiansAngleField(key) &&
      angleInputUnit === 'deg' &&
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return String(Number(radiansToDegrees(value).toFixed(4)));
    }
    return formatInputValue(value);
  };

  const initializeTestParams = (example: Record<string, unknown>) => {
    const initial: Record<string, string> = {};
    Object.keys(example).forEach((key) => {
      initial[key] = formatAnglePlaceholderValue(key, example[key]);
    });
    return initial;
  };

  const coerceInputValue = (inputValue: unknown, exampleValue: unknown) => {
    const asText = typeof inputValue === 'string' ? inputValue : formatInputValue(inputValue);
    const trimmed = asText.trim();

    if (typeof exampleValue === 'number') {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid numeric value "${asText}"`);
      }
      return parsed;
    }

    if (typeof exampleValue === 'boolean') {
      if (trimmed.toLowerCase() === 'true' || trimmed === '1') return true;
      if (trimmed.toLowerCase() === 'false' || trimmed === '0') return false;
      throw new Error(`Invalid boolean value "${asText}"`);
    }

    if (Array.isArray(exampleValue) || (exampleValue !== null && typeof exampleValue === 'object')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new Error(`Invalid JSON for field value "${asText}"`);
      }
    }

    if (exampleValue === null) {
      if (trimmed.length === 0) return null;
      try {
        return JSON.parse(trimmed);
      } catch {
        return asText;
      }
    }

    return asText;
  };

  const switchAngleUnit = (nextUnit: 'deg' | 'rad') => {
    if (nextUnit === angleInputUnit) {
      return;
    }

    setTestParams((previous) => {
      const converted = { ...previous };
      Object.keys(converted).forEach((key) => {
        if (!isRadiansAngleField(key)) {
          return;
        }
        const numeric = Number(String(converted[key]).trim());
        if (!Number.isFinite(numeric)) {
          return;
        }
        const nextValue =
          nextUnit === 'deg' ? radiansToDegrees(numeric) : degreesToRadians(numeric);
        converted[key] = String(Number(nextValue.toFixed(6)));
      });
      return converted;
    });

    setAngleInputUnit(nextUnit);
  };

  const handleTest = async () => {
    if (shouldDisableLiveCalls) {
      setTestError(liveDisabledReason ?? 'Authentication is required for this endpoint.');
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const url = joinEndpointUrl(baseUrl, path);
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(extraHeaders ?? {}),
        },
      };

      if (method !== 'GET' && requestBody) {
        // Convert input strings back to typed JSON based on requestBody example values.
        const typedParams: Record<string, any> = {};
        Object.keys(testParams).forEach((key) => {
          const param = parameters?.find((p) => p.name === key);
          if (!shouldIncludeField(key, param)) {
            return;
          }

          const exampleValue = requestBody.example?.[key];
          const inputValue = testParams[key];
          let typedValue = coerceInputValue(inputValue, exampleValue);
          if (isRadiansAngleField(key) && angleInputUnit === 'deg' && typeof typedValue === 'number') {
            typedValue = degreesToRadians(typedValue);
          }
          typedParams[key] = typedValue;
        });

        options.body = JSON.stringify(typedParams);
      }

      const response = await fetch(url, options);
      const data = await parseJsonResponse(response);
      
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
      setTestParams(initializeTestParams(requestBody.example as Record<string, unknown>));
    }
    
    // Auto-fetch live result for GET endpoints when expanding
    if (next && method === 'GET') {
      if (shouldDisableLiveCalls) {
        setLiveError(liveDisabledReason ?? 'Authentication is required for this endpoint.');
        setLiveResponse(null);
        setIsFetchingLive(false);
        return;
      }

      setIsFetchingLive(true);
      setLiveError(null);
      setLiveResponse(null);
      try {
        const url = joinEndpointUrl(baseUrl, path);
        const response = await fetch(url, {
          headers: {
            ...(extraHeaders ?? {}),
          },
        });
        const data = await parseJsonResponse(response);
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
            {displayPath ?? path}
          </ThemedText>
          <ThemedText style={{ fontSize: 20 }}>
            {isExpanded ? '▼' : '▶'}
          </ThemedText>
        </View>
        <ThemedText style={{ fontSize: 18, opacity: 0.9, color: secondaryColor }}>
          {summary}
        </ThemedText>
        <ThemedText style={{ fontSize: 14, opacity: 0.7, color: secondaryColor, marginTop: 2 }}>
          {authLabel}
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

              {shouldDisableLiveCalls && (
                <View
                  style={{
                    backgroundColor: '#ef4444',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <ThemedText style={{ color: '#fff', fontSize: RFPercentage(1.35) }}>
                    {liveDisabledReason}
                  </ThemedText>
                </View>
              )}

              {/* Input fields when requestBody.example is provided */}
              {requestBody.example && (
                <View>
                  {Object.keys(requestBody.example).map((key) => {
                    // Find parameter definition for this key
                    const param = parameters?.find(p => p.name === key);
                    const enumOptions = resolveEnumOptions(key, param);
                    const hasEnum = Boolean(enumOptions && enumOptions.length > 0);
                    const isAngleField = isRadiansAngleField(key);

                    if (!shouldIncludeField(key, param)) {
                      return null;
                    }

                    const selectedEnumValue = hasEnum
                      ? String(testParams[key] ?? enumOptions?.[0] ?? '')
                      : '';

                    const fieldLabel = isAngleField
                      ? `${key} (${angleInputUnit})`
                      : key;
                    
                    return (
                      <View key={key} style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <ThemedText style={{ fontSize: RFPercentage(1.4) }}>
                            {fieldLabel}
                            {param?.required === false && (
                              <ThemedText style={{ fontSize: RFPercentage(1.3), opacity: 0.6 }}>
                                {' '}(optional)
                              </ThemedText>
                            )}
                          </ThemedText>

                          {isAngleField && (
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <Pressable
                                onPress={() => switchAngleUnit('deg')}
                                style={({ pressed }) => ({
                                  backgroundColor: angleInputUnit === 'deg' ? tintColor : accentColor,
                                  borderColor: tintColor + '55',
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  opacity: pressed ? 0.8 : 1,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                })}
                              >
                                <ThemedText
                                  style={{
                                    color: angleInputUnit === 'deg' ? '#fff' : textColor,
                                    fontSize: RFPercentage(1.25),
                                    fontWeight: 'bold',
                                  }}
                                >
                                  DEG
                                </ThemedText>
                              </Pressable>
                              <Pressable
                                onPress={() => switchAngleUnit('rad')}
                                style={({ pressed }) => ({
                                  backgroundColor: angleInputUnit === 'rad' ? tintColor : accentColor,
                                  borderColor: tintColor + '55',
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  opacity: pressed ? 0.8 : 1,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                })}
                              >
                                <ThemedText
                                  style={{
                                    color: angleInputUnit === 'rad' ? '#fff' : textColor,
                                    fontSize: RFPercentage(1.25),
                                    fontWeight: 'bold',
                                  }}
                                >
                                  RAD
                                </ThemedText>
                              </Pressable>
                            </View>
                          )}
                        </View>
                        
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
                              selectedValue={selectedEnumValue}
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
                              {enumOptions!.map((option) => (
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
                            placeholder={formatAnglePlaceholderValue(key, requestBody.example[key])}
                            placeholderTextColor={textColor + '60'}
                            value={formatInputValue(testParams[key])}
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
                disabled={isTesting || shouldDisableLiveCalls}
                style={({ pressed }) => ({
                  backgroundColor: tintColor,
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: pressed || isTesting || shouldDisableLiveCalls ? 0.7 : 1,
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
