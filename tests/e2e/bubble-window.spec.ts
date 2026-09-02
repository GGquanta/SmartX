import { completeSetup, expect, test } from './fixtures/electron';

test.describe('Desktop bubble window', () => {
  test('opens main window when bubble is clicked', async ({ electronApp, page }) => {
    test.skip(process.env.SMARTX_E2E_BUBBLE !== '1', 'Requires SMARTX_E2E_BUBBLE=1 launch profile');

    await completeSetup(page);

    await page.getByTestId('sidebar-nav-settings').click();
    await page.getByTestId('settings-bubble-visibility-always').click();

    const bubblePage = await electronApp.waitForEvent('window', {
      predicate: async (window) => window.url().includes('#/bubble'),
      timeout: 20_000,
    });

    await bubblePage.waitForLoadState('domcontentloaded');
    await expect(bubblePage.getByTestId('desktop-bubble-button')).toBeVisible({ timeout: 15_000 });
    await bubblePage.getByTestId('desktop-bubble-button').click();

    await expect(page.getByTestId('chat-page')).toBeVisible({ timeout: 15_000 });
  });
});
