import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EndpointCard } from '~/src/components/PublicFacing/api/APIComponents';
import { QuantumAuthDashboardCard } from '~/src/components/PublicFacing/api/quantum-auth-dashboard-card';
import { ExternalLink } from '@/components/UI/ExternalLink';
import { HelloWave } from '@/components/QuantumAnimation';
import { PublicFacingDetailWrapper } from '~/src/components/PublicFacing/PublicFacingDetailWrapper';
import {
  QUANTUM_API_BASE_URL,
  QUANTUM_DOCS_URL,
  QUANTUM_PORTFOLIO_URL,
  getQuantumApiHeaders,
  hasQuantumApiKey,
} from '@/lib/quantum-api-config';
import apisData from '@json/apis.json';

const QUANTUM_API_HEADERS = getQuantumApiHeaders({ includeContentType: false });
const HAS_QUANTUM_API_KEY = hasQuantumApiKey();
const SHOULD_DEBUG_PUBLIC_FACING =
  __DEV__ || process.env.EXPO_PUBLIC_PUBLIC_FACING_DEBUG === '1';

type QuantumPortfolioDetail = {
  api: {
    id: string;
    name: string;
    version: string;
    icon?: string;
    description?: string;
    baseUrl: string;
    docsUrl: string;
    healthUrl?: string;
    status: string;
    featured?: boolean;
    tags?: string[];
    uptime?: string;
  };
  endpoints: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
    path: string;
    summary: string;
    description?: string;
    auth?: 'public' | 'api_key' | 'bearer_jwt';
    parameters?: {
      name: string;
      type: string;
      required: boolean;
      description: string;
      example?: any;
      enum?: string[];
      dependsOn?: string;
    }[];
    requestBody?: { description: string; example: any };
    responses?: { code: string; description: string; example?: any }[];
  }[];
};

type QuantumEndpoint = QuantumPortfolioDetail['endpoints'][number];

const FALLBACK_ENDPOINTS: QuantumEndpoint[] = [
  {
    method: 'GET',
    path: '/v1/health',
    summary: 'Service health and runtime capability status',
    description:
      'Public liveness endpoint. Returns service status, version, and runtime availability details.',
    auth: 'public',
    responses: [
      {
        code: '200',
        description: 'Healthy response payload',
        example: {
          status: 'healthy',
          service: 'Quantum API',
          version: '0.1.0',
          qiskit_available: true,
          runtime_mode: 'simulator',
        },
      },
    ],
  },
  {
    method: 'GET',
    path: '/v1/echo-types',
    summary: 'List canonical text transformation categories',
    description:
      'Returns transformation categories and descriptions used by text transformation clients.',
    auth: 'api_key',
    responses: [
      {
        code: '200',
        description: 'Echo type catalog',
      },
      {
        code: '401',
        description: 'Missing or invalid API key',
      },
    ],
  },
  {
    method: 'POST',
    path: '/v1/gates/run',
    summary: 'Run a single-qubit gate and return measured output',
    description:
      'Supports bit_flip, phase_flip, and rotation gates. Rotation requests must include rotation_angle_rad.',
    auth: 'api_key',
    parameters: [
      {
        name: 'gate_type',
        type: 'string',
        required: true,
        description: "Gate to apply: 'bit_flip', 'phase_flip', or 'rotation'.",
        example: 'rotation',
        enum: ['bit_flip', 'phase_flip', 'rotation'],
      },
      {
        name: 'rotation_angle_rad',
        type: 'number',
        required: false,
        description: "Radians for rotation gate. Required only when gate_type is 'rotation'.",
        example: 1.5708,
        dependsOn: 'rotation',
      },
    ],
    requestBody: {
      description: 'Gate execution request payload.',
      example: {
        gate_type: 'rotation',
        rotation_angle_rad: Math.PI / 2,
      },
    },
    responses: [
      {
        code: '200',
        description: 'Successful quantum gate simulation',
        example: {
          gate_type: 'rotation',
          measurement: 1,
          superposition_strength: 0.87,
          success: true,
        },
      },
      {
        code: '401',
        description: 'Missing or invalid API key',
      },
    ],
  },
];

