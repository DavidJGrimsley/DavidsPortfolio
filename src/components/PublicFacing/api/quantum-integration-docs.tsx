import React from "react";
import { Link, type Href } from "expo-router";
import { Platform, ScrollView, View } from "react-native";

import quantumIntegrationDocsData from "@json/quantum-integration-docs.json";
import { ThemedText } from "@/components/UI/ThemedText";
import Ionicons from "@/components/UI/HydratedIonicon";
import { SITE_URL, joinUrl } from "@/constants/seo";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PublicFacingDetailWrapper } from "~/src/components/PublicFacing/PublicFacingDetailWrapper";
import {
  QuantumAgentSkillInstallCard,
  QuantumSupportButton,
} from "~/src/components/PublicFacing/api/quantum-page-actions";
import { ExternalLink } from "@/components/UI/ExternalLink";

export const QUANTUM_API_PATH = "/public-facing/api/quantum";
export const QUANTUM_API_MARKDOWN_PATH = "/public-facing/api/quantum.md";
export const LLMS_TXT_PATH = "/llms.txt";
export const QUANTUM_DOCS_FEEDBACK_EMAIL = "DavidJGrimsley@gmail.com";
export const QUANTUM_DOCS_ISSUES_URL =
  "https://github.com/davidjgrimsley/quantum-api/issues";
export const IBM_QUANTUM_URL = "https://quantum.cloud.ibm.com/";

export type QuantumIntegrationDoc = (typeof quantumIntegrationDocsData.docs)[number];

export const QUANTUM_INTEGRATION_DOCS = quantumIntegrationDocsData.docs;

export function getQuantumIntegrationDoc(slug: string | undefined) {
  return QUANTUM_INTEGRATION_DOCS.find((doc) => doc.slug === slug);
}

export const UNREAL_SECTION_TITLES = [
  "What this plugin is",
  "Install",
  "Configure",
  "First Blueprint call: Health Check",
  "Run Gate example",
  "Generate Random Int example",
  "Run Circuit explained pin-by-pin",
  "IBM hardware jobs",
  "Auth modes: Direct API Key vs Backend Proxy",
  "All Blueprint nodes",
  "Troubleshooting",
] as const;

