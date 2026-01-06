import { useEffect, useState, useRef } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

import { ThemedText } from '@/components/UI/ThemedText';
import { ThemedView } from '@/components/UI/ThemedView';
import { ExternalLink } from '@/components/UI/ExternalLink';


export function HelloWave() {
  const quantumBaseUrl = 'https://davidjgrimsley.com/api/quantum';
  const quantumEndpoint = `${quantumBaseUrl}/quantum_gate`;
  const rotationAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);
  const [robotMessage, setRobotMessage] = useState('🤖 Initializing quantum circuit...');
  const [isRobotLooping, setIsRobotLooping] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quantumLevel, setQuantumLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [lottieSpeed, setLottieSpeed] = useState(1);
  const [lottieLoop, setLottieLoop] = useState(true);
  const [isRestartPlaying, setIsRestartPlaying] = useState(false);
  const loadingStartTime = useRef(Date.now());
  const lottieRef = useRef<LottieView>(null);
  const robotSpeakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animated opacity values for each technical detail line
  const backendOpacity = useSharedValue(0);
  const gateOpacity = useSharedValue(0);
  const angleOpacity = useSharedValue(0);
  const stateOpacity = useSharedValue(0);
  const strengthOpacity = useSharedValue(0);
  const measurementOpacity = useSharedValue(0);
  const intensityOpacity = useSharedValue(0);
  const technicalDetailsHeight = useSharedValue(0);
  const animationContainerScale = useSharedValue(1);
  
  const [technicalDetails, setTechnicalDetails] = useState<{
    gate: string;
    angle: number;
    state: string;
    backend: string;
    superposition: number;
    measurement: number;
    intensity: string;
  }>({ gate: '', angle: 0, state: '', backend: '', superposition: 0, measurement: 0, intensity: '' });

  /**
   * Fades in a technical detail line
   */
  const fadeInDetail = (opacityValue: SharedValue<number>) => {
    opacityValue.value = withTiming(1, { duration: 800 });
  };

  /**
   * Resets all technical detail opacities to 0
   */
  const resetDetailOpacities = () => {
    backendOpacity.value = 0;
    gateOpacity.value = 0;
    angleOpacity.value = 0;
    stateOpacity.value = 0;
    strengthOpacity.value = 0;
    measurementOpacity.value = 0;
    intensityOpacity.value = 0;
    technicalDetailsHeight.value = withTiming(0, { duration: 300 });
  };

  /**
   * Makes the robot "speak" by displaying a message and animating for a specific duration.
   * @param message - The message to display in the speech bubble
   * @param talkTime - How long the robot should animate (in milliseconds). If 0, message is set without animation.
   * @param keepMessage - If true, message stays visible after animation stops (default: true)
   */
  const makeRobotSpeak = (message: string, talkTime: number, keepMessage: boolean = true) => {
    // Clear any existing timeout
    if (robotSpeakTimeoutRef.current) {
      clearTimeout(robotSpeakTimeoutRef.current);
      robotSpeakTimeoutRef.current = null;
    }

    // Set message
    setRobotMessage(message);
    
    // If talkTime is 0, just set message without animation
    if (talkTime === 0) {
      setIsRobotLooping(false);
      console.log(`🤖 [Robot] Message set: "${message}" | Loop: false | No animation`);
      return;
    }

    // Start animating
    setIsRobotLooping(true);
    console.log(`🤖 [Robot] Speaking: "${message}" | Loop: true | Duration: ${talkTime}ms`);

    // Stop animating after talkTime, but keep message visible
    robotSpeakTimeoutRef.current = setTimeout(() => {
      setIsRobotLooping(false);
      console.log(`🤖 [Robot] Stopped animating | Loop: false | Message kept: ${keepMessage}`);
      if (!keepMessage) {
        setRobotMessage('');
      }
      robotSpeakTimeoutRef.current = null;
    }, talkTime);
  };

  const startClassicalFallback = (reason: string) => {
    console.log('🌊 [QuantumWave] 🎲 Falling back to classical physics animation:', reason);

    setRobotMessage('⚠️ Quantum server offline - Running classical animation mode');
    setTechnicalDetails({
      gate: 'Classical Fallback',
      angle: 0,
      state: 'Deterministic',
      backend: 'Local JavaScript',
      superposition: 0,
      measurement: 0,
      intensity: 'N/A'
    });
    fadeInDetail(backendOpacity);

    // Classical fallback animation
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
      setIsComplete(true);
      setIsLoading(false);
      setRobotMessage('Classical animation complete!');
    }, 8000);
  };

  const fetchQuantumTiming = async () => {
    console.log('🌊 [QuantumWave] Starting dramatic quantum-controlled animation...');
    setIsComplete(false);
    setIsLoading(true);
    loadingStartTime.current = Date.now();
    
    // Reset technical details and opacities
    setTechnicalDetails({ gate: '', angle: 0, state: '', backend: '', superposition: 0, measurement: 0, intensity: '' });
    resetDetailOpacities();

    // Robot narrates the quantum process
    makeRobotSpeak('Connecting to quantum server...', 1500);
    setTechnicalDetails(prev => ({ ...prev, backend: 'Qiskit Aer Simulator' }));
    fadeInDetail(backendOpacity);
    technicalDetailsHeight.value = withTiming(30, { duration: 500 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    makeRobotSpeak('Initializing qubit in |0⟩ state...', 1500);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 5000);

      console.log(`🌊 [QuantumWave] Sending request to quantum server: ${quantumEndpoint}`);

      // Generate truly random quantum rotation angle for variety!
      // Balanced distribution: 3 low, 3 medium, 3 high
      const quantumAngles = [
        Math.PI / 16,   // 11.25° → ~20% superposition (LOW)
        Math.PI / 12,   // 15°    → ~26% superposition (LOW)
        Math.PI / 10,   // 18°    → ~31% superposition (LOW)
        Math.PI / 7,    // 25.7°  → ~43% superposition (MEDIUM)
        Math.PI / 5,    // 36°    → ~59% superposition (MEDIUM)
        Math.PI / 4.5,  // 40°    → ~64% superposition (MEDIUM)
        Math.PI / 3,    // 60°    → ~87% superposition (HIGH)
        Math.PI / 2.5,  // 72°    → ~95% superposition (HIGH)
        Math.PI / 2,    // 90°    → ~100% superposition (HIGH)
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

      // Ensure minimum 5 seconds of loading animation
      const elapsedTime = Date.now() - loadingStartTime.current;
      const remainingTime = Math.max(0, 5000 - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`🌊 [QuantumWave] Waiting ${remainingTime}ms to meet minimum loading time`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Store gate and angle details
      makeRobotSpeak(`Applied RY(${randomAngle.toFixed(3)}) gate to qubit...`, 1500);
      setTechnicalDetails(prev => ({ ...prev, gate: 'RY (Rotation around Y-axis)', angle: randomAngle }));
      fadeInDetail(gateOpacity);
      fadeInDetail(angleOpacity);
      technicalDetailsHeight.value = withTiming(90, { duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 1500));

      makeRobotSpeak('Calculating superposition strength from amplitudes...', 1500);
      setTechnicalDetails(prev => ({ ...prev, state: `|ψ⟩ = cos(${(randomAngle/2).toFixed(3)})|0⟩ + sin(${(randomAngle/2).toFixed(3)})|1⟩` }));
      fadeInDetail(stateOpacity);
      technicalDetailsHeight.value = withTiming(140, { duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Determine level based on superposition strength
      let level: 'low' | 'medium' | 'high' = 'medium';
      const strength = result.superposition_strength;
      
      if (strength > 0.7) {
        level = 'high';
      } else if (strength > 0.3) {
        level = 'medium';
      } else {
        level = 'low';
      }
      setQuantumLevel(level);
      
      // Add superposition strength to technical details
      setTechnicalDetails(prev => ({ ...prev, superposition: strength }));
      fadeInDetail(strengthOpacity);
      technicalDetailsHeight.value = withTiming(170, { duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 500));

      makeRobotSpeak('Measuring qubit state...', 1500);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Looping based on measurement: 0 = no loop (false), 1 = loop (true)
      const looping = result.measurement === 1;
      setLottieLoop(looping);
      setTechnicalDetails(prev => ({ ...prev, measurement: result.measurement }));
      fadeInDetail(measurementOpacity);
      technicalDetailsHeight.value = withTiming(200, { duration: 500 });
      makeRobotSpeak(
        `Wavefunction collapsed to |${result.measurement}⟩! Setting looping to ${looping}.`,
        1500
      );
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Speed mapped within level range: very slow (0.3) to very fast (3.0)
      let speed = 1;
      
      if (level === 'low') {
        // Map 0.0-0.3 to 0.3-1.2 (very slow to medium)
        speed = 0.3 + (strength / 0.3) * 0.9;
      } else if (level === 'medium') {
        // Map 0.3-0.7 to 1.2-2.0 (medium to fast)
        speed = 1.2 + ((strength - 0.3) / 0.4) * 0.8;
      } else {
        // Map 0.7-1.0 to 2.0-3.0 (fast to very fast)
        speed = 2.0 + ((strength - 0.7) / 0.3) * 1.0;
      }
      
      setLottieSpeed(speed);
      makeRobotSpeak(`Setting animation speed to ${speed.toFixed(2)}x...`, 1500);
      await new Promise(resolve => setTimeout(resolve, 1500));

      makeRobotSpeak(
        `Choosing Lottie file: quantum_${level}.json (${(strength * 100).toFixed(1)}% strength)`,
        1500
      );
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add intensity to technical details
      const intensity = strength > 0.7 ? 'High' : strength > 0.3 ? 'Medium' : 'Low';
      setTechnicalDetails(prev => ({ ...prev, intensity }));
      fadeInDetail(intensityOpacity);
      technicalDetailsHeight.value = withTiming(230, { duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple final message
      makeRobotSpeak('Playing quantum animation', 0);

      console.log(`🌊 [QuantumWave] Result - Measurement: ${result.measurement}, Superposition: ${result.superposition_strength}, Level: ${level}`);

      // Start quantum animation
      setIsLoading(false);

      // Animation duration: 10 seconds if looping, or just let it play once if not looping
      if (looping) {
        setTimeout(() => {
          // Shrink then grow animation
          animationContainerScale.value = withSequence(
            withTiming(0.95, { duration: 200 }),
            withTiming(1, { duration: 300 })
          );
          setIsComplete(true);
          setRobotMessage('Press the black dot on the right to restart the animation');
        }, 10000);
        console.log('🌊 [QuantumWave] ✅ 10-second looping quantum animation initiated!');
      } else {
        // For non-looping animations, we need to estimate duration based on the lottie file
        // Assume each lottie is ~3-5 seconds at normal speed, adjust for actual speed
        const estimatedDuration = 4000 / speed; // Base 4 seconds adjusted by speed
        setTimeout(() => {
          // Shrink then grow animation
          animationContainerScale.value = withSequence(
            withTiming(0.95, { duration: 200 }),
            withTiming(1, { duration: 300 })
          );
          setIsComplete(true);
          setRobotMessage('Press the black dot on the right to restart the animation');
        }, estimatedDuration);
        console.log(`🌊 [QuantumWave] ✅ Single-play quantum animation initiated (${estimatedDuration}ms estimated)!`);
      }
      
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

  const handleRestartClick = () => {
    // Only allow click if restart is not currently playing
    if (!isRestartPlaying) {
      setIsRestartPlaying(true);
      makeRobotSpeak('Restarting...', 2000); // Robot talks during restart animation
      lottieRef.current?.play();
    }
  };

  const handleRestartComplete = () => {
    // When restart animation finishes, fetch new quantum data
    setIsRestartPlaying(false);
    // Shrink then grow animation
    animationContainerScale.value = withSequence(
      withTiming(0.95, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    fetchQuantumTiming();
  };

  return (
    <View style={{ flexDirection: 'column', gap: 12, width: '100%', backgroundColor: '#a2a2a2', padding: 16, borderRadius: 12 }}>
      {/* Two column layout */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        {/* Left column (1/3): Robot icon and Technical details stacked */}
        <View style={{ flex: 1, minWidth: 220, maxWidth: '33%', gap: 16 }}>
          {/* Robot with overlapping speech bubble */}
          <View style={{ alignItems: 'center', position: 'relative' }}>
            <View style={{ width: 220, height: 220, position: 'relative' }}>
              <LottieView
                key={`robot-${isRobotLooping ? 'looping' : 'stopped'}`}
                source={require('~/assets/lottie/loading_robot.json')}
                autoPlay={isRobotLooping}
                loop={isRobotLooping}
                style={{ width: 220, height: 220 }}
              />
              {/* Speech bubble overlapping bottom 40% of robot - fixed height */}
              <ThemedView 
                lightColor="rgba(255, 255, 255, 0.98)"
                darkColor="rgba(20, 30, 45, 0.95)"
                style={{ 
                  position: 'absolute',
                  bottom: 0,
                  left: -15,
                  right: -15,
                  height: 88, // Fixed at 40% of 220px
                  borderColor: '#a96710', 
                  borderWidth: 2, 
                  borderRadius: 12, 
                  padding: 10,
                  justifyContent: 'center'
                }}>
                <ThemedText 
                  lightColor="#11181C"
                  darkColor="#ECEDEE"
                  style={{ 
                    fontSize: 13, 
                    fontWeight: 'bold', 
                    textAlign: 'center',
                    lineHeight: 16
                  }}>
                  {robotMessage}
                </ThemedText>
              </ThemedView>
            </View>
          </View>

          {/* Technical details */}
          <Animated.View style={{ height: technicalDetailsHeight, overflow: 'hidden' }}>
            <View style={{ gap: 6 }}>
              {technicalDetails.backend && (
                <Animated.View style={{ opacity: backendOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Backend:</ThemedText> {technicalDetails.backend}
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.gate && (
                <Animated.View style={{ opacity: gateOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Quantum Gate:</ThemedText> {technicalDetails.gate}
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.angle > 0 && (
                <Animated.View style={{ opacity: angleOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Rotation Angle:</ThemedText> {technicalDetails.angle.toFixed(4)} rad ({(technicalDetails.angle * 180 / Math.PI).toFixed(1)}°)
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.state && (
                <Animated.View style={{ opacity: stateOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Quantum State:</ThemedText> {technicalDetails.state}
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.superposition > 0 && (
                <Animated.View style={{ opacity: strengthOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Superposition:</ThemedText> {(technicalDetails.superposition * 100).toFixed(1)}%
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.measurement !== undefined && technicalDetails.measurement >= 0 && (
                <Animated.View style={{ opacity: measurementOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Measurement:</ThemedText> |{technicalDetails.measurement}⟩
                  </ThemedText>
                </Animated.View>
              )}
              {technicalDetails.intensity && (
                <Animated.View style={{ opacity: intensityOpacity }}>
                  <ThemedText style={{ fontSize: 13, flexWrap: 'wrap' }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Intensity:</ThemedText> {technicalDetails.intensity}
                  </ThemedText>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Right column (2/3): Quantum state visualization or restart button */}
        <Animated.View style={{ 
          flex: 2, 
          minWidth: 200,
          minHeight: 300,
          maxHeight: 500,
          alignItems: 'center', 
          justifyContent: 'center',
          transform: [{ scale: animationContainerScale }]
        }}>
          {isComplete ? (
            <View style={{ 
              flex: 1,
              width: '100%',
              backgroundColor: 'rgba(0, 200, 221, 0.1)',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Pressable 
                onPress={handleRestartClick}
                style={({ pressed }) => ({ opacity: pressed && !isRestartPlaying ? 0.7 : 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' })}
                disabled={isRestartPlaying}
              >
                <LottieView
                  ref={lottieRef}
                  source={require('~/assets/lottie/restart.json')}
                  autoPlay={false}
                  loop={false}
                  onAnimationFinish={handleRestartComplete}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          ) : !isLoading ? (
            <View style={{ width: '100%', height: '100%' }}>
              <LottieView
                source={
                  quantumLevel === 'high' ? require('~/assets/lottie/quantum_high.json') :
                  quantumLevel === 'medium' ? require('~/assets/lottie/quantum_medium.json') :
                  require('~/assets/lottie/quantum_low.json')
                }
                autoPlay
                loop={lottieLoop}
                speed={lottieSpeed}
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* Explanation */}
      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(128, 128, 128, 0.3)' }}>
        <ThemedText style={{ fontSize: 12, opacity: 0.7, textAlign: 'left', fontStyle: 'italic', flexWrap: 'wrap' }}>
          💡 This animation is slightly or very different every time you load it due to quantum randomness! It makes a live API call 
          to a Python server hosted at <ExternalLink 
            href="https://davidjgrimsley.com/api/quantum"
            style={{ textDecorationLine: 'underline', color: '#11181C', fontSize: 12, opacity: 0.7 }}
          >DavidJGrimsley.com/api/quantum</ExternalLink>, which runs Qiskit quantum circuit calculations in a simulated environment. 
          The RY gate creates a superposition state, and when measured, the quantum wavefunction collapses to produce 
          truly random results that drive the animation&apos;s behavior, intensity, and duration.
        </ThemedText>
      </View>
    </View>
  );
}
