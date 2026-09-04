import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompleteContent } from '@/pages/Setup';

const { gatewayState } = vi.hoisted(() => ({
  gatewayState: {
    status: { state: 'running', port: 18789, gatewayReady: true } as {
      state: string;
      port: number;
      gatewayReady?: boolean;
    },
  },
}));

vi.mock('@/stores/gateway', () => ({
  useGatewayStore: (selector: (state: typeof gatewayState) => unknown) => selector(gatewayState),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'complete.title': 'Setup Complete!',
        'complete.subtitle': 'Xiaoguang is configured and ready.',
        'complete.provider': 'AI Provider',
        'complete.components': 'Components',
        'complete.gateway': 'Gateway',
        'complete.running': 'Running',
        'complete.footer': 'You can customize skills and connect channels in Settings',
        'defaultSkills.opencode.name': 'OpenCode',
        'defaultSkills.python-env.name': 'Python Environment',
        'defaultSkills.code-assist.name': 'Code Assist',
        'defaultSkills.file-tools.name': 'File Tools',
        'defaultSkills.terminal.name': 'Terminal',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('Setup complete summary', () => {
  it('right-aligns the installed components list', () => {
    render(
      <CompleteContent
        installedSkills={['opencode', 'python-env', 'code-assist', 'file-tools', 'terminal']}
        providerSummary={{ name: '阿里云百炼', model: 'qwen3.7-max' }}
      />,
    );

    const componentsValue = screen.getByTestId('setup-complete-components-value');
    expect(componentsValue).toHaveTextContent(
      'OpenCode, Python Environment, Code Assist, File Tools, Terminal',
    );
    expect(componentsValue).toHaveClass('text-right');
    expect(componentsValue).toHaveClass('flex-1');
  });
});
