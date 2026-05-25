import { AbstractInputSuggest, App } from "obsidian";
import { getAllFolders } from "./utils";

export class FolderSuggest extends AbstractInputSuggest<string> {
	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	getSuggestions(query: string): string[] {
		const lower = query.toLowerCase();
		return getAllFolders(this.app).filter((f) => f.toLowerCase().includes(lower));
	}

	renderSuggestion(folder: string, el: HTMLElement): void {
		el.setText(folder);
	}

	selectSuggestion(folder: string): void {
		this.setValue(folder);
		this.close();
	}
}
