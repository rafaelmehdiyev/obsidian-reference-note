import { Notice, Plugin, TFile } from "obsidian";
import { ReferenceNoteSettings, DEFAULT_SETTINGS, ReferenceNoteSettingTab } from "./settings";
import { ReferenceNoteModal } from "./modal";
import { hasFrontmatter } from "./frontmatter";

export default class ReferenceNotePlugin extends Plugin {
	settings: ReferenceNoteSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ReferenceNoteSettingTab(this.app, this));

		this.addRibbonIcon("copy-plus", "Use this note as reference", () => {
			const file = this.app.workspace.getActiveFile();
			if (!file) {
				new Notice("No note is open.");
				return;
			}
			if (!hasFrontmatter(this.app, file)) {
				new Notice("No frontmatter found in this note.");
				return;
			}
			new ReferenceNoteModal(this.app, file, this.settings).open();
		});

		this.addCommand({
			id: "use-as-reference",
			name: "Use this note as reference",
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return;
				if (!hasFrontmatter(this.app, file)) {
					new Notice("No frontmatter found in this note.");
					return;
				}
				new ReferenceNoteModal(this.app, file, this.settings).open();
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, abstractFile) => {
				if (!(abstractFile instanceof TFile)) return;
				if (!abstractFile.path.endsWith(".md")) return;
				menu.addItem((item) => {
					item
						.setTitle("Use as reference")
						.setIcon("copy-plus")
						.onClick(() => {
							if (!hasFrontmatter(this.app, abstractFile)) {
								new Notice("No frontmatter found in this note.");
								return;
							}
							new ReferenceNoteModal(this.app, abstractFile, this.settings).open();
						});
				});
			})
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
