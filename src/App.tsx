import React, { useEffect, useState } from 'react';
import {
  Layers,
  LayoutGrid,
  Grid,
  PaintBucket,
  FileText,
  Download,
  Award,
  CheckCircle2,
  X,
  Camera,
  Sun,
  Moon,
  ArrowLeftRight,
} from 'lucide-react';
import {
  UnitSystem,
  WasteFactor,
  CurrencyCode,
  CURRENCY_OPTIONS,
  QuoteCartItem,
  JobSitePhoto,
  MaterialPricingDefaults,
  DEFAULT_MATERIAL_PRICES,
  QuoteMetadata,
  DEFAULT_QUOTE_METADATA,
  serializeBackupJson,
  parseAndValidateBackupJson,
  checkUrlForProUnlock,
  estimateDataUrlSizeKb,
  formatCurrency,
} from './utils/calculators';
import { usePWAInstall } from './utils/pwa';
import { ConcreteCalculator } from './components/ConcreteCalculator';
import { DrywallCalculator } from './components/DrywallCalculator';
import { TileCalculator } from './components/TileCalculator';
import { PaintCalculator } from './components/PaintCalculator';
import { QuoteBuilder } from './components/QuoteBuilder';
import { ProUnlockModal } from './components/ProUnlockModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { JobSiteCameraModal } from './components/JobSiteCameraModal';
import { PhotoAnnotationModal } from './components/PhotoAnnotationModal';
import { UnitConverterModal } from './components/UnitConverterModal';
import { QuickAddCustomItem } from './components/QuickAddCustomItem';
import { MaterialPricingPanel } from './components/MaterialPricingPanel';
import { handleSegmentedKeyDown } from './utils/useModalKeyboard';

type ActiveTab = 'concrete' | 'drywall' | 'tile' | 'paint' | 'quote';
type ThemeMode = 'dark' | 'light';

const TAB_ORDER: readonly ActiveTab[] = ['concrete', 'drywall', 'tile', 'paint', 'quote'];
const UNIT_ORDER: readonly UnitSystem[] = ['imperial', 'metric'];
const WASTE_ORDER: readonly WasteFactor[] = [0, 10, 15];
const CURRENCY_CODE_ORDER: readonly CurrencyCode[] = ['CAD', 'USD', 'EUR', 'GBP'];

