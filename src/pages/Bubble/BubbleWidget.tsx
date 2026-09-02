import { useState } from 'react';
import type { BubbleVisualState } from '@shared/host-api/contract';
import logoUrl from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type BubbleWidgetProps = {
  visualState: BubbleVisualState;
  ariaLabel: string;
};

export function BubbleWidget({ visualState, ariaLabel }: BubbleWidgetProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn('bubble-shell', hovered && 'bubble-shell--hovered')}
      data-testid="desktop-bubble"
    >
      <div
        className={cn(
          'bubble-sphere',
          visualState === 'disconnected' && 'bubble-sphere--disconnected',
          visualState === 'idle' && 'bubble-sphere--idle',
          visualState === 'working' && 'bubble-sphere--working',
        )}
        data-testid="desktop-bubble-button"
        aria-label={ariaLabel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="bubble-orbit" aria-hidden="true" />
        <div className="bubble-body" aria-hidden="true">
          <div className="bubble-specular" />
          <div className="bubble-rim" />
        </div>
        <div className="bubble-logo-frame">
          <img src={logoUrl} alt="" className="bubble-logo" draggable={false} />
        </div>
      </div>
    </div>
  );
}
