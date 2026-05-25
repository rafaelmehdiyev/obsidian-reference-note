import { App, TFile } from "obsidian";

export function extractFrontmatter(app: App, file: TFile): Record<string, unknown> | null {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.frontmatter) return null;
	const fm = { ...cache.frontmatter };
	// metadataCache includes a non-enumerable `position` key on some versions; delete it if present
	delete fm["position"];
	if (Object.keys(fm).length === 0) return null;
	return fm;
}

export function hasFrontmatter(app: App, file: TFile): boolean {
	return extractFrontmatter(app, file) !== null;
}

export function previewValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") {
		const json = JSON.stringify(value);
		return json.length > 60 ? json.slice(0, 57) + "…" : json;
	}
	const str = String(value);
	return str.length > 60 ? str.slice(0, 57) + "…" : str;
}
