import { completeSetup, expect, test } from './fixtures/electron';

async function readBubbleVisibility(page: import('@playwright/test').Page): Promise<string | undefined> {
  return await page.evaluate(async () => {
    const settings = await window.electron.ipcRenderer.invoke('settings:getAll');
    return settings?.bubbleVisibility as string | undefined;
  });
}

test.describe('Settings bubble visibility', () => {
  test('persists bubble visibility pill selection', async ({ page }) => {
    await completeSetup(page);

    await page.getByTestId('sidebar-nav-settings').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    const bubbleSection = page.getByTestId('settings-bubble-section');
    await bubbleSection.scrollIntoViewIfNeeded();
    await expect(bubbleSection).toBeVisible();

    await page.getByTestId('settings-bubble-visibility-always').click();
    await expect.poll(async () => await readBubbleVisibility(page)).toBe('always');

    await page.getByTestId('settings-bubble-visibility-never').click();
    await expect.poll(async () => await readBubbleVisibility(page)).toBe('never');

    await page.getByTestId('settings-bubble-visibility-whenMinimized').click();
    await expect.poll(async () => await readBubbleVisibility(page)).toBe('whenMinimized');
  });
});