const INITIAL_SAMPLE_ITEMS: QuoteCartItem[] = [
  {
    id: 'sample-concrete-1',
    trade: 'Concrete',
    title: 'Concrete Slab / Footing',
    summary: '12ft × 10ft × 4in Slab (10% waste) — 74 × 80lb Pre-Mix Bags @ $6.48/bag',
    details: [
      'Total Volume: 44.00 ft³ (1.63 yd³ / 1.25 m³)',
      'Pre-Mix Equivalents: 74 (80lb) · 98 (60lb) · 88 (30kg) · 118 (50lb)',
    ],
    materialCost: 479.52,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concrete');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [wastePercent, setWastePercent] = useState<WasteFactor>(10);

  // Dark / Light Mode state (defaults to 'dark', persisted in localStorage)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('buildquote_theme_v1');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  // Currency Selector state (CAD $, USD $, EUR €, GBP £)
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('buildquote_currency_v1') as CurrencyCode | null;
      if (saved && ['CAD', 'USD', 'EUR', 'GBP'].includes(saved)) {
        return saved;
      }
      return 'USD';
    } catch {
      return 'USD';
    }
  });

  // Persisted Material Pricing Defaults
  const [materialPrices, setMaterialPrices] = useState<MaterialPricingDefaults>(() => {
    try {
      const saved = localStorage.getItem('buildquote_material_prices_v1');
      if (!saved) return { ...DEFAULT_MATERIAL_PRICES };
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_MATERIAL_PRICES, ...parsed };
    } catch {
      return { ...DEFAULT_MATERIAL_PRICES };
    }
  });

  // Persisted Quote Metadata (Client details, labor, markup, tax, branding, notes)
  const [quoteMetadata, setQuoteMetadata] = useState<QuoteMetadata>(() => {
    try {
      const savedDetails = localStorage.getItem('buildquote_quote_details_v1');
      const savedNotes = localStorage.getItem('buildquote_project_notes_v1');
      const parsed = savedDetails ? JSON.parse(savedDetails) : {};
      return {
        ...DEFAULT_QUOTE_METADATA,
        ...parsed,
        projectNotes:
          savedNotes !== null
            ? savedNotes
            : parsed.projectNotes || DEFAULT_QUOTE_METADATA.projectNotes,
      };
    } catch {
      return { ...DEFAULT_QUOTE_METADATA };
    }
  });

  const [backupStatusMessage, setBackupStatusMessage] = useState<string>('');

  const [quoteItems, setQuoteItems] = useState<QuoteCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('buildquote_quote_items_v1');
      if (!saved) return INITIAL_SAMPLE_ITEMS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_ITEMS;
    } catch {
      return INITIAL_SAMPLE_ITEMS;
    }
  });

  const [sitePhotos, setSitePhotos] = useState<JobSitePhoto[]>(() => {
    try {
      const saved = localStorage.getItem('buildquote_site_photos_v1');
      if (!saved) return [];
      const parsed = JSON.parse(saved) as JobSitePhoto[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((p) => ({
        ...p,
        sizeKb: p.sizeKb || estimateDataUrlSizeKb(p.dataUrl),
      }));
    } catch {
      return [];
    }
  });
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('buildquote_pro_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [showUnlockBanner, setShowUnlockBanner] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isUnitConverterOpen, setIsUnitConverterOpen] = useState<boolean>(false);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<JobSitePhoto | null>(null);

  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();

  // Sync Dark / Light mode class on documentElement and persist in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('buildquote_theme_v1', theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  // Persist selected currency in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('buildquote_currency_v1', currency);
    } catch {
      // Ignore storage error
    }
  }, [currency]);

  // Persist materialPrices in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('buildquote_material_prices_v1', JSON.stringify(materialPrices));
    } catch {
      // Ignore storage error
    }
  }, [materialPrices]);

  // Persist quoteMetadata in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('buildquote_quote_details_v1', JSON.stringify(quoteMetadata));
      localStorage.setItem('buildquote_project_notes_v1', quoteMetadata.projectNotes);
    } catch {
      // Ignore storage error
    }
  }, [quoteMetadata]);

  // Persist quoteItems in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('buildquote_quote_items_v1', JSON.stringify(quoteItems));
    } catch {
      // Ignore storage error
    }
  }, [quoteItems]);

  // Check localStorage and URL Auto-Hook on mount
  useEffect(() => {
    try {
      const storedPro = localStorage.getItem('buildquote_pro_v1') === 'true';
      if (storedPro) {
        setIsPro(true);
      }

      if (checkUrlForProUnlock(window.location.search, window.location.hash)) {
        localStorage.setItem('buildquote_pro_v1', 'true');
        setIsPro(true);
        setShowUnlockBanner(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  // Persist job site photos into project quote storage
  useEffect(() => {
    try {
      localStorage.setItem('buildquote_site_photos_v1', JSON.stringify(sitePhotos));
    } catch {
      // Ignore quota or storage restriction
    }
  }, [sitePhotos]);

  const handleExportBackup = () => {
    const jsonString = serializeBackupJson({
      app: 'BuildQuote Pro',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency,
      unitSystem,
      wastePercent,
      materialPrices,
      quoteMetadata,
      quoteItems,
      sitePhotos,
    });

    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `buildquote-pro-backup-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Ignore download restriction in headless environments
    }

    setBackupStatusMessage('Backup Exported (JSON)!');
    setTimeout(() => setBackupStatusMessage(''), 3200);
  };

  const handleImportBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const restored = parseAndValidateBackupJson(reader.result);
      if (!restored) {
        setBackupStatusMessage('Invalid Backup JSON File');
        setTimeout(() => setBackupStatusMessage(''), 3200);
        return;
      }

      setCurrency(restored.currency);
      setUnitSystem(restored.unitSystem);
      setWastePercent(restored.wastePercent);
      setMaterialPrices(restored.materialPrices);
      setQuoteMetadata(restored.quoteMetadata);
      setQuoteItems(restored.quoteItems);
      setSitePhotos(restored.sitePhotos);

      setBackupStatusMessage('Backup Restored Successfully!');
      setTimeout(() => setBackupStatusMessage(''), 3200);
    };
    reader.readAsText(file);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem('buildquote_theme_v1', next);
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleSaveSitePhoto = (photo: Omit<JobSitePhoto, 'id'>) => {
    const newPhoto: JobSitePhoto = {
      ...photo,
      id: `site-photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setSitePhotos((prev) => [...prev, newPhoto]);
  };

  const handleRemoveSitePhoto = (id: string) => {
    setSitePhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveAnnotatedPhoto = (id: string, newDataUrl: string, newSizeKb: number) => {
    setSitePhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              dataUrl: newDataUrl,
              sizeKb: newSizeKb,
            }
          : p
      )
    );
  };

  const handleUnlockSuccess = () => {
    try {
      localStorage.setItem('buildquote_pro_v1', 'true');
    } catch {
      // Ignore storage error
    }
    setIsPro(true);
    setShowUnlockBanner(true);
  };

  const handleInstallClick = async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    try {
      const outcome = await triggerInstall();
      if (outcome === 'manual') setIsInstallModalOpen(true);
    } catch {
      // If a browser rejects the native prompt, offer manual steps instead.
      setIsInstallModalOpen(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleAddToQuote = (item: Omit<QuoteCartItem, 'id'>) => {
    const newItem: QuoteCartItem = {
      ...item,
      id: `${item.trade.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setQuoteItems((prev) => [...prev, newItem]);
  };

  const handleRemoveQuoteItem = (id: string) => {
    setQuoteItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuoteItemCost = (id: string, cost: number) => {
    setQuoteItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, materialCost: Math.max(0, cost) } : item))
    );
  };

  const handleLoadSampleItems = () => {
    setQuoteItems([
      ...INITIAL_SAMPLE_ITEMS,
      {
        id: 'sample-drywall-2',
        trade: 'Drywall',
        title: 'Drywall, Mud, Tape & Screws (4×8 ft)',
        summary: '20 Sheets · 2 Mud Buckets (4.5 gal) · 1 Tape Roll · 3 Screw Boxes',
        details: [
          'Net Area: 568 sq ft · With 10% Waste: 624.8 sq ft',
          '20 × 4×8 ft sheets, 9 gal compound (2 × 4.5-gal buckets), 625 drywall screws',
        ],
        materialCost: 406.35,
      },
    ]);
  };

  const cartSubtotal = quoteItems.reduce((sum, i) => sum + (Number(i.materialCost) || 0), 0);

  return (
    <div
      data-theme={theme}
      className={`${theme === 'dark' ? 'dark' : ''} min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-12 transition-colors`}
    >
      {/* WCAG Skip to Main Content Link for Keyboard Users */}
      <a
        href="#main-workspace"
        data-testid="skip-to-content-link"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:text-xs"
      >
        Skip to main content
      </a>

      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('concrete');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display rounded-lg px-1"
          >
            BuildQuote Pro
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            role="tablist"
            aria-label="Primary Trade Calculators"
            onKeyDown={(e) => handleSegmentedKeyDown(e, TAB_ORDER, activeTab, setActiveTab)}
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'concrete'}
              data-testid="tab-concrete"
              onClick={() => setActiveTab('concrete')}
              className={`py-1 px-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'concrete'
                  ? 'text-amber-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-white'
              }`}
            >
              Concrete
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drywall'}
              data-testid="tab-drywall"
              onClick={() => setActiveTab('drywall')}
              className={`py-1 px-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'drywall'
                  ? 'text-amber-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-white'
              }`}
            >
              Drywall
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'tile'}
              data-testid="tab-tile"
              onClick={() => setActiveTab('tile')}
              className={`py-1 px-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'tile'
                  ? 'text-amber-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-white'
              }`}
            >
              Tile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'paint'}
              data-testid="tab-paint"
              onClick={() => setActiveTab('paint')}
              className={`py-1 px-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'paint'
                  ? 'text-amber-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-white'
              }`}
            >
              Paint
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'quote'}
              data-testid="tab-quote"
              onClick={() => setActiveTab('quote')}
              className={`py-1 px-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'quote'
                  ? 'text-amber-400 underline underline-offset-8 decoration-2'
                  : 'hover:text-white'
              }`}
            >
              Project Quote ({quoteItems.length})
            </button>
          </nav>

          {/* Zone 3: Theme Toggle, Install App & Pro Unlock */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              data-testid="theme-toggle-btn"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden lg:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden lg:inline">Dark</span>
                </>
              )}
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                aria-label="Install App"
                disabled={isInstalling}
                className="min-h-[36px] sm:min-h-[38px] px-2 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {!isPro ? (
              <button
                type="button"
                onClick={() => setIsProModalOpen(true)}
                className="min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">
                  Unlock Pro Forever ($4.99) - Remove Watermark &amp; Add Your Company Name
                </span>
                <span className="hidden sm:inline xl:hidden">Unlock Pro Forever ($4.99)</span>
                <span className="sm:hidden">Pro ($4.99)</span>
              </button>
            ) : (
              <span
                data-testid="pro-status-indicator"
                className="text-xs font-semibold text-amber-400 whitespace-nowrap shrink-0"
              >
                Pro Unlocked
              </span>
            )}
          </div>
        </div>
      </header>

      <PWAInstallBanner
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInstalling={isInstalling}
        onInstall={handleInstallClick}
      />

      {/* Celebratory Pro Unlocked Banner */}
      {showUnlockBanner && (
        <div
          role="status"
          data-testid="pro-unlocked-banner"
          className="no-print bg-emerald-900 text-white border-b border-emerald-700 px-4 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                BuildQuote Pro Unlocked Forever! Custom Company Branding is now active and all PDF
                watermarks have been permanently removed.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUnlockBanner(false)}
              aria-label="Dismiss Pro Unlocked Banner"
              className="p-1 text-emerald-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Workspace Global Estimator Controls Bar (Units, Waste %, Currency, Job Site Camera, Live Cart) */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Imperial / Metric Toggle, Waste Factor & Currency Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Unit System Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Units:</span>
              <div
                role="group"
                aria-label="Unit System Toggle"
                onKeyDown={(e) =>
                  handleSegmentedKeyDown(e, UNIT_ORDER, unitSystem, setUnitSystem)
                }
                className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <button
                  type="button"
                  aria-pressed={unitSystem === 'imperial'}
                  onClick={() => setUnitSystem('imperial')}
                  className={`min-h-[36px] px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    unitSystem === 'imperial'
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Imperial (ft/in, lbs, gal)
                </button>
                <button
                  type="button"
                  aria-pressed={unitSystem === 'metric'}
                  onClick={() => setUnitSystem('metric')}
                  className={`min-h-[36px] px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    unitSystem === 'metric'
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Metric (m/cm, kg, L)
                </button>
              </div>
            </div>

            {/* Waste Factor Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Waste:
              </span>
              <div
                role="group"
                aria-label="Waste Factor Selector"
                onKeyDown={(e) =>
                  handleSegmentedKeyDown(e, WASTE_ORDER, wastePercent, setWastePercent)
                }
                className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                {([0, 10, 15] as WasteFactor[]).map((factor) => (
                  <button
                    key={factor}
                    type="button"
                    aria-pressed={wastePercent === factor}
                    onClick={() => setWastePercent(factor)}
                    className={`min-h-[36px] px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      wastePercent === factor
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {factor}%
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Selector Toggle (CAD $, USD $, EUR €, GBP £) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Currency:
              </span>
              <div
                role="group"
                aria-label="Currency Selector"
                data-testid="currency-selector-group"
                onKeyDown={(e) =>
                  handleSegmentedKeyDown(e, CURRENCY_CODE_ORDER, currency, setCurrency)
                }
                className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    aria-pressed={currency === opt.code}
                    data-testid={`currency-btn-${opt.code}`}
                    onClick={() => setCurrency(opt.code)}
                    className={`min-h-[36px] px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      currency === opt.code
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Unit Converter, Job Site Camera Button & Live Project Estimate Cart Summary */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsUnitConverterOpen(true)}
              data-testid="open-unit-converter-btn"
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Unit Converter</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              data-testid="open-job-site-camera-btn"
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border border-slate-800 dark:border-slate-700"
            >
              <Camera className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Job Site Camera ({sitePhotos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quote')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Project Estimate Cart:</span>
              <span
                data-testid="cart-item-count"
                className="font-mono font-bold text-slate-900 dark:text-white"
              >
                {quoteItems.length} {quoteItems.length === 1 ? 'item' : 'items'}
              </span>
              <span aria-hidden="true">·</span>
              <span
                data-testid="cart-subtotal-display"
                className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"
              >
                {formatCurrency(cartSubtotal, currency)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main
        id="main-workspace"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 focus:outline-none"
      >
        <MaterialPricingPanel
          currency={currency}
          prices={materialPrices}
          onUpdatePrices={setMaterialPrices}
          onExportBackup={handleExportBackup}
          onImportBackupFile={handleImportBackupFile}
          backupStatusMessage={backupStatusMessage}
        />

        {activeTab === 'concrete' && (
          <ConcreteCalculator
            unitSystem={unitSystem}
            wastePercent={wastePercent}
            currency={currency}
            materialPrices={materialPrices}
            onUpdateMaterialPrices={setMaterialPrices}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {activeTab === 'drywall' && (
          <DrywallCalculator
            unitSystem={unitSystem}
            wastePercent={wastePercent}
            currency={currency}
            materialPrices={materialPrices}
            onUpdateMaterialPrices={setMaterialPrices}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {activeTab === 'tile' && (
          <TileCalculator
            unitSystem={unitSystem}
            wastePercent={wastePercent}
            currency={currency}
            materialPrices={materialPrices}
            onUpdateMaterialPrices={setMaterialPrices}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {activeTab === 'paint' && (
          <PaintCalculator
            unitSystem={unitSystem}
            wastePercent={wastePercent}
            currency={currency}
            materialPrices={materialPrices}
            onUpdateMaterialPrices={setMaterialPrices}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {activeTab !== 'quote' && (
          <QuickAddCustomItem currency={currency} onAddCustomItem={handleAddToQuote} />
        )}

        {activeTab === 'quote' && (
          <QuoteBuilder
            items={quoteItems}
            sitePhotos={sitePhotos}
            isPro={isPro}
            currency={currency}
            quoteMetadata={quoteMetadata}
            onUpdateQuoteMetadata={setQuoteMetadata}
            onExportBackup={handleExportBackup}
            onImportBackupFile={handleImportBackupFile}
            backupStatusMessage={backupStatusMessage}
            onAddItem={handleAddToQuote}
            onRemoveItem={handleRemoveQuoteItem}
            onUpdateItemCost={handleUpdateQuoteItemCost}
            onClearItems={() => setQuoteItems([])}
            onLoadSampleItems={handleLoadSampleItems}
            onOpenProModal={() => setIsProModalOpen(true)}
            onOpenCameraModal={() => setIsCameraModalOpen(true)}
            onRemoveSitePhoto={handleRemoveSitePhoto}
            onAnnotateSitePhoto={(photo) => setAnnotatingPhoto(photo)}
          />
        )}
      </main>

      {/* Footer (Hidden when printing) */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            BuildQuote Pro: Contractor &amp; DIY Estimator · 100% Browser Offline-Ready PWA
          </div>
          <div className="flex items-center gap-3">
            <span>All material quantities rounded up via Math.ceil()</span>
            {!isPro && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setIsProModalOpen(true)}
                  className="font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Unlock Pro ($4.99)
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone Navigation) */}
      <nav
        role="tablist"
        aria-label="Mobile Bottom Navigation"
        onKeyDown={(e) => handleSegmentedKeyDown(e, TAB_ORDER, activeTab, setActiveTab)}
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'concrete'}
          onClick={() => setActiveTab('concrete')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'concrete'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1">Concrete</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'drywall'}
          onClick={() => setActiveTab('drywall')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'drywall'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-1">Drywall</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tile'}
          onClick={() => setActiveTab('tile')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'tile'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-1">Tile</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'paint'}
          onClick={() => setActiveTab('paint')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'paint'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <PaintBucket className="w-5 h-5" />
          <span className="text-[10px] mt-1">Paint</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quote'}
          onClick={() => setActiveTab('quote')}
          className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
            activeTab === 'quote'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-1">Quote ({quoteItems.length})</span>
        </button>
      </nav>

      {/* Modals */}
      <ProUnlockModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onUnlockSuccess={handleUnlockSuccess}
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        isIOS={isIOS}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <JobSiteCameraModal
        isOpen={isCameraModalOpen}
        existingPhotos={sitePhotos}
        onClose={() => setIsCameraModalOpen(false)}
        onSavePhoto={handleSaveSitePhoto}
        onRemovePhoto={handleRemoveSitePhoto}
        onAnnotatePhoto={(photo) => setAnnotatingPhoto(photo)}
      />

      <PhotoAnnotationModal
        photo={annotatingPhoto}
        onClose={() => setAnnotatingPhoto(null)}
        onSaveAnnotatedPhoto={handleSaveAnnotatedPhoto}
      />

      <UnitConverterModal
        isOpen={isUnitConverterOpen}
        onClose={() => setIsUnitConverterOpen(false)}
      />
    </div>
  );
}
