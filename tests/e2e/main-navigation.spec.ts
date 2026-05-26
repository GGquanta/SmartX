import { closeElectronApp, expect, getStableWindow, test } from './fixtures/electron';

test.describe('SmartX main navigation without setup flow', () => {
  test('navigates between core pages with setup bypassed', async ({ launchElectronApp }) => {
    const app = await launchElectronApp({ skipSetup: true });

    try {
      const page = await getStableWindow(app);

      await expect(page.getByTestId('main-layout')).toBeVisible();

      await page.getByTestId('sidebar-nav-models').click();
      await expect(page.getByTestId('models-page')).toBeVisible();
      await expect(page.getByTestId('models-page-title')).toBeVisible();

      await page.getByTestId('sidebar-nav-agents').click();
      await expect(page.getByTestId('agents-page')).toBeVisible();

      await page.getByTestId('sidebar-nav-channels').click();
      await expect(page.getByTestId('channels-page')).toBeVisible();

      await page.getByTestId('sidebar-nav-research-tools').click();
      await expect(page.getByTestId('research-tools-page')).toBeVisible();
      await expect(page.getByTestId('research-tools-page-title')).toBeVisible();
      await expect(page.getByTestId('research-tools-quafu-login-button')).toBeVisible();

      await page.getByTestId('sidebar-nav-company-knowledge').click();
      await expect(page.getByTestId('company-knowledge-page')).toBeVisible();
      await expect(page.getByTestId('company-knowledge-page-title')).toBeVisible();
      const knowledgeWebview = page.getByTestId('company-knowledge-webview');
      await expect(knowledgeWebview).toBeVisible();
      await expect(knowledgeWebview).toHaveAttribute('src', /localhost:5001/);
    } finally {
      await closeElectronApp(app);
    }
  });
});
