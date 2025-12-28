import React, { useState } from 'react';
import { View, ScrollView, Pressable, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { styles } from '@/constants/styles';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { EndpointCard } from '@/components/APIComponents';
import { ExternalLink } from '@/components/ExternalLink';
import { HelloWave } from '@/components/QuantumAnimation';
import apisData from '@/assets/json/apis.json';

const QUANTUM_BASE_URL = 'https://davidjgrimsley.com/api/quantum';

export default function QuantumAPIPage() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [isHowToUseExpanded, setIsHowToUseExpanded] = useState(false);
  const [isQuantumMechanicsExpanded, setIsQuantumMechanicsExpanded] = useState(false);

  return (
    <View style={[styles.page, { backgroundColor }]}>
      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          paddingVertical: 30,
          paddingBottom: 60,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {/* Icon box */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: tintColor + '33',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="nuclear" size={40} color={tintColor} />
            </View>

            {/* Title + version */}
            <View style={{ flex: 1, flexDirection: 'row', marginRight: 8 }}>
              <ThemedText
                type="title"
                style={{
                  fontSize: RFPercentage(3.5),
                }}
              >
                {apisData.apis[0].name}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: RFPercentage(1.6),
                  opacity: 0.6,
                  marginTop: 2,
                }}
              >
                v{apisData.apis[0].version}
              </ThemedText>
            </View>

            {/* Live badge */}
            <View
              style={{
                backgroundColor: '#10b981',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                marginLeft: 8,
              }}
            >
              <ThemedText
                style={{
                  fontSize: RFPercentage(1.4),
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                ● LIVE
              </ThemedText>
            </View>
          </View>

          <ThemedText style={{ 
            fontSize: RFPercentage(1.9),
            lineHeight: RFPercentage(2.7),
            opacity: 0.85,
            marginBottom: 16
          }}>
            General-purpose quantum computing services for games and applications. 
            Run real quantum circuits using Qiskit Aer Simulator to generate truly 
            random numbers, transform text, and create unique quantum-powered experiences.
          </ThemedText>

          {/* Features Section */}
          <View style={{ marginBottom: 16 }}>
            <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 12 }}>
              Features
            </ThemedText>
            <View style={{ paddingLeft: 8 }}>
              <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.4), opacity: 0.85 }}>
                • True Randomness - Quantum measurement provides genuine randomness, not pseudo-random algorithms{'\n'}
                • Qiskit Backend - Powered by IBM Qiskit Aer Simulator running on Python server{'\n'}
                • Low Latency - Optimized for fast responses with connection pooling{'\n'}
                • CORS Enabled - Ready for web applications and cross-origin requests{'\n'}
                • Detailed Responses - Get measurement results, superposition strength, and quantum state info
              </ThemedText>
            </View>
          </View>

          {/* Base URL & API Docs */}
          <View style={{ gap: 12 }}>
            <View style={{
              backgroundColor: accentColor,
              padding: 16,
              borderRadius: 10,
              borderLeftWidth: 4,
              borderLeftColor: tintColor,
            }}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.5), marginBottom: 6 }}>
                Base URL
              </ThemedText>
              <ExternalLink 
                href={QUANTUM_BASE_URL}
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: RFPercentage(1.6),
                  color: tintColor,
                }}
              >
                {QUANTUM_BASE_URL}
              </ExternalLink>
            </View>

            {/* OpenAPI/Swagger Button */}
            <ExternalLink 
              href={`${QUANTUM_BASE_URL}/docs`}
              style={{
                backgroundColor: tintColor,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <ThemedText style={{ 
                color: '#fff',
                fontSize: RFPercentage(1.8),
                fontWeight: 'bold',
              }}>
                View Interactive API Docs (Swagger UI)
              </ThemedText>
            </ExternalLink>
          </View>
        </View>

        {/* Endpoints Section */}
        <View style={{ marginBottom: 30 }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 16 }}>
            📡 Endpoints
          </ThemedText>

          {/* Quantum Gate */}
          <EndpointCard
            method="POST"
            path="/quantum_gate"
            summary="Apply quantum gate operation"
            description="Execute a quantum gate operation on a single qubit. Supports rotation gates (RY) with custom angles. The qubit starts in |0⟩ state, gets rotated, then measured to collapse the wavefunction."
            parameters={[
              {
                name: 'gate_type',
                type: 'string',
                required: true,
                description: 'Type of quantum gate to apply (currently supports "rotation")',
                example: 'rotation'
              },
              {
                name: 'rotation_angle',
                type: 'number',
                required: true,
                description: 'Angle in radians for RY rotation gate (0 to π). Higher angles create more superposition.',
                example: 1.5708
              }
            ]}
            requestBody={{
              description: 'Quantum gate configuration',
              example: {
                gate_type: 'rotation',
                rotation_angle: 1.5708
              }
            }}
            responses={[
              {
                code: '200',
                description: 'Quantum gate result',
                example: {
                  measurement: 1,
                  superposition_strength: 0.9245,
                  rotation_angle: 1.5708,
                  quantum_state: '|ψ⟩ = cos(0.785)|0⟩ + sin(0.785)|1⟩'
                }
              },
              {
                code: '400',
                description: 'Invalid gate parameters'
              },
              {
                code: '500',
                description: 'Quantum simulation error'
              }
            ]}
            baseUrl={QUANTUM_BASE_URL}
          />

          {/* Quantum Text */}
          <EndpointCard
            method="POST"
            path="/quantum_text"
            summary="Transform text using quantum effects"
            description="Apply quantum-inspired transformations to text strings. Uses quantum randomness to determine transformation strength and type."
            parameters={[
              {
                name: 'text',
                type: 'string',
                required: true,
                description: 'The text string to transform',
                example: 'Hello Quantum World'
              }
            ]}
            requestBody={{
              description: 'Text transformation request',
              example: {
                text: 'Hello Quantum World'
              }
            }}
            responses={[
              {
                code: '200',
                description: 'Transformed text result',
                example: {
                  original: 'Hello Quantum World',
                  transformed: 'ⒽⒺⓁⓁⓄ ⓆⓊⒶⓃⓉⓊⓂ ⓌⓄⓇⓁⒹ',
                  transformation_type: 'circled',
                  quantum_seed: 42
                }
              }
            ]}
            baseUrl={QUANTUM_BASE_URL}
          />

          {/* Echo Types */}
          <EndpointCard
            method="GET"
            path="/quantum_echo_types"
            summary="List available transformation types"
            description="Get a list of all available quantum text transformation types and their descriptions."
            baseUrl={QUANTUM_BASE_URL}
            responses={[
              {
                code: '200',
                description: 'List of transformation types',
                example: {
                  types: ['circled', 'squared', 'inverted', 'script', 'bold']
                }
              }
            ]}
          />

          {/* Health Check */}
          <EndpointCard
            method="GET"
            path="/health"
            summary="Health check endpoint"
            description="Check if the quantum server is running and responsive. Returns server status and uptime."
            baseUrl={QUANTUM_BASE_URL}
            responses={[
              {
                code: '200',
                description: 'Server is healthy',
                example: {
                  status: 'healthy',
                  service: 'Quantum API',
                  version: '1.0.0'
                }
              }
            ]}
          />
        </View>

        {/* Quantum Mechanics Explainer */}
        <View style={{ marginBottom: 30 }}>
          <Pressable 
            onPress={() => setIsQuantumMechanicsExpanded(!isQuantumMechanicsExpanded)}
            style={{
              backgroundColor: accentColor,
              padding: 16,
              borderRadius: 10,
              marginBottom: isQuantumMechanicsExpanded ? 16 : 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
                What is Quantum Mechanics?
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(2) }}>
                {isQuantumMechanicsExpanded ? '▼' : '▶'}
              </ThemedText>
            </View>
          </Pressable>
          
          {isQuantumMechanicsExpanded && (
            <View style={{
              backgroundColor: accentColor,
              padding: 20,
              borderRadius: 10,
              gap: 16,
            }}>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  Understanding Quantum Mechanics
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  Quantum mechanics is the physics of the very small - atoms, electrons, and photons. At this scale, 
                  particles behave very differently than in our everyday world. They can exist in multiple states at once 
                  (superposition), be mysteriously connected across distances (entanglement), and change when observed 
                  (measurement collapse). It's weird, mind-bending, and completely real.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  What is Quantum Computing?
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  Traditional computers use bits (0 or 1). Quantum computers use qubits that can be 0, 1, or BOTH 
                  simultaneously (superposition). This lets them explore many possibilities at once. When you "measure" 
                  a qubit, it collapses to either 0 or 1 - but which one it becomes is fundamentally random and influenced 
                  by the quantum state you created.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  How This API Works
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  This API uses IBM's Qiskit library to simulate quantum circuits. When you call the /quantum_gate endpoint, 
                  the server creates a quantum circuit, applies a rotation gate (RY) at your chosen angle, then measures the 
                  qubit. The measurement forces the quantum state to collapse into either 0 or 1, giving you TRUE quantum 
                  randomness (not pseudo-random like typical computer algorithms). The angle you choose determines how likely 
                  each outcome is - it's probability, but rooted in fundamental physics.
                </ThemedText>
              </View>

              {/* Simulator vs Hardware Disclaimer */}
              <View style={{
                backgroundColor: '#f59e0b20',
                borderColor: '#f59e0b60',
                borderWidth: 2,
                padding: 14,
                borderRadius: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <ThemedText style={{ fontSize: RFPercentage(2), marginRight: 8 }}>⚠️</ThemedText>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8) }}>
                    Important: Simulator vs Real Quantum Hardware
                  </ThemedText>
                </View>
                
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85, marginBottom: 12 }}>
                  Currently, this API uses the <ThemedText style={{ fontWeight: 'bold' }}>Qiskit Aer Simulator</ThemedText> - 
                  a classical computer simulating quantum behavior. Here's what that means:
                </ThemedText>

                <View style={{ paddingLeft: 12, gap: 10, marginBottom: 12 }}>
                  <View>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                      What the Simulator Does
                    </ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.85 }}>
                      The simulator mathematically calculates what a quantum computer WOULD do. It uses the actual quantum 
                      mechanics equations (Schrödinger equation, unitary matrices) to compute superposition states and 
                      measurement probabilities. The randomness comes from Python's pseudo-random number generator weighted 
                      by quantum probabilities - so it's <ThemedText style={{ fontStyle: 'italic' }}>statistically</ThemedText> correct 
                      but not fundamentally random.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                      Is It "Really" Quantum?
                    </ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.85 }}>
                      The <ThemedText style={{ fontWeight: 'bold' }}>math is 100% quantum</ThemedText> - it follows the same 
                      rules as real quantum hardware. But the <ThemedText style={{ fontWeight: 'bold' }}>physical process is classical</ThemedText>. 
                      Think of it like: playing a racing game (simulator) vs actually driving a car (hardware). The game uses real 
                      physics equations, but you're not experiencing actual G-forces.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                      What Makes Real Quantum Hardware Different
                    </ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.85 }}>
                      Real quantum hardware uses <ThemedText style={{ fontWeight: 'bold' }}>actual physical qubits</ThemedText> - 
                      superconducting circuits, trapped ions, or photons - operating at near absolute zero (-273°C). When you 
                      measure these, the wavefunction collapse is a REAL physical event governed by quantum mechanics, not 
                      a random number generator. That's true, unclonable, fundamentally unpredictable randomness. Plus, 
                      real hardware has noise, decoherence, and other quantum weirdness that's hard to simulate.
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                      Future Plans
                    </ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.85 }}>
                      I plan to integrate <ThemedText style={{ fontWeight: 'bold' }}>IBM Quantum's real hardware</ThemedText> via 
                      their cloud API. This will let this API run circuits on actual quantum processors (like their 127-qubit Eagle 
                      or 433-qubit Osprey chips). The results will be TRULY quantum - fundamentally random, with real quantum 
                      noise. The tradeoff? Real hardware has limited availability, longer wait times, and costs money after 
                      free tier limits.
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={{ fontSize: RFPercentage(1.4), lineHeight: RFPercentage(2.1), opacity: 0.75, fontStyle: 'italic' }}>
                  💡 Bottom line: This simulator is perfect for learning, development, and applications where quantum-correct 
                  probability distributions matter more than fundamental randomness. For cryptographic security or quantum 
                  research, real hardware would be necessary.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  What's Possible with Quantum Computing
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85, marginBottom: 12 }}>
                  Quantum computing has incredible potential for:
                </ThemedText>
                <View style={{ paddingLeft: 12, gap: 8 }}>
                  <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.85 }}>
                    • Breaking encryption and creating unbreakable quantum encryption{"\n"}
                    • Simulating molecules for drug discovery and materials science{"\n"}
                    • Optimizing complex systems (logistics, finance, AI training){"\n"}
                    • True random number generation for security and gaming{"\n"}
                    • Solving problems exponentially faster than classical computers{"\n"}
                    • Machine learning with quantum neural networks
                  </ThemedText>
                </View>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  My Quantum Computing Journey
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85, marginBottom: 12 }}>
                  Here's what I've built and what I'm planning:
                </ThemedText>
                
                <View style={{
                  backgroundColor: backgroundColor,
                  padding: 14,
                  borderRadius: 8,
                  gap: 10,
                }}>
                  {/* Completed Items */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, color: '#10b981' }}>✓</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.85 }}>
                      Quantum Gate API - RY rotation gates for true randomness
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, color: '#10b981' }}>✓</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.85 }}>
                      Quantum Text Transformation - Unicode effects powered by quantum randomness
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, color: '#10b981' }}>✓</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.85 }}>
                      Portfolio Integration - Live quantum animation in Quantum Echo project
                    </ThemedText>
                  </View>
                  
                  {/* To-Do Items */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Multi-qubit circuits for more complex quantum states
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Quantum entanglement demonstration API
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Grover's algorithm for quantum search
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Quantum random number generator (QRNG) endpoint
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Quantum game mechanics for procedural generation
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Quantum circuit visualization in the API response
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ThemedText style={{ fontSize: RFPercentage(1.6), marginRight: 8, opacity: 0.5 }}>☐</ThemedText>
                    <ThemedText style={{ fontSize: RFPercentage(1.5), flex: 1, opacity: 0.7 }}>
                      Real quantum hardware access via IBM Quantum cloud
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={{
                backgroundColor: tintColor + '20',
                borderColor: tintColor + '40',
                borderWidth: 1,
                padding: 14,
                borderRadius: 8,
              }}>
                <ThemedText style={{ fontSize: RFPercentage(1.5), lineHeight: RFPercentage(2.2), opacity: 0.9, fontStyle: 'italic' }}>
                  💡 Fun fact: The randomness from quantum measurement is the ONLY truly random process in the universe. 
                  Everything else (dice rolls, coin flips, random() functions) is technically predictable if you know all 
                  the variables. Quantum randomness is fundamentally unpredictable - even in theory.
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* How to Use Section */}
        <View style={{ marginBottom: 30 }}>
          <Pressable 
            onPress={() => setIsHowToUseExpanded(!isHowToUseExpanded)}
            style={{
              backgroundColor: accentColor,
              padding: 16,
              borderRadius: 10,
              marginBottom: isHowToUseExpanded ? 16 : 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5) }}>
                How to Use This API
              </ThemedText>
              <ThemedText style={{ fontSize: RFPercentage(2) }}>
                {isHowToUseExpanded ? '▼' : '▶'}
              </ThemedText>
            </View>
          </Pressable>
          
          {isHowToUseExpanded && (
            <View style={{
              backgroundColor: accentColor,
              padding: 20,
              borderRadius: 10,
              gap: 16,
            }}>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  1. What is an API?
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  An API (Application Programming Interface) lets your code talk to a server on the internet. 
                  Think of it like ordering food - you send a request ("I want quantum randomness"), and the server 
                  sends back a response (the random result).
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  2. Making Requests
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  Use the base URL + endpoint path. For example:{"\n\n"}
                  <ThemedText style={{ fontFamily: 'monospace', fontSize: RFPercentage(1.5) }}>
                    {QUANTUM_BASE_URL}/quantum_gate
                  </ThemedText>
                  {"\n\n"}
                  For GET requests (like /health), just visit the URL. For POST requests (like /quantum_gate), 
                  you need to send data in JSON format.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  3. Understanding the Response
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  The server always responds with JSON data (a structured text format). You'll get back information 
                  like the quantum measurement result, superposition strength, and more. Use the interactive "Try It Out" 
                  sections above to see real responses!
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  4. No Authentication or Rate Limits
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  This API is completely free and open - no API keys, no signup, no login. Just start making requests!{"\n\n"}
                  <ThemedText style={{ fontWeight: 'bold' }}>Fair Use Policy:</ThemedText> Please be respectful and don't spam the server. 
                  Excessive requests may be rate-limited. Recommended limit: ~100 requests/minute per IP.
                </ThemedText>
              </View>

              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
                  5. Quick Start
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.6), lineHeight: RFPercentage(2.3), opacity: 0.85 }}>
                  Try visiting this URL in your browser right now:{"\n\n"}
                  <ExternalLink 
                    href={`${QUANTUM_BASE_URL}/health`}
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: RFPercentage(1.5),
                      color: tintColor,
                      textDecorationLine: 'underline'
                    }}
                  >
                    {QUANTUM_BASE_URL}/health
                  </ExternalLink>
                  {"\n\n"}
                  You'll see a JSON response showing the server is alive. That's your first API call!
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Code Examples Section */}
        <View style={{ marginBottom: 30 }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 16 }}>
            💻 Code Examples
          </ThemedText>
          {/* JavaScript Example */}
          <View style={{ marginBottom: 20 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
              JavaScript / TypeScript
            </ThemedText>
            <View style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              borderRadius: 10,
            }}>
              <ScrollView horizontal>
                <ThemedText style={{ 
                  fontFamily: 'monospace',
                  fontSize: RFPercentage(1.4),
                  color: '#d4d4d4'
                }}>
{`const response = await fetch(
  'https://davidjgrimsley.com/api/quantum/quantum_gate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gate_type: 'rotation',
      rotation_angle: Math.PI / 2
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
          <View style={{ marginBottom: 20 }}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
              Python
            </ThemedText>
            <View style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              borderRadius: 10,
            }}>
              <ScrollView horizontal>
                <ThemedText style={{ 
                  fontFamily: 'monospace',
                  fontSize: RFPercentage(1.4),
                  color: '#d4d4d4'
                }}>
{`import requests
import math

response = requests.post(
    'https://davidjgrimsley.com/api/quantum/quantum_gate',
    json={
        'gate_type': 'rotation',
        'rotation_angle': math.pi / 2
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
            <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.8), marginBottom: 8 }}>
              cURL
            </ThemedText>
            <View style={{
              backgroundColor: '#1e1e1e',
              padding: 16,
              borderRadius: 10,
            }}>
              <ScrollView horizontal>
                <ThemedText style={{ 
                  fontFamily: 'monospace',
                  fontSize: RFPercentage(1.4),
                  color: '#d4d4d4'
                }}>
{`curl -X POST https://davidjgrimsley.com/api/quantum/quantum_gate \\
  -H "Content-Type: application/json" \\
  -d '{"gate_type":"rotation","rotation_angle":1.5708}'`}
                </ThemedText>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Technical Details Section */}
        <View style={{ marginBottom: 30 }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 16 }}>
            🔬 Technical Details
          </ThemedText>
          
          <View style={{
            backgroundColor: accentColor,
            padding: 16,
            borderRadius: 10,
          }}>
            <View style={{ gap: 12 }}>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                  Backend Technology
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.8 }}>
                  Python 3.11 with FastAPI framework
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                  Quantum Simulator
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.8 }}>
                  IBM Qiskit Aer Simulator (latest version)
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                  Hosting
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.8 }}>
                  Self-hosted VPS with Nginx reverse proxy
                </ThemedText>
              </View>
              <View>
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.6), marginBottom: 4 }}>
                  Protocol
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.8 }}>
                  HTTPS (SSL/TLS encryption)
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Use Cases Section */}
        <View style={{ marginBottom: 30 }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 16 }}>
            🎯 Use Cases
          </ThemedText>
          
          <View style={{ gap: 12 }}>
            {[
              { title: 'Game Development', desc: 'Generate truly random loot drops, critical hits, or procedural generation seeds' },
              { title: 'Creative Applications', desc: 'Create unique quantum-powered animations and visual effects' },
              { title: 'Randomization Services', desc: 'Lottery systems, contest winners, A/B testing with quantum fairness' },
              { title: 'Educational Tools', desc: 'Demonstrate quantum computing concepts interactively' },
              { title: 'Quantum Text Art', desc: 'Transform text with quantum-inspired Unicode effects' },
            ].map((useCase, index) => (
              <View 
                key={index}
                style={{
                  backgroundColor: accentColor,
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                <ThemedText type="defaultSemiBold" style={{ fontSize: RFPercentage(1.7), marginBottom: 4 }}>
                  {useCase.title}
                </ThemedText>
                <ThemedText style={{ fontSize: RFPercentage(1.5), opacity: 0.8 }}>
                  {useCase.desc}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Live API Demo */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText type="subtitle" style={{ fontSize: RFPercentage(2.5), marginBottom: 16 }}>
            🎮 Live Demo
          </ThemedText>
          <View style={{
            backgroundColor: accentColor,
            padding: 20,
            borderRadius: 10,
          }}>
            <ThemedText style={{ 
              fontSize: RFPercentage(1.7),
              lineHeight: RFPercentage(2.4),
              opacity: 0.9,
              textAlign: 'center',
              marginBottom: 16
            }}>
              💡 This is the actual quantum animation from my Quantum Echo project. 
              It's making a LIVE call to this API right now! Watch it run a 30-second 
              quantum circuit simulation with real Qiskit code.
            </ThemedText>
            
            {/* Live Quantum Animation */}
            <HelloWave />
            
            <ThemedText style={{ 
              fontSize: RFPercentage(1.5),
              lineHeight: RFPercentage(2.1),
              opacity: 0.7,
              textAlign: 'center',
              marginTop: 16,
              fontStyle: 'italic'
            }}>
              Every time this loads, it calls POST /quantum_gate with a random rotation angle, 
              runs a quantum simulation, measures the qubit, and uses the result to control 
              the animation's behavior. This is quantum computing in action!
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
