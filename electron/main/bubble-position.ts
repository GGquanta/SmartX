/**
 * Bubble window geometry
 */
import { screen } from 'electron';

export interface BubblePosition {
  x: number;
  y: number;
}

export interface BubbleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bubbleStateStore: any = null;

async function getStore() {
  if (!bubbleStateStore) {
    const Store = (await import('electron-store')).default;
    bubbleStateStore = new Store<{ position: BubblePosition | null }>({
      name: 'bubble-state',
      defaults: {
        position: null,
      },
    });
  }
  return bubbleStateStore;
}

const LEGACY_BUBBLE_WINDOW_WIDTH = 380;

function isBoundsVisibleOnAnyDisplay(bounds: BubbleBounds): boolean {
  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const { x: dx, y: dy, width, height } = display.bounds;
    const left = bounds.x;
    const top = bounds.y;
    const right = bounds.x + bounds.width;
    const bottom = bounds.y + bounds.height;
    return left < dx + width
      && right > dx
      && top < dy + height
      && bottom > dy;
  });
}

function normalizeSavedBubblePosition(saved: BubblePosition): BubblePosition {
  const compact: BubbleBounds = {
    x: saved.x,
    y: saved.y,
    width: BUBBLE_COMPACT_WIDTH,
    height: BUBBLE_COMPACT_HEIGHT,
  };

  if (isBoundsVisibleOnAnyDisplay(compact)) {
    return { x: compact.x, y: compact.y };
  }

  const legacyCompact: BubbleBounds = {
    x: saved.x + LEGACY_BUBBLE_WINDOW_WIDTH - BUBBLE_COMPACT_WIDTH,
    y: saved.y,
    width: BUBBLE_COMPACT_WIDTH,
    height: BUBBLE_COMPACT_HEIGHT,
  };

  if (isBoundsVisibleOnAnyDisplay(legacyCompact)) {
    return { x: legacyCompact.x, y: legacyCompact.y };
  }

  return saved;
}

export const BUBBLE_SHADOW_PAD = 30;
export const BUBBLE_ORBIT_OUTSET = 6;
export const BUBBLE_SPHERE_SIZE = 64;
export const BUBBLE_SPHERE_BLOCK = BUBBLE_ORBIT_OUTSET * 2 + BUBBLE_SPHERE_SIZE;
export const BUBBLE_DEFAULT_INSET = 12;

export const BUBBLE_COMPACT_WIDTH =
  BUBBLE_SHADOW_PAD + BUBBLE_SPHERE_BLOCK + BUBBLE_SHADOW_PAD;
export const BUBBLE_COMPACT_HEIGHT = BUBBLE_COMPACT_WIDTH;

/** @deprecated Use BUBBLE_COMPACT_WIDTH / BUBBLE_COMPACT_HEIGHT */
export const BUBBLE_WINDOW_WIDTH = BUBBLE_COMPACT_WIDTH;
export const BUBBLE_WINDOW_HEIGHT = BUBBLE_COMPACT_HEIGHT;
export const BUBBLE_WINDOW_SIZE = BUBBLE_COMPACT_HEIGHT;

export function getSphereRectInWindow(
  windowWidth: number,
  windowHeight: number,
): { left: number; top: number; right: number; bottom: number } {
  const top = BUBBLE_SHADOW_PAD - BUBBLE_ORBIT_OUTSET;
  const left = (windowWidth - BUBBLE_SPHERE_BLOCK) / 2;
  const right = left + BUBBLE_SPHERE_BLOCK;
  return { left, top, right, bottom: Math.min(top + BUBBLE_SPHERE_BLOCK, windowHeight) };
}

export function isPointInSphere(
  point: { x: number; y: number },
  windowWidth: number,
  windowHeight: number,
): boolean {
  const rect = getSphereRectInWindow(windowWidth, windowHeight);
  return point.x >= rect.left
    && point.x <= rect.right
    && point.y >= rect.top
    && point.y <= rect.bottom;
}

export async function getBubblePosition(): Promise<BubblePosition> {
  const store = await getStore();
  const saved = store.get('position') as BubblePosition | null;
  if (saved) {
    const normalized = normalizeSavedBubblePosition(saved);
    if (isBoundsVisibleOnAnyDisplay({
      x: normalized.x,
      y: normalized.y,
      width: BUBBLE_COMPACT_WIDTH,
      height: BUBBLE_COMPACT_HEIGHT,
    })) {
      return normalized;
    }
  }

  const primary = screen.getPrimaryDisplay();
  const { workArea } = primary;
  return {
    x: workArea.x + workArea.width - BUBBLE_COMPACT_WIDTH - BUBBLE_DEFAULT_INSET,
    y: workArea.y + workArea.height - BUBBLE_COMPACT_HEIGHT - BUBBLE_DEFAULT_INSET,
  };
}

export async function saveBubblePosition(position: BubblePosition): Promise<void> {
  const store = await getStore();
  store.set('position', position);
}

export const BUBBLE_SNAP_THRESHOLD = 16;
export const BUBBLE_EDGE_MARGIN = 4;

export function snapBubbleBounds(bounds: BubbleBounds): BubblePosition {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const display = screen.getDisplayNearestPoint(center);
  const { workArea } = display;

  const distLeft = bounds.x - workArea.x;
  const distRight = workArea.x + workArea.width - (bounds.x + bounds.width);
  const distTop = bounds.y - workArea.y;
  const distBottom = workArea.y + workArea.height - (bounds.y + bounds.height);

  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  let x = bounds.x;
  let y = bounds.y;

  if (minDist <= BUBBLE_SNAP_THRESHOLD) {
    if (minDist === distLeft) {
      x = workArea.x + BUBBLE_EDGE_MARGIN;
    } else if (minDist === distRight) {
      x = workArea.x + workArea.width - bounds.width - BUBBLE_EDGE_MARGIN;
    } else if (minDist === distTop) {
      y = workArea.y + BUBBLE_EDGE_MARGIN;
    } else {
      y = workArea.y + workArea.height - bounds.height - BUBBLE_EDGE_MARGIN;
    }
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/** @deprecated Use BUBBLE_COMPACT_WIDTH / BUBBLE_COMPACT_HEIGHT */
export function getBubbleWindowBounds(): { width: number; height: number } {
  return {
    width: BUBBLE_COMPACT_WIDTH,
    height: BUBBLE_COMPACT_HEIGHT,
  };
}
