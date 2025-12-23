import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ExternalLink } from '@/components/ExternalLink';
import { useThemeColor } from '@/hooks/useThemeColor';


export function HelloWave() {
  const quantumBaseUrl = __DEV__ ? 'https://localhost:8000' : 'https://108.175.12.95:8000';
  const quantumEndpoint = `${quantumBaseUrl}/quantum_gate`;
  const rotationAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);
  const [quantumIcon, setQuantumIcon] = useState('⚛️');
  const [quantumDetails, setQuantumDetails] = useState('Initializing quantum circuit...');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [technicalDetails, setTechnicalDetails] = useState<{
    gate: string;
    angle: number;
    state: string;
    backend: string;
  } | null>(null);

  const startClassicalFallback = (reason: string) => {
    console.log('🌊 [QuantumWave] 🎲 Falling back to classical physics animation:', reason);

    setQuantumIcon('⚗️');
    setQuantumDetails('⚠️ Quantum server offline - Classical animation mode | 🎲 Random timing | 🧪 Chemistry fallback');
    setTechnicalDetails({
      gate: 'Classical Fallback',
      angle: 0,
      state: 'Deterministic',
      backend: 'Local JavaScript'
    });

    rotationAnimation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(-25, { duration: 150 }),
        withTiming(0, { duration: 100 })
      ),
      20
    );

    scaleAnimation.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(1, { duration: 200 })
      ),
      10
    );

    setTimeout(() => {
      setIsAnimating(false);
      setIsComplete(true);
      setQuantumDetails('🧪 Classical animation complete - Try refreshing for quantum mode');
    }, 8000);
  };

  const fetchQuantumTiming = async () => {
    console.log('🌊 [QuantumWave] Starting dramatic quantum-controlled animation...');
    setQuantumDetails(`🔄 Contacting quantum server at ${quantumBaseUrl}...`);
    setIsAnimating(true);
    setIsComplete(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 5000);

      console.log(`🌊 [QuantumWave] Sending request to quantum server: ${quantumEndpoint}`);

      // Generate truly random quantum rotation angle for variety!
      const quantumAngles = [
        Math.PI / 8,    // 22.5° → ~38% superposition
        Math.PI / 6,    // 30°   → ~50% superposition  
        Math.PI / 4,    // 45°   → ~71% superposition
        Math.PI / 3,    // 60°   → ~87% superposition
        Math.PI / 2.5,  // 72°   → ~95% superposition
        Math.PI / 2,    // 90°   → ~100% superposition
      ];
      
      const randomAngle = quantumAngles[Math.floor(Math.random() * quantumAngles.length)];
      console.log(`🌊 [QuantumWave] Using random quantum angle: ${randomAngle.toFixed(4)} radians (${(randomAngle * 180 / Math.PI).toFixed(1)}°)`);

      const response = await fetch(quantumEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gate_type: 'rotation',
          rotation_angle: randomAngle,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('🌊 [QuantumWave] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🌊 [QuantumWave] Quantum server response:', JSON.stringify(result, null, 2));

      // Store technical details for display
      setTechnicalDetails({
        gate: 'RY (Rotation around Y-axis)',
        angle: randomAngle,
        state: `|ψ⟩ = cos(${(randomAngle/2).toFixed(3)})|0⟩ + sin(${(randomAngle/2).toFixed(3)})|1⟩`,
        backend: 'Qiskit Aer Simulator'
      });

      // Icon based on superposition strength (0.0 - 1.0)
      let icon = '⚛️'; // Default atom
      if (result.superposition_strength > 0.7) {
        icon = '🌌'; // Galaxy for high superposition
      } else if (result.superposition_strength > 0.3) {
        icon = '⭐'; // Star for medium superposition  
      } else {
        icon = '⚛️'; // Atom for low superposition
      }

      // Animation timing based on measurement (0 or 1)
      const baseTiming = result.measurement === 0 ? 100 : 200; // Fast vs slow
      
      // Animation intensity based on superposition
      const maxRotation = 20 + (result.superposition_strength * 40); // 20-60 degrees
      const cycles = Math.ceil(15 + (result.superposition_strength * 15)); // 15-30 cycles for 30 seconds
      
      setQuantumIcon(icon);
      
      // Create beautiful quantum details message
      const quantumType = result.superposition_strength > 0.5 ? 'Superposition' : 'Collapsed';
      const animationStyle = result.measurement === 0 ? 'Orbital' : 'Oscillation';
      const intensity = result.superposition_strength > 0.7 ? 'High' : 
                       result.superposition_strength > 0.3 ? 'Medium' : 'Low';
      
      setQuantumDetails(
        `⚛️ Quantum State: ${quantumType} | 📏 Strength: ${(result.superposition_strength * 100).toFixed(1)}% | ` +
        `🎯 Measurement: ${result.measurement} | 🎭 Animation: ${animationStyle} | 💫 Intensity: ${intensity}`
      );

      console.log(`🌊 [QuantumWave] Dramatic quantum result - Measurement: ${result.measurement}, Superposition: ${result.superposition_strength}, Icon: ${icon}, Cycles: ${cycles}, Rotation: ±${maxRotation}°`);

      // Start dramatic 30-second animation
      if (result.measurement === 0) {
        // Orbital animation for measurement 0
        console.log(`🌊 [QuantumWave] Starting dramatic orbital animation (${cycles} cycles, ±${maxRotation}° rotation)`);
        rotationAnimation.value = withRepeat(
          withSequence(
            withTiming(maxRotation, { duration: baseTiming }),
            withTiming(-maxRotation, { duration: baseTiming }),
            withTiming(0, { duration: baseTiming })
          ),
          cycles
        );
        
        // Add scale pulsing for extra drama
        scaleAnimation.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: baseTiming * 1.5 }),
            withTiming(0.9, { duration: baseTiming * 1.5 }),
            withTiming(1, { duration: baseTiming })
          ),
          Math.ceil(cycles * 0.6)
        );
      } else {
        // Oscillation animation for measurement 1
        console.log(`🌊 [QuantumWave] Starting dramatic oscillation animation (${cycles} cycles, ±${maxRotation}° swing)`);
        rotationAnimation.value = withRepeat(
          withSequence(
            withTiming(maxRotation * 0.7, { duration: baseTiming }),
            withTiming(-maxRotation * 0.7, { duration: baseTiming })
          ),
          cycles
        );
        
        // Add gentle breathing scale for oscillation
        scaleAnimation.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: baseTiming * 2 }),
            withTiming(1, { duration: baseTiming * 2 })
          ),
          Math.ceil(cycles * 0.4)
        );
      }

      // Reset animation state after 30 seconds
      setTimeout(() => {
        setIsAnimating(false);
        setIsComplete(true);
        setQuantumDetails('✨ Quantum animation sequence complete');
      }, 30000);

      console.log('🌊 [QuantumWave] ✅ Dramatic 30-second quantum animation initiated!');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log('🌊 [QuantumWave] ❌ Quantum server error:', errorMsg);
      startClassicalFallback(errorMsg);
    }
  };

  useEffect(() => {
    fetchQuantumTiming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotationAnimation.value}deg` },
      { scale: scaleAnimation.value }
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: isAnimating ? 1 : 0.8,
  }));

  const themedBg = useThemeColor({}, 'background');
  const themedText = useThemeColor({}, 'text');

  const handleRestart = () => {
    fetchQuantumTiming();
  };

  return (
    <View style={{ backgroundColor: themedBg, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', marginVertical: 8 }}>
      {isComplete ? (
        <Pressable 
          onPress={handleRestart}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: 'rgba(100, 150, 255, 0.2)',
            borderWidth: 2,
            borderColor: 'rgba(100, 150, 255, 0.5)',
          })}
        >
          <ThemedText style={{ fontSize: 32, textAlign: 'center' }}>🔄</ThemedText>
          <ThemedText style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4, textAlign: 'center' }}>
            Run Again
          </ThemedText>
        </Pressable>
      ) : (
        <Animated.View style={[animatedStyle, containerStyle]}>
          <ThemedText style={{ fontSize: 40, lineHeight: 36, marginTop: -6 }}>{quantumIcon}</ThemedText>
        </Animated.View>
      )}
      <View style={{ marginTop: 12, paddingHorizontal: 16, alignItems: 'center' }}>
        <ThemedText style={{ fontSize: 16, textAlign: 'center', opacity: 0.8, lineHeight: 16 }}>{quantumDetails}</ThemedText>
        {isAnimating && (
          <ThemedText style={{ fontSize: 16, textAlign: 'center', opacity: 0.6, marginTop: 4, fontStyle: 'italic' }}>
            🔄 Running a 30-second quantum sequence active based on the quantum Qiskit code in the python server:{' '}
          <ServerLink url={quantumBaseUrl} />
          </ThemedText>
        )}
        
        {technicalDetails && (
          <View style={{ marginTop: 16, width: '100%', paddingHorizontal: 8 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
              🔬 Technical Details
            </ThemedText>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ fontSize: 13, opacity: 0.9 }}>
                <ThemedText style={{ fontWeight: 'bold' }}>Quantum Gate:</ThemedText> {technicalDetails.gate}
              </ThemedText>
              <ThemedText style={{ fontSize: 13, opacity: 0.9 }}>
                <ThemedText style={{ fontWeight: 'bold' }}>Rotation Angle:</ThemedText> {technicalDetails.angle.toFixed(4)} rad ({(technicalDetails.angle * 180 / Math.PI).toFixed(1)}°)
              </ThemedText>
              <ThemedText style={{ fontSize: 13, opacity: 0.9 }}>
                <ThemedText style={{ fontWeight: 'bold' }}>Quantum State:</ThemedText> {technicalDetails.state}
              </ThemedText>
              <ThemedText style={{ fontSize: 13, opacity: 0.9 }}>
                <ThemedText style={{ fontWeight: 'bold' }}>Backend:</ThemedText> {technicalDetails.backend}
              </ThemedText>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128, 128, 128, 0.3)' }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.7, textAlign: 'center', fontStyle: 'italic' }}>
                💡 This animation is different every time you load it due to quantum randomness! It makes a live API call 
                to a Python server hosted on my VPS, which runs Qiskit quantum circuit calculations in a simulated environment. 
                The RY gate creates a superposition state, and when measured, the quantum wavefunction collapses to produce 
                truly random results that drive the animation's behavior, intensity, and duration.
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Simple link component that respects native + web navigation
function ServerLink({ url }: { url: string }) {
  return (
    <ExternalLink href={url} style={{ textDecorationLine: 'underline' }}>
      {url}
    </ExternalLink>
  );
}

// Remove StyleSheet - replaced with NativeWind classes