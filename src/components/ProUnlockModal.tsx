import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { isValidProCode } from '../utils/calculators';
import { useModalKeyboard } from '../utils/useModalKeyboard';

interface ProUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export const ProUnlockModal: React.FC<ProUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const modalRef = useModalKeyboard(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidProCode(code)) {
      setError('');
      onUnlockSuccess();
      onClose();
    } else {
      setError('Invalid unlock code. Please check your code and try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
      data-testid="pro-unlock-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 no-print"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Pro Unlock Modal"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            One-Time Lifetime Upgrade · $4.99
          </div>
          <h2 id="pro-modal-title" className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Unlock BuildQuote Pro Forever
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Remove the trial watermark from client PDFs and unlock your custom Company Name, Logo
            &amp; Phone header.
          </p>
        </div>

        {/* Benefits Checklist */}
        <ul className="mt-4 space-y-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-200">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Remove &ldquo;FREE TRIAL ESTIMATE&rdquo; diagonal watermark on PDFs</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Unlock Company Name, License Badge &amp; Phone Number on quotes</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Pay once ($4.99), unlocked forever on your device with zero subscriptions</span>
          </li>
        </ul>

        {/* Step 1: PayPal Button */}
        <div className="mt-5">
          <a
            href="https://www.paypal.me/SaeedNazari911/4.99"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <span>Step 1: Pay $4.99 Safely via PayPal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 text-center leading-relaxed">
            Include your email in the PayPal note to receive your instant Pro code, or enter your
            code below.
          </p>
        </div>

        {/* Step 2: Code Input */}
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <label
              htmlFor="pro-unlock-code-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Step 2: Enter Pro Unlock Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="pro-unlock-code-input"
                  data-autofocus="true"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter Pro code..."
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Activate Pro
              </button>
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1.5">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Instant offline verification · Saves permanently to this device</span>
          </div>
        </form>
      </div>
    </div>
  );
};
