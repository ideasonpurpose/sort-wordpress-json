import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import * as vscode from "vscode";

const cli = fileURLToPath(new URL("../cli.js", import.meta.url));

export function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"sort-wordpress-json.sort",
			sortActiveEditor,
		),
	);
}

async function sortActiveEditor() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor.");
		return;
	}
	if (!existsSync(cli)) {
		vscode.window.showErrorMessage(`CLI not found: ${cli}`);
		return;
	}

	const input = editor.document.getText();
	let output;
	try {
		output = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "Sorting WordPress JSON",
			},
			() => runSort(input, editor.document),
		);
	} catch (error) {
		vscode.window.showErrorMessage(error.message);
		return;
	}

	if (output === input) return;

	const document = editor.document;
	const range = new vscode.Range(
		document.positionAt(0),
		document.positionAt(input.length),
	);
	const applied = await editor.edit((editBuilder) => {
		editBuilder.replace(range, output);
	});
	if (!applied) {
		vscode.window.showErrorMessage("Could not replace editor content.");
	}
}

function runSort(input, document) {
	return new Promise((resolve, reject) => {
		const cwd =
			document.uri.scheme === "file"
				? dirname(document.uri.fsPath)
				: dirname(cli);
		const child = spawn(process.execPath, [cli], {
			cwd,
			env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
			stdio: ["pipe", "pipe", "pipe"],
		});
		const stdout = [];
		const stderr = [];
		child.stdout.on("data", (chunk) => stdout.push(chunk));
		child.stderr.on("data", (chunk) => stderr.push(chunk));
		child.on("error", reject);
		child.on("close", (code) => {
			if (code === 0) {
				resolve(Buffer.concat(stdout).toString("utf8"));
				return;
			}
			const message = stripVTControlCharacters(
				Buffer.concat(stderr).toString("utf8"),
			).trim();
			reject(new Error(message || `sort-wp-json exited with code ${code}`));
		});
		child.stdin.end(input);
	});
}

export function deactivate() {}
