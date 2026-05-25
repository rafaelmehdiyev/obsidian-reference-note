import { App, ButtonComponent, Modal, Notice, Setting, TFile, TFolder } from "obsidian";
import { ReferenceNoteSettings } from "./settings";
import { extractFrontmatter, previewValue } from "./frontmatter";
import { FolderSuggest } from "./folder-suggest";
import { getUniqueName, sanitizeFilename } from "./utils";

export class ReferenceNoteModal extends Modal {
	private sourceFile: TFile;
	private settings: ReferenceNoteSettings;

	private noteName: string;
	private checkedKeys: Set<string>;
	private targetFolder: string;
	private linkBack: boolean;

	constructor(app: App, sourceFile: TFile, settings: ReferenceNoteSettings) {
		super(app);
		this.sourceFile = sourceFile;
		this.settings = settings;
		this.noteName = sourceFile.basename + " Copy";
		this.targetFolder = sourceFile.parent?.path ?? "/";
		this.linkBack = false;
		this.checkedKeys = new Set();
	}

	onOpen(): void {
		const { contentEl } = this;
		this.modalEl.addClass("reference-note-modal");
		contentEl.empty();

		this.setTitle(`Use "${this.sourceFile.basename}" as reference`);

		const fm = extractFrontmatter(this.app, this.sourceFile);
		if (!fm) {
			contentEl.createEl("p", { text: "No frontmatter found in this note." });
			new ButtonComponent(contentEl).setButtonText("Close").onClick(() => this.close());
			return;
		}

		// Initialize checked keys (all except default-excluded)
		const excluded = new Set(this.settings.defaultExcludedKeys.map((k) => k.trim()));
		for (const key of Object.keys(fm)) {
			if (!excluded.has(key)) this.checkedKeys.add(key);
		}

		// Note name input
		new Setting(contentEl)
			.setName("Note name")
			.addText((text) => {
				text.setValue(this.noteName).onChange((v) => {
					this.noteName = v;
				});
				text.inputEl.style.width = "100%";
			});

		// Frontmatter key checklist
		const checklistHeader = contentEl.createDiv({ cls: "rn-checklist-header" });
		checklistHeader.createDiv({ cls: "rn-section-label", text: "Properties to carry over" });

		const checklistActions = checklistHeader.createDiv({ cls: "rn-checklist-actions" });
		const allKeys = Object.keys(fm);

		const keyList = contentEl.createDiv({ cls: "rn-key-list" });

		new ButtonComponent(checklistActions)
			.setButtonText("Select all")
			.onClick(() => {
				allKeys.forEach((key) => this.checkedKeys.add(key));
				keyList.querySelectorAll<HTMLInputElement>("input[type='checkbox']")
					.forEach((cb) => (cb.checked = true));
			});

		new ButtonComponent(checklistActions)
			.setButtonText("Remove all")
			.onClick(() => {
				this.checkedKeys.clear();
				keyList.querySelectorAll<HTMLInputElement>("input[type='checkbox']")
					.forEach((cb) => (cb.checked = false));
			});

		for (const key of Object.keys(fm)) {
			const row = keyList.createDiv({ cls: "rn-key-row" });

			const checkboxId = `rn-key-${key}`;
			const checkbox = row.createEl("input", {
				type: "checkbox",
				attr: { id: checkboxId },
			});
			checkbox.checked = this.checkedKeys.has(key);
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.checkedKeys.add(key);
				} else {
					this.checkedKeys.delete(key);
				}
			});

			const label = row.createEl("label", {
				cls: "rn-key-label",
				attr: { for: checkboxId },
			});
			label.createSpan({ cls: "rn-key-name", text: key });
			label.createSpan({ cls: "rn-key-value", text: ": " + previewValue(fm[key]) });
		}

		// Target folder input
		new Setting(contentEl)
			.setName("Target folder")
			.addText((text) => {
				text.setValue(this.targetFolder).onChange((v) => {
					this.targetFolder = v;
				});
				text.inputEl.style.width = "100%";
				new FolderSuggest(this.app, text.inputEl);
			});

		// Link back checkbox
		new Setting(contentEl)
			.setName("Link back to source")
			.setDesc(`Adds a "${this.settings.sourceLinkKey}" property pointing to [[${this.sourceFile.basename}]].`)
			.addToggle((toggle) => {
				toggle.setValue(false).onChange((v) => {
					this.linkBack = v;
				});
			});

		// Buttons
		const buttonRow = contentEl.createDiv({ cls: "rn-buttons" });

		new ButtonComponent(buttonRow)
			.setButtonText("Cancel")
			.onClick(() => this.close());

		const createBtn = new ButtonComponent(buttonRow)
			.setButtonText("Create")
			.setCta()
			.onClick(async () => {
				createBtn.setDisabled(true);
				createBtn.setButtonText("Creating…");
				await this.createNote(fm);
				createBtn.setDisabled(false);
				createBtn.setButtonText("Create");
			});

		// Enter to create
		this.scope.register([], "Enter", async (evt) => {
			// Only trigger if not focused on a text input
			if (
				document.activeElement &&
				(document.activeElement.tagName === "INPUT" ||
					document.activeElement.tagName === "TEXTAREA")
			) {
				return;
			}
			evt.preventDefault();
			createBtn.buttonEl.click();
		});
	}

	private async createNote(fm: Record<string, unknown>): Promise<void> {
		const sanitized = sanitizeFilename(this.noteName);
		if (!sanitized) {
			new Notice("Note name cannot be empty.");
			return;
		}

		const folderPath = this.targetFolder === "/" ? "" : this.targetFolder.replace(/\/+$/, "");

		// Ensure folder exists
		if (folderPath) {
			const existing = this.app.vault.getAbstractFileByPath(folderPath);
			if (!existing) {
				try {
					await this.app.vault.createFolder(folderPath);
				} catch {
					// Folder may have been created concurrently; proceed
				}
			} else if (!(existing instanceof TFolder)) {
				new Notice(`"${folderPath}" exists but is not a folder.`);
				return;
			}
		}

		const uniqueName = getUniqueName(this.app, folderPath || "/", sanitized);
		const filePath = folderPath ? `${folderPath}/${uniqueName}.md` : `${uniqueName}.md`;

		let newFile: TFile;
		try {
			newFile = await this.app.vault.create(filePath, "");
		} catch (e) {
			new Notice("Failed to create note: " + String(e));
			return;
		}

		try {
			await this.app.fileManager.processFrontMatter(newFile, (frontmatter) => {
				for (const key of this.checkedKeys) {
					if (key in fm) frontmatter[key] = fm[key];
				}
				if (this.linkBack) {
					frontmatter[this.settings.sourceLinkKey] = `[[${this.sourceFile.basename}]]`;
				}
			});
		} catch (e) {
			new Notice("Failed to write frontmatter: " + String(e));
			return;
		}

		this.close();
		await this.app.workspace.getLeaf(false).openFile(newFile);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
