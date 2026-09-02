import { expect, test } from './fixtures/electron';

test.describe('SmartX setup runtime provider row', () => {
  test('shows provider skip hint on environment check when no default env is configured', async ({ page }) => {
    await expect(page.getByTestId('setup-page')).toBeVisible();
    await page.getByTestId('setup-next-button').click();
    await expect(page.getByTestId('setup-runtime-step')).toBeVisible();
    await expect(page.getByTestId('setup-runtime-provider-row')).toBeVisible();
    await expect(page.getByTestId('setup-runtime-provider-row')).toContainText('AI Provider');
    await expect(page.getByTestId('setup-runtime-provider-row')).toContainText(
      'No default provider configured — add one later in Settings',
    );
  });
});
