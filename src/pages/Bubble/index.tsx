/**
 * Desktop floating bubble page (standalone renderer window)
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { hostApi } from '@/lib/host-api';
import { hostEvents } from '@/lib/host-events';
import { resolveSupportedLanguage } from '@shared/language';
import type { BubbleVisualState } from '@shared/host-api/contract';
import { BubbleWidget } from './BubbleWidget';
import './bubble.css';

export function BubbleApp() {
  const { t } = useTranslation('common');
  const [visualState, setVisualState] = useState<BubbleVisualState>('idle');

  useEffect(() => {
    document.documentElement.classList.add('bubble-window');
    document.body.classList.add('bubble-window');

    void hostApi.settings.get('language').then((language) => {
      if (typeof language === 'string' && language.length > 0) {
        i18n.changeLanguage(resolveSupportedLanguage(language));
      }
    }).catch(() => {});

    const unsubscribeVisual = hostEvents.onBubbleVisualState((payload) => {
      setVisualState(payload.state);
    });

    return () => {
      document.documentElement.classList.remove('bubble-window');
      document.body.classList.remove('bubble-window');
      unsubscribeVisual();
    };
  }, []);

  return (
    <BubbleWidget
      visualState={visualState}
      ariaLabel={t('sidebar.title')}
    />
  );
}
