import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { RFPercentage } from 'react-native-responsive-fontsize';
import Ionicons from '@expo/vector-icons/Ionicons';

// Props for a single MCP Resource Card
export interface MCPResourceCardProps {
  id: string;
  title: string;
  description: string;
  fileName: string;
  uri?: string;
  onPress?: () => void;
}

// MCP Resource Card - displays a single resource/guide
export const MCPResourceCard: React.FC<MCPResourceCardProps> = ({
  title,
  description,
  fileName,
  onPress
}) => {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: accentColor,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: tintColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="document-text" size={20} color={tintColor} style={{ marginRight: 8 }} />
        <ThemedText
          style={{
            fontSize: RFPercentage(2.2),
            fontWeight: '600',
            color: textColor,
            flex: 1,
          }}
        >
          {title}
        </ThemedText>
      </View>
      <ThemedText
        style={{
          fontSize: RFPercentage(1.8),
          opacity: 0.7,
          marginBottom: 6,
        }}
      >
        {description}
      </ThemedText>
      <ThemedText
        style={{
          fontSize: RFPercentage(1.5),
          opacity: 0.5,
          fontStyle: 'italic',
        }}
      >
        {fileName}
      </ThemedText>
    </Pressable>
  );
};

// Props for MCP Tool Card
export interface MCPToolCardProps {
  name: string;
  title: string;
  description: string;
  schema?: Record<string, any>;
}

// MCP Tool Card - displays available tools
export const MCPToolCard: React.FC<MCPToolCardProps> = ({
  name,
  title,
  description,
  schema
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View
      style={{
        backgroundColor: accentColor,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: tintColor,
      }}
    >
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="construct" size={18} color={tintColor} style={{ marginRight: 8 }} />
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  color: tintColor,
                }}
              >
                {name}
              </ThemedText>
            </View>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.9),
                fontWeight: '500',
                marginBottom: 6,
              }}
            >
              {title}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.7),
                opacity: 0.7,
              }}
            >
              {description}
            </ThemedText>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={textColor}
            style={{ opacity: 0.5, marginLeft: 8 }}
          />
        </View>
      </Pressable>
      
      {isExpanded && schema && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: tintColor + '30' }}>
          <ThemedText
            style={{
              fontSize: RFPercentage(1.6),
              fontWeight: '600',
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            Input Schema:
          </ThemedText>
          <View style={{ backgroundColor: '#1e1e1e', borderRadius: 6, padding: 12 }}>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.5),
                fontFamily: 'monospace',
                color: '#d4d4d4',
              }}
            >
              {JSON.stringify(schema, null, 2)}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

// Props for MCP Prompt Card
export interface MCPPromptCardProps {
  name: string;
  title: string;
  description: string;
  args?: string[];
}

// MCP Prompt Card - displays available prompts
export const MCPPromptCard: React.FC<MCPPromptCardProps> = ({
  name,
  title,
  description,
  args
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View
      style={{
        backgroundColor: accentColor,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#10b981',
      }}
    >
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="chatbubbles" size={18} color="#10b981" style={{ marginRight: 8 }} />
              <ThemedText
                style={{
                  fontSize: RFPercentage(2),
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  color: '#10b981',
                }}
              >
                {name}
              </ThemedText>
            </View>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.9),
                fontWeight: '500',
                marginBottom: 6,
              }}
            >
              {title}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: RFPercentage(1.7),
                opacity: 0.7,
              }}
            >
              {description}
            </ThemedText>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={textColor}
            style={{ opacity: 0.5, marginLeft: 8 }}
          />
        </View>
      </Pressable>
      
      {isExpanded && args && args.length > 0 && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#10b981' + '30' }}>
          <ThemedText
            style={{
              fontSize: RFPercentage(1.6),
              fontWeight: '600',
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            Arguments:
          </ThemedText>
          {args.map((arg, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="arrow-forward" size={14} color={tintColor} style={{ marginRight: 6, opacity: 0.5 }} />
              <ThemedText
                style={{
                  fontSize: RFPercentage(1.6),
                  fontFamily: 'monospace',
                  opacity: 0.7,
                }}
              >
                {arg}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Props for Feature Card
export interface MCPFeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

// MCP Feature Card - highlights MCP capabilities
export const MCPFeatureCard: React.FC<MCPFeatureCardProps> = ({
  icon,
  title,
  description
}) => {
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View
      style={{
        backgroundColor: accentColor,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: tintColor + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={22} color={tintColor} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText
            style={{
              fontSize: RFPercentage(2),
              fontWeight: '600',
              marginBottom: 6,
            }}
          >
            {title}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: RFPercentage(1.7),
              opacity: 0.7,
            }}
          >
            {description}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

// Props for Collapsible Section
export interface MCPCollapsibleSectionProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

// MCP Collapsible Section - reusable expandable section
export const MCPCollapsibleSection: React.FC<MCPCollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={{ marginBottom: 20, alignItems: 'center' }}>
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: accentColor,
          borderRadius: 10,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          // width: '100%',
          minWidth: 500,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {icon && <Ionicons name={icon} size={20} color={tintColor} style={{ marginRight: 10 }} />}
          <ThemedText
            style={{
              fontSize: RFPercentage(2),
              fontWeight: '600',
            }}
          >
            {title}
          </ThemedText>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={textColor}
          style={{ opacity: 0.5 }}
        />
      </Pressable>
      
      {isExpanded && (
        <View style={{ marginTop: 12, paddingHorizontal: 4, width: '100%' }}>
          {children}
        </View>
      )}
    </View>
  );
};

// Props for Code Block
export interface MCPCodeBlockProps {
  code: string;
  language?: string;
}

// MCP Code Block - styled code display
export const MCPCodeBlock: React.FC<MCPCodeBlockProps> = ({
  code,
  language
}) => {
  return (
    <View style={{ marginBottom: 16 }}>
      {language && (
        <ThemedText
          style={{
            fontSize: RFPercentage(1.5),
            fontWeight: '600',
            opacity: 0.6,
            marginBottom: 6,
          }}
        >
          {language}
        </ThemedText>
      )}
      <ScrollView
        horizontal
        style={{
          backgroundColor: '#1e1e1e',
          borderRadius: 8,
          padding: 16,
        }}
        showsHorizontalScrollIndicator={false}
      >
        <ThemedText
          style={{
            fontFamily: 'monospace',
            fontSize: RFPercentage(1.6),
            color: '#d4d4d4',
            lineHeight: RFPercentage(2.4),
          }}
        >
          {code}
        </ThemedText>
      </ScrollView>
    </View>
  );
};
