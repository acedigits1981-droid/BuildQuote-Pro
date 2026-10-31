import React, { useRef, useState } from 'react';
import {
  Printer,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  FileText,
  Camera,
  PenTool,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  Database,
} from 'lucide-react';
import {
  QuoteCartItem,
  JobSitePhoto,
  CurrencyCode,
  QuoteMetadata,
  calculateQuoteFinancials,
  formatCurrency,
  getCurrencySymbol,
  formatQuoteTextSummary,
} from '../utils/calculators';
import { downloadJobSitePhotoJpeg } from '../utils/imageTools';
import { QuickAddCustomItem } from './QuickAddCustomItem';

interface QuoteBuilderProps {
  items: QuoteCartItem[];
  sitePhotos: JobSitePhoto[];
  isPro: boolean;
  currency: CurrencyCode;
  quoteMetadata: QuoteMetadata;
  onUpdateQuoteMetadata: (next: QuoteMetadata) => void;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
  backupStatusMessage: string;
  onAddItem: (item: Omit<QuoteCartItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItemCost: (id: string, cost: number) => void;
  onClearItems: () => void;
  onLoadSampleItems: () => void;
  onOpenProModal: () => void;
  onOpenCameraModal: () => void;
  onRemoveSitePhoto: (id: string) => void;
  onAnnotateSitePhoto: (photo: JobSitePhoto) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  items,
  sitePhotos,
  isPro,
  currency,
  quoteMetadata,
  onUpdateQuoteMetadata,
  onExportBackup,
  onImportBackupFile,
  backupStatusMessage,
  onAddItem,
  onRemoveItem,
  onUpdateItemCost,
  onClearItems,
  onLoadSampleItems,
  onOpenProModal,
  onOpenCameraModal,
  onRemoveSitePhoto,
  onAnnotateSitePhoto,
}) => {
  const quoteBackupFileRef = useRef<HTMLInputElement | null>(null);

  const {
    clientName,
    projectAddress,
    quoteNumber,
    quoteDate,
    customLaborCost,
    materialMarkupPercent,
    taxRatePercent,
    companyName,
    companyPhone,
    companyLogoText,
    projectNotes,
  } = quoteMetadata;

  const setClientName = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, clientName: val });
  const setProjectAddress = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, projectAddress: val });
  const setQuoteNumber = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, quoteNumber: val });
  const setQuoteDate = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, quoteDate: val });
  const setCustomLaborCost = (val: number) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, customLaborCost: Math.max(0, val) });
  const setMaterialMarkupPercent = (val: number) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, materialMarkupPercent: Math.max(0, val) });
  const setTaxRatePercent = (val: number) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, taxRatePercent: Math.max(0, val) });
  const setCompanyName = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, companyName: val });
  const setCompanyPhone = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, companyPhone: val });
  const setCompanyLogoText = (val: string) =>
    onUpdateQuoteMetadata({ ...quoteMetadata, companyLogoText: val });
  const setProjectNotes = (val: string) => {
    try {
      localStorage.setItem('buildquote_project_notes_v1', val);
    } catch {
      // Ignore storage error
    }
    onUpdateQuoteMetadata({ ...quoteMetadata, projectNotes: val });
  };

  // Feedback state for Share & Copy actions
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<string>('');

  const financials = calculateQuoteFinancials({
    items,
    customLaborCost,
    materialMarkupPercent,
    taxRatePercent,
  });

  const currencySymbol = getCurrencySymbol(currency);

  const buildSummaryText = () =>
    formatQuoteTextSummary({
      quoteNumber,
      quoteDate,
      clientName,
      projectAddress,
      companyName,
      companyPhone,
      isPro,
      items,
      financials,
      materialMarkupPercent,
      taxRatePercent,
      projectNotes,
      currency,
    });

  const handleCopySummary = async () => {
    const summaryText = buildSummaryText();
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summaryText);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const temp = document.createElement('textarea');
        temp.value = summaryText;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      } catch {
        // Ignore fallback error
      }
    }

    setCopyFeedback('Copied to Clipboard!');
    setTimeout(() => setCopyFeedback(''), 2800);
  };

  const handleShareQuote = async () => {
    const summaryText = buildSummaryText();
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: `Project Estimate #${quoteNumber} - ${clientName || 'Client'}`,
          text: summaryText,
        });
        setShareFeedback('Quote Shared!');
        setTimeout(() => setShareFeedback(''), 2800);
        return;
      }
    } catch {
      // Fallback to clipboard copy if Web Share is canceled or unsupported
    }

    await handleCopySummary();
    setShareFeedback('Copied for Sharing!');
    setTimeout(() => setShareFeedback(''), 2800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Pro Upsell Banner on Quote Tab (Hidden in Print & Hidden when Unlocked) */}
      {!isPro && (
        <div className="no-print bg-slate-900 dark:bg-slate-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-400">
              Free Trial Estimate Mode Active
            </div>
            <p className="text-sm text-slate-200">
              Your client PDF currently includes the trial watermark and locked company branding.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProModal}
            className="min-h-[44px] w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm text-center transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <span className="hidden sm:inline">
              Unlock Pro Forever ($4.99) - Remove Watermark &amp; Add Your Company Name
            </span>
            <span className="sm:hidden">
              Unlock Pro Forever ($4.99) · Remove Watermark
            </span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quote Controls & Line Items (Hidden when printing) */}
        <section
          aria-label="Quote Configuration Controls"
          className="no-print lg:col-span-5 space-y-5"
        >
          {/* Client & Financial Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Client &amp; Financial Settings
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Customize client info, labor, material markup, and local tax
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="quote-client-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Client Name
                </label>
                <input
                  id="quote-client-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client Full Name"
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-number"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Estimate #
                </label>
                <input
                  id="quote-number"
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="quote-project-address"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Project Address
                </label>
                <input
                  id="quote-project-address"
                  type="text"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="Job Site Street, City, State"
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-labor-cost"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Custom Labor Cost ({currencySymbol})
                </label>
                <input
                  id="quote-labor-cost"
                  type="number"
                  min="0"
                  step="25"
                  value={customLaborCost}
                  onChange={(e) => setCustomLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-markup"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Material Markup (%)
                </label>
                <input
                  id="quote-markup"
                  type="number"
                  min="0"
                  step="1"
                  value={materialMarkupPercent}
                  onChange={(e) => setMaterialMarkupPercent(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-tax-rate"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tax Rate (%)
                </label>
                <input
                  id="quote-tax-rate"
                  type="number"
                  min="0"
                  step="0.25"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-date"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Estimate Date
                </label>
                <input
                  id="quote-date"
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Project Notes & Scope Resizable Textarea */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label
                htmlFor="project-scope-notes"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Project Notes &amp; Scope
              </label>
              <textarea
                id="project-scope-notes"
                data-testid="project-scope-notes-input"
                rows={3}
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder="Describe project scope, prep work, payment schedule, and warranty terms..."
                className="w-full min-h-[84px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          {/* Job Site Camera & Photo Attachments Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3
                  data-testid="quote-site-photos-heading"
                  className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-amber-500" />
                  Job Site Photos ({sitePhotos.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Auto-compressed JPEG photos with Draw/Text Markup &amp; 1-Tap Export
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCameraModal}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border border-slate-800 dark:border-slate-700"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Take / Upload Photo</span>
              </button>
            </div>

            {sitePhotos.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No job site photos attached yet. Click <strong>Take / Upload Photo</strong> to add a
                room or site photo to this quote.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {sitePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    data-testid="quote-photo-card"
                    className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/70 p-2"
                  >
                    <div className="relative">
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption}
                        className="w-full h-28 object-cover rounded-lg"
                      />
                      <span
                        data-testid="photo-size-kb"
                        className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-900/85 text-amber-400 font-mono text-[10px] font-semibold"
                      >
                        {photo.sizeKb} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveSitePhoto(photo.id)}
                        aria-label={`Remove site photo ${photo.caption}`}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 px-0.5">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {photo.caption}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {photo.timestamp} · {photo.sizeKb} KB JPEG
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAnnotateSitePhoto(photo)}
                        data-testid={`annotate-photo-${photo.id}`}
                        className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Annotate / Draw</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadJobSitePhotoJpeg(photo)}
                        data-testid={`download-photo-${photo.id}`}
                        className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                        <span>Download JPEG</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company Branding Card (Locked unless Pro is unlocked) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isPro ? (
                    <Unlock className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500" />
                  )}
                  Company Name, Logo &amp; Phone Number
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPro
                    ? 'Pro Unlocked: Custom contractor header appears on PDF estimates'
                    : 'Locked in Free Mode — Unlock Pro ($4.99) to customize branding'}
                </p>
              </div>
              {!isPro && (
                <button
                  type="button"
                  onClick={onOpenProModal}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Unlock ($4.99)
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  disabled={!isPro}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="company-logo-badge"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Company Logo / License Text
                  </label>
                  <input
                    id="company-logo-badge"
                    type="text"
                    disabled={!isPro}
                    value={companyLogoText}
                    onChange={(e) => setCompanyLogoText(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="company-phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Company Phone Number
                  </label>
                  <input
                    id="company-phone"
                    type="text"
                    disabled={!isPro}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add Custom Item Card */}
          <QuickAddCustomItem currency={currency} onAddCustomItem={onAddItem} />

          {/* Cart Items Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Estimate Cart ({items.length})
              </h3>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearItems}
                    className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No trade items in your estimate cart yet. Use any calculator tab and click{' '}
                  <strong>Add to Project Quote</strong>, or load a sample multi-trade remodel.
                </p>
                <button
                  type="button"
                  onClick={onLoadSampleItems}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Load Sample Multi-Trade Estimate
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {item.trade}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {item.summary}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="sr-only" htmlFor={`cost-${item.id}`}>
                        Material cost for {item.title}
                      </label>
                      <input
                        id={`cost-${item.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={item.materialCost}
                        onChange={(e) =>
                          onUpdateItemCost(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 min-h-[38px] px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.title} from quote`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local Backup & Restore (JSON) Card in Quote Tab */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  Local Backup &amp; Restore (JSON)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Download all saved quotes, custom material prices, and project data to a local JSON file
                </p>
              </div>
            </div>

            <input
              ref={quoteBackupFileRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportBackupFile(file);
                  e.target.value = '';
                }
              }}
              className="sr-only"
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                data-testid="quote-export-backup-btn"
                className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => quoteBackupFileRef.current?.click()}
                data-testid="quote-import-backup-btn"
                className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Import Backup</span>
              </button>
            </div>

            {backupStatusMessage && (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{backupStatusMessage}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live Print-Ready Estimate Sheet Preview */}
        <section
          aria-label="Client Quote Preview and PDF Generator"
          className="lg:col-span-7 space-y-4"
        >
          {/* Action Toolbar above Preview (Hidden in Print) */}
          <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Live Client Estimate &amp; Printable PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Share, copy text summary, or export single-page Letter / A4 PDF
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleShareQuote}
                data-testid="share-quote-btn"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {shareFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{shareFeedback}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Share Quote</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                data-testid="copy-summary-btn"
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{copyFeedback}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Copy Summary to Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenCameraModal}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Add Site Photo</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap sm:ml-auto"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print / Save Client PDF Estimate</span>
              </button>
            </div>
          </div>

          {/* Printable Single-Page Invoice / Estimate Sheet */}
          <div
            data-testid="quote-preview-sheet"
            className="print-sheet relative overflow-hidden bg-white text-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xs"
          >
            {/* Diagonal Watermark Overlay in Free Mode */}
            {!isPro && (
              <div
                data-testid="free-trial-watermark"
                aria-hidden="true"
                className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden p-4"
              >
                <div className="-rotate-18 text-center px-4 py-2.5 border-y-2 border-rose-600/40 bg-white/80 text-rose-700/45 font-display font-bold text-xs sm:text-base md:text-lg tracking-wider uppercase max-w-full">
                  FREE TRIAL ESTIMATE - UNLOCK PRO AT BUILDQUOTE ($4.99)
                </div>
              </div>
            )}

            {/* Invoice Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                {isPro ? (
                  <>
                    <div className="text-xs font-mono font-semibold text-amber-700">
                      {companyLogoText || 'LICENSED CONTRACTOR'}
                    </div>
                    <h2
                      data-testid="invoice-company-name"
                      className="text-2xl font-bold text-slate-900 mt-0.5"
                    >
                      {companyName || 'Your Company Name'}
                    </h2>
                    <div className="text-xs text-slate-600 mt-1">
                      Phone: {companyPhone || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-mono font-semibold text-slate-400">
                      BUILDQUOTE TRIAL ESTIMATE
                    </div>
                    <h2
                      data-testid="invoice-company-name"
                      className="text-xl font-bold text-slate-400 mt-0.5"
                    >
                      [Company Branding Locked — Unlock Pro $4.99]
                    </h2>
                    <div className="text-xs text-slate-400 mt-1">
                      Upgrade to display your Company Name, License &amp; Phone
                    </div>
                  </>
                )}
              </div>

              <div className="sm:text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Project Estimate ({currency})
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  #{quoteNumber}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Date: {quoteDate}
                </div>
              </div>
            </div>

            {/* Client Info Strip */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500">Prepared For</div>
                <div
                  data-testid="invoice-client-name"
                  className="font-bold text-slate-900 mt-0.5"
                >
                  {clientName || 'Valued Client'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">Job Site Address</div>
                <div
                  data-testid="invoice-project-address"
                  className="font-medium text-slate-800 mt-0.5"
                >
                  {projectAddress || 'On-Site Project'}
                </div>
              </div>
            </div>

            {/* Job Site Visual Thumbnail Preview Section inside PDF Client Quote Layout */}
            {sitePhotos.length > 0 && (
              <div
                data-testid="quote-site-photos-section"
                className="relative z-10 py-4 border-b border-slate-200"
              >
                <div className="text-xs font-semibold text-slate-500 mb-2.5">
                  Job Site Visual Inspection &amp; Photo Documentation ({sitePhotos.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sitePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      data-testid="quote-site-photo-thumbnail"
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2.5"
                    >
                      <div className="relative">
                        <img
                          src={photo.dataUrl}
                          alt={photo.caption}
                          className="w-full h-28 object-cover rounded-lg"
                        />
                        <span className="no-print absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-900/85 text-amber-400 font-mono text-[10px] font-semibold">
                          {photo.sizeKb} KB
                        </span>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {photo.caption}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {photo.timestamp} · {photo.sizeKb} KB
                        </div>
                      </div>
                      <div className="no-print mt-2 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAnnotateSitePhoto(photo)}
                          className="min-h-[32px] px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <PenTool className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Annotate / Draw</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadJobSitePhotoJpeg(photo)}
                          className="min-h-[32px] px-2 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Download className="w-3 h-3 text-slate-600 shrink-0" />
                          <span>Download JPEG</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="relative z-10 py-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="pb-2.5 pr-3">Trade &amp; Material Breakdown</th>
                    <th className="pb-2.5 text-right w-28">Materials ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-400 text-xs">
                        No material line items added yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-slate-900">
                            {idx + 1}. [{item.trade}] {item.title}
                          </div>
                          <div className="text-xs text-slate-700 mt-0.5">{item.summary}</div>
                          {item.details.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                              {item.details.map((line, i) => (
                                <li key={i}>• {line}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(item.materialCost, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="relative z-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
              <div className="sm:max-w-xs text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800">Project Scope &amp; Notes</div>
                <p
                  data-testid="invoice-project-notes"
                  className="leading-relaxed whitespace-pre-line"
                >
                  {projectNotes}
                </p>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="border-b border-slate-300 pb-1 text-[11px] text-slate-500">
                    Client Acceptance Signature
                  </div>
                  <div className="border-b border-slate-300 pb-1 text-[11px] text-slate-500">
                    Date
                  </div>
                </div>
              </div>

              <div className="sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Raw Materials Subtotal</span>
                  <span
                    data-testid="quote-raw-materials"
                    className="font-mono tabular-nums text-slate-900"
                  >
                    {formatCurrency(financials.rawMaterialsSubtotal, currency)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Material Markup ({materialMarkupPercent}%)</span>
                  <span
                    data-testid="quote-markup-amount"
                    className="font-mono tabular-nums text-slate-900"
                  >
                    +{formatCurrency(financials.markupAmount, currency)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Custom Labor Cost</span>
                  <span
                    data-testid="quote-labor-amount"
                    className="font-mono tabular-nums text-slate-900"
                  >
                    {formatCurrency(financials.laborCost, currency)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax ({taxRatePercent}%)</span>
                  <span
                    data-testid="quote-tax-amount"
                    className="font-mono tabular-nums text-slate-900"
                  >
                    {formatCurrency(financials.taxAmount, currency)}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-900 flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">Total Project Estimate</span>
                  <span
                    data-testid="quote-grand-total"
                    className="text-xl font-bold font-mono text-slate-900 tabular-nums"
                  >
                    {formatCurrency(financials.grandTotal, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
