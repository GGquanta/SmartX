const RASTER_EXT = /\.(png|jpe?g)(\?[^#]*)?(#.*)?$/i;

export function toWebpSrc(src: string): string {
  return src.replace(RASTER_EXT, '.webp$2$3');
}

export function hasWebpFallback(src: string): boolean {
  return src !== toWebpSrc(src);
}
