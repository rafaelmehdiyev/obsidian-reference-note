import { App, ButtonComponent, Notice, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type ReferenceNotePlugin from "./main";

export interface ReferenceNoteSettings {
	defaultExcludedKeys: string[];
	sourceLinkKey: string;
}

export const DEFAULT_SETTINGS: ReferenceNoteSettings = {
	defaultExcludedKeys: [],
	sourceLinkKey: "source",
};

export class ReferenceNoteSettingTab extends PluginSettingTab {
	plugin: ReferenceNotePlugin;

	constructor(app: App, plugin: ReferenceNotePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ── Excluded keys ────────────────────────────────────────────────────
		new Setting(containerEl)
			.setName("Excluded keys")
			.setDesc(
				"Keys that will be unchecked by default when the modal opens. " +
				"Useful for timestamps, IDs, and other note-specific properties."
			)
			.setHeading();

		// Live list of current excluded keys
		const keyListEl = containerEl.createDiv({ cls: "rn-settings-key-list" });

		const renderKeys = () => {
			keyListEl.empty();
			if (this.plugin.settings.defaultExcludedKeys.length === 0) {
				keyListEl.createEl("p", {
					text: "No excluded keys yet — all properties will be checked by default.",
					cls: "rn-settings-empty",
				});
				return;
			}
			for (const key of this.plugin.settings.defaultExcludedKeys) {
				const row = keyListEl.createDiv({ cls: "rn-settings-key-row" });
				row.createSpan({ text: key, cls: "rn-settings-key-name" });
				new ButtonComponent(row)
					.setIcon("x")
					.setTooltip(`Remove "${key}"`)
					.buttonEl.addClass("rn-settings-key-remove");
				// wire up after adding class so we keep the ButtonComponent ref
				const btn = row.querySelector("button") as HTMLButtonElement;
				btn.addEventListener("click", async () => {
					this.plugin.settings.defaultExcludedKeys =
						this.plugin.settings.defaultExcludedKeys.filter((k) => k !== key);
					await this.plugin.saveSettings();
					renderKeys();
				});
			}
		};

		renderKeys();

		// Add-key row
		let newKeyText: TextComponent;

		const addKey = async () => {
			const val = newKeyText.getValue().trim().toLowerCase();
			if (!val) return;
			if (this.plugin.settings.defaultExcludedKeys.includes(val)) {
				new Notice(`"${val}" is already in the list.`);
				return;
			}
			this.plugin.settings.defaultExcludedKeys.push(val);
			await this.plugin.saveSettings();
			newKeyText.setValue("");
			renderKeys();
		};

		const addRow = containerEl.createDiv({ cls: "rn-add-key-row" });
		newKeyText = new TextComponent(addRow);
		newKeyText.setPlaceholder("Key name, e.g. date");
		newKeyText.inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") { e.preventDefault(); addKey(); }
		});
		new ButtonComponent(addRow).setButtonText("Add key").setCta().onClick(() => addKey());

		// ── Source link key ──────────────────────────────────────────────────
		new Setting(containerEl)
			.setName("Source link key")
			.setDesc('Frontmatter key used when "Link back to source" is enabled.')
			.addText((text) =>
				text
					.setPlaceholder("source")
					.setValue(this.plugin.settings.sourceLinkKey)
					.onChange(async (value) => {
						this.plugin.settings.sourceLinkKey = value.trim() || "source";
						await this.plugin.saveSettings();
					})
			);
	}
}
