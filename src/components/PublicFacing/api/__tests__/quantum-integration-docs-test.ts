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

  it("publishes package, source, and demo links for the current integration pages", () => {
    const linksBySlug = Object.fromEntries(
      quantumDocs.map((doc) => [
        doc.slug,
        (doc.resourceLinks ?? []).map((link) => link.url),
      ]),
    );

    expect(linksBySlug["ue-plugin"]).toEqual(
      expect.arrayContaining([
        "https://github.com/DavidJGrimsley/quantum-api/releases/tag/quantumapi-unreal-v0.3.0-beta-ue5.8",
        "https://github.com/DavidJGrimsley/quantum-api/tree/main/sdk/unreal",
        "https://github.com/DavidJGrimsley/guess-the-qubit",
      ]),
    );
    expect(linksBySlug["typescript-sdk"]).toEqual(
      expect.arrayContaining([
        "https://www.npmjs.com/package/@mr.dj2u/quantum-api",
        "https://github.com/DavidJGrimsley/quantum-api/tree/main/sdk/js",
      ]),
    );
    expect(linksBySlug["python-sdk"]).toEqual(
      expect.arrayContaining([
        "https://pypi.org/project/quantum-api-sdk/",
        "https://github.com/DavidJGrimsley/quantum-api/tree/main/sdk/python",
      ]),
    );
    expect(linksBySlug["godot-addon"]).toEqual(
      expect.arrayContaining([
        "https://godotengine.org/asset-library/asset/5008",
        "https://store.godotengine.org/asset/david-grimsley/quantum-api/",
      ]),
    );
    expect(linksBySlug["unity-package"]).toEqual(
      expect.arrayContaining([
        "https://github.com/DavidJGrimsley/quantum-api/releases/tag/quantumapi-unity-v1.1.0",
        "https://github.com/DavidJGrimsley/quantum-api/tree/main/sdk/unity",
        "https://github.com/DavidJGrimsley/qrng-unity-demo",
      ]),
    );
  });

  it("keeps release versions and shipped method names aligned with the Markdown guides", () => {
    for (const [slug, version] of [
      ["ue-plugin", "0.3.0-beta"],
      ["unity-package", "1.1.0"],
    ]) {
      const doc = quantumDocs.find((item) => item.slug === slug);
      const markdown = fs.readFileSync(path.join(publicDirectory, doc!.markdownPath), "utf8");
      expect(doc!.version).toBe(version);
      expect(markdown).toContain(`version: \`${version}\``);
    }

    const typescript = fs.readFileSync(path.join(publicDirectory, "public-facing", "api", "quantum", "typescript-sdk.md"), "utf8");
    expect(typescript).not.toMatch(/\b(runQasm|submitRandomJob|submitQasmJob|statusCode)\b/);

    const python = fs.readFileSync(path.join(publicDirectory, "public-facing", "api", "quantum", "python-sdk.md"), "utf8");
    expect(python).not.toContain("submit_random_job");
  });

  it("keeps private account administration out of the public guides", () => {
    const guideFiles = quantumDocs.map((doc) =>
      path.join(publicDirectory, doc.markdownPath),
    );
    guideFiles.push(
      path.resolve(process.cwd(), "src/components/PublicFacing/api/quantum-integration-docs.tsx"),
    );

    for (const file of guideFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toMatch(/owner-only|account administration|profile management|administration methods/i);
    }

    const godot = fs.readFileSync(
      path.join(publicDirectory, "public-facing", "api", "quantum", "godot-addon.md"),
      "utf8",
    );
    expect(godot).not.toContain('base_url="https://davidjgrimsley.com');
  });
});
