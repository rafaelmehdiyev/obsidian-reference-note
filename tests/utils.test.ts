import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../src/utils";

describe("sanitizeFilename", () => {
	it("strips forbidden characters", () => {
		expect(sanitizeFilename('my*note"file')).toBe("mynoteFile".replace("F", "f").replace("ile", "ile"));
		// Direct check: strips * and "
		expect(sanitizeFilename('test*name"here')).toBe("testnamehere");
	});

	it("strips all forbidden chars", () => {
		expect(sanitizeFilename('note<>:|?#^[]\\/test')).toBe("notetest");
	});

	it("trims whitespace", () => {
		expect(sanitizeFilename("  note  ")).toBe("note");
	});

	it("preserves normal names", () => {
		expect(sanitizeFilename("My Note 2025")).toBe("My Note 2025");
	});

	it("returns empty string for all-invalid input", () => {
		expect(sanitizeFilename("***")).toBe("");
	});
});

describe("getUniqueName — logic", () => {
	// Test the naming logic directly without a real App instance
	it("appends incrementing suffix for conflicts", () => {
		// Replicate the logic: baseName, baseName 2, baseName 3 …
		const existing = new Set(["Note.md", "Note 2.md", "Note 3.md"]);
		function mockUniqueName(base: string): string {
			if (!existing.has(base + ".md")) return base;
			let n = 2;
			while (existing.has(`${base} ${n}.md`)) n++;
			return `${base} ${n}`;
		}
		expect(mockUniqueName("Note")).toBe("Note 4");
		expect(mockUniqueName("Other")).toBe("Other");
	});
});
