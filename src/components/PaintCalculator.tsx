import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  UnitSystem,
  WasteFactor,
  CurrencyCode,
  calculatePaint,
  QuoteCartItem,
  MaterialPricingDefaults,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculators';
import { ProTipsAccordion } from './ProTipsAccordion';

interface PaintCalculatorProps {
  unitSystem: UnitSystem;
  wastePercent: WasteFactor;
  currency: CurrencyCode;
  materialPrices: MaterialPricingDefaults;
  onUpdateMaterialPrices: (next: MaterialPricingDefaults) => void;
  onAddToQuote: (item: Omit<QuoteCartItem, 'id'>) => void;
}

export const PaintCalculator: React.FC<PaintCalculatorProps> = ({
  unitSystem,
  wastePercent,
  currency,
  materialPrices,
  onUpdateMaterialPrices,
  onAddToQuote,
}) => {
  const [wallAreaSqFt, setWallAreaSqFt] = useState<number>(850);
  const [doorCount, setDoorCount] = useState<number>(2);
  const [windowCount, setWindowCount] = useState<number>(3);
  const [paintCoats, setPaintCoats] = useState<number>(2);
  const [primerCoats, setPrimerCoats] = useState<number>(1);
  const [addedFlash, setAddedFlash] = useState(false);

  const pricePerGallonPaint = materialPrices.paintGallonPrice;
  const pricePerGallonPrimer = materialPrices.primerGallonPrice;

  const setPricePerGallonPaint = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, paintGallonPrice: Math.max(0, val) });
  const setPricePerGallonPrimer = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, primerGallonPrice: Math.max(0, val) });

  const sym = getCurrencySymbol(currency);

  const result = calculatePaint({
    wallAreaSqFt,
    doorCount,
    windowCount,
    paintCoats,
    primerCoats,
    pricePerGallonPaint,
    pricePerGallonPrimer,
    wastePercent,
  });

  const areaDisplay =
    unitSystem === 'metric' ? Number((wallAreaSqFt * 0.092903).toFixed(1)) : wallAreaSqFt;

  const handleAdd = () => {
    onAddToQuote({
      trade: 'Paint',
      title: `Finish Paint (${paintCoats} Coats) & Primer (${primerCoats} Coat)`,
      summary: `${result.paintGallons} Gal (${result.paintLiters} L) Finish Paint · ${result.primerGallons} Gal (${result.primerLiters} L) Primer`,
      details: [
        `Net Paintable Area: ${result.netAreaSqFt.toFixed(0)} sq ft (Deducted ${doorCount} doors & ${windowCount} windows = -${result.deductedSqFt} sq ft, +${wastePercent}% waste)`,
        `Finish Paint: ${result.paintGallons} gal / ${result.paintLiters} L (${paintCoats} coats @ 350 sq ft/gal) @ ${formatCurrency(pricePerGallonPaint, currency)}/gal`,
        `Primer Sealer: ${result.primerGallons} gal / ${result.primerLiters} L (${primerCoats} coats @ 300 sq ft/gal) @ ${formatCurrency(pricePerGallonPrimer, currency)}/gal`,
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
        aria-label="Paint Calculator Inputs"
        className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs"
      >
        <div className="pb-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Paint &amp; Primer Calculator
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            350 sq ft/gal finish coverage &amp; 300 sq ft/gal primer coverage with opening deductions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div>
            <label
              htmlFor="paint-wall-area"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Total Wall Area ({unitSystem === 'metric' ? 'm²' : 'sq ft'})
            </label>
            <input
              id="paint-wall-area"
              type="number"
              min="0"
              step="10"
              value={areaDisplay}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setWallAreaSqFt(unitSystem === 'metric' ? Math.round(v / 0.092903) : v);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="paint-doors"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Doors (-21 sq ft each)
            </label>
            <input
              id="paint-doors"
              type="number"
              min="0"
              step="1"
              value={doorCount}
              onChange={(e) => setDoorCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="paint-windows"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Windows (-15 sq ft each)
            </label>
            <input
              id="paint-windows"
              type="number"
              min="0"
              step="1"
              value={windowCount}
              onChange={(e) => setWindowCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label
              htmlFor="paint-coats"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Finish Paint Coats
            </label>
            <input
              id="paint-coats"
              type="number"
              min="1"
              max="5"
              step="1"
              value={paintCoats}
              onChange={(e) => setPaintCoats(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>

          <div>
            <label
              htmlFor="primer-coats"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Primer Coats
            </label>
            <input
              id="primer-coats"
              type="number"
              min="0"
              max="4"
              step="1"
              value={primerCoats}
              onChange={(e) => setPrimerCoats(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>

          <div>
            <label
              htmlFor="paint-price"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Paint ({sym} / Gal)
            </label>
            <input
              id="paint-price"
              type="number"
              min="0"
              step="1"
              value={pricePerGallonPaint}
              onChange={(e) => setPricePerGallonPaint(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>

          <div>
            <label
              htmlFor="primer-price"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Primer ({sym} / Gal)
            </label>
            <input
              id="primer-price"
              type="number"
              min="0"
              step="1"
              value={pricePerGallonPrimer}
              onChange={(e) => setPricePerGallonPrimer(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>
        </div>

        {/* Context-Specific Construction Best Practices Accordion */}
        <ProTipsAccordion trade="Paint" />
      </section>

      {/* Right Column: Outputs */}
      <section
        aria-label="Paint Calculation Results"
        className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="pb-4 border-b border-slate-800">
          <span className="text-xs font-medium text-amber-400">
            Net Paintable Surface: {result.netAreaSqFt.toFixed(0)} sq ft (-{result.deductedSqFt} sq
            ft openings)
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Finish Paint &amp; Primer Quantities
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">
              Finish Paint ({paintCoats} {paintCoats === 1 ? 'Coat' : 'Coats'})
            </span>
            <span
              data-testid="paint-finish-gallons"
              className="text-3xl font-bold font-mono text-amber-400 mt-1 block tabular-nums"
            >
              {result.paintGallons}{' '}
              <span className="text-sm font-normal text-slate-300">gal</span>
            </span>
            <span
              data-testid="paint-finish-liters"
              className="text-xs text-sky-400 font-mono mt-1 block"
            >
              {result.paintLiters} Liters (350 sq ft/gal)
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">
              Primer Sealer ({primerCoats} {primerCoats === 1 ? 'Coat' : 'Coats'})
            </span>
            <span
              data-testid="paint-primer-gallons"
              className="text-3xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.primerGallons}{' '}
              <span className="text-sm font-normal text-slate-300">gal</span>
            </span>
            <span
              data-testid="paint-primer-liters"
              className="text-xs text-sky-400 font-mono mt-1 block"
            >
              {result.primerLiters} Liters (300 sq ft/gal)
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Estimated Paint &amp; Primer Total
          </span>
          <span
            data-testid="paint-estimated-cost"
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
              Added Paint &amp; Primer to Quote!
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
