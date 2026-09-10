import type { ImgHTMLAttributes } from 'react';
import { toWebpSrc } from '../../lib/image';

export type PictureProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
};

function pictureLayoutClass(className?: string): string {
  const classes = ['block', 'max-w-full', 'leading-[0]'];
  if (!className) return classes.join(' ');
  if (className.includes('w-full')) classes.push('w-full');
  if (className.includes('h-full')) classes.push('h-full');
  if (className.includes('shrink-0')) classes.push('shrink-0');
  if (className.includes('absolute')) classes.push('absolute');
  if (className.includes('inset-0')) classes.push('inset-0');
  return classes.join(' ');
}

export function Picture({ src, alt, className, ...imgProps }: PictureProps) {
  const webpSrc = toWebpSrc(src);

  return (
    <picture className={pictureLayoutClass(className)}>
      {webpSrc !== src && <source srcSet={webpSrc} type="image/webp" />}
      <img src={src} alt={alt} className={['block', className].filter(Boolean).join(' ')} {...imgProps} />
    </picture>
  );
}
