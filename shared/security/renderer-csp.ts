/**
 * Renderer Content-Security-Policy for the SmartX Electron windows.
 *
 * Electron warns when a renderer has no CSP or when the policy enables
 * `unsafe-eval`. Vite HMR uses an inline module preamble (`unsafe-inline`)
 * but does not require `unsafe-eval`, so development can stay warning-free
 * without weakening the packaged app.
 */

export function buildRendererContentSecurityPolicy(options: { isDev: boolean }): string {
  const scriptSrc = options.isDev
    ? ["'self'", 'blob:', "'unsafe-inline'"]
    : ["'self'", 'blob:'];
  const connectSrc = options.isDev
    ? ["'self'", 'data:', 'blob:', 'ws:', 'wss:', 'http://127.0.0.1:*', 'http://localhost:*']
    : ["'self'", 'data:', 'blob:'];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "media-src 'self' blob: data: mediastream:",
    "worker-src 'self' blob:",
    "frame-src 'self' blob: file: http://127.0.0.1:* http://localhost:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export function getRendererContentSecurityPolicyFilterUrls(devServerUrl?: string): string[] {
  if (!devServerUrl) {
    return ['file://*/*'];
  }

  try {
    return [`${new URL(devServerUrl).origin}/*`];
  } catch {
    return ['http://localhost:5173/*', 'http://127.0.0.1:5173/*'];
  }
}
