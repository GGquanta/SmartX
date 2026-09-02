/// <reference types="vite/client" />

interface NavigatorUAData {
  getHighEntropyValues(hints: string[]): Promise<{ architecture?: string }>;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}
