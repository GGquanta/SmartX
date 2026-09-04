import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyKnowledge } from '@/pages/CompanyKnowledge';
import {
  COMPANY_KNOWLEDGE_WEBVIEW_PARTITION,
  COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR,
} from '@shared/company-knowledge';

const { getPreloadPath } = vi.hoisted(() => ({
  getPreloadPath: vi.fn(async () => '/tmp/company-knowledge-webview.js'),
}));

vi.mock('@/lib/host-api', () => ({
  hostApi: {
    app: {
      getCompanyKnowledgeWebviewPreloadPath: () => getPreloadPath(),
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MockWebview extends HTMLElement {
  setZoomFactor: ReturnType<typeof vi.fn>;
}

function guest(): MockWebview {
  return screen.getByTestId('company-knowledge-webview') as MockWebview;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const element = Document.prototype.createElement.call(document, tagName, options);
    if (tagName.toLowerCase() === 'webview') {
      Object.assign(element, { setZoomFactor: vi.fn() });
    }
    return element;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Company knowledge webview zoom', () => {
  it('uses a 0.75 guest zoom factor so the dense UI fits the default pane', () => {
    expect(COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR).toBe(0.75);
  });

  it('applies 0.75 zoom when the guest is prepared and again when it becomes ready', async () => {
    render(<CompanyKnowledge />);

    const webview = await waitFor(() => guest());
    expect(webview).toHaveAttribute('partition', COMPANY_KNOWLEDGE_WEBVIEW_PARTITION);
    expect(webview.getAttribute('webpreferences')).toContain('zoomFactor=0.75');
    expect(webview.setZoomFactor).toHaveBeenCalledWith(0.75);

    fireEvent(webview, new Event('dom-ready'));
    fireEvent(webview, new Event('did-finish-load'));
    expect(webview.setZoomFactor).toHaveBeenCalledTimes(3);
    expect(webview.setZoomFactor).toHaveBeenLastCalledWith(0.75);
  });
});