export const UNREAL_ADVANCED_NODE_LABELS = [
  "Grover Search",
  "Amplitude Estimation",
  "Phase Estimation",
  "Time Evolution",
  "QAOA",
  "VQE",
  "MaxCut",
  "Knapsack",
  "Traveling Salesperson",
  "State Tomography",
  "Randomized Benchmarking",
  "Quantum Volume",
  "T1",
  "T2 Ramsey",
  "Portfolio Optimization",
  "Portfolio Diversification",
  "Kernel Classifier",
  "VQC Classifier",
  "QSVR Regressor",
  "Ground State Energy",
  "Fermionic Mapping Preview",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scrollToSection(sectionId: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function withOpacity(hexColor: string, opacity: number) {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6 && hex.length !== 8) return hexColor;
  const alpha = Math.max(0, Math.min(1, opacity));
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getIntegrationSummary(doc: QuantumIntegrationDoc) {
  const kind = doc.kind.trim();
  const summary = doc.summary.trim();

  if (summary.toLowerCase().includes(kind.toLowerCase())) {
    return summary;
  }

  return `${kind}. ${summary}`;
}

function IntegrationIntroPanel({ doc }: { doc: QuantumIntegrationDoc }) {
  const tintColor = useThemeColor({}, "tint");
  const accentColor = useThemeColor({}, "accent");

  return (
    <View
      className="rounded-lg border p-4 gap-5"
      style={{
        backgroundColor: withOpacity(accentColor, 0.62),
        borderColor: withOpacity(tintColor, 0.4),
      }}
    >
      <Paragraph>{getIntegrationSummary(doc)}</Paragraph>

      {doc.resourceLinks?.length ? (
        <View className="gap-3">
          <ThemedText type="defaultSemiBold" className="text-tint">
            Downloads, source, and demos
          </ThemedText>
          <View className="gap-3 md:flex-row md:flex-wrap">
            {doc.resourceLinks.map((link) => (
              <ExternalLink
                key={`${link.kind ?? "link"}:${link.url}`}
                href={link.url}
                className="rounded-lg border p-3 md:w-[31%]"
                style={{ borderColor: withOpacity(tintColor, 0.4) }}
              >
                <ThemedText className="font-bold text-tint mb-1">
                  {link.label}
                </ThemedText>
                {link.description ? (
                  <ThemedText className="text-sm leading-5 opacity-80">
                    {link.description}
                  </ThemedText>
                ) : null}
              </ExternalLink>
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-3">
        <View className="flex-row gap-3">
          <View
            className="h-11 w-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: withOpacity(tintColor, 0.18) }}
          >
            <Ionicons name="heart" size={22} color={tintColor} />
          </View>
          <View className="flex-1 gap-1">
            <ThemedText type="defaultSemiBold" className="text-tint">
              Support the Quantum API work
            </ThemedText>
            <ThemedText className="text-sm md:text-base leading-6 opacity-85">
              These guides, SDKs, plugins, and demos take real testing time across engines and package ecosystems.
            </ThemedText>
          </View>
        </View>
        <QuantumSupportButton />
      </View>
    </View>
  );
}

function DocsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View nativeID={slugify(title)} className="py-6 border-t border-tint/30">
      <ThemedText
        type="subtitle"
        headingLevel={2}
        visualHeadingLevel={2}
        className="mb-4 text-tint"
      >
        {title}
      </ThemedText>
      <View className="gap-4">{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText selectable className="text-base md:text-lg leading-7 opacity-90">
      {children}
    </ThemedText>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View key={index} className="flex-row gap-3">
          <ThemedText className="text-tint text-base md:text-lg">-</ThemedText>
          <ThemedText selectable className="flex-1 text-base md:text-lg leading-7 opacity-90">
            {item}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <View className="rounded-lg bg-(--color-code-bg) border border-(--color-code-border)">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ThemedText
          selectable
          className="font-noto-sans-mono text-sm md:text-base text-(--color-code-text) leading-6 p-4"
        >
          {value}
        </ThemedText>
      </ScrollView>
    </View>
  );
}

function InfoPanel({
  title,
  children,
  tone = "default",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "default" | "important";
}) {
  const tintColor = useThemeColor({}, "tint");
  const accentColor = useThemeColor({}, "accent");
  const backgroundColor =
    tone === "important"
      ? withOpacity(tintColor, 0.22)
      : withOpacity(accentColor, 0.55);

  return (
    <View
      className="rounded-lg p-4 border"
      style={{
        backgroundColor,
        borderColor: withOpacity(tintColor, tone === "important" ? 0.65 : 0.35),
      }}
    >
      {title ? (
        <ThemedText type="defaultSemiBold" className="mb-2 text-tint">
          {title}
        </ThemedText>
      ) : null}
      <View className="gap-3">{children}</View>
    </View>
  );
}

function FieldGrid({
  rows,
}: {
  rows: { name: string; meaning: string }[];
}) {
  return (
    <View className="gap-2">
      {rows.map((row) => (
        <View
          key={row.name}
          className="rounded-lg p-3 md:flex-row md:items-start md:gap-4 bg-accent/60"
        >
          <ThemedText
            selectable
            type="defaultSemiBold"
            className="font-noto-sans-mono md:w-70 text-tint"
          >
            {row.name}
          </ThemedText>
          <ThemedText selectable className="flex-1 leading-6 opacity-90">
            {row.meaning}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function InlineToken({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText
      selectable
      className="font-noto-sans-mono text-sm md:text-base text-tint"
    >
      {children}
    </ThemedText>
  );
}

function FeedbackAndAgentSections({ markdownPath }: { markdownPath: string }) {
  const markdownUrl = joinUrl(SITE_URL, markdownPath);

  return (
    <>
      <DocsSection title="Feedback, contributions, comments, and questions">
        <Paragraph>
          Questions, corrections, and issue reports are welcome. Email{" "}
          <Link href={`mailto:${QUANTUM_DOCS_FEEDBACK_EMAIL}` as Href}>
            <ThemedText className="text-tint underline">
              {QUANTUM_DOCS_FEEDBACK_EMAIL}
            </ThemedText>
          </Link>{" "}
          or open an issue at{" "}
          <Link href={QUANTUM_DOCS_ISSUES_URL as Href}>
            <ThemedText className="text-tint underline">
              github.com/davidjgrimsley/quantum-api/issues
            </ThemedText>
          </Link>
          .
        </Paragraph>
      </DocsSection>

      <View className="py-6 border-t border-tint/30">
        <QuantumAgentSkillInstallCard />
      </View>

      <DocsSection title="Agent version (.md)">
        <Paragraph>
          Coding agents can use the plain Markdown companion for this guide at{" "}
          <Link href={markdownUrl as Href}>
            <ThemedText className="text-tint underline">{markdownPath}</ThemedText>
          </Link>
          .
        </Paragraph>
      </DocsSection>
    </>
  );
}

function UnrealGuide() {
  return (
    <>
      <DocsSection title="What this plugin is">
        <Paragraph>
          This is a project plugin you copy into an Unreal project. Its Blueprint
          async actions send HTTP requests and then return either <InlineToken>On Success</InlineToken>{" "}
          with a response or <InlineToken>On Error</InlineToken> with a safe error
          object.
        </Paragraph>
        <BulletList
          items={[
            "White execution pins control when the request starts.",
            "Request pins are forms you fill out before sending the request.",
            "Options is for advanced per-call auth or proxy overrides. Leave it empty for normal project settings.",
            "The plugin never stores or edits IBM credentials and never logs credential values.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Install">
        <BulletList
          items={[
            "Copy sdk/unreal into <YourProject>/Plugins/QuantumApi.",
            "Regenerate project files, build the project, then enable Quantum API in Unreal's Plugin Browser if Unreal asks.",
            "Keep game-specific configuration in the host project's Config/DefaultGame.ini.",
          ]}
        />
      </DocsSection>

      <DocsSection title="Configure">
        <Paragraph>
          Start with Backend Proxy for shipped games. Direct API Key is only for
          local development, demos, and game jams because a key packaged into a
          game client can be extracted.
        </Paragraph>
        <CodeBlock
          value={`[/Script/QuantumApi.QuantumApiSettings]
AuthMode=BackendProxy
ApiKey=
bUseEnvironmentApiKey=True
ApiKeyEnvironmentVariable=QUANTUM_API_KEY
BearerToken=
DefaultIbmProfile=
RequestTimeoutSeconds=10.000000
MaxReadRetries=2
MaxRetryDelaySeconds=5.000000`}
        />
        <Paragraph>
          The base URL is the web address the plugin sends requests to. The
          hosted Quantum API address is already configured, so leave it alone
          unless you run your own service. A self-hosted project can set{" "}
          <InlineToken>BaseUrl</InlineToken> in <InlineToken>Config/DefaultGame.ini</InlineToken>.
        </Paragraph>
      </DocsSection>

      <DocsSection title="First Blueprint call: Health Check">
        <Paragraph>
          Use <InlineToken>Health Check</InlineToken> before building bigger
          flows. It confirms that the service is reachable and needs no request
          body.
        </Paragraph>
        <FieldGrid
          rows={[
            {
              name: "Options",
              meaning:
                "Leave empty unless you are testing a one-off bearer token, API key, or custom proxy header.",
            },
            {
              name: "On Success",
              meaning:
                "Read fields such as status, service, version, runtime mode, and whether Qiskit is available.",
            },
            {
              name: "On Error",
              meaning: "Route FQuantumApiError to UI or logs without freezing gameplay.",
            },
          ]}
        />
      </DocsSection>

      <DocsSection title="Run Gate example">
        <Paragraph>
          <InlineToken>Run Gate</InlineToken> is the easiest quantum-flavored
          test after Health Check. For a first rotation, use these request values:
        </Paragraph>
        <FieldGrid
          rows={[
            { name: "GateType", meaning: "rotation" },
            { name: "bSendRotationAngle", meaning: "Checked / true" },
            { name: "RotationAngleRad", meaning: "1.57079632679, which is PI / 2" },
          ]}
        />
        <Paragraph>
          On success, read <InlineToken>Measurement</InlineToken>. It is usually{" "}
          <InlineToken>0</InlineToken> or <InlineToken>1</InlineToken>.
        </Paragraph>
      </DocsSection>

      <DocsSection title="Generate Random Int example">
        <Paragraph>
          <InlineToken>Generate Random Int</InlineToken> calls{" "}
          <InlineToken>POST /v1/random</InlineToken> with inclusive signed 32-bit
          bounds. For a coin-flip-style test, set <InlineToken>Min = 0</InlineToken>{" "}
          and <InlineToken>Max = 1</InlineToken>.
        </Paragraph>
        <InfoPanel>
          <Paragraph>
            The response includes <InlineToken>Value</InlineToken> and{" "}
            <InlineToken>Source</InlineToken>. The source may be{" "}
            <InlineToken>qiskit-simulator</InlineToken> or{" "}
            <InlineToken>classical-fallback</InlineToken>; neither is a
            cryptographic-randomness guarantee.
          </Paragraph>
        </InfoPanel>
      </DocsSection>

      <DocsSection title="Run Circuit explained pin-by-pin">
        <InfoPanel tone="important">
          <ThemedText
            selectable
            type="subtitle"
            headingLevel={3}
            visualHeadingLevel={3}
            className="text-tint"
          >
            “What does ‘array of Quantum Api Circuit Operation’ mean?”
          </ThemedText>
          <Paragraph>
            It means "a list of gate steps." A struct is a bundle of fields, an
            array is a list, and each <InlineToken>Quantum Api Circuit Operation</InlineToken>{" "}
            is one instruction such as "apply an H gate to qubit 0."
          </Paragraph>
        </InfoPanel>
        <Paragraph>
          Use <InlineToken>Run Circuit</InlineToken> when you want a multi-step
          circuit. In plain English, you are saying: create this many qubits, run
          this ordered list of gate operations, then sample the circuit this many
          times.
        </Paragraph>
        <FieldGrid
          rows={[
            {
              name: "Request Circuit Num Qubits",
              meaning: "How many qubits, or wires, the circuit has. Start with 1.",
            },
            {
              name: "Request Circuit Operations",
              meaning: "The ordered list of gate steps. Start with one operation: Gate = h, Target = 0.",
            },
            {
              name: "Request Shots",
              meaning: "How many times to sample the circuit. Start with 1024.",
            },
            {
              name: "Request Include Statevector",
              meaning: "Advanced simulator output. Leave unchecked at first.",
            },
            {
              name: "Request Send Seed",
              meaning: "Whether to send a deterministic simulator seed. Leave unchecked at first.",
            },
            { name: "Request Seed", meaning: "Only matters when Request Send Seed is checked." },
            {
              name: "Options",
              meaning: "Optional per-call auth or proxy overrides. Leave empty for normal project settings.",
            },
          ]}
        />
        <Paragraph>
          Each circuit operation has <InlineToken>Gate</InlineToken>,{" "}
          <InlineToken>Target</InlineToken>, optional <InlineToken>Theta</InlineToken>{" "}
          for rotation gates like <InlineToken>rx</InlineToken>, <InlineToken>ry</InlineToken>,
          and <InlineToken>rz</InlineToken>, and optional <InlineToken>Control</InlineToken>{" "}
          for controlled gates like <InlineToken>cx</InlineToken>.
        </Paragraph>
        <InfoPanel title="Tiny first circuit">
          <BulletList
            items={[
              "Num Qubits: 1",
              "Operations: one operation with Gate = h and Target = 0",
              "Shots: 1024",
              "Include Statevector: unchecked",
              "Send Seed: unchecked",
            ]}
          />
        </InfoPanel>
      </DocsSection>

      <DocsSection title="IBM hardware jobs">
        <Paragraph>
          The plugin submits jobs by profile name. The IBM token and instance stay
          on the Quantum API service, not inside the game. Set{" "}
          <InlineToken>Default IBM Profile Name</InlineToken> in Project Settings
          or fill the request struct's <InlineToken>IbmProfile</InlineToken>.
        </Paragraph>
        <BulletList
          items={[
            "Use List Backends with Provider = ibm to discover a backend name.",
            "Submit Random Job, Submit Circuit Job, or Submit QASM Job with the backend name and profile name.",
            "Poll Get Job Status, then read Get Job Result. Use Cancel Job when needed.",
            `IBM hardware jobs have to wait in a queue before starting; get started at ${IBM_QUANTUM_URL}. Hardware availability, account access, queue time, and usage limits still apply.`,
          ]}
        />
      </DocsSection>

      <DocsSection title="Auth modes: Direct API Key vs Backend Proxy">
        <FieldGrid
          rows={[
            {
              name: "Backend Proxy",
              meaning:
                "Recommended for shipped games. Your backend holds the upstream API key and can accept bearer or custom headers from the plugin.",
            },
            {
              name: "Direct API Key (Development Only)",
              meaning:
                "For local development, demos, and game jams. It sends X-API-Key from the environment, Plugin Settings, or one request's Options.",
            },
            {
              name: "Options",
              meaning:
                "Use Override Api Key, Override Bearer Token, or Extra Headers only when one call needs different auth than the project settings.",
            },
          ]}
        />
        <Paragraph>
          Restart Unreal after changing <InlineToken>QUANTUM_API_KEY</InlineToken>.
          Never ship a packaged client with a real upstream key.
        </Paragraph>
      </DocsSection>

      <DocsSection title="All Blueprint nodes">
        <InfoPanel title="Typed success payloads">
          <BulletList items={["Health Check", "Run Gate", "Transform Text", "Generate Random Int"]} />
        </InfoPanel>
        <InfoPanel title="Named JSON-result async actions">
          <BulletList
            items={[
              "Get Echo Types",
              "Run Circuit",
              "List Backends",
              "Transpile",
              "Import QASM",
              "Export QASM",
              "Run QASM",
              "Submit Circuit Job",
              "Submit QASM Job",
              "Submit Random Job",
              "Get Job Status",
              "Get Job Result",
              "Cancel Job",
            ]}
          />
        </InfoPanel>
        <InfoPanel title="Advanced JSON actions">
          <BulletList items={[...UNREAL_ADVANCED_NODE_LABELS]} />
        </InfoPanel>
      </DocsSection>

      <DocsSection title="Troubleshooting">
        <BulletList
          items={[
            "If a node errors immediately, run Health Check first and confirm that the configured base URL or proxy is reachable.",
            "If Run Circuit feels confusing, start with Run Gate, then Generate Random Int, then one h operation targeting qubit 0.",
            "If IBM hardware does not run, check the profile name, backend availability, account access, queue time, and service-side IBM configuration.",
            "GET health, backend, and job reads retry limited transport and transient-server failures. POSTs and cancellation do not retry automatically.",
          ]}
        />
      </DocsSection>
    </>
  );
}

function TypeScriptGuide() {
  return (
    <>
      <DocsSection title="What this SDK is">
        <Paragraph>
          <InlineToken>@mr.dj2u/quantum-api</InlineToken> is a TypeScript client
          for Node.js applications. It exposes named methods instead of making you
          build every URL and header yourself.
        </Paragraph>
      </DocsSection>
      <DocsSection title="Install">
        <CodeBlock value="npm install @mr.dj2u/quantum-api" />
        <Paragraph>Use Node.js 18 or later. The package supports ESM and CommonJS consumers.</Paragraph>
      </DocsSection>
      <DocsSection title="Configure">
        <Paragraph>
          The base URL is the web address the SDK sends requests to. Give the
          client either the mounted Quantum API address or the same address ending
          in <InlineToken>/v1</InlineToken>; the SDK normalizes it.
        </Paragraph>
        <CodeBlock
          value={`import { QuantumApiClient } from "@mr.dj2u/quantum-api";

const runtimeApiKey = "<your-runtime-api-key>";
const client = new QuantumApiClient({
  baseUrl: "https://davidjgrimsley.com/public-facing/api/quantum",
  apiKey: runtimeApiKey,
});`}
        />
      </DocsSection>
      <DocsSection title="First call: Health Check">
        <CodeBlock
          value={`const health = await client.health();
console.log(health.status, health.runtime_mode);`}
        />
        <Paragraph>
          Health is public. It is the smallest useful check before making an
          authenticated runtime call.
        </Paragraph>
      </DocsSection>
      <DocsSection title="Run Gate example">
        <CodeBlock
          value={`const gate = await client.runGate({
  gate_type: "rotation",
  rotation_angle_rad: Math.PI / 2,
});

console.log(gate.measurement);`}
        />
      </DocsSection>
      <DocsSection title="Auth modes">
        <FieldGrid
          rows={[
            { name: "Public", meaning: "Health and portfolio metadata do not require credentials." },
            { name: "API key", meaning: "Most runtime methods use X-API-Key. Pass apiKey when creating the client." },
            { name: "Bearer token", meaning: "Account key management and IBM profile methods use the signed-in user's bearer token." },
            { name: "Per-call override", meaning: "Pass auth options to a method only when that call needs different credentials." },
          ]}
        />
      </DocsSection>
      <DocsSection title="IBM profiles and jobs">
        <Paragraph>
          Use bearer-authenticated profile methods to create, verify, update, and
          remove an IBM profile. Then submit a circuit, QASM, or random job with
          the saved profile name and poll the job result.
        </Paragraph>
        <Paragraph>
          IBM hardware jobs have to wait in a queue before starting; get started at{" "}
          <Link href={IBM_QUANTUM_URL as Href}>
            <ThemedText className="text-tint underline">
              quantum.cloud.ibm.com
            </ThemedText>
          </Link>
          .
        </Paragraph>
        <CodeBlock
          value={`const job = await client.submitCircuitJob({
  provider: "ibm",
  backend_name: "ibm_brisbane",
  ibm_profile: "my-profile",
  shots: 1024,
  circuit: { num_qubits: 1, operations: [{ gate: "h", target: 0 }] },
});`}
        />
      </DocsSection>
      <DocsSection title="Useful methods">
        <BulletList
          items={[
            "health, portfolio, echoTypes, runGate, runCircuit, transformText",
            "listBackends, transpile, importQasm, exportQasm, runQasm",
            "listKeys, createKey, revokeKey, rotateKey, deleteKey",
            "listIbmProfiles, createIbmProfile, updateIbmProfile, verifyIbmProfile, deleteIbmProfile",
            "submitCircuitJob, submitQasmJob, submitRandomJob, getCircuitJob, getCircuitJobResult, cancelCircuitJob",
          ]}
        />
      </DocsSection>
      <DocsSection title="Troubleshooting">
        <BulletList
          items={[
            "Catch QuantumApiError and inspect statusCode, code, requestId, and details.",
            "If a runtime call returns 401, check the API key. If a profile call returns 401, check the bearer token.",
            "Keep API keys and IBM tokens on a server when distributing an application to other people.",
          ]}
        />
      </DocsSection>
    </>
  );
}

function PythonGuide() {
  return (
    <>
      <DocsSection title="What this SDK is">
        <Paragraph>
          <InlineToken>quantum-api-sdk</InlineToken> is a synchronous Python
          client for scripts, command-line tools, service integrations, and backend
          automation. It uses <InlineToken>httpx</InlineToken> and works as a
          context manager.
        </Paragraph>
      </DocsSection>
      <DocsSection title="Install">
        <CodeBlock value="pip install quantum-api-sdk" />
        <Paragraph>The package requires Python 3.11 or later.</Paragraph>
      </DocsSection>
      <DocsSection title="Configure">
        <Paragraph>
          The base URL is the web address the client sends requests to. You can
          pass the mounted Quantum API address with or without <InlineToken>/v1</InlineToken>;
          the client makes the final address consistent.
        </Paragraph>
        <CodeBlock
          value={`from quantum_api_sdk import QuantumApiClient

client = QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum",
    api_key="your-runtime-api-key",
)`}
        />
      </DocsSection>
      <DocsSection title="First call: Health Check">
        <CodeBlock
          value={`from quantum_api_sdk import QuantumApiClient, QuantumApiError

with QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum"
) as client:
    try:
        health = client.health()
        print(health["status"])
    except QuantumApiError as error:
        print(error.status_code, error.code, error.request_id)`}
        />
      </DocsSection>
      <DocsSection title="Run Gate example">
        <CodeBlock
          value={`with QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum",
    api_key="your-runtime-api-key",
) as client:
    gate = client.run_gate({
        "gate_type": "rotation",
        "rotation_angle_rad": 1.57079632679,
    })
    print(gate["measurement"])`}
        />
      </DocsSection>
      <DocsSection title="Auth modes">
        <FieldGrid
          rows={[
            { name: "auto", meaning: "The default. Health and portfolio are public, profile and key routes use bearer auth, and runtime routes use an API key." },
            { name: "api_key", meaning: "Use X-API-Key for protected runtime methods." },
            { name: "bearer", meaning: "Use a signed-in user's bearer token for keys and IBM profiles." },
            { name: "none", meaning: "Use only for public calls such as health." },
          ]}
        />
      </DocsSection>
      <DocsSection title="IBM profiles and jobs">
        <Paragraph>
          Create and verify IBM profiles with a bearer token, then use the saved
          <InlineToken>ibm_profile</InlineToken> name in backend, transpile, and
          job requests. In a distributed app, keep the IBM profile lifecycle on
          your server.
        </Paragraph>
        <Paragraph>
          IBM hardware jobs have to wait in a queue before starting; get started at{" "}
          <Link href={IBM_QUANTUM_URL as Href}>
            <ThemedText className="text-tint underline">
              quantum.cloud.ibm.com
            </ThemedText>
          </Link>
          .
        </Paragraph>
      </DocsSection>
      <DocsSection title="Useful methods">
        <BulletList
          items={[
            "health, portfolio, echo_types, run_gate, run_circuit, transform_text",
            "list_backends, transpile, import_qasm, export_qasm, run_qasm",
            "list_keys, create_key, revoke_key, rotate_key, delete_key",
            "list_ibm_profiles, create_ibm_profile, update_ibm_profile, verify_ibm_profile, delete_ibm_profile",
            "submit_circuit_job, submit_qasm_job, submit_random_job, get_circuit_job, get_circuit_job_result, cancel_circuit_job",
          ]}
        />
      </DocsSection>
      <DocsSection title="Troubleshooting">
        <BulletList
          items={[
            "Catch QuantumApiError so failures preserve a status code, normalized code, request ID, and details.",
            "Use API-key auth for runtime calls and bearer auth for account/profile calls.",
            "Keep credentials in environment variables or server-side secret storage, not in a shipped client.",
          ]}
        />
      </DocsSection>
    </>
  );
}

function GodotGuide() {
  return (
    <>
      <DocsSection title="What this addon is">
        <Paragraph>
          The Godot addon is a reusable runtime client, not editor tooling. Add it
          to a game when you need health checks, text transforms, gate calls,
          backend discovery, transpile, or IBM circuit jobs from Godot code.
        </Paragraph>
      </DocsSection>
      <DocsSection title="Install">
        <BulletList
          items={[
            "Copy the addon into your project as addons/quantum_api_client/.",
            "Preload res://addons/quantum_api_client/quantum_api_client.gd from your game script.",
            "Create the client as a child node at runtime, then call apply_project_settings().",
          ]}
        />
      </DocsSection>
      <DocsSection title="Configure project settings">
        <Paragraph>
          The base URL is the web address the addon sends requests to. It accepts
          the mounted Quantum API address with or without <InlineToken>/v1</InlineToken>
          and normalizes the final request address.
        </Paragraph>
        <CodeBlock
          value={`[quantum_api]
base_url="https://davidjgrimsley.com/public-facing/api/quantum/v1"
backend_proxy_mode=true
direct_api_key=""
default_ibm_profile=""`}
        />
      </DocsSection>
      <DocsSection title="First call: Health Check">
        <CodeBlock
          value={`const QuantumApiClientScript = preload("res://addons/quantum_api_client/quantum_api_client.gd")
var quantum_api_client: QuantumApiClient

func _ready() -> void:
    quantum_api_client = QuantumApiClientScript.new()
    add_child(quantum_api_client)
    quantum_api_client.apply_project_settings()
    quantum_api_client.health_check(func(success: bool, payload: Dictionary) -> void:
        print(success, payload)
    )`}
        />
      </DocsSection>
      <DocsSection title="Run Gate example">
        <CodeBlock
          value={`quantum_api_client.run_gate({
    "gate_type": "rotation",
    "rotation_angle_rad": PI / 2.0,
}, func(success: bool, payload: Dictionary) -> void:
    print(success, payload)
)`}
        />
      </DocsSection>
      <DocsSection title="Backend proxy vs direct API key">
        <FieldGrid
          rows={[
            { name: "Backend proxy mode", meaning: "Keep this true for a shipped game. Your backend keeps the upstream API key out of the client." },
            { name: "Direct API key", meaning: "Useful for local development, prototypes, and demos. Set it only after choosing to accept that the client can expose it." },
            { name: "Default IBM profile", meaning: "An optional saved profile name used by IBM runtime calls when one is not supplied for that call." },
          ]}
        />
      </DocsSection>
      <DocsSection title="IBM hardware jobs">
        <Paragraph>
          Profile management stays on the Quantum API account site or your backend.
          The addon consumes an existing profile name. Pass it for IBM calls or set
          <InlineToken>default_ibm_profile</InlineToken> in project settings.
        </Paragraph>
        <Paragraph>
          IBM hardware jobs have to wait in a queue before starting; get started at{" "}
          <Link href={IBM_QUANTUM_URL as Href}>
            <ThemedText className="text-tint underline">
              quantum.cloud.ibm.com
            </ThemedText>
          </Link>
          .
        </Paragraph>
        <CodeBlock
          value={`quantum_api_client.list_backends(func(success: bool, payload: Dictionary) -> void:
    print(success, payload)
, "ibm")`}
        />
      </DocsSection>
      <DocsSection title="Available calls">
        <BulletList items={["health_check", "transform_text", "run_gate", "list_backends", "transpile", "submit_circuit_job"]} />
      </DocsSection>
      <DocsSection title="Troubleshooting">
        <BulletList
          items={[
            "Start with health_check to distinguish a connection problem from a request-shape problem.",
            "When using direct mode, create an API key through the Quantum API account page and keep it out of a distributed build.",
            "For IBM calls, verify the selected profile and backend availability before submitting a job.",
          ]}
        />
      </DocsSection>
    </>
  );
}

function UnityGuide() {
  return (
    <>
      <DocsSection title="What this package is">
        <Paragraph>
          This Unity runtime package is for gameplay code, not editor tooling. It
          uses <InlineToken>UnityWebRequest</InlineToken> behind coroutine and Task
          entry points, with structured errors for API failures.
        </Paragraph>
      </DocsSection>
      <DocsSection title="Install">
        <BulletList
          items={[
            "Copy sdk/unity into your Unity project's Packages directory, or add it by local path in Unity Package Manager.",
            "Use Unity 2021 LTS or later.",
            "Create QuantumApiClient with your API address and keep BackendProxyMode enabled for shipped builds.",
          ]}
        />
      </DocsSection>
      <DocsSection title="Configure">
        <Paragraph>
          The base URL is the web address the package sends requests to. It accepts
          the mounted Quantum API address with or without <InlineToken>/v1</InlineToken>
          and normalizes it before sending requests.
        </Paragraph>
        <CodeBlock
          value={`using QuantumApi.Unity;

var client = new QuantumApiClient(new QuantumApiClientOptions
{
    BaseUrl = "https://davidjgrimsley.com/public-facing/api/quantum",
    BackendProxyMode = true,
    TimeoutSeconds = 15,
});`}
        />
      </DocsSection>
      <DocsSection title="First call: Health Check">
        <CodeBlock
          value={`private async void Start()
{
    var health = await client.HealthAsync();
    Debug.Log($"Quantum API status: {health.status}");
}`}
        />
      </DocsSection>
      <DocsSection title="Run Gate example">
        <CodeBlock
          value={`StartCoroutine(client.RunGateCoroutine(
    new GateRunRequest
    {
        gate_type = "rotation",
        rotation_angle_rad = Mathf.PI / 2f,
    },
    response => Debug.Log($"Measurement: {response.measurement}"),
    error => Debug.LogWarning(error.Message)
));`}
        />
      </DocsSection>
      <DocsSection title="Auth modes">
        <FieldGrid
          rows={[
            { name: "Backend proxy mode", meaning: "The default for shipped builds. Runtime calls go through your backend so the upstream key stays server-side." },
            { name: "Direct API key", meaning: "For local development, demos, and prototypes. Protected runtime calls send X-API-Key." },
            { name: "Bearer override", meaning: "Use a bearer token only when your own backend proxy expects it, or override a request's auth intentionally." },
          ]}
        />
      </DocsSection>
      <DocsSection title="IBM profiles">
        <Paragraph>
          The current package wraps gameplay endpoints only. Manage IBM credential
          profiles through your backend, then submit IBM jobs using the selected
          profile name. Do not put IBM tokens in a distributed Unity build.
        </Paragraph>
        <Paragraph>
          IBM hardware jobs have to wait in a queue before starting; get started at{" "}
          <Link href={IBM_QUANTUM_URL as Href}>
            <ThemedText className="text-tint underline">
              quantum.cloud.ibm.com
            </ThemedText>
          </Link>
          .
        </Paragraph>
      </DocsSection>
      <DocsSection title="Available calls">
        <BulletList items={["GET /v1/health", "GET /v1/echo-types", "POST /v1/gates/run", "POST /v1/text/transform"]} />
      </DocsSection>
      <DocsSection title="Troubleshooting">
        <BulletList
          items={[
            "Call HealthAsync first to check that the API address is reachable.",
            "Use BackendProxyMode for distributed builds so a runtime key is not embedded in game assets.",
            "Treat the package as a runtime helper and smoke-test it inside a Unity project before relying on it in a release.",
          ]}
        />
      </DocsSection>
    </>
  );
}

const guideContent: Record<string, { sectionTitles: readonly string[]; content: React.ReactNode }> = {
  "ue-plugin": { sectionTitles: UNREAL_SECTION_TITLES, content: <UnrealGuide /> },
  "typescript-sdk": {
    sectionTitles: ["What this SDK is", "Install", "Configure", "First call: Health Check", "Run Gate example", "Auth modes", "IBM profiles and jobs", "Useful methods", "Troubleshooting"],
    content: <TypeScriptGuide />,
  },
  "python-sdk": {
    sectionTitles: ["What this SDK is", "Install", "Configure", "First call: Health Check", "Run Gate example", "Auth modes", "IBM profiles and jobs", "Useful methods", "Troubleshooting"],
    content: <PythonGuide />,
  },
  "godot-addon": {
    sectionTitles: ["What this addon is", "Install", "Configure project settings", "First call: Health Check", "Run Gate example", "Backend proxy vs direct API key", "IBM hardware jobs", "Available calls", "Troubleshooting"],
    content: <GodotGuide />,
  },
  "unity-package": {
    sectionTitles: ["What this package is", "Install", "Configure", "First call: Health Check", "Run Gate example", "Auth modes", "IBM profiles", "Available calls", "Troubleshooting"],
    content: <UnityGuide />,
  },
};

export function QuantumIntegrationDocs({ slug }: { slug: string | undefined }) {
  const doc = getQuantumIntegrationDoc(slug);
  const guide = doc ? guideContent[doc.slug] : undefined;

  if (!doc || !guide) {
    return (
      <PublicFacingDetailWrapper contentClassName="max-w-5xl">
        <View className="gap-4">
          <ThemedText type="title" headingLevel={1} visualHeadingLevel={1} className="font-noto-serif-display text-tint">
            Quantum integration guide not found
          </ThemedText>
          <Paragraph>The requested guide is not part of the published Quantum API documentation.</Paragraph>
          <Link href={QUANTUM_API_PATH as Href} className="self-start">
            <ThemedText className="text-tint underline">View Quantum API docs</ThemedText>
          </Link>
        </View>
      </PublicFacingDetailWrapper>
    );
  }

  const pageUrl = joinUrl(SITE_URL, doc.path);
  const markdownUrl = joinUrl(SITE_URL, doc.markdownPath);
  const llmsUrl = joinUrl(SITE_URL, LLMS_TXT_PATH);
  const structuredData = [
    {
      "@type": "TechArticle",
      "@id": `${pageUrl}#article`,
      headline: doc.title,
      description: doc.description,
      url: pageUrl,
      author: { "@type": "Person", name: "David Grimsley", url: SITE_URL },
      about: ["Quantum API", doc.kind],
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Public APIs", item: joinUrl(SITE_URL, "/public-facing/api") },
        { "@type": "ListItem", position: 3, name: "Quantum API", item: joinUrl(SITE_URL, QUANTUM_API_PATH) },
        { "@type": "ListItem", position: 4, name: doc.title, item: pageUrl },
      ],
    },
  ];

  return (
    <PublicFacingDetailWrapper
      contentClassName="max-w-5xl"
      seo={{
        title: doc.title,
        description: doc.description,
        path: doc.path,
        keywords: ["Quantum API", doc.title, doc.kind, "developer documentation"],
        links: [
          { rel: "alternate", type: "text/markdown", href: markdownUrl },
          { rel: "describedby", href: llmsUrl },
        ],
        type: "article",
        structuredData,
      }}
    >
      <View className="gap-6">
        <View className="gap-4">
          <View className="flex-row flex-wrap items-end gap-3">
            <ThemedText
              type="title"
              headingLevel={1}
              visualHeadingLevel={1}
              className="font-noto-serif-display text-tint"
            >
              {doc.title}
            </ThemedText>
            <ThemedText className="pb-1 text-lg font-bold text-tint">
              v{doc.version}
            </ThemedText>
          </View>
          <IntegrationIntroPanel doc={doc} />
          <View className="rounded-lg border border-tint/30 bg-accent/40 p-4 gap-4">
            <View>
              <ThemedText type="defaultSemiBold" className="mb-3 text-tint">
                On this page
              </ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {guide.sectionTitles.map((title) => (
                  <Link
                    key={title}
                    href={`${doc.path}#${slugify(title)}` as Href}
                    onPress={() => scrollToSection(slugify(title))}
                    className="rounded-md border border-tint/40 px-3 py-2"
                  >
                    <ThemedText className="text-sm text-tint">{title}</ThemedText>
                  </Link>
                ))}
              </View>
            </View>
          </View>
        </View>
        {guide.content}
        <FeedbackAndAgentSections markdownPath={doc.markdownPath} />
      </View>
    </PublicFacingDetailWrapper>
  );
}
