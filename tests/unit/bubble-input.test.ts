import { describe, expect, it } from 'vitest';
import { computeWindowDragPosition } from '@electron/main/bubble-input';

describe('computeWindowDragPosition', () => {
  it('moves the window by the same delta as the pointer in screen space', () => {
    const anchor = {
      startGlobal: { x: 400, y: 300 },
      startWin: { x: 1200, y: 800 },
    };

    expect(computeWindowDragPosition(anchor, 460, 340)).toEqual({
      x: 1260,
      y: 840,
    });
  });

  it('rounds the resulting window position', () => {
    const anchor = {
      startGlobal: { x: 10, y: 10 },
      startWin: { x: 100, y: 100 },
    };

    expect(computeWindowDragPosition(anchor, 13.4, 16.6)).toEqual({
      x: 103,
      y: 107,
    });
  });
});
