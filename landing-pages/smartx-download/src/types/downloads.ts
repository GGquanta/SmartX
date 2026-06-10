export type PlatformIcon = 'apple' | 'windows' | 'linux';

export interface DownloadVariant {
  id: string;
  label: string;
  format: string;
  arch: string;
  path: string;
  size: string | null;
  recommended?: boolean;
}

export interface DownloadPlatform {
  id: string;
  label: string;
  icon: PlatformIcon;
  variants: DownloadVariant[];
}

export interface DownloadsManifest {
  productName: string;
  version: string;
  updatedAt: string;
  assetBaseUrl: string;
  platforms: DownloadPlatform[];
}
