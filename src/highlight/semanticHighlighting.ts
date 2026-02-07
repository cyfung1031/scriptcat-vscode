import * as vscode from "vscode";

const SEMANTIC_HIGHLIGHTING_CONFIG_KEY = "editor.semanticHighlighting.enabled";
const PROMPT_CONFIG_KEY = "scriptcat.promptSemanticHighlighting";

/**
 * 检查语义高亮是否启用，如果未启用则提示用户
 */
export async function checkAndPromptSemanticHighlighting(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const semanticHighlighting = config.get(SEMANTIC_HIGHLIGHTING_CONFIG_KEY);
  const shouldPrompt = config.get<boolean>(PROMPT_CONFIG_KEY, true);

  // 如果用户在设置中禁用了提示，则直接返回
  if (!shouldPrompt) {
    return;
  }

  // 如果已经启用，则直接返回
  if (semanticHighlighting === true) {
    return;
  }

  // 提示用户启用语义高亮
  const action = await vscode.window.showInformationMessage(
    vscode.l10n.t("scriptcat-semantic-highlight-prompt"),
    vscode.l10n.t("scriptcat-semantic-highlight-enable"),
    vscode.l10n.t("scriptcat-semantic-highlight-skip")
  );

  if (action === vscode.l10n.t("scriptcat-semantic-highlight-enable")) {
    await config.update(SEMANTIC_HIGHLIGHTING_CONFIG_KEY, true, true);
    vscode.window.showInformationMessage(vscode.l10n.t("scriptcat-semantic-highlight-enabled"));
  } else if (action === vscode.l10n.t("scriptcat-semantic-highlight-skip")) {
    await config.update(PROMPT_CONFIG_KEY, false, true);
    vscode.window.showInformationMessage(
      vscode.l10n.t("scriptcat-semantic-highlight-info")
    );
  }
}