export default function QuantumAPIPage() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [isHowToUseExpanded, setIsHowToUseExpanded] = useState(false);
  const [isQuantumMechanicsExpanded, setIsQuantumMechanicsExpanded] = useState(false);
  const [portfolioDetail, setPortfolioDetail] = useState<QuantumPortfolioDetail | null>(null);
  const [isDetailSynced, setIsDetailSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolioDetail = async () => {
      try {
        if (SHOULD_DEBUG_PUBLIC_FACING) {
          console.log('[Quantum] Fetching portfolio detail', {
            url: QUANTUM_PORTFOLIO_URL,
          });
        }

        const response = await fetch(QUANTUM_PORTFOLIO_URL, {
          method: 'GET',
          cache: 'no-store' as any,
        });

        if (SHOULD_DEBUG_PUBLIC_FACING) {
          console.log('[Quantum] Initial response', {
            status: response.status,
            ok: response.ok,
          });
        }

        const finalResponse =
          response.status === 304
            ? await fetch(`${QUANTUM_PORTFOLIO_URL}?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store' as any,
              })
            : response;

        if (SHOULD_DEBUG_PUBLIC_FACING && finalResponse !== response) {
          console.log('[Quantum] Retried after 304 with cache-bust', {
            status: finalResponse.status,
            ok: finalResponse.ok,
          });
        }

        if (!finalResponse.ok) throw new Error(`HTTP ${finalResponse.status}`);
        const data = (await finalResponse.json()) as QuantumPortfolioDetail;

        if (SHOULD_DEBUG_PUBLIC_FACING) {
          console.log('[Quantum] Parsed payload', {
            apiId: data?.api?.id,
            apiVersion: data?.api?.version,
            endpointCount: Array.isArray(data?.endpoints) ? data.endpoints.length : -1,
            firstEndpoint: data?.endpoints?.[0]?.path,
          });
        }

        if (!isMounted) return;
        setPortfolioDetail(data);
        setIsDetailSynced(true);
      } catch (error) {
        if (SHOULD_DEBUG_PUBLIC_FACING) {
          console.warn('[Quantum] Failed to fetch portfolio detail; using local fallback', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        if (!isMounted) return;
        setPortfolioDetail(null);
        setIsDetailSynced(false);
      }
    };

    fetchPortfolioDetail();
    return () => {
      isMounted = false;
    };
  }, []);

  const apiName = portfolioDetail?.api?.name ?? apisData.apis[0].name;
  const apiBaseUrl = portfolioDetail?.api?.baseUrl ?? QUANTUM_API_BASE_URL;
  const apiDocsUrl = portfolioDetail?.api?.docsUrl ?? QUANTUM_DOCS_URL;
  const apiVersion = portfolioDetail?.api?.version ?? apisData.apis[0].version;
  const apiStatusRaw = (portfolioDetail?.api?.status ?? apisData.apis[0].status ?? '').toLowerCase();
  const isLive =
    apiStatusRaw === 'active' ||
    apiStatusRaw === 'healthy' ||
    apiStatusRaw === 'live' ||
    (isDetailSynced && apiStatusRaw !== 'offline');
  const hasRemoteEndpoints = Array.isArray(portfolioDetail?.endpoints) && portfolioDetail.endpoints.length > 0;
  const endpointsToRender: QuantumEndpoint[] = hasRemoteEndpoints ? portfolioDetail!.endpoints : FALLBACK_ENDPOINTS;
  const authHintForEndpoint = (
    auth: QuantumEndpoint['auth'],
  ): string | undefined => {
    if (auth === 'api_key' && !HAS_QUANTUM_API_KEY) {
      return 'Set EXPO_PUBLIC_QUANTUM_API_KEY to test this endpoint locally.';
    }
    if (auth === 'bearer_jwt') {
      return 'This endpoint requires a signed user JWT. Test it in Swagger with Bearer auth.';
    }
    return undefined;
  };

  const seoTitle = portfolioDetail?.api?.name
    ? `${portfolioDetail.api.name} API`
    : 'Quantum API';
  const seoDescription =
    portfolioDetail?.api?.description ??
    'Quantum is a public API hosted by David Grimsley. View endpoints, docs, examples, uptime, and usage notes.';

  return (
    <PublicFacingDetailWrapper
      seo={{
        title: seoTitle,
        description: seoDescription,
        path: '/public-facing/api/quantum',
        keywords: [
          'Quantum API',
          'public API',
          'what is an API',
          'REST API',
          'developer tools',
          'backend development',
          'TypeScript',
        ],
        type: 'website',
      }}
    >
        {/* Header */}
        <View className="mb-7.5">
          <View className="flex-row items-center mb-3">
            {/* Icon box */}
            <View
              className="w-18 h-18 rounded-2xl items-center justify-center mr-4"
              style={{
                backgroundColor: tintColor + '33',
              }}
            >
              <Ionicons name="nuclear" size={40} color={tintColor} />
            </View>

            {/* Title + version */}
            <View className="flex-1 flex-row mr-2">
              <ThemedText
                type="title"
                headingLevel={1}
                visualHeadingLevel={1}
                className="font-noto-serif-display"
              >
                {apiName}
              </ThemedText>
              <ThemedText
                className="opacity-60 mt-0.5 text-sm"
              >
                v{apiVersion}
              </ThemedText>
            </View>

            {/* Live badge */}
            <View
              className={`px-3 py-1.5 rounded-xl ml-2 ${isLive ? 'bg-success' : 'bg-error'}`}
            >
              <ThemedText inverse className="font-bold text-xs">
                {isLive ? ' LIVE' : ' OFFLINE'}
              </ThemedText>
            </View>
          </View>

          <ThemedText className="opacity-85 mb-4 leading-6">
            General-purpose quantum computing services for games and applications. Simulator-backed runtime works out of the box, and BYO IBM credentials unlock backend discovery, transpilation, and async hardware jobs through the same Quantum API account.
          </ThemedText>

          {/* Features Section */}
          <View className="mb-4">
            <ThemedText type="subtitle" className="mb-3">
              Features
            </ThemedText>
            <View className="pl-2">
              <ThemedText className="opacity-85 text-sm leading-6">
                 True Randomness - Quantum measurement provides genuine randomness, not pseudo-random algorithms{'\n'}
                 Simulator First - Qiskit Aer simulator works without IBM credentials{'\n'}
                 BYO IBM - Add optional IBM credentials for hardware workflows{'\n'}
                 Low Latency - Optimized for fast responses with connection pooling{'\n'}
                 CORS Enabled - Ready for web applications and cross-origin requests{'\n'}
                 Detailed Responses - Get measurement results, superposition strength, and quantum state info{'\n'}
              </ThemedText>
            </View>
          </View>

          {/* Base URL & API Docs */}
          <View className="gap-3">
            <View 
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: accentColor,
                borderLeftColor: tintColor,
              }}
            >
              <ThemedText type="defaultSemiBold" className="mb-1.5 text-secondary">
                Base URL
              </ThemedText>
              <ExternalLink 
                href={apiBaseUrl}
                className="font-mono text-sm"
                style={{ color: tintColor }}
              >
                {apiBaseUrl}
              </ExternalLink>
            </View>

            {/* OpenAPI/Swagger Button */}
            <ExternalLink 
              href={apiDocsUrl}
              className="py-3.5 px-5 rounded-lg flex-row items-center justify-center gap-2.5"
              style={{
                backgroundColor: tintColor,
              }}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <ThemedText className="font-bold text-white text-base">
                View Interactive API Docs (Swagger UI)
              </ThemedText>
            </ExternalLink>
          </View>
        </View>

        <QuantumAuthDashboardCard baseUrl={apiBaseUrl} />

        {/* Endpoints Section */}
        <View className="mb-7.5">
          <ThemedText type="subtitle" className="mb-4">
             Endpoints
          </ThemedText>

          {endpointsToRender.map((endpoint) => {
            const normalizedMethod = String(endpoint.method ?? 'GET').toUpperCase();
            const methodForCard =
              normalizedMethod === 'GET' ||
              normalizedMethod === 'POST' ||
              normalizedMethod === 'PUT' ||
              normalizedMethod === 'DELETE' ||
              normalizedMethod === 'PATCH'
                ? normalizedMethod
                : 'GET';

            return (
              <EndpointCard
                key={`${normalizedMethod}:${endpoint.path}`}
                method={methodForCard}
                path={endpoint.path}
                summary={endpoint.summary}
                description={endpoint.description}
                auth={endpoint.auth ?? 'public'}
                parameters={endpoint.parameters}
                requestBody={endpoint.requestBody}
                responses={endpoint.responses}
                baseUrl={apiBaseUrl}
                extraHeaders={endpoint.auth === 'api_key' && HAS_QUANTUM_API_KEY ? QUANTUM_API_HEADERS : undefined}
                liveDisabledReason={authHintForEndpoint(endpoint.auth)}
              />
            );
          })}

          {!hasRemoteEndpoints ? (
            <View
              className="p-4 rounded-lg"
              style={{
                backgroundColor: accentColor,
              }}
            >
              <ThemedText className="opacity-80">
                Unable to sync endpoint metadata from {QUANTUM_PORTFOLIO_URL}. Showing local fallback endpoint docs.
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* Quantum Mechanics Explainer */}
        <View className="mb-7.5">
          <Pressable 
            onPress={() => setIsQuantumMechanicsExpanded(!isQuantumMechanicsExpanded)}
            className={`p-4 rounded-lg ${isQuantumMechanicsExpanded ? 'mb-4' : ''}`}
            style={{
              backgroundColor: accentColor,
            }}
          >
            <View className="flex-row items-center justify-between">
              <ThemedText type="subtitle" className="detail-section-header text-2xl md:text-3xl" style={{ color: textColor }}>
                What is Quantum Mechanics?
              </ThemedText>
              <ThemedText className="detail-body text-lg md:text-xl" style={{ color: textColor }}>
                {isQuantumMechanicsExpanded ? 'v' : '>'}
              </ThemedText>
            </View>
          </Pressable>
          
          {isQuantumMechanicsExpanded && (
            <View 
              className="p-5 rounded-lg gap-4"
              style={{
                backgroundColor: accentColor,
              }}
            >
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader text-xl md:text-2xl mb-2">
                  Understanding Quantum Mechanics
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  Quantum mechanics is the physics of the very small - atoms, electrons, and photons. At this scale, 
                  particles behave very differently than in our everyday world. They can exist in multiple states at once 
                  (superposition), be mysteriously connected across distances (entanglement), and change when observed 
                  (measurement collapse). It's weird, mind-bending, and completely real.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader text-xl md:text-2xl mb-2">
                  Quantum vs Classical Computing
                </ThemedText>
                <View className="gap-2">
                  <View className="flex-row">
                    <ThemedText className="font-bold flex-1 detail-body text-base md:text-lg">Aspect</ThemedText>
                    <ThemedText className="font-bold flex-1 detail-body text-base md:text-lg">Classical Bit</ThemedText>
                    <ThemedText className="font-bold flex-1 detail-body text-base md:text-lg">Quantum Qubit</ThemedText>
                  </View>
                  <View className="flex-row p-2 rounded-md" style={{ backgroundColor: backgroundColor }}>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">State</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">0 or 1</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">0 AND 1 superposition</ThemedText>
                  </View>
                  <View className="flex-row p-2">
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Gates</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Deterministic</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Can be probabilistic</ThemedText>
                  </View>
                  <View className="flex-row p-2 rounded-md" style={{ backgroundColor: backgroundColor }}>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Measurement</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Read current value</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Collapses randomly</ThemedText>
                  </View>
                  <View className="flex-row p-2">
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Rotation</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Not possible</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-base">Creates superposition</ThemedText>
                  </View>
                </View>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader text-xl md:text-2xl mb-2">
                  What is Quantum Computing?
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  Traditional computers use bits (0 or 1). Quantum computers use qubits that can be 0, 1, or BOTH 
                  simultaneously (superposition). This lets them explore many possibilities at once. When you "measure" 
                  a qubit, it collapses to either 0 or 1 - but which one it becomes is fundamentally random and influenced 
                  by the quantum state you created.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader text-xl md:text-2xl mb-2">
                  How This API Works
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  This API uses IBM's Qiskit library to simulate quantum circuits. When you call the /gates/run endpoint, 
                  the server creates a quantum circuit, applies a rotation gate (RY) at your chosen angle, then measures the 
                  qubit. The measurement forces the quantum state to collapse into either 0 or 1, giving you TRUE quantum 
                  randomness (not pseudo-random like typical computer algorithms). The angle you choose determines how likely 
                  each outcome is - it's probability, but rooted in fundamental physics.
                </ThemedText>
              </View>

              {/* Simulator vs Hardware Disclaimer */}
              <View className="p-3.5 rounded-lg border-2" style={{
                backgroundColor: '#f59e0b20',
                borderColor: '#f59e0b60',
              }}>
                <View className="flex-row items-center mb-2">
                  <ThemedText className="mr-2 text-[2%]">!</ThemedText>
                  <ThemedText type="defaultSemiBold" className="detail-subheader text-[2%]">
                    Important: Simulator vs Real Quantum Hardware
                  </ThemedText>
                </View>
                
                <ThemedText className="detail-body opacity-90 mb-3 text-[1.9%] leading-[2.6%]">
                  Currently, this API uses the <ThemedText className="font-bold">Qiskit Aer Simulator</ThemedText> - 
                  a classical computer simulating quantum behavior. Here's what that means:
                </ThemedText>

                <View className="pl-3 gap-2.5 mb-3">
                  <View>
                    <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                      What the Simulator Does
                    </ThemedText>
                    <ThemedText className="detail-body opacity-90 text-[1.8%] leading-[2.4%]">
                      The simulator mathematically calculates what a quantum computer WOULD do. It uses the actual quantum 
                      mechanics equations (Schrodinger equation, unitary matrices) to compute superposition states and 
                      measurement probabilities. The randomness comes from Python's pseudo-random number generator weighted 
                      by quantum probabilities - so it's <ThemedText className="italic">statistically</ThemedText> correct 
                      but not fundamentally random.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                      Is It "Really" Quantum?
                    </ThemedText>
                    <ThemedText className="detail-body opacity-90 text-[1.8%] leading-[2.4%]">
                      The <ThemedText className="font-bold">math is 100% quantum</ThemedText> - it follows the same 
                      rules as real quantum hardware. But the <ThemedText className="font-bold">physical process is classical.</ThemedText>
                      Think of it like: playing a racing game (simulator) vs actually driving a car (hardware). The game uses real 
                      physics equations, but you're not experiencing actual G-forces.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                      What Makes Real Quantum Hardware Different
                    </ThemedText>
                    <ThemedText className="detail-body opacity-90 text-[1.8%] leading-[2.4%]">
                      Real quantum hardware uses <ThemedText className="font-bold">actual physical qubits</ThemedText> - 
                      superconducting circuits, trapped ions, or photons - operating at near absolute zero (-273C). When you 
                      measure these, the wavefunction collapse is a REAL physical event governed by quantum mechanics, not 
                      a random number generator. That's true, unclonable, fundamentally unpredictable randomness. Plus, 
                      real hardware has noise, decoherence, and other quantum weirdness that's hard to simulate.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                      Hardware Access Model
                    </ThemedText>
                    <ThemedText className="detail-body opacity-90 text-[1.8%] leading-[2.4%]">
                      IBM hardware access follows a <ThemedText className="font-bold">BYO credential model</ThemedText>.
                      Simulator mode remains available without IBM credentials. If you save and verify your
                      own IBM profile, you can route jobs to IBM hardware backends through this same API key.
                      Hardware jobs are asynchronous and can take longer due to queueing and provider limits.
                      
                    </ThemedText>
                  </View>
                </View>

                <ThemedText className="detail-body opacity-80 italic text-[1.7%] leading-[2.4%]">
                   Bottom line: This simulator is perfect for learning, development, and applications where quantum-correct 
                  probability distributions matter more than fundamental randomness. For cryptographic security or quantum 
                  research, real hardware would be necessary.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-[2%]">
                  What's Possible with Quantum Computing
                </ThemedText>
                <ThemedText className="detail-body opacity-90 mb-3 text-[1.9%] leading-[2.6%]">
                  Quantum computing has incredible potential for:
                </ThemedText>
                <View className="pl-3 gap-2">
                  <ThemedText className="detail-body opacity-90 text-[1.8%] leading-[2.4%]">
                     Breaking encryption and creating unbreakable quantum encryption{"\n"}
                     Simulating molecules for drug discovery and materials science{"\n"}
                     Optimizing complex systems (logistics, finance, AI training){"\n"}
                     True random number generation for security and gaming{"\n"}
                     Solving problems exponentially faster than classical computers{"\n"}
                     Machine learning with quantum neural networks
                  </ThemedText>
                </View>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-[2%]">
                  My Quantum Computing Journey
                </ThemedText>
                <ThemedText className="detail-body opacity-90 mb-3 text-[1.9%] leading-[2.6%]">
                  Here's what I've built and what I'm planning:
                </ThemedText>
                
                <View
                  className="p-3.5 rounded-lg gap-2.5"
                  style={{
                    backgroundColor: backgroundColor,
                  }}
                >
                  {/* Completed Items */}
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 detail-body text-[1.8%] text-success">[x]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-[1.8%]">
                      Quantum Gate API - RY rotation gates for true randomness
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 detail-body text-[1.8%] text-success">[x]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-[1.8%]">
                      Quantum Text Transformation - Unicode effects powered by quantum randomness
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 detail-body text-[1.8%] text-success">[x]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-90 text-[1.8%]">
                      Portfolio Integration - Live quantum animation in Quantum Echo project
                    </ThemedText>
                  </View>
                  
                  {/* To-Do Items */}
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Multi-qubit circuits for more complex quantum states
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Quantum entanglement demonstration API
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Grover's algorithm for quantum search
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Quantum random number generator (QRNG) endpoint
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Quantum game mechanics for procedural generation
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Quantum circuit visualization in the API response
                    </ThemedText>
                  </View>
                  <View className="flex-row items-start">
                    <ThemedText className="mr-2 opacity-60 text-[1.8%]">[ ]</ThemedText>
                    <ThemedText className="flex-1 detail-body opacity-75 text-[1.8%]">
                      Real quantum hardware access via IBM Quantum cloud
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View 
                className="p-3.5 rounded-lg border"
                style={{
                  backgroundColor: tintColor + '20',
                  borderColor: tintColor + '40',
                }}
              >
                <ThemedText className="detail-body opacity-90 italic text-[1.8%] leading-[2.5%]">
                   Fun fact: The randomness from quantum measurement is the ONLY truly random process in the universe. 
                  Everything else (dice rolls, coin flips, random() functions) is technically predictable if you know all 
                  the variables. Quantum randomness is fundamentally unpredictable - even in theory.
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* How to Use Section */}
        <View className="mb-7.5">
          <Pressable 
            onPress={() => setIsHowToUseExpanded(!isHowToUseExpanded)}
            className={`p-4 rounded-lg ${isHowToUseExpanded ? 'mb-4' : ''}`}
            style={{
              backgroundColor: accentColor,
            }}
          >
            <View className="flex-row items-center justify-between">
              <ThemedText type="subtitle" className="detail-section-header text-2xl md:text-3xl" style={{ color: textColor }}>
                How to Use This API
              </ThemedText>
              <ThemedText className="detail-body text-lg md:text-xl" style={{ color: textColor }}>
                {isHowToUseExpanded ? 'v' : '>'}
              </ThemedText>
            </View>
          </Pressable>
          
          {isHowToUseExpanded && (
            <View 
              className="p-5 rounded-lg gap-4"
              style={{
                backgroundColor: accentColor,
              }}
            >
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
                  1. What is an API?
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  An API (Application Programming Interface) lets your code talk to a server on the internet. 
                  Think of it like ordering food - you send a request ("I want quantum randomness"), and the server 
                  sends back a response (the random result).
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
                  2. Making Requests
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  Use the base URL + endpoint path. For example:{"\n\n"}
                  <ThemedText className="font-mono text-sm md:text-base">
                    {apiBaseUrl}/gates/run
                  </ThemedText>
                  {"\n\n"}
                  For public GET requests (like /health), visit the URL directly. For protected endpoints (like /gates/run or /echo-types),
                  send <ThemedText className="font-mono">X-API-Key</ThemedText> with your request.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
                  3. Understanding the Response
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  The server always responds with JSON data (a structured text format). You'll get back information 
                  like the quantum measurement result, superposition strength, and more. Use the interactive "Try It Out" 
                  sections above to see real responses!
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
                  4. Authentication and Key Management
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  Phase 3.75 uses Identerest Account auth for key management on this page. Sign in with an email magic link or GitHub, then create, rotate, and revoke Quantum API keys from the dashboard above.{"\n\n"}
                  IBM credentials are optional. Without them, simulator-backed features still work. With BYO IBM credentials, the same account can use IBM backend discovery, transpilation, and async hardware jobs.{"\n\n"}
                  Public routes include <ThemedText className="font-mono">/v1/health</ThemedText> and{' '}
                  <ThemedText className="font-mono">/v1/portfolio.json</ThemedText>. Most runtime endpoints require an API key in{' '}
                  <ThemedText className="font-mono">X-API-Key</ThemedText>.{"\n\n"}
                  <ThemedText className="font-bold">Fair Use Policy:</ThemedText> Keep requests reasonable and expect rate limiting
                  on protected endpoints.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
                  5. Quick Start
                </ThemedText>
                <ThemedText className="detail-body opacity-90 text-base md:text-lg leading-relaxed">
                  Try visiting this URL in your browser right now:{"\n\n"}
                  <ExternalLink 
                    href={`${apiBaseUrl}/health`}
                    className="underline font-mono text-sm md:text-base"
                    style={{ color: tintColor }}
                  >
                    {apiBaseUrl}/health
                  </ExternalLink>
                  {"\n\n"}
                  You will see a health payload. Then add <ThemedText className="font-mono">X-API-Key</ThemedText> to call protected routes like /gates/run.
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Code Examples Section */}
        <View className="mb-7.5">
          <ThemedText type="subtitle" className="detail-section-header mb-4 text-2xl md:text-3xl">
             Code Examples
          </ThemedText>
          {/* JavaScript Example */}
          <View className="mb-5">
            <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
              JavaScript / TypeScript
            </ThemedText>
            <View className="p-4 rounded-lg bg-(--color-code-bg)">
              <ScrollView horizontal>
                <ThemedText className="font-mono text-sm md:text-base text-(--color-code-text) leading-relaxed">
{`const response = await fetch(
  '${apiBaseUrl}/gates/run',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '<your_api_key>'
    },
    body: JSON.stringify({
      gate_type: 'rotation',
      rotation_angle_rad: Math.PI / 2
    })
  }
);

const result = await response.json();
console.log('Measurement:', result.measurement);
console.log('Superposition:', result.superposition_strength);`}
                </ThemedText>
              </ScrollView>
            </View>
          </View>

          {/* Python Example */}
          <View className="mb-5">
            <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
              Python
            </ThemedText>
            <View className="p-4 rounded-lg bg-(--color-code-bg)">
              <ScrollView horizontal>
                <ThemedText className="font-mono text-sm md:text-base text-(--color-code-text) leading-relaxed">
{`import requests
import math

response = requests.post(
  '${apiBaseUrl}/gates/run',
    headers={'X-API-Key': '<your_api_key>'},
    json={
        'gate_type': 'rotation',
        'rotation_angle_rad': math.pi / 2
    }
)

result = response.json()
print(f"Measurement: {result['measurement']}")
print(f"Superposition: {result['superposition_strength']}")`}
                </ThemedText>
              </ScrollView>
            </View>
          </View>

          {/* cURL Example */}
          <View>
            <ThemedText type="defaultSemiBold" className="detail-subheader mb-2 text-xl md:text-2xl">
              cURL
            </ThemedText>
            <View className="p-4 rounded-lg bg-(--color-code-bg)">
              <ScrollView horizontal>
                <ThemedText className="font-mono text-sm md:text-base text-(--color-code-text) leading-relaxed">
{`curl -X POST ${apiBaseUrl}/gates/run \\
  -H "X-API-Key: <your_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"gate_type":"rotation","rotation_angle_rad":1.5708}'`}
                </ThemedText>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Technical Details Section */}
        <View className="mb-7.5">
          <ThemedText type="subtitle" className="detail-section-header mb-4 text-[2.2%]">
             Technical Details
          </ThemedText>
          
          <View
            className="p-4 rounded-lg"
            style={{
              backgroundColor: accentColor,
            }}
          >
            <View className="gap-3">
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                  Backend Technology
                </ThemedText>
                <ThemedText className="detail-body opacity-85 text-[1.8%]">
                  Python 3.11 with FastAPI framework
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                  Quantum Simulator
                </ThemedText>
                <ThemedText className="detail-body opacity-85 text-[1.8%]">
                  IBM Qiskit Aer Simulator (latest version)
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                  Hosting
                </ThemedText>
                <ThemedText className="detail-body opacity-85 text-[1.8%]">
                  Self-hosted VPS with Nginx reverse proxy
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                  Protocol
                </ThemedText>
                <ThemedText className="detail-body opacity-85 text-[1.8%]">
                  HTTPS (SSL/TLS encryption)
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Use Cases Section */}
        <View className="mb-7.5">
          <ThemedText type="subtitle" className="detail-section-header mb-4 text-[2.2%]">
             Use Cases
          </ThemedText>
          
          <View className="gap-3">
            {[
              { title: 'Game Development', desc: 'Generate truly random loot drops, critical hits, or procedural generation seeds' },
              { title: 'Creative Applications', desc: 'Create unique quantum-powered animations and visual effects' },
              { title: 'Randomization Services', desc: 'Lottery systems, contest winners, A/B testing with quantum fairness' },
              { title: 'Educational Tools', desc: 'Demonstrate quantum computing concepts interactively' },
              { title: 'Quantum Text Art', desc: 'Transform text with quantum-inspired Unicode effects' },
            ].map((useCase, index) => (
              <View 
                key={index}
                className="p-3.5 rounded-lg"
                style={{
                  backgroundColor: accentColor,
                }}
              >
                <ThemedText type="defaultSemiBold" className="detail-subheader mb-1 text-[1.9%]">
                  {useCase.title}
                </ThemedText>
                <ThemedText className="detail-body opacity-85 text-[1.8%]">
                  {useCase.desc}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Live API Demo */}
        <View className="mb-5">
          <ThemedText type="subtitle" className="detail-section-header mb-4 text-2xl md:text-3xl">
             Live Demo
          </ThemedText>
          <View 
            className="p-5 rounded-lg"
            style={{
              backgroundColor: accentColor,
            }}
          >
            <ThemedText className="detail-body opacity-90 text-center mb-4 text-lg md:text-xl leading-relaxed">
               This is the actual quantum animation from my Quantum Echo project. 
              It's making a LIVE call to this API right now! Watch it run a 30-second 
              quantum circuit simulation with real Qiskit code.
            </ThemedText>
            
            {/* Live Quantum Animation */}
            <HelloWave />
            
            <ThemedText className="detail-body opacity-85 text-center mt-4 italic text-base md:text-lg leading-relaxed">
              Every time this loads, it calls POST /gates/run with a random rotation angle, 
              runs a quantum simulation, measures the qubit, and uses the result to control 
              the animation's behavior. This is quantum computing in action!
            </ThemedText>
          </View>
        </View>
        {/* Portfolio Data Sync Note */}
        <View
          className="mt-6 rounded-lg p-3.5 flex-row items-center gap-2.5"
          style={{
            backgroundColor: accentColor,
          }}
        >
          <Ionicons
            name={isDetailSynced ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={18}
            color={isDetailSynced ? tintColor : textColor}
            className="opacity-90"
          />
          <ThemedText className="detail-body opacity-80 flex-1 text-base md:text-lg">
            {isDetailSynced
              ? `Synced from ${QUANTUM_PORTFOLIO_URL}`
              : 'Using local portfolio metadata (offline / fetch failed)'}
          </ThemedText>
        </View>
      </PublicFacingDetailWrapper>
  );
}


