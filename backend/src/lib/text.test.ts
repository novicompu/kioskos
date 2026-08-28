import { describe, expect, it } from "vitest";
import { nonBlank } from "./text.js";

describe("nonBlank", () => {
  it("devuelve el texto recortado cuando hay contenido real", () => {
    expect(nonBlank("  Marco Cachote  ")).toBe("Marco Cachote");
  });

  it("trata undefined como sin dato", () => {
    expect(nonBlank(undefined)).toBeNull();
  });

  it("trata null como sin dato", () => {
    expect(nonBlank(null)).toBeNull();
  });

  it("trata string vacio como sin dato", () => {
    expect(nonBlank("")).toBeNull();
  });

  it("trata string de solo espacios como sin dato", () => {
    expect(nonBlank("   ")).toBeNull();
  });
});
