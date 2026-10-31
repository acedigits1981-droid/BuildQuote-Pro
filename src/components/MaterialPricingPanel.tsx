import React, { useRef, useState } from 'react';
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import {
  CurrencyCode,
  MaterialPricingDefaults,
  DEFAULT_MATERIAL_PRICES,
  getCurrencySymbol,
} from '../utils/calculators';

interface MaterialPricingPanelProps {
  currency: CurrencyCode;
  prices: MaterialPricingDefaults;
  onUpdatePrices: (next: MaterialPricingDefaults) => void;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
  backupStatusMessage: string;
}

export const MaterialPricingPanel: React.FC<MaterialPricingPanelProps> = ({
  currency,
  prices,
  onUpdatePrices,
  onExportBackup,
  onImportBackupFile,
  backupStatusMessage,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sym = getCurrencySymbol(currency);

  const handleFieldChange = (field: keyof MaterialPricingDefaults, rawVal: string) => {
    const num = Math.max(0, parseFloat(rawVal) || 0);
    onUpdatePrices({
      ...prices,
      [field]: num,
    });
  };

  const handleReset = () => {
    onUpdatePrices({ ...DEFAULT_MATERIAL_PRICES });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackupFile(file);
      e.target.value = '';
    }
  };

  return (
    <section
      aria-label="Material Pricing & Defaults and Local Backup"
      data-testid="material-pricing-panel"
      className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors"
    >
      {/* Collapsible Header Bar + Quick Local Backup & Restore Controls */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          data-testid="toggle-material-pricing-btn"
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              <span>Material Pricing &amp; Defaults</span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize baseline unit prices ({sym}) synced live across all trade calculators
            </p>
          </div>
        </button>

        {/* Local Backup & Restore (JSON) Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {backupStatusMessage && (
            <span
              role="status"
              data-testid="backup-status-badge"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{backupStatusMessage}</span>
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            data-testid="import-backup-file-input"
            onChange={handleFileChange}
            className="sr-only"
          />

          <button
            type="button"
            onClick={onExportBackup}
            data-testid="export-backup-json-btn"
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            data-testid="import-backup-btn"
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Import Backup</span>
          </button>
        </div>
      </div>

      {/* Collapsible Body: Material Price Sync Table */}
      {isOpen && (
        <div
          data-testid="material-pricing-table-content"
          className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              All changes save automatically to your device and sync with Concrete, Drywall, Tile &amp; Paint calculators.
            </span>
            <button
              type="button"
              onClick={handleReset}
              data-testid="reset-default-prices-btn"
              className="min-h-[34px] px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Default Prices</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Concrete Defaults */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Concrete Pricing
              </div>
              <div>
                <label
                  htmlFor="price-setting-concrete-bag"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  80lb / Pre-Mix Bag ({sym})
                </label>
                <input
                  id="price-setting-concrete-bag"
                  data-testid="price-setting-concrete-bag"
                  type="number"
                  min="0"
                  step="0.25"
                  value={prices.concreteBagPrice}
                  onChange={(e) => handleFieldChange('concreteBagPrice', e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="price-setting-concrete-readymix"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Ready-Mix per yd³ ({sym})
                </label>
                <input
                  id="price-setting-concrete-readymix"
                  data-testid="price-setting-concrete-readymix"
                  type="number"
                  min="0"
                  step="5"
                  value={prices.concreteReadyMixPerYard}
                  onChange={(e) => handleFieldChange('concreteReadyMixPerYard', e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Drywall Defaults */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Drywall Pricing
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="price-setting-drywall-sheet"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Sheet Price ({sym})
                  </label>
                  <input
                    id="price-setting-drywall-sheet"
                    data-testid="price-setting-drywall-sheet"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.drywallSheetPrice}
                    onChange={(e) => handleFieldChange('drywallSheetPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price-setting-drywall-mud"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Mud 4.5G ({sym})
                  </label>
                  <input
                    id="price-setting-drywall-mud"
                    data-testid="price-setting-drywall-mud"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.drywallMudBucketPrice}
                    onChange={(e) => handleFieldChange('drywallMudBucketPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price-setting-drywall-tape"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Tape Roll ({sym})
                  </label>
                  <input
                    id="price-setting-drywall-tape"
                    data-testid="price-setting-drywall-tape"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.drywallTapeRollPrice}
                    onChange={(e) => handleFieldChange('drywallTapeRollPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price-setting-drywall-screws"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Screws 1lb ({sym})
                  </label>
                  <input
                    id="price-setting-drywall-screws"
                    data-testid="price-setting-drywall-screws"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.drywallScrewBoxPrice}
                    onChange={(e) => handleFieldChange('drywallScrewBoxPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Tile Defaults */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Tile &amp; Mortar Pricing
              </div>
              <div>
                <label
                  htmlFor="price-setting-tile-sqft"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tile per sq ft / unit ({sym})
                </label>
                <input
                  id="price-setting-tile-sqft"
                  data-testid="price-setting-tile-sqft"
                  type="number"
                  min="0"
                  step="0.25"
                  value={prices.tilePricePerSqFt}
                  onChange={(e) => handleFieldChange('tilePricePerSqFt', e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="price-setting-tile-thinset"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Thinset 50lb ({sym})
                  </label>
                  <input
                    id="price-setting-tile-thinset"
                    data-testid="price-setting-tile-thinset"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.tileThinsetBagPrice}
                    onChange={(e) => handleFieldChange('tileThinsetBagPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price-setting-tile-grout"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Grout 25lb ({sym})
                  </label>
                  <input
                    id="price-setting-tile-grout"
                    data-testid="price-setting-tile-grout"
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices.tileGroutBagPrice}
                    onChange={(e) => handleFieldChange('tileGroutBagPrice', e.target.value)}
                    className="w-full min-h-[38px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Paint Defaults */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Paint &amp; Primer Pricing
              </div>
              <div>
                <label
                  htmlFor="price-setting-paint-gal"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Finish Paint per Gal ({sym})
                </label>
                <input
                  id="price-setting-paint-gal"
                  data-testid="price-setting-paint-gal"
                  type="number"
                  min="0"
                  step="1"
                  value={prices.paintGallonPrice}
                  onChange={(e) => handleFieldChange('paintGallonPrice', e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="price-setting-primer-gal"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Primer per Gal ({sym})
                </label>
                <input
                  id="price-setting-primer-gal"
                  data-testid="price-setting-primer-gal"
                  type="number"
                  min="0"
                  step="1"
                  value={prices.primerGallonPrice}
                  onChange={(e) => handleFieldChange('primerGallonPrice', e.target.value)}
                  className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
