import fs from "node:fs";
import path from "node:path";

import quantumIntegrationDocsData from "@json/quantum-integration-docs.json";

const quantumDocs = quantumIntegrationDocsData.docs;
const publicDirectory = path.resolve(process.cwd(), "public");

describe("Quantum integration documentation registry", () => {
  it("publishes every requested guide with a matching Markdown companion", () => {
    expect(quantumDocs.map((doc) => doc.slug)).toEqual([
      "ue-plugin",
      "typescript-sdk",
      "python-sdk",
      "godot-addon",
      "unity-package",
    ]);

    for (const doc of quantumDocs) {
      expect(doc.path).toBe(`/public-facing/api/quantum/${doc.slug}`);
      expect(doc.markdownPath).toBe(`${doc.path}.md`);
      expect(fs.existsSync(path.join(publicDirectory, doc.markdownPath))).toBe(true);
    }
  });

  it("keeps removed Unreal sections and metadata nodes out of the published Markdown", () => {
    const unrealMarkdown = fs.readFileSync(
      path.join(publicDirectory, "public-facing", "api", "quantum", "ue-plugin.md"),
      "utf8",
    );

    expect(unrealMarkdown).toContain("What does");
    expect(unrealMarkdown).toContain("Quantum Api Circuit Operation");
    expect(unrealMarkdown).not.toContain("Packaging / distribution");
    expect(unrealMarkdown).not.toContain("Portfolio Metadata");
  });
});
