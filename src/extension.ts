import * as vscode from "vscode";
import { metaProvideHover } from "./provide";
import { Synchronizer } from "./sync";
import { registerUserScriptHighlighter } from "./highlight/userScriptHighlighter";
import { checkAndPromptSemanticHighlighting } from "./highlight/semanticHighlighting";
import { registerUserScriptDiagnostics } from "./highlight/userScriptDiagnostics";
import { existsSync, fstat } from "fs";
import "fs";

export function activate(context: vscode.ExtensionContext) {
  let watcher = null;

  const signatureFileCommand = "scriptcat.target";
  const autoTargetCommand = "scriptcat.autoTarget";
  const config = context.workspaceState.get<string>("target");

  // 如果事先在当前工作区指定过目标脚本，则不再扫描目录下是否存在符合约定的脚本
  if (config && existsSync(config)) {
    vscode.window.showInformationMessage(
      vscode.l10n.t("scriptcat-workspace-selected", config, signatureFileCommand)
    );
    watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(config, "*"),
      false,
      false,
      false
    );
  } else {
    context.subscriptions.push(metaProvideHover());
    watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.user.js",
      false,
      false,
      false
    );
  }

  const mSync = new Synchronizer(watcher, context);

  // 将同步器添加到订阅中，以便在扩展停用时正确清理
  context.subscriptions.push({
    dispose: () => {
      mSync.close();
    }
  });

  // 注册 UserScript 元数据高亮
  context.subscriptions.push(registerUserScriptHighlighter());

  // 注册 UserScript 元数据诊断
  context.subscriptions.push(...registerUserScriptDiagnostics());

  // 检查并提示用户启用语义高亮
  checkAndPromptSemanticHighlighting();

  context.subscriptions.push(
    vscode.commands.registerCommand(signatureFileCommand, () => {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        title: vscode.l10n.t("scriptcat-select-debug-script"),
        openLabel: vscode.l10n.t("scriptcat-select-script"),
        filters: {
          [vscode.l10n.t("scriptcat-user-script")]: ["js"],
        },
      };
      vscode.window.showOpenDialog(options).then((filePath) => {
        if (filePath) {
          const scriptPath = filePath[0].fsPath;
          context.workspaceState.update("target", scriptPath);
          vscode.window.showInformationMessage(vscode.l10n.t("scriptcat-script-selected", scriptPath));
          mSync.changeTargetScript(
            vscode.workspace.createFileSystemWatcher(
              new vscode.RelativePattern(scriptPath, "*")
            )
          );
        }
      });
    }),
    vscode.commands.registerCommand(autoTargetCommand, () => {
      // 清除已保存的目标脚本路径
      context.workspaceState.update("target", undefined);
      
      // 切换回自动识别模式，监控所有 *.user.js 文件
      const autoWatcher = vscode.workspace.createFileSystemWatcher(
        "**/*.user.js",
        false,
        false,
        false
      );
      
      mSync.changeTargetScript(autoWatcher);
      
      vscode.window.showInformationMessage(vscode.l10n.t("scriptcat-auto-mode-enabled"));
    }),
    vscode.languages.registerDocumentFormattingEditProvider(["javascript"], {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): vscode.TextEdit[] | undefined {
        const firstLine = document.lineAt(0);
        console.log(firstLine);
        if (firstLine.text !== "42") {
          return [vscode.TextEdit.insert(firstLine.range.start, "42\n")];
        }
      },
    }),
    vscode.commands.registerCommand('scriptcat.debug', () => {
      const debugInfo = mSync.getDebugInfo();
      const windowRole = debugInfo.isWebSocketOwner ? vscode.l10n.t("scriptcat-main-window") : vscode.l10n.t("scriptcat-secondary-window");
      const wsStatus = debugInfo.wsManagerRunning ? vscode.l10n.t("scriptcat-ws-running") : vscode.l10n.t("scriptcat-ws-stopped");
      const message = vscode.l10n.t(
        "scriptcat-debug-info",
        windowRole,
        wsStatus,
        debugInfo.wsManagerPort.toString(),
        debugInfo.sharedDir,
        debugInfo.sharedDirExists.toString()
      );
      
      vscode.window.showInformationMessage(message, { modal: true });
      console.log('ScriptCat debug info:', debugInfo);
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
