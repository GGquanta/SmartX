/**
 * Streaming helper: hide incomplete markdown image syntax (`![...](...)`)
 * so the chat bubble never flashes raw image markup while tokens arrive.
 *
 * Only a trailing incomplete image at end-of-string is masked.
 * Complete images and image-like text inside fenced code blocks are left alone.
 */

export interface MaskIncompleteMarkdownImageResult {
  text: string;
  showSkeleton: boolean;
}

/** Unclosed alt: `![` / `![partial alt` */
const INCOMPLETE_ALT_RE = /!\[[^\]]*$/;
/** Unclosed destination: `![alt](` / `![alt](https://partial` */
const INCOMPLETE_DEST_RE = /!\[[^\]]*\]\([^)]*$/;

function getCodeFenceRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('```', cursor);
    if (open === -1) break;
    const afterOpen = open + 3;
    const close = text.indexOf('```', afterOpen);
    if (close === -1) {
      ranges.push({ start: open, end: text.length });
      break;
    }
    ranges.push({ start: open, end: close + 3 });
    cursor = close + 3;
  }
  return ranges;
}

function isInsideRanges(index: number, ranges: Array<{ start: number; end: number }>): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

/**
 * Find the start index of a trailing incomplete `![...](...)` outside code fences.
 * Returns -1 when nothing should be masked.
 */
export function findTrailingIncompleteMarkdownImageStart(text: string): number {
  if (!text || !text.includes('![')) return -1;

  const fenceRanges = getCodeFenceRanges(text);

  for (const pattern of [INCOMPLETE_DEST_RE, INCOMPLETE_ALT_RE]) {
    const match = text.match(pattern);
    if (match?.index == null) continue;
    if (isInsideRanges(match.index, fenceRanges)) continue;
    return match.index;
  }

  return -1;
}

/**
 * While streaming, strip a trailing incomplete markdown image and signal that
 * a skeleton placeholder should be shown instead.
 * When not streaming, returns the original text unchanged.
 */
export function maskIncompleteMarkdownImage(
  text: string,
  isStreaming: boolean,
): MaskIncompleteMarkdownImageResult {
  if (!isStreaming || !text) {
    return { text, showSkeleton: false };
  }

  const start = findTrailingIncompleteMarkdownImageStart(text);
  if (start < 0) {
    return { text, showSkeleton: false };
  }

  return {
    // Drop trailing blank lines/spaces left behind by the cut so the
    // skeleton sits flush under the preceding prose.
    text: text.slice(0, start).replace(/[ \t\n\r]+$/u, ''),
    showSkeleton: true,
  };
}
