import { App, TFolder } from "obsidian";

export function sanitizeFilename(name: string): string {
	// Strip characters forbidden in Obsidian note names
	return name.replace(/[*"\\/<>:|?#^[\]]/g, "").trim();
}

export function getUniqueName(app: App, folderPath: string, baseName: string): string {
	const prefix = folderPath === "/" || folderPath === "" ? "" : folderPath + "/";
	if (!app.vault.getAbstractFileByPath(prefix + baseName + ".md")) {
		return baseName;
	}
	let n = 2;
	while (app.vault.getAbstractFileByPath(prefix + baseName + " " + n + ".md")) {
		n++;
	}
	return baseName + " " + n;
}

export function getAllFolders(app: App): string[] {
	const folders: string[] = ["/"];
	app.vault.getAllFolders().forEach((folder: TFolder) => {
		if (folder.path) folders.push(folder.path);
	});
	return folders.sort((a, b) => a.localeCompare(b));
}
