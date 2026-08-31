/**
 * Main-process drag + click detection for the bubble overlay window.
 * Drag/click only when the pointer starts on the sphere hit region.
 */
import type { BrowserWindow } from 'electron';

const CLICK_SLOP_PX = 5;

type DragAnchor = {
  startGlobal: { x: number; y: number };
  startWin: { x: number; y: number };
};

export function computeWindowDragPosition(
  anchor: DragAnchor,
  globalX: number,
  globalY: number,
): { x: number; y: number } {
  return {
    x: Math.round(anchor.startWin.x + (globalX - anchor.startGlobal.x)),
    y: Math.round(anchor.startWin.y + (globalY - anchor.startGlobal.y)),
  };
}

export function attachBubbleInputHandlers(
  win: BrowserWindow,
  handlers: {
    isPointerOnSphere: (input: { x: number; y: number }) => boolean;
    onClick: () => void;
    onDragEnd: () => void;
  },
): void {
  let dragAnchor: DragAnchor | null = null;
  let dragging = false;

  win.webContents.on('before-mouse-event', (_event, input) => {
    if (input.type === 'mouseDown' && input.button === 'left') {
      if (!handlers.isPointerOnSphere({ x: input.x, y: input.y })) {
        dragAnchor = null;
        dragging = false;
        return;
      }

      const globalX = input.globalX;
      const globalY = input.globalY;
      if (typeof globalX !== 'number' || typeof globalY !== 'number') {
        dragAnchor = null;
        dragging = false;
        return;
      }

      const [winX, winY] = win.getPosition();
      dragAnchor = {
        startGlobal: { x: globalX, y: globalY },
        startWin: { x: winX, y: winY },
      };
      dragging = false;
      return;
    }

    if (input.type === 'mouseMove' && dragAnchor) {
      const globalX = input.globalX;
      const globalY = input.globalY;
      if (typeof globalX !== 'number' || typeof globalY !== 'number') {
        return;
      }
      const dx = globalX - dragAnchor.startGlobal.x;
      const dy = globalY - dragAnchor.startGlobal.y;

      if (!dragging && (Math.abs(dx) > CLICK_SLOP_PX || Math.abs(dy) > CLICK_SLOP_PX)) {
        dragging = true;
      }

      if (dragging && !win.isDestroyed()) {
        const next = computeWindowDragPosition(dragAnchor, globalX, globalY);
        win.setPosition(next.x, next.y);
      }
      return;
    }

    if (input.type === 'mouseUp' && input.button === 'left' && dragAnchor) {
      if (!dragging) {
        handlers.onClick();
      } else {
        handlers.onDragEnd();
      }
      dragAnchor = null;
      dragging = false;
    }
  });
}
