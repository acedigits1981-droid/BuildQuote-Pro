import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface PWAInstallBannerProps {
  isInstalled: boolean;
  isIOS: boolean;
  isInstalling: boolean;
  onInstall: () => void;
}

const DISMISSED_KEY = 'buildquote_install_banner_dismissed_v1';

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  isInstalled,
  isIOS,
  isInstalling,
  onInstall,
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (isInstalled || isDismissed) return null;

  const dismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Dismissal still works for this page when storage is unavailable.
    }
  };

  return (
    <aside
      aria-label="Install BuildQuote on your device"
      data-testid="pwa-install-banner"
      className="no-print border-b border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-start gap-3">
        <Smartphone aria-hidden="true" className="hidden sm:block w-5 h-5 mt-1 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Take BuildQuote to the job site</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {isIOS
                ? 'In Safari: Share → Add to Home Screen → Add.'
                : 'Install for quick home-screen access. No app store needed.'}
              {' '}Open online once to prepare for offline use.
            </p>
          </div>
          <button
            type="button"
            onClick={onInstall}
            disabled={isInstalling}
            className="self-start sm:self-center min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-wait"
          >
            <Download aria-hidden="true" className="w-4 h-4" />
            {isInstalling ? 'Opening…' : isIOS ? 'How to Install' : 'Install App'}
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner for this session"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
        >
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
