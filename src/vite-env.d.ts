/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Company Knowledge embedded webview (optional; defaults to http://localhost:5001/). */
  readonly VITE_COMPANY_KNOWLEDGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: {
      src?: string;
      className?: string;
      partition?: string;
      allowpopups?: string;
      useragent?: string;
      preload?: string;
      /** Electron webPreferences as comma-separated key=value (e.g. contextIsolation=yes). */
      webpreferences?: string;
      'data-testid'?: string;
    };
  }
}
