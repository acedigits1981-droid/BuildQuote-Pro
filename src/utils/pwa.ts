import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SVG_ICON_RAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="96" fill="#0F172A"/><rect x="44" y="44" width="424" height="424" rx="72" fill="none" stroke="#F59E0B" stroke-width="12" stroke-opacity="0.35"/><path d="M136 352h240v36H136z" fill="#F59E0B"/><path d="M160 320c0-53 43-96 96-96s96 43 96 96H160z" fill="#F59E0B"/><rect x="240" y="196" width="32" height="52" rx="8" fill="#FBBF24"/></svg>`;
const SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_ICON_RAW)}`;

export function initDynamicPWA() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Dynamically inject valid Web App Manifest via Blob URL
  try {
    const manifestObj = {
      id: window.location.origin + '/',
      name: 'BuildQuote Pro: Contractor & DIY Estimator',
      short_name: 'BuildQuote',
      description:
        'Offline-first contractor and DIY material estimator for concrete, drywall, tile, and paint with client PDF quote generation.',
      start_url: window.location.origin + '/',
      scope: window.location.origin + '/',
      display: 'standalone',
      background_color: '#0F172A',
      theme_color: '#0F172A',
      orientation: 'portrait-primary',
      icons: [
        {
          src: `${window.location.origin}/icon.svg`,
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: SVG_DATA_URL,
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'maskable',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifestObj)], { type: 'application/manifest+json' });
    const manifestUrl = URL.createObjectURL(blob);

    let linkEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'manifest';
      document.head.appendChild(linkEl);
    }
    linkEl.href = manifestUrl;
  } catch {
    // Fallback ignored if restricted
  }

  // 2. Register offline Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Fallback inline Blob Service Worker if /sw.js is blocked
        try {
          const swCode = `
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
            self.addEventListener('fetch', () => {});
          `;
          const swBlob = new Blob([swCode], { type: 'application/javascript' });
          navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(() => {});
        } catch {
          // Ignore SW registration error in restricted iframe
        }
      });
    });
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    initDynamicPWA();

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return outcome;
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
