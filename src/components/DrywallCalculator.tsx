import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  UnitSystem,
  WasteFactor,
  CurrencyCode,
  calculateDrywall,
  QuoteCartItem,
  MaterialPricingDefaults,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculators';
import { ProTipsAccordion } from './ProTipsAccordion';
import { handleSegmentedKeyDown } from '../utils/useModalKeyboard';

const DRYWALL_INPUT_MODES: readonly ('area' | 'room')[] = ['area', 'room'];
const DRYWALL_SHEET_SIZES: readonly (32 | 48)[] = [32, 48];

interface DrywallCalculatorProps {
  unitSystem: UnitSystem;
  wastePercent: WasteFactor;
  currency: CurrencyCode;
  materialPrices: MaterialPricingDefaults;
  onUpdateMaterialPrices: (next: MaterialPricingDefaults) => void;
  onAddToQuote: (item: Omit<QuoteCartItem, 'id'>) => void;
}

export const DrywallCalculator: React.FC<DrywallCalculatorProps> = ({
  unitSystem,
  wastePercent,
  currency,
  materialPrices,
  onUpdateMaterialPrices,
  onAddToQuote,
}) => {
  const [inputMode, setInputMode] = useState<'area' | 'room'>('area');
  const [directAreaSqFt, setDirectAreaSqFt] = useState<number>(640);
  const [roomLengthFt, setRoomLengthFt] = useState<number>(16);
  const [roomWidthFt, setRoomWidthFt] = useState<number>(12);
  const [roomHeightFt, setRoomHeightFt] = useState<number>(8);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);

  const [doorCount, setDoorCount] = useState<number>(2);
  const [windowCount, setWindowCount] = useState<number>(2);
  const [sheetSize, setSheetSize] = useState<32 | 48>(32);

  const [addedFlash, setAddedFlash] = useState(false);

  const pricePerSheet = materialPrices.drywallSheetPrice;
  const pricePerBucketMud = materialPrices.drywallMudBucketPrice;
  const pricePerTapeRoll = materialPrices.drywallTapeRollPrice;
  const pricePerScrewBox = materialPrices.drywallScrewBoxPrice;

  const setPricePerSheet = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, drywallSheetPrice: Math.max(0, val) });
  const setPricePerBucketMud = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, drywallMudBucketPrice: Math.max(0, val) });
  const setPricePerTapeRoll = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, drywallTapeRollPrice: Math.max(0, val) });
  const setPricePerScrewBox = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, drywallScrewBoxPrice: Math.max(0, val) });

  const sym = getCurrencySymbol(currency);

  const result = calculateDrywall({
    inputMode,
    directAreaSqFt,
    roomLengthFt,
    roomWidthFt,
    roomHeightFt,
    includeCeiling,
    doorCount,
    windowCount,
    sheetSize,
    wastePercent,
    pricePerSheet,
    pricePerBucketMud,
    pricePerTapeRoll,
    pricePerScrewBox,
  });

  const areaDisplay =
    unitSystem === 'metric'
      ? Number((directAreaSqFt * 0.092903).toFixed(1))
      : directAreaSqFt;

  const handleAreaChange = (val: number) => {
    setDirectAreaSqFt(unitSystem === 'metric' ? Math.round(val / 0.092903) : val);
  };

  const handleAdd = () => {
    const sheetName = sheetSize === 32 ? '4×8 ft (32 sq ft)' : '4×12 ft (48 sq ft)';
    onAddToQuote({
      trade: 'Drywall',
      title: `Drywall, Mud, Tape & Screws (${sheetName})`,
      summary: `${result.totalSheets} Sheets · ${result.compoundBuckets45Gal} Mud Buckets (4.5 gal) · ${result.tapeRolls} Tape Rolls · ${result.screwBoxes1lb} Screw Boxes`,
      details: [
        `Net Area: ${result.netAreaSqFt.toFixed(0)} sq ft (Deducted ${doorCount} doors / ${windowCount} windows = -${result.deductedSqFt} sq ft) · With ${wastePercent}% Waste: ${result.grossSqFt.toFixed(1)} sq ft`,
        `Drywall Panels: ${result.totalSheets} sheets of ${sheetName} @ ${formatCurrency(pricePerSheet, currency)}/sheet`,
        `Joint Compound: ${result.compoundGallons} gal (${result.compoundLiters} L) / ${result.compoundBuckets45Gal} × 4.5-Gal Buckets`,
        `Fasteners & Tape: ${result.tapeRolls} rolls (250 ft) · ${result.drywallScrews} screws (${result.screwBoxes1lb} × 1lb boxes)`,
      ],
      materialCost: result.estimatedMaterialCost,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Inputs */}
      <section
        aria-label="Drywall Calculator Inputs"
        className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Drywall, Mud, Tape &amp; Screws Estimator
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Deducts 21 sq ft per door &amp; 15 sq ft per window · 0.014 gal/sq ft compound rate
            </p>
          </div>

          <div
            role="group"
            aria-label="Drywall area input mode"
            onKeyDown={(e) =>
              handleSegmentedKeyDown(e, DRYWALL_INPUT_MODES, inputMode, setInputMode)
            }
            className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0"
          >
            <button
              type="button"
              aria-pressed={inputMode === 'area'}
              onClick={() => setInputMode('area')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                inputMode === 'area'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Wall/Ceiling Area
            </button>
            <button
              type="button"
              aria-pressed={inputMode === 'room'}
              onClick={() => setInputMode('room')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                inputMode === 'room'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Room L × W × H
            </button>
          </div>
        </div>

        {/* Area or Room Dimensions */}
        {inputMode === 'area' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="sm:col-span-1">
              <label
                htmlFor="drywall-area"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Gross Wall/Ceiling ({unitSystem === 'metric' ? 'm²' : 'sq ft'})
              </label>
              <input
                id="drywall-area"
                type="number"
                min="0"
                step="10"
                value={areaDisplay}
                onChange={(e) => handleAreaChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${directAreaSqFt} sq ft`
                  : `${(directAreaSqFt * 0.092903).toFixed(1)} m²`}
              </span>
            </div>

            <div>
              <label
                htmlFor="drywall-doors"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Doors (-21 sq ft each)
              </label>
              <input
                id="drywall-doors"
                type="number"
                min="0"
                step="1"
                value={doorCount}
                onChange={(e) => setDoorCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Deducts {doorCount * 21} sq ft
              </span>
            </div>

            <div>
              <label
                htmlFor="drywall-windows"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Windows (-15 sq ft each)
              </label>
              <input
                id="drywall-windows"
                type="number"
                min="0"
                step="1"
                value={windowCount}
                onChange={(e) => setWindowCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Deducts {windowCount * 15} sq ft
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="drywall-room-len"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Room Length (ft)
                </label>
                <input
                  id="drywall-room-len"
                  type="number"
                  min="0"
                  step="1"
                  value={roomLengthFt}
                  onChange={(e) => setRoomLengthFt(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label
                  htmlFor="drywall-room-wid"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Room Width (ft)
                </label>
                <input
                  id="drywall-room-wid"
                  type="number"
                  min="0"
                  step="1"
                  value={roomWidthFt}
                  onChange={(e) => setRoomWidthFt(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label
                  htmlFor="drywall-room-hgt"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Ceiling Height (ft)
                </label>
                <input
                  id="drywall-room-hgt"
                  type="number"
                  min="0"
                  step="0.5"
                  value={roomHeightFt}
                  onChange={(e) => setRoomHeightFt(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label
                  htmlFor="drywall-doors-room"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Doors (-21 sq ft each)
                </label>
                <input
                  id="drywall-doors-room"
                  type="number"
                  min="0"
                  step="1"
                  value={doorCount}
                  onChange={(e) => setDoorCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
                />
              </div>
              <div>
                <label
                  htmlFor="drywall-windows-room"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Windows (-15 sq ft each)
                </label>
                <input
                  id="drywall-windows-room"
                  type="number"
                  min="0"
                  step="1"
                  value={windowCount}
                  onChange={(e) => setWindowCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
                />
              </div>
              <label className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCeiling}
                  onChange={(e) => setIncludeCeiling(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Include Ceiling ({roomLengthFt * roomWidthFt} sq ft)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Sheet Size Selector */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Drywall Sheet Size
          </span>
          <div
            role="group"
            aria-label="Drywall Sheet Size"
            onKeyDown={(e) =>
              handleSegmentedKeyDown(e, DRYWALL_SHEET_SIZES, sheetSize, setSheetSize)
            }
            className="grid grid-cols-2 gap-3"
          >
            <button
              type="button"
              aria-pressed={sheetSize === 32}
              onClick={() => setSheetSize(32)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                sheetSize === 32
                  ? 'bg-slate-900 dark:bg-amber-500/20 text-white border-slate-900 dark:border-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-bold">4 × 8 ft Standard Sheet</div>
              <div
                className={`text-xs font-mono ${
                  sheetSize === 32 ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                32 sq ft (2.97 m²) per sheet
              </div>
            </button>

            <button
              type="button"
              aria-pressed={sheetSize === 48}
              onClick={() => setSheetSize(48)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                sheetSize === 48
                  ? 'bg-slate-900 dark:bg-amber-500/20 text-white border-slate-900 dark:border-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-bold">4 × 12 ft Commercial Sheet</div>
              <div
                className={`text-xs font-mono ${
                  sheetSize === 48 ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                48 sq ft (4.46 m²) per sheet
              </div>
            </button>
          </div>
        </div>

        {/* Unit Prices */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="drywall-price-sheet"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Sheet Price ({sym})
            </label>
            <input
              id="drywall-price-sheet"
              type="number"
              min="0"
              step="0.5"
              value={pricePerSheet}
              onChange={(e) => setPricePerSheet(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[42px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="drywall-price-mud"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              4.5g Mud ({sym})
            </label>
            <input
              id="drywall-price-mud"
              type="number"
              min="0"
              step="0.5"
              value={pricePerBucketMud}
              onChange={(e) => setPricePerBucketMud(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[42px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="drywall-price-tape"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Tape Roll ({sym})
            </label>
            <input
              id="drywall-price-tape"
              type="number"
              min="0"
              step="0.5"
              value={pricePerTapeRoll}
              onChange={(e) => setPricePerTapeRoll(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[42px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="drywall-price-screws"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Screw Box ({sym})
            </label>
            <input
              id="drywall-price-screws"
              type="number"
              min="0"
              step="0.5"
              value={pricePerScrewBox}
              onChange={(e) => setPricePerScrewBox(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[42px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>
        </div>

        {/* Context-Specific Construction Best Practices Accordion */}
        <ProTipsAccordion trade="Drywall" />
      </section>

      {/* Right Column: Outputs */}
      <section
        aria-label="Drywall Calculation Results"
        className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="pb-4 border-b border-slate-800">
          <span className="text-xs font-medium text-amber-400">
            Net Area: {result.netAreaSqFt.toFixed(0)} sq ft · Gross w/ {wastePercent}% Waste:{' '}
            {result.grossSqFt.toFixed(1)} sq ft
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Sheets, Joint Compound, Tape &amp; Screws
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">
              Total Drywall Sheets ({sheetSize === 32 ? '4×8' : '4×12'})
            </span>
            <span
              data-testid="drywall-total-sheets"
              className="text-3xl font-bold font-mono text-amber-400 mt-1 block tabular-nums"
            >
              {result.totalSheets}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {result.totalSheets * sheetSize} sq ft total panel area
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Ready-Mix Mud</span>
            <span
              data-testid="drywall-mud-gallons"
              className="text-3xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.compoundGallons}{' '}
              <span className="text-sm font-normal text-slate-300">gal</span>
            </span>
            <span className="text-[11px] text-amber-300 font-mono">
              {result.compoundBuckets45Gal} × 4.5-Gal Buckets ({result.compoundLiters} L)
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Paper / Mesh Tape</span>
            <span
              data-testid="drywall-tape-rolls"
              className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.tapeRolls}{' '}
              <span className="text-sm font-normal text-slate-300">rolls</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {result.tapeFeet} linear ft (250 ft/roll)
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Drywall Screws</span>
            <span
              data-testid="drywall-screws"
              className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.drywallScrews}
            </span>
            <span className="text-[11px] text-amber-300 font-mono">
              {result.screwBoxes1lb} × 1 lb Boxes (300/box)
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Estimated Material Total
          </span>
          <span
            data-testid="drywall-estimated-cost"
            className="text-2xl font-bold font-mono text-amber-400 tabular-nums"
          >
            {formatCurrency(result.estimatedMaterialCost, currency)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-5 w-full min-h-[48px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          {addedFlash ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              Added Drywall Package to Quote!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add to Project Quote
            </>
          )}
        </button>
      </section>
    </div>
  );
};
