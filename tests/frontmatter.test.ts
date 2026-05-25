import { describe, it, expect } from "vitest";
import { previewValue } from "../src/frontmatter";

describe("previewValue", () => {
	it("converts a string as-is", () => {
		expect(previewValue("hello")).toBe("hello");
	});

	it("truncates long strings", () => {
		const long = "a".repeat(80);
		const result = previewValue(long);
		expect(result.length).toBeLessThanOrEqual(60);
		expect(result.endsWith("…")).toBe(true);
	});

	it("serializes arrays to JSON", () => {
		expect(previewValue(["a", "b"])).toBe('["a","b"]');
	});

	it("serializes objects to JSON", () => {
		expect(previewValue({ x: 1 })).toBe('{"x":1}');
	});

	it("truncates long JSON", () => {
		const obj = { key: "a".repeat(80) };
		const result = previewValue(obj);
		expect(result.length).toBeLessThanOrEqual(60);
		expect(result.endsWith("…")).toBe(true);
	});

	it("handles null/undefined gracefully", () => {
		expect(previewValue(null)).toBe("");
		expect(previewValue(undefined)).toBe("");
	});

	it("handles numbers and booleans", () => {
		expect(previewValue(42)).toBe("42");
		expect(previewValue(true)).toBe("true");
	});
});
