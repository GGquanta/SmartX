import { completeSetup, expect, test } from './fixtures/electron';

test.describe('Settings about section', () => {
  test('shows product and developer information', async ({ page }) => {
    await completeSetup(page);

    await page.getByTestId('sidebar-nav-settings').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    const aboutSection = page.getByTestId('settings-about-section');
    await aboutSection.scrollIntoViewIfNeeded();
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('小光');
    await expect(aboutSection).toContainText('Development codename: SmartX');
    await expect(aboutSection).toContainText('Based on OpenClaw & ClawX');
    await expect(aboutSection).toContainText('Beijing Zhongke Guoguang Quantum Technology Co., Ltd.');
  });
});
