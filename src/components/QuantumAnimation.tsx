import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import LottieView from 'lottie-react-native';

import { ExternalLink } from '@/components/UI/ExternalLink';
import { ThemedText } from '@/components/UI/ThemedText';
import {
  QUANTUM_API_BASE_URL,
  resolveQuantumEndpointBaseUrl,
} from '@/lib/quantum-api-config';
import {
  getIbmCircuitJobResult,
  getIbmCircuitJobStatus,
  listIbmBackends,
  runQuantumGate,
  submitIbmCircuitJob,
  type IbmBackendRecord,
} from '@/services/quantum-ibm-runtime';

type ExecutionMode = 'simulator' | 'ibm_hardware';

type HardwareJobEvidence = {
  backendName: string;
  jobId: string;
  remoteJobId: string;
  status: string;
};

type QuantumRunResult = {
  mode: ExecutionMode;
  backendLabel: string;
  gateAngle: number;
  superpositionStrength: number;
  measurement: 0 | 1;
  hardwareEvidence?: HardwareJobEvidence;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalIbmFailureStatus(status: string) {
  return status === 'failed' || status === 'cancelled' || status === 'cancelling';
}

function getRandomAngle() {
  const angles = [
    Math.PI / 16,
    Math.PI / 12,
    Math.PI / 10,
    Math.PI / 7,
    Math.PI / 5,
    Math.PI / 4.5,
    Math.PI / 3,
    Math.PI / 2.5,
    Math.PI / 2,
  ];
  return angles[Math.floor(Math.random() * angles.length)] ?? Math.PI / 4;
}

export function HelloWave() {
  const isWeb = Platform.OS === 'web';
  const publicQuantumBaseUrl = QUANTUM_API_BASE_URL;
  const quantumBaseUrl = resolveQuantumEndpointBaseUrl('api_key', isWeb);

  const restartRef = useRef<LottieView>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulatorAbortRef = useRef<AbortController | null>(null);
  const runTokenRef = useRef(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isRestartPlaying, setIsRestartPlaying] = useState(false);
  const [robotMessage, setRobotMessage] = useState('Initializing quantum circuit...');

  const [executionMode, setExecutionMode] = useState<ExecutionMode>('simulator');
  const [ibmBackends, setIbmBackends] = useState<IbmBackendRecord[]>([]);
  const [selectedIbmBackend, setSelectedIbmBackend] = useState('');
  const [loadingIbmBackends, setLoadingIbmBackends] = useState(false);
  const [ibmBackendsError, setIbmBackendsError] = useState<string | null>(null);
  const [jobStatusText, setJobStatusText] = useState('');
  const [hardwareEvidence, setHardwareEvidence] = useState<HardwareJobEvidence | null>(null);

  const [backendLabel, setBackendLabel] = useState('');
  const [gateAngle, setGateAngle] = useState(0);
  const [superpositionStrength, setSuperpositionStrength] = useState(0);
  const [measurement, setMeasurement] = useState<0 | 1>(0);
  const [lottieLoop, setLottieLoop] = useState(true);
  const [lottieSpeed, setLottieSpeed] = useState(1);
  const [lottieLevel, setLottieLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const loadIbmHardwareBackends = useCallback(async () => {
    setLoadingIbmBackends(true);
    setIbmBackendsError(null);

    try {
      const backends = await listIbmBackends(quantumBaseUrl, '', {
        minQubits: 1,
      });

      const sorted = [...backends].sort((a, b) => b.numQubits - a.numQubits);
      setIbmBackends(sorted);
      if (!sorted.some((item) => item.name === selectedIbmBackend)) {
        setSelectedIbmBackend(sorted[0]?.name ?? '');
      }
      if (sorted.length === 0) {
        setIbmBackendsError(
          'No IBM hardware backends were returned for this API key/default profile. Simulator mode still works.'
        );
      }
      return sorted;
    } catch (error) {
      setIbmBackends([]);
      setSelectedIbmBackend('');
      setIbmBackendsError(error instanceof Error ? error.message : 'Unable to load IBM backends.');
      return [] as IbmBackendRecord[];
    } finally {
      setLoadingIbmBackends(false);
    }
  }, [quantumBaseUrl, selectedIbmBackend]);

  const runSimulator = useCallback(
    async (angle: number): Promise<QuantumRunResult> => {
      simulatorAbortRef.current?.abort();
      const abortController = new AbortController();
      simulatorAbortRef.current = abortController;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('Simulator request timed out. Please try again.'));
        }, 10_000);
      });

      const payload = await Promise.race([
        runQuantumGate(quantumBaseUrl, '', {
          gateType: 'rotation',
          rotationAngleRad: angle,
        }, {
          signal: abortController.signal,
        }),
        timeoutPromise,
      ]).finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (simulatorAbortRef.current === abortController) {
          simulatorAbortRef.current = null;
        }
      });

      const strength = Math.max(0, Math.min(1, Number(payload.superpositionStrength ?? 0.5)));
      const measured = payload.measurement === 1 ? 1 : 0;

      return {
        mode: 'simulator',
        backendLabel: payload.backend ?? 'Qiskit Aer simulator',
        gateAngle: angle,
        superpositionStrength: strength,
        measurement: measured,
      };
    },
    [quantumBaseUrl]
  );

  const runIbmHardware = useCallback(
    async (angle: number): Promise<QuantumRunResult> => {
      let backendName = selectedIbmBackend;
      if (!backendName) {
        const loaded = ibmBackends.length > 0 ? ibmBackends : await loadIbmHardwareBackends();
        backendName = loaded[0]?.name ?? '';
      }
      if (!backendName) {
        throw new Error(
          'No IBM hardware backend selected. Load backends first or switch to simulator mode.'
        );
      }

      setJobStatusText(`Submitting IBM hardware job to ${backendName}...`);

      const submitted = await submitIbmCircuitJob(quantumBaseUrl, '', {
        backendName,
        shots: 512,
        circuit: {
          numQubits: 1,
          operations: [{ gate: 'ry', target: 0, theta: angle }],
        },
      });

      let status = submitted.status;
      let remoteJobId = submitted.remoteJobId;
      setHardwareEvidence({
        backendName,
        jobId: submitted.jobId,
        remoteJobId,
        status,
      });

      if (isTerminalIbmFailureStatus(status)) {
        throw new Error(`IBM hardware job ended with status "${status}".`);
      }

      const pollStart = Date.now();
      while (status !== 'succeeded') {
        if (Date.now() - pollStart > 120_000) {
          throw new Error('IBM hardware job timed out after 120 seconds.');
        }

        await wait(2000);
        const next = await getIbmCircuitJobStatus(quantumBaseUrl, '', submitted.jobId);
        status = next.status;
        remoteJobId = next.remoteJobId;
        setJobStatusText(`IBM job ${submitted.jobId} is ${status} (remote: ${remoteJobId}).`);
        setHardwareEvidence({
          backendName,
          jobId: submitted.jobId,
          remoteJobId,
          status,
        });

        if (isTerminalIbmFailureStatus(status)) {
          throw new Error(next.errorMessage ?? `IBM hardware job ended with status "${status}".`);
        }

        if (status !== 'queued' && status !== 'running' && status !== 'succeeded') {
          throw new Error(`IBM hardware job returned unexpected status "${status}".`);
        }
      }

      const result = await getIbmCircuitJobResult(quantumBaseUrl, '', submitted.jobId);
      const entries = Object.entries(result.result.counts);
      const total = entries.reduce((sum, [, count]) => sum + count, 0);
      const oneCount = entries.reduce(
        (sum, [bitString, count]) => (bitString.trim().endsWith('1') ? sum + count : sum),
        0
      );
      const strength = total > 0 ? oneCount / total : 0.5;

      const draw = Math.random() * Math.max(total, 1);
      let acc = 0;
      let sampled = '0';
      for (const [bitString, count] of entries) {
        acc += count;
        if (draw <= acc) {
          sampled = bitString;
          break;
        }
      }

      const measured: 0 | 1 = sampled.trim().endsWith('1') ? 1 : 0;
      const evidence: HardwareJobEvidence = {
        backendName,
        jobId: submitted.jobId,
        remoteJobId,
        status: 'succeeded',
      };

      setHardwareEvidence(evidence);
      setJobStatusText(
        `IBM hardware job completed. Local job ${submitted.jobId}, remote job ${remoteJobId}.`
      );

      return {
        mode: 'ibm_hardware',
        backendLabel: `${backendName} (IBM hardware)`,
        gateAngle: angle,
        superpositionStrength: Math.max(0, Math.min(1, strength)),
        measurement: measured,
        hardwareEvidence: evidence,
      };
    },
    [ibmBackends, loadIbmHardwareBackends, quantumBaseUrl, selectedIbmBackend]
  );

  const runQuantumAnimation = useCallback(async () => {
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;

    simulatorAbortRef.current?.abort();
    simulatorAbortRef.current = null;

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    setIsLoading(true);
    setIsComplete(false);
    setIbmBackendsError(null);
    setJobStatusText('');
    setRobotMessage('Running quantum workflow...');
    setHardwareEvidence(null);

    try {
      const angle = getRandomAngle();
      const result =
        executionMode === 'simulator' ? await runSimulator(angle) : await runIbmHardware(angle);
      if (runToken !== runTokenRef.current) {
        return;
      }

      setBackendLabel(result.backendLabel);
      setGateAngle(result.gateAngle);
      setSuperpositionStrength(result.superpositionStrength);
      setMeasurement(result.measurement);

      const level: 'low' | 'medium' | 'high' =
        result.superpositionStrength > 0.7
          ? 'high'
          : result.superpositionStrength > 0.3
            ? 'medium'
            : 'low';
      setLottieLevel(level);
      setLottieLoop(result.measurement === 1);
      const speed = level === 'high' ? 2.2 : level === 'medium' ? 1.4 : 0.9;
      setLottieSpeed(speed);

      setRobotMessage(
        result.mode === 'simulator'
          ? 'Simulator run complete. Restart for new randomness.'
          : 'IBM hardware run complete. Restart to submit another hardware job.'
      );

      const finishDelayMs =
        result.measurement === 1 ? 10_000 : Math.max(1500, Math.floor(4000 / speed));
      completionTimerRef.current = setTimeout(() => {
        if (runToken !== runTokenRef.current) {
          return;
        }
        setIsComplete(true);
        completionTimerRef.current = null;
      }, finishDelayMs);
    } catch (error) {
      if (runToken !== runTokenRef.current) {
        return;
      }
      setRobotMessage(error instanceof Error ? error.message : 'Quantum run failed.');
      setBackendLabel('Fallback');
      setGateAngle(0);
      setSuperpositionStrength(0);
      setMeasurement(0);
      setLottieLevel('low');
      setLottieLoop(false);
      setLottieSpeed(1);
      setIsComplete(true);
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    } finally {
      if (runToken === runTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [executionMode, runIbmHardware, runSimulator]);

  useEffect(() => {
    void runQuantumAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (executionMode === 'ibm_hardware' && ibmBackends.length === 0) {
      void loadIbmHardwareBackends();
    }
  }, [executionMode, ibmBackends.length, loadIbmHardwareBackends]);

  useEffect(
    () => () => {
      runTokenRef.current += 1;
      simulatorAbortRef.current?.abort();
      simulatorAbortRef.current = null;
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    },
    []
  );

  const handleRestartClick = () => {
    if (isRestartPlaying) return;
    setIsRestartPlaying(true);
    restartRef.current?.play();
  };

  const handleRestartComplete = () => {
    setIsRestartPlaying(false);
    void runQuantumAnimation();
  };

  return (
    <View
      style={{
        backgroundColor: '#a2a2a2',
        borderRadius: 12,
        gap: 12,
        padding: 16,
        width: '100%',
      }}
    >
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderColor: 'rgba(17, 24, 28, 0.16)',
          borderRadius: 12,
          borderWidth: 1,
          gap: 10,
          padding: 12,
        }}
      >
        <ThemedText style={{ fontSize: 14, fontWeight: 'bold' }}>Execution Mode</ThemedText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pressable
            onPress={() => setExecutionMode('simulator')}
            style={({ pressed }) => ({
              backgroundColor: executionMode === 'simulator' ? '#11181C' : '#d4d4d8',
              borderRadius: 10,
              opacity: pressed ? 0.8 : 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}
          >
            <ThemedText
              style={{
                color: executionMode === 'simulator' ? '#fff' : '#11181C',
                fontSize: 12,
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              Simulator
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setExecutionMode('ibm_hardware')}
            style={({ pressed }) => ({
              backgroundColor: executionMode === 'ibm_hardware' ? '#11181C' : '#d4d4d8',
              borderRadius: 10,
              opacity: pressed ? 0.8 : 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}
          >
            <ThemedText
              style={{
                color: executionMode === 'ibm_hardware' ? '#fff' : '#11181C',
                fontSize: 12,
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              IBM Hardware
            </ThemedText>
          </Pressable>

          <Pressable
            disabled={isLoading || isRestartPlaying}
            onPress={() => {
              void runQuantumAnimation();
            }}
            style={({ pressed }) => ({
              backgroundColor: '#0f766e',
              borderRadius: 10,
              opacity: pressed || isLoading || isRestartPlaying ? 0.7 : 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}
          >
            <ThemedText
              style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              Run Now
            </ThemedText>
          </Pressable>
        </View>

        {executionMode === 'simulator' ? (
          <ThemedText style={{ fontSize: 12, opacity: 0.85 }}>
            Simulator mode is always available and does not require IBM credentials.
          </ThemedText>
        ) : (
          <View style={{ gap: 8 }}>
            <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>IBM hardware backend</ThemedText>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(17, 24, 28, 0.2)',
                borderRadius: 16,
                borderWidth: 1,
                overflow: 'hidden',
              }}
            >
              <Picker
                onValueChange={(value) => setSelectedIbmBackend(String(value || ''))}
                selectedValue={selectedIbmBackend}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  color: '#11181C',
                  height: 52,
                }}
                dropdownIconColor="#11181C"
              >
                <Picker.Item
                  color="#11181C"
                  label={loadingIbmBackends ? 'Loading hardware backends...' : 'Select IBM backend'}
                  value=""
                />
                {ibmBackends.map((backend) => (
                  <Picker.Item
                    color="#11181C"
                    key={backend.name}
                    label={`${backend.name} (${backend.numQubits} qubits)`}
                    value={backend.name}
                  />
                ))}
              </Picker>
            </View>

            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
              <Pressable
                disabled={loadingIbmBackends}
                onPress={() => {
                  void loadIbmHardwareBackends();
                }}
                style={({ pressed }) => ({
                  backgroundColor: '#11181C',
                  borderRadius: 10,
                  opacity: pressed || loadingIbmBackends ? 0.7 : 1,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                })}
              >
                <ThemedText
                  style={{
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  Refresh Backends
                </ThemedText>
              </Pressable>

              <ThemedText style={{ fontSize: 12, opacity: 0.85 }}>
                {ibmBackends.length} hardware backend{ibmBackends.length === 1 ? '' : 's'} loaded
              </ThemedText>
            </View>

            {ibmBackendsError ? (
              <ThemedText style={{ color: '#991b1b', fontSize: 12 }}>{ibmBackendsError}</ThemedText>
            ) : null}

            {jobStatusText ? (
              <ThemedText style={{ fontSize: 12, opacity: 0.85 }}>{jobStatusText}</ThemedText>
            ) : null}

            {hardwareEvidence ? (
              <ThemedText style={{ fontSize: 12, opacity: 0.85 }}>
                Last IBM hardware run: backend {hardwareEvidence.backendName}, local job{' '}
                {hardwareEvidence.jobId}, remote job {hardwareEvidence.remoteJobId}, status{' '}
                {hardwareEvidence.status}, using default IBM profile.
              </ThemedText>
            ) : null}
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flex: 1, gap: 10, minWidth: 240 }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.28)',
              borderRadius: 12,
              minHeight: 220,
              padding: 10,
            }}
          >
            <LottieView
              autoPlay
              loop
              source={require('~/assets/lottie/loading_robot.json')}
              style={{ height: 160, width: 160 }}
            />
            <ThemedText style={{ fontSize: 13, fontWeight: 'bold', textAlign: 'center' }}>
              {robotMessage}
            </ThemedText>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: 12,
              gap: 6,
              padding: 10,
            }}
          >
            <ThemedText style={{ fontSize: 13 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Backend:</ThemedText> {backendLabel || 'N/A'}
            </ThemedText>
            <ThemedText style={{ fontSize: 13 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Gate:</ThemedText> RY
            </ThemedText>
            <ThemedText style={{ fontSize: 13 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Angle:</ThemedText>{' '}
              {gateAngle > 0 ? `${gateAngle.toFixed(4)} rad` : 'N/A'}
            </ThemedText>
            <ThemedText style={{ fontSize: 13 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Superposition:</ThemedText>{' '}
              {(superpositionStrength * 100).toFixed(1)}%
            </ThemedText>
            <ThemedText style={{ fontSize: 13 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Measurement:</ThemedText> |{measurement}
              {'>'}
            </ThemedText>
          </View>
        </View>

        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.28)',
            borderRadius: 12,
            flex: 1.3,
            justifyContent: 'center',
            minHeight: 320,
            minWidth: 260,
            padding: 12,
          }}
        >
          {isLoading ? (
            <LottieView
              autoPlay
              loop
              source={require('~/assets/lottie/loading_robot.json')}
              style={{ height: 200, width: 200 }}
            />
          ) : isComplete ? (
            <Pressable
              disabled={isRestartPlaying}
              onPress={handleRestartClick}
              style={({ pressed }) => ({
                alignItems: 'center',
                height: '100%',
                justifyContent: 'center',
                opacity: pressed && !isRestartPlaying ? 0.75 : 1,
                width: '100%',
              })}
            >
              <LottieView
                autoPlay={false}
                loop={false}
                onAnimationFinish={handleRestartComplete}
                ref={restartRef}
                resizeMode="contain"
                source={require('~/assets/lottie/restart.json')}
                style={{ height: '100%', width: '100%' }}
              />
            </Pressable>
          ) : (
            <LottieView
              autoPlay
              loop={lottieLoop}
              resizeMode="contain"
              source={
                lottieLevel === 'high'
                  ? require('~/assets/lottie/quantum_high.json')
                  : lottieLevel === 'medium'
                    ? require('~/assets/lottie/quantum_medium.json')
                    : require('~/assets/lottie/quantum_low.json')
              }
              speed={lottieSpeed}
              style={{ height: '100%', width: '100%' }}
            />
          )}
        </View>
      </View>

      <View
        style={{
          borderTopColor: 'rgba(128, 128, 128, 0.3)',
          borderTopWidth: 1,
          paddingTop: 12,
        }}
      >
        <ThemedText style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.8 }}>
          This demo defaults to simulator mode. Switch to IBM Hardware, load a backend, and run
          again to submit a real IBM job through this same Quantum API backend. Hardware runs
          display backend plus local and remote job IDs so you can verify IBM execution. Base URL:{' '}
          <ExternalLink
            href={publicQuantumBaseUrl}
            style={{ color: '#11181C', fontSize: 12, opacity: 0.8, textDecorationLine: 'underline' }}
          >
            {publicQuantumBaseUrl}
          </ExternalLink>
          .
        </ThemedText>
      </View>
    </View>
  );
}
