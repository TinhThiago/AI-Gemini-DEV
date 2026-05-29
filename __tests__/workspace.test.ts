import { describe, expect, it } from "vitest";
import { safeJoin } from "../lib/workspace";

describe("safeJoin", () => {
  it("allows file inside workspace", () => {
    const result = safeJoin("C:/temp/workspace", "src/App.tsx");

    expect(result.replaceAll("\\", "/")).toContain(
      "C:/temp/workspace/src/App.tsx"
    );
  });

  it("blocks path traversal outside workspace", () => {
    expect(() => {
      safeJoin("C:/temp/workspace", "../secret.txt");
    }).toThrow("Invalid file path");
  });
});