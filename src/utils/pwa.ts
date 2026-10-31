import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// The manifest is a static file linked in index.html so browsers can discover it
// before React starts. The worker is generated from Vite's final hashed assets.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Offline support could not be initialized.', error);
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

const INSTALLED_KEY = 'buildquote_installed_v1';

function rememberInstallation(installed: boolean) {
  try {
    if (installed) localStorage.setItem(INSTALLED_KEY, 'true');
    else localStorage.removeItem(INSTALLED_KEY);
  } catch {
    // Installation detection still works in memory without browser storage.
  }
}

export function getIsAppInstalled() {
  if (typeof window === 'undefined') return false;
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  ) return true;
  try {
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getIsAppInstalled);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncInstallation = () => {
      const installed = getIsAppInstalled();
      if (installed) rememberInstallation(true);
      setIsInstalled(installed);
    };
    syncInstallation();

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // A fresh native prompt is evidence the app can be installed again.
      rememberInstallation(false);
      setIsInstalled(false);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      rememberInstallation(true);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('storage', syncInstallation);
    window.addEventListener('focus', syncInstallation);
    displayMode.addEventListener('change', syncInstallation);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('storage', syncInstallation);
      window.removeEventListener('focus', syncInstallation);
      displayMode.removeEventListener('change', syncInstallation);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        return outcome;
      } finally {
        // A prompt can only be used once, including dismissals or failures.
        setDeferredPrompt(null);
      }
    }
    return 'manual';
  };

  return {
    canPromptNatively: !!deferredPrompt,
    isInstalled,
    isIOS,
    triggerInstall,
  };
}
