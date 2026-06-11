/**
 * Main-process drag + click detection for the bubble overlay window.
 * Drag/click only when the pointer starts on the sphere hit region.
 */
import { screen, type BrowserWindow } from 'electron';

const CLICK_SLOP_PX = 5;

type DragAnchor = {
  startCursor: { x: number; y: number };
  startWin: { x: number; y: number };
};

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

      const cursor = screen.getCursorScreenPoint();
      const [winX, winY] = win.getPosition();
      dragAnchor = {
        startCursor: { x: cursor.x, y: cursor.y },
        startWin: { x: winX, y: winY },
      };
      dragging = false;
      return;
    }

    if (input.type === 'mouseMove' && dragAnchor) {
      const cursor = screen.getCursorScreenPoint();
      const dx = cursor.x - dragAnchor.startCursor.x;
      const dy = cursor.y - dragAnchor.startCursor.y;

      if (!dragging && (Math.abs(dx) > CLICK_SLOP_PX || Math.abs(dy) > CLICK_SLOP_PX)) {
        dragging = true;
      }

      if (dragging && !win.isDestroyed()) {
        win.setPosition(
          Math.round(dragAnchor.startWin.x + dx),
          Math.round(dragAnchor.startWin.y + dy),
        );
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
