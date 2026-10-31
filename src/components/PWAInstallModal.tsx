import React from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { useModalKeyboard } from '../utils/useModalKeyboard';

interface PWAInstallModalProps {
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  isIOS,
  onClose,
}) => {
  const modalRef = useModalKeyboard(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      data-testid="pwa-install-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 no-print"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Install Guide"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 id="pwa-install-title" className="text-base font-bold text-slate-900 dark:text-white">
              Install BuildQuote Pro App
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Open online once to save the app for offline job sites.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isIOS ? 'iPhone / iPad 2-Step Install' : 'Quick 2-Step Home Screen Install'}
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-950 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isIOS ? 'Open the Share menu' : 'Open your browser menu'}</span>
                {isIOS && <Share className="w-4 h-4 text-sky-600 dark:text-sky-400 inline" />}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isIOS
                  ? <>In Safari, tap <strong>Share</strong> (you may need to open the menu first).</>
                  : <>On Android, open Chrome and tap the <strong>⋮</strong> menu. On desktop, look for the install icon in Chrome or Edge’s address bar.</>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-950 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Add to Home Screen</span>
                <PlusSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isIOS
                  ? <>Choose <strong>Add to Home Screen</strong>, leave <strong>Open as Web App</strong> on if shown, then tap <strong>Add</strong>.</>
                  : <>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm. If no install option appears, try Chrome or Edge.</>}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-autofocus="true"
          onClick={onClose}
          className="mt-4 w-full min-h-[44px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
