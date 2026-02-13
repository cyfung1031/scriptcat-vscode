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
    vscode.l10n.t("ScriptCat recommends enabling semantic highlighting for better UserScript metadata highlighting experience"),
    vscode.l10n.t("Enable Now"),
    vscode.l10n.t("Don't Show Again")
  );

  if (action === vscode.l10n.t("Enable Now")) {
    await config.update(SEMANTIC_HIGHLIGHTING_CONFIG_KEY, true, true);
    vscode.window.showInformationMessage(vscode.l10n.t("Semantic highlighting has been enabled!"));
  } else if (action === vscode.l10n.t("Don't Show Again")) {
    await config.update(PROMPT_CONFIG_KEY, false, true);
    vscode.window.showInformationMessage(
      vscode.l10n.t("You can always enable semantic highlighting by searching for 'Semantic Highlighting' in settings and setting it to true.")
    );
  }
}
