import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  UnitSystem,
  WasteFactor,
  CurrencyCode,
  calculateTile,
  QuoteCartItem,
  MaterialPricingDefaults,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculators';
import { ProTipsAccordion } from './ProTipsAccordion';
import { handleSegmentedKeyDown } from '../utils/useModalKeyboard';

const TILE_CATEGORIES: readonly ('small' | 'large')[] = ['small', 'large'];

interface TileCalculatorProps {
  unitSystem: UnitSystem;
  wastePercent: WasteFactor;
  currency: CurrencyCode;
  materialPrices: MaterialPricingDefaults;
  onUpdateMaterialPrices: (next: MaterialPricingDefaults) => void;
  onAddToQuote: (item: Omit<QuoteCartItem, 'id'>) => void;
}

export const TileCalculator: React.FC<TileCalculatorProps> = ({
  unitSystem,
  wastePercent,
  currency,
  materialPrices,
  onUpdateMaterialPrices,
  onAddToQuote,
}) => {
  const [areaSqFt, setAreaSqFt] = useState<number>(180);
  const [tileWidthIn, setTileWidthIn] = useState<number>(12);
  const [tileLengthIn, setTileLengthIn] = useState<number>(24);
  const [tileCategory, setTileCategory] = useState<'small' | 'large'>('large');
  const [tilesPerBox, setTilesPerBox] = useState<number>(8);
  const [pricingBasis, setPricingBasis] = useState<'sqft' | 'box'>('sqft');
  const [addedFlash, setAddedFlash] = useState(false);

  const unitPrice = materialPrices.tilePricePerSqFt;
  const thinsetPricePerBag = materialPrices.tileThinsetBagPrice;
  const groutPricePerBag = materialPrices.tileGroutBagPrice;

  const setUnitPrice = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, tilePricePerSqFt: Math.max(0, val) });

  const sym = getCurrencySymbol(currency);

  const result = calculateTile({
    areaSqFt,
    tileWidthIn,
    tileLengthIn,
    tileCategory,
    tilesPerBox,
    pricingBasis,
    unitPrice,
    thinsetPricePerBag,
    groutPricePerBag,
    wastePercent,
  });

  const areaDisplay =
    unitSystem === 'metric' ? Number((areaSqFt * 0.092903).toFixed(1)) : areaSqFt;
  const widthDisplay =
    unitSystem === 'metric' ? Number((tileWidthIn * 2.54).toFixed(1)) : tileWidthIn;
  const lengthDisplay =
    unitSystem === 'metric' ? Number((tileLengthIn * 2.54).toFixed(1)) : tileLengthIn;

  const handleTileSizeUpdate = (newWIn: number, newLIn: number) => {
    setTileWidthIn(newWIn);
    setTileLengthIn(newLIn);
    if (newWIn >= 12 && newLIn >= 12) {
      setTileCategory('large');
    } else {
      setTileCategory('small');
    }
  };

  const handleAdd = () => {
    onAddToQuote({
      trade: 'Tile',
      title: `Tile, Thinset & Grout (${tileWidthIn}"×${tileLengthIn}" ${
        tileCategory === 'large' ? 'Large Format' : 'Standard'
      })`,
      summary: `${result.totalSqFtWithWaste} sq ft (${result.totalBoxes} boxes / ${result.individualTiles} tiles) · ${result.thinsetBags50lb} Thinset Bags · ${result.groutBags25lb} Grout Bags`,
      details: [
        `Gross Coverage w/ ${wastePercent}% Waste: ${result.totalSqFtWithWaste} sq ft (${result.totalSqMetersWithWaste} m²)`,
        `Tile Count: ${result.individualTiles} individual tiles (${result.totalBoxes} boxes @ ${tilesPerBox} tiles/box)`,
        `Setting Materials: ${result.thinsetBags50lb} × 50lb Thinset Mortar Bags · ${result.groutBags25lb} × 25lb Grout Bags`,
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
        aria-label="Tile Calculator Inputs"
        className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs"
      >
        <div className="pb-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Tile, Thinset &amp; Grout Estimator
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Calculates individual tiles, full boxes, 50lb thinset mortar, and 25lb grout bags
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div>
            <label
              htmlFor="tile-area"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Floor/Wall Area ({unitSystem === 'metric' ? 'm²' : 'sq ft'})
            </label>
            <input
              id="tile-area"
              type="number"
              min="0"
              step="5"
              value={areaDisplay}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setAreaSqFt(unitSystem === 'metric' ? Math.round(v / 0.092903) : v);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="tile-width"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tile Width ({unitSystem === 'metric' ? 'cm' : 'in'})
            </label>
            <input
              id="tile-width"
              type="number"
              min="1"
              step="1"
              value={widthDisplay}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 1;
                const wIn = unitSystem === 'metric' ? Number((v / 2.54).toFixed(2)) : v;
                handleTileSizeUpdate(wIn, tileLengthIn);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="tile-length"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tile Length ({unitSystem === 'metric' ? 'cm' : 'in'})
            </label>
            <input
              id="tile-length"
              type="number"
              min="1"
              step="1"
              value={lengthDisplay}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 1;
                const lIn = unitSystem === 'metric' ? Number((v / 2.54).toFixed(2)) : v;
                handleTileSizeUpdate(tileWidthIn, lIn);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Tile Size Category for Thinset Mortar Trowel Coverage */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tile Size Category (Thinset Mortar Coverage Rate)
          </span>
          <div
            role="group"
            aria-label="Tile Size Category"
            onKeyDown={(e) =>
              handleSegmentedKeyDown(e, TILE_CATEGORIES, tileCategory, setTileCategory)
            }
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <button
              type="button"
              aria-pressed={tileCategory === 'small'}
              onClick={() => setTileCategory('small')}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tileCategory === 'small'
                  ? 'bg-slate-900 dark:bg-amber-500/20 text-white border-slate-900 dark:border-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-bold">Small Tile (Under 12×12 in)</div>
              <div
                className={`text-xs font-mono ${
                  tileCategory === 'small' ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                90 sq ft per 50lb Thinset Bag
              </div>
            </button>

            <button
              type="button"
              aria-pressed={tileCategory === 'large'}
              onClick={() => setTileCategory('large')}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tileCategory === 'large'
                  ? 'bg-slate-900 dark:bg-amber-500/20 text-white border-slate-900 dark:border-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-bold">Large Format Tile (12×12 in +)</div>
              <div
                className={`text-xs font-mono ${
                  tileCategory === 'large' ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                60 sq ft per 50lb Thinset Bag
              </div>
            </button>
          </div>
        </div>

        {/* Packaging & Pricing */}
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="tiles-per-box"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tiles per Box
            </label>
            <input
              id="tiles-per-box"
              type="number"
              min="1"
              step="1"
              value={tilesPerBox}
              onChange={(e) => setTilesPerBox(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>

          <div>
            <label
              htmlFor="tile-pricing-basis"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tile Pricing Mode
            </label>
            <select
              id="tile-pricing-basis"
              value={pricingBasis}
              onChange={(e) => setPricingBasis(e.target.value as 'sqft' | 'box')}
              className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium"
            >
              <option value="sqft">Price per Sq Ft ({sym})</option>
              <option value="box">Price per Box ({sym})</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="tile-unit-price"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {pricingBasis === 'sqft'
                ? `Tile Price (${sym} / sq ft)`
                : `Tile Price (${sym} / box)`}
            </label>
            <input
              id="tile-unit-price"
              type="number"
              min="0"
              step="0.25"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base"
            />
          </div>
        </div>

        {/* Context-Specific Construction Best Practices Accordion */}
        <ProTipsAccordion trade="Tile" />
      </section>

      {/* Right Column: Outputs */}
      <section
        aria-label="Tile Calculation Results"
        className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="pb-4 border-b border-slate-800">
          <span className="text-xs font-medium text-amber-400">
            Gross Area w/ {wastePercent}% Waste: {result.totalSqFtWithWaste} sq ft (
            {result.totalSqMetersWithWaste} m²)
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Tiles, Boxes, Thinset &amp; Grout
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Total Area w/ Waste</span>
            <span
              data-testid="tile-total-sqft"
              className="text-3xl font-bold font-mono text-amber-400 mt-1 block tabular-nums"
            >
              {result.totalSqFtWithWaste}{' '}
              <span className="text-sm font-normal text-slate-300">sq ft</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {result.totalSqMetersWithWaste} m² total
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Individual Tiles &amp; Boxes</span>
            <span
              data-testid="tile-total-boxes"
              className="text-3xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.totalBoxes}{' '}
              <span className="text-sm font-normal text-slate-300">boxes</span>
            </span>
            <span
              data-testid="tile-individual-count"
              className="text-[11px] text-amber-300 font-mono"
            >
              {result.individualTiles} individual tiles
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">50 lb Thinset Mortar</span>
            <span
              data-testid="tile-thinset-bags"
              className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.thinsetBags50lb}{' '}
              <span className="text-sm font-normal text-slate-300">bags</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {tileCategory === 'large' ? '60 sq ft/bag (12×12+)' : '90 sq ft/bag (<12×12)'}
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">25 lb Grout Bags</span>
            <span
              data-testid="tile-grout-bags"
              className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.groutBags25lb}{' '}
              <span className="text-sm font-normal text-slate-300">bags</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              100 sq ft / 25lb bag
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Tile Material Cost</span>
            <span className="font-mono">{formatCurrency(result.tileCost, currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Thinset &amp; Grout Cost</span>
            <span className="font-mono">
              {formatCurrency(result.settingMaterialsCost, currency)}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-sm font-semibold text-slate-200">
              Estimated Material Total
            </span>
            <span
              data-testid="tile-estimated-cost"
              className="text-2xl font-bold font-mono text-amber-400 tabular-nums"
            >
              {formatCurrency(result.estimatedMaterialCost, currency)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-5 w-full min-h-[48px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          {addedFlash ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              Added Tile Package to Quote!
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
