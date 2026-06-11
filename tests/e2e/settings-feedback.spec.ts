import { completeSetup, expect, test } from './fixtures/electron';

const FEEDBACK_FORM_URL = 'https://docs.qq.com/form/page/DTGV4dVVmYkdocVBz#/fill';

test.describe('Settings feature feedback button', () => {
  test('opens the feedback form in the system browser', async ({ page }) => {
    await completeSetup(page);

    await page.getByTestId('sidebar-nav-settings').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    const feedbackButton = page.getByTestId('settings-feedback-button');
    await expect(feedbackButton).toBeVisible();
    await expect(feedbackButton).toContainText('Feature Feedback');

    await page.evaluate(() => {
      (window as Window & { __feedbackUrlOpened?: string }).__feedbackUrlOpened = undefined;
      const original = window.electron.openExternal.bind(window.electron);
      window.electron.openExternal = async (url: string) => {
        (window as Window & { __feedbackUrlOpened?: string }).__feedbackUrlOpened = url;
        return original(url);
      };
    });

    await feedbackButton.click();

    await expect.poll(async () =>
      page.evaluate(() => (window as Window & { __feedbackUrlOpened?: string }).__feedbackUrlOpened),
    ).toBe(FEEDBACK_FORM_URL);
  });
});
