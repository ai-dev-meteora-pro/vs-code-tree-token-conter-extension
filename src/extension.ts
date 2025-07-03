import * as vscode from "vscode";
import * as os from "os";
import { TokenCountingService } from "./services/TokenCountingService";
import { CacheManager } from "./services/CacheManager";
import { TokenDecorationProvider } from "./TokenDecorationProvider";
import { TokenStatsManager } from "./services/TokenStatsManager";
import { TokenTreeDataProvider } from "./TokenTreeDataProvider";
import { getLocalizedStrings } from "./localization";

let decorationProvider: TokenDecorationProvider | undefined;
let statsManager: TokenStatsManager | undefined;
let treeDataProvider: TokenTreeDataProvider | undefined;
let treeView:
  | vscode.TreeView<import("./TokenTreeDataProvider").TokenFileItem>
  | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("LLM Token Counter DevBoy.pro: Starting activation...");
  const l10n = getLocalizedStrings();
  console.log(l10n.extensionActivating);

  try {
    const counter = new TokenCountingService();
    console.log("TokenCountingService created");
    const concurrency = Math.min(16, Math.floor(os.cpus().length / 2));
    const cache = new CacheManager(counter, concurrency);
    statsManager = new TokenStatsManager(cache);
    decorationProvider = new TokenDecorationProvider(
      statsManager.getFileMap(),
      statsManager.getFolderMap()
    );
    statsManager.setProvider(decorationProvider);

    // Debug decoration check
    console.log(l10n.checkingDecorations);
    vscode.workspace.textDocuments.forEach((doc) => {
      const decoration = decorationProvider?.provideFileDecoration(doc.uri);
      if (decoration) {
        console.log(`  ${doc.uri.fsPath}: badge=${decoration.badge}`);
      }
    });

    // Register FileDecorationProvider
    console.log(l10n.registeringFileDecorationProvider);
    const decorationDisposable =
      vscode.window.registerFileDecorationProvider(decorationProvider);
    context.subscriptions.push(decorationDisposable);
    console.log(l10n.fileDecorationProviderRegistered);

    // Create and register TreeDataProvider
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    treeDataProvider = new TokenTreeDataProvider(
      workspaceRoot,
      statsManager.getFileMap()
    );
    treeView = vscode.window.createTreeView("tokenCounterView", {
      treeDataProvider: treeDataProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);
    console.log(l10n.treeDataProviderRegistered);

    console.log(l10n.startingScan);
    void statsManager.scanWorkspace().then(() => {
      console.log(l10n.scanComplete);
      decorationProvider?.updateDecorations();
      treeDataProvider?.refresh();
    });

    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidChange((uri) => {
      statsManager?.handleChange(uri);
      treeDataProvider?.refresh();
    });
    watcher.onDidCreate((uri) => {
      statsManager?.handleChange(uri);
      treeDataProvider?.refresh();
    });
    watcher.onDidDelete((uri) => {
      statsManager?.handleDelete(uri);
      treeDataProvider?.refresh();
    });
    context.subscriptions.push(watcher);

    // Handle configuration changes for encoding selection
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokenCounter.encoding')) {
            counter.refreshConfig();
            decorationProvider?.refreshAll();
            treeDataProvider?.refresh();
        }
    }));

    // Register refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand("tokenCounter.refresh", () => {
        console.log(l10n.updatingTokenCounter);
        void statsManager?.scanWorkspace().then(() => {
          treeDataProvider?.refresh();
          vscode.window.showInformationMessage(l10n.tokenCountUpdated);
        });
      })
    );

    // Test decoration command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "tokenCounter.testDecoration",
        async () => {
          const uri = vscode.window.activeTextEditor?.document.uri;
          if (!uri) {
            vscode.window.showInformationMessage(l10n.openFileForTesting);
            return;
          }

          // Force decoration update
          decorationProvider?.updateDecorations();

          // Get decoration
          const decoration = decorationProvider?.provideFileDecoration(uri);

          if (decoration) {
            vscode.window.showInformationMessage(
              l10n.decorationFound(
                decoration.badge || "",
                decoration.tooltip || ""
              )
            );
          } else {
            vscode.window.showWarningMessage(l10n.decorationNotFound);
          }
        }
      )
    );

    // Add debug command
    context.subscriptions.push(
      vscode.commands.registerCommand("tokenCounter.debug", () => {
        const fileMap = statsManager?.getFileMap();
        const folderMap = statsManager?.getFolderMap();

        console.log("=== Token Counter Debug Info ===");
        console.log(`Files in map: ${fileMap?.size || 0}`);
        console.log(`Folders in map: ${folderMap?.size || 0}`);

        if (fileMap) {
          console.log("\nFiles:");
          fileMap.forEach((data, path) => {
            console.log(
              `  ${path}: ${data.tokens} tokens, status: ${data.status}, processed: ${data.processed}`
            );
          });
        }

        // Test decorations
        const activeFile = vscode.window.activeTextEditor?.document.uri;
        if (activeFile && decorationProvider) {
          const decoration =
            decorationProvider.provideFileDecoration(activeFile);
          console.log(`\nActive file decoration:`);
          console.log(`  URI: ${activeFile.toString()}`);
          console.log(`  fsPath: ${activeFile.fsPath}`);
          console.log(
            `  Decoration: ${decoration ? JSON.stringify(decoration) : "none"}`
          );
        }

        vscode.window.showInformationMessage(
          `Token Counter: ${
            fileMap?.size || 0
          } files tracked. Check console for details.`
        );
      })
    );
  } catch (error) {
    console.error("LLM Token Counter DevBoy.pro: Activation failed", error);
    vscode.window.showErrorMessage(
      `LLM Token Counter activation failed: ${error}`
    );
  }
}

export async function deactivate() {
  await statsManager?.dispose();
}
