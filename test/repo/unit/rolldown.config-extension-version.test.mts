import { describe, expect, test } from "vitest";

import { defineExtensionVersionPlugin } from "../../../.config/repo/rolldown.config.mts";

export function rewriteInlinedExtensionVersion(
  code: string,
  version = "2.0.3",
): string {
  const plugin = defineExtensionVersionPlugin(version);
  const transform = plugin.transform;
  if (typeof transform !== "function") {
    throw new TypeError("Extension version plugin must provide a transform.");
  }
  const result: unknown = Reflect.apply(transform, {}, [
    code,
    "src/example.mts",
  ]);
  if (typeof result !== "string") {
    throw new TypeError(
      "Extension version plugin did not return transformed code.",
    );
  }
  return result;
}

describe("defineExtensionVersionPlugin", () => {
  test("rewrites single-quoted bracket access", () => {
    expect(
      rewriteInlinedExtensionVersion(
        "const version = process.env['INLINED_EXTENSION_VERSION']",
      ),
    ).toBe('const version = "2.0.3"');
  });

  test("rewrites double-quoted bracket access", () => {
    expect(
      rewriteInlinedExtensionVersion(
        'const version = process.env["INLINED_EXTENSION_VERSION"]',
      ),
    ).toBe('const version = "2.0.3"');
  });

  test("rewrites TypeScript source", () => {
    const source =
      "export function readVersion(): string {\n" +
      "  return process.env['INLINED_EXTENSION_VERSION']\n" +
      "}\n";
    expect(rewriteInlinedExtensionVersion(source)).toBe(
      'export function readVersion(): string {\n  return "2.0.3"\n}\n',
    );
  });

  test("leaves dot and dynamic access untouched", () => {
    const source =
      "const a = process.env.INLINED_EXTENSION_VERSION\n" +
      'const key = "INLINED_EXTENSION_VERSION"\n' +
      "const b = process.env[key]";
    expect(rewriteInlinedExtensionVersion(source)).toBe(source);
  });

  test("leaves unrelated environment variables untouched", () => {
    const source = "const value = process.env['OTHER_VARIABLE']";
    expect(rewriteInlinedExtensionVersion(source)).toBe(source);
  });
});
