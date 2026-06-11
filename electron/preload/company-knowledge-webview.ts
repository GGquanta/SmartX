/**
 * Preload for the Company Knowledge <webview> guest page.
 * Exposes window.smartXBindKnowledgeBase so the embedded site can persist binding to openclaw.json via main IPC.
 *
 * Note: Electron <webview> guests may run with contextIsolation disabled depending on
 * webpreferences. contextBridge.exposeInMainWorld only works when contextIsolation is enabled;
 * otherwise we fall back to assigning on window (same pattern as legacy preloads).
 */
import { contextBridge, ipcRenderer } from 'electron';

type BindResult = { success: boolean; error?: string };

function postBindResult(result: BindResult) {
  try {
    ipcRenderer.sendToHost('company-knowledge:bind-result', result);
  } catch {
    // ignore
  }
}

/** IPC uses structured clone; strip functions / cycles so invoke does not throw. */
function serializePayloadForMain(payload: unknown): unknown {
  if (payload === null || typeof payload !== 'object') {
    return payload;
  }
  try {
    return JSON.parse(JSON.stringify(payload)) as unknown;
  } catch {
    return undefined;
  }
}

function bindHandler(payload: unknown) {
  const safe = serializePayloadForMain(payload);
  void ipcRenderer
    .invoke('company-knowledge:bindWebview', safe)
    .then((raw) => {
      const result = raw as BindResult;
      postBindResult(
        result && typeof result === 'object' && 'success' in result
          ? result
          : { success: false, error: 'Invalid bind response' },
      );
    })
    .catch((err: unknown) => {
      postBindResult({ success: false, error: err instanceof Error ? err.message : String(err) });
    });
}

try {
  contextBridge.exposeInMainWorld('smartXBindKnowledgeBase', bindHandler);
} catch (firstErr) {
  try {
    // Guest has contextIsolation disabled — contextBridge is unavailable.
     
    (globalThis as typeof globalThis & { smartXBindKnowledgeBase?: typeof bindHandler }).smartXBindKnowledgeBase = bindHandler;
  } catch (secondErr) {
    console.error(
      '[company-knowledge-webview] Failed to expose smartXBindKnowledgeBase',
      firstErr,
      secondErr,
    );
  }
}
