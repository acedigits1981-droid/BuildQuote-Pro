import React, { useState } from 'react';
import { Plus, Check, Layers, CircleDot } from 'lucide-react';
import {
  UnitSystem,
  WasteFactor,
  CurrencyCode,
  ConcreteSlabInput,
  calculateConcrete,
  QuoteCartItem,
  MaterialPricingDefaults,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculators';
import { ProTipsAccordion } from './ProTipsAccordion';
import { handleSegmentedKeyDown } from '../utils/useModalKeyboard';

const CONCRETE_MODES: readonly ('slab' | 'post')[] = ['slab', 'post'];
const COST_BASIS_OPTIONS: readonly ('bags' | 'readymix')[] = ['bags', 'readymix'];
const BAG_SIZE_OPTIONS: readonly ConcreteSlabInput['selectedBagType'][] = [
  '80lb',
  '60lb',
  '30kg',
  '50lb',
];

interface ConcreteCalculatorProps {
  unitSystem: UnitSystem;
  wastePercent: WasteFactor;
  currency: CurrencyCode;
  materialPrices: MaterialPricingDefaults;
  onUpdateMaterialPrices: (next: MaterialPricingDefaults) => void;
  onAddToQuote: (item: Omit<QuoteCartItem, 'id'>) => void;
}

export const ConcreteCalculator: React.FC<ConcreteCalculatorProps> = ({
  unitSystem,
  wastePercent,
  currency,
  materialPrices,
  onUpdateMaterialPrices,
  onAddToQuote,
}) => {
  const [mode, setMode] = useState<'slab' | 'post'>('slab');
  const [lengthFt, setLengthFt] = useState<number>(12);
  const [widthFt, setWidthFt] = useState<number>(10);
  const [thicknessIn, setThicknessIn] = useState<number>(4);

  const [diameterIn, setDiameterIn] = useState<number>(12);
  const [depthFt, setDepthFt] = useState<number>(3.5);
  const [holeCount, setHoleCount] = useState<number>(6);

  const [selectedBagType, setSelectedBagType] = useState<'80lb' | '60lb' | '30kg' | '50lb'>('80lb');
  const [costBasis, setCostBasis] = useState<'bags' | 'readymix'>('bags');
  const [addedFlash, setAddedFlash] = useState(false);

  const pricePerBag = materialPrices.concreteBagPrice;
  const readyMixPricePerYard = materialPrices.concreteReadyMixPerYard;

  const setPricePerBag = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, concreteBagPrice: Math.max(0, val) });
  const setReadyMixPricePerYard = (val: number) =>
    onUpdateMaterialPrices({ ...materialPrices, concreteReadyMixPerYard: Math.max(0, val) });

  const sym = getCurrencySymbol(currency);

  const result = calculateConcrete({
    mode,
    lengthFt,
    widthFt,
    thicknessIn,
    diameterIn,
    depthFt,
    holeCount,
    wastePercent,
    selectedBagType,
    pricePerBag,
    readyMixPricePerYard,
  });

  const lengthDisplay = unitSystem === 'metric' ? Number((lengthFt * 0.3048).toFixed(2)) : lengthFt;
  const widthDisplay = unitSystem === 'metric' ? Number((widthFt * 0.3048).toFixed(2)) : widthFt;
  const thicknessDisplay =
    unitSystem === 'metric' ? Number((thicknessIn * 2.54).toFixed(1)) : thicknessIn;
  const diameterDisplay =
    unitSystem === 'metric' ? Number((diameterIn * 2.54).toFixed(1)) : diameterIn;
  const depthDisplay = unitSystem === 'metric' ? Number((depthFt * 0.3048).toFixed(2)) : depthFt;

  const handleLengthChange = (val: number) => {
    setLengthFt(unitSystem === 'metric' ? Number((val / 0.3048).toFixed(3)) : val);
  };
  const handleWidthChange = (val: number) => {
    setWidthFt(unitSystem === 'metric' ? Number((val / 0.3048).toFixed(3)) : val);
  };
  const handleThicknessChange = (val: number) => {
    setThicknessIn(unitSystem === 'metric' ? Number((val / 2.54).toFixed(3)) : val);
  };
  const handleDiameterChange = (val: number) => {
    setDiameterIn(unitSystem === 'metric' ? Number((val / 2.54).toFixed(3)) : val);
  };
  const handleDepthChange = (val: number) => {
    setDepthFt(unitSystem === 'metric' ? Number((val / 0.3048).toFixed(3)) : val);
  };

  const activeCost =
    costBasis === 'bags' ? result.estimatedBagCost : result.estimatedReadyMixCost;

  const handleAdd = () => {
    const dimensionLabel =
      mode === 'slab'
        ? unitSystem === 'metric'
          ? `${lengthDisplay}m × ${widthDisplay}m × ${thicknessDisplay}cm Slab (${wastePercent}% waste)`
          : `${Number(lengthFt.toFixed(1))}ft × ${Number(widthFt.toFixed(1))}ft × ${Number(thicknessIn.toFixed(1))}in Slab (${wastePercent}% waste)`
        : `${holeCount} Post Holes (${Number(diameterIn.toFixed(0))}in Ø × ${Number(depthFt.toFixed(1))}ft deep, ${wastePercent}% waste)`;

    const supplyLabel =
      costBasis === 'bags'
        ? `${result.selectedBagCount} × ${selectedBagType} Pre-Mix Bags @ ${formatCurrency(pricePerBag, currency)}/bag`
        : `${result.cubicYards.toFixed(2)} yd³ (${result.cubicMeters.toFixed(2)} m³) Ready-Mix @ ${formatCurrency(readyMixPricePerYard, currency)}/yd³`;

    onAddToQuote({
      trade: 'Concrete',
      title: mode === 'slab' ? 'Concrete Slab / Footing' : 'Concrete Round Post Holes',
      summary: `${dimensionLabel} — ${supplyLabel}`,
      details: [
        `Total Volume: ${result.cubicFeetWithWaste.toFixed(2)} ft³ (${result.cubicYards.toFixed(2)} yd³ / ${result.cubicMeters.toFixed(2)} m³)`,
        `Pre-Mix Equivalents: ${result.bags80lb} (80lb) · ${result.bags60lb} (60lb) · ${result.bags30kg} (30kg) · ${result.bags50lb} (50lb)`,
        supplyLabel,
      ],
      materialCost: activeCost,
    });

    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Inputs */}
      <section
        aria-label="Concrete Calculator Inputs"
        className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Concrete Slab &amp; Post Hole Calculator
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Verified volume math for flatwork, footings, and cylindrical piers
            </p>
          </div>

          {/* Mode Toggle */}
          <div
            role="group"
            aria-label="Concrete calculation mode"
            onKeyDown={(e) => handleSegmentedKeyDown(e, CONCRETE_MODES, mode, setMode)}
            className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0"
          >
            <button
              type="button"
              aria-pressed={mode === 'slab'}
              onClick={() => setMode('slab')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'slab'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Slab / Footing
            </button>
            <button
              type="button"
              aria-pressed={mode === 'post'}
              onClick={() => setMode('post')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'post'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              Round Post Holes
            </button>
          </div>
        </div>

        {/* Dimension Inputs */}
        {mode === 'slab' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div>
              <label
                htmlFor="concrete-length"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Length ({unitSystem === 'metric' ? 'm' : 'ft'})
              </label>
              <input
                id="concrete-length"
                type="number"
                min="0"
                step="0.1"
                value={lengthDisplay}
                onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${lengthFt.toFixed(1)} ft`
                  : `${(lengthFt * 0.3048).toFixed(2)} m`}
              </span>
            </div>

            <div>
              <label
                htmlFor="concrete-width"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Width ({unitSystem === 'metric' ? 'm' : 'ft'})
              </label>
              <input
                id="concrete-width"
                type="number"
                min="0"
                step="0.1"
                value={widthDisplay}
                onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${widthFt.toFixed(1)} ft`
                  : `${(widthFt * 0.3048).toFixed(2)} m`}
              </span>
            </div>

            <div>
              <label
                htmlFor="concrete-thickness"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Thickness ({unitSystem === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                id="concrete-thickness"
                type="number"
                min="0"
                step="0.5"
                value={thicknessDisplay}
                onChange={(e) => handleThicknessChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${thicknessIn.toFixed(1)} in`
                  : `${(thicknessIn * 2.54).toFixed(1)} cm`}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div>
              <label
                htmlFor="post-diameter"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hole Diameter ({unitSystem === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                id="post-diameter"
                type="number"
                min="1"
                step="1"
                value={diameterDisplay}
                onChange={(e) => handleDiameterChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${diameterIn.toFixed(1)} in`
                  : `${(diameterIn * 2.54).toFixed(1)} cm`}
              </span>
            </div>

            <div>
              <label
                htmlFor="post-depth"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hole Depth ({unitSystem === 'metric' ? 'm' : 'ft'})
              </label>
              <input
                id="post-depth"
                type="number"
                min="0.5"
                step="0.5"
                value={depthDisplay}
                onChange={(e) => handleDepthChange(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {unitSystem === 'metric'
                  ? `${depthFt.toFixed(1)} ft`
                  : `${(depthFt * 0.3048).toFixed(2)} m`}
              </span>
            </div>

            <div>
              <label
                htmlFor="post-count"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Number of Holes
              </label>
              <input
                id="post-count"
                type="number"
                min="1"
                step="1"
                value={holeCount}
                onChange={(e) => setHoleCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Cylindrical pier formula
              </span>
            </div>
          </div>
        )}

        {/* Pricing & Bag Size Configuration */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pricing &amp; Supply Selection
            </span>
            <div
              role="group"
              aria-label="Concrete pricing supply basis"
              onKeyDown={(e) =>
                handleSegmentedKeyDown(e, COST_BASIS_OPTIONS, costBasis, setCostBasis)
              }
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg"
            >
              <button
                type="button"
                aria-pressed={costBasis === 'bags'}
                onClick={() => setCostBasis('bags')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  costBasis === 'bags'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pre-Mix Bags
              </button>
              <button
                type="button"
                aria-pressed={costBasis === 'readymix'}
                onClick={() => setCostBasis('readymix')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  costBasis === 'readymix'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bulk Ready-Mix
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="concrete-bag-size"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Primary Bag Size for Quote
              </label>
              <select
                id="concrete-bag-size"
                value={selectedBagType}
                onChange={(e) =>
                  setSelectedBagType(e.target.value as ConcreteSlabInput['selectedBagType'])
                }
                className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="80lb">80 lb Bag (0.60 ft³ yield)</option>
                <option value="60lb">60 lb Bag (0.45 ft³ yield)</option>
                <option value="30kg">30 kg Canadian Bag (0.50 ft³)</option>
                <option value="50lb">50 lb Bag (0.375 ft³ yield)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="concrete-bag-price"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Price per Bag ({sym})
              </label>
              <input
                id="concrete-bag-price"
                type="number"
                min="0"
                step="0.1"
                value={pricePerBag}
                onChange={(e) => setPricePerBag(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="concrete-readymix-price"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Bulk Ready-Mix ({sym} / yd³)
              </label>
              <input
                id="concrete-readymix-price"
                type="number"
                min="0"
                step="5"
                value={readyMixPricePerYard}
                onChange={(e) => setReadyMixPricePerYard(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Formula Transparency Footnote */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            {mode === 'slab'
              ? 'Formula: L (ft) × W (ft) × (T (in) / 12) = ft³ · ÷ 27 = yd³'
              : 'Formula: π × (Diameter (in) / 24)² × Depth (ft) × Holes = ft³'}
          </span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            Raw: {result.rawCubicFeet.toFixed(2)} ft³ · +{wastePercent}% Waste
          </span>
        </div>

        {/* Context-Specific Construction Best Practices Accordion */}
        <ProTipsAccordion trade="Concrete" />
      </section>

      {/* Right Column: Verified Results & Add to Quote */}
      <section
        aria-label="Concrete Calculation Results"
        className="lg:col-span-5 bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-medium text-amber-400">
              Verified Material Estimate ({wastePercent}% Waste Included)
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Bulk Volume &amp; Pre-Mix Bag Count
            </h3>
          </div>
        </div>

        {/* Primary Volume Readout */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Cubic Yards</span>
            <span
              data-testid="concrete-cubic-yards"
              className="text-2xl font-bold font-mono text-amber-400 mt-1 block tabular-nums"
            >
              {result.cubicYards.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              yd³ ({Math.ceil(result.cubicYards)} whole)
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Cubic Feet</span>
            <span
              data-testid="concrete-cubic-feet"
              className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums"
            >
              {result.cubicFeetWithWaste.toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ft³ ({result.cubicFeetRounded} ceil)
            </span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Cubic Meters</span>
            <span
              data-testid="concrete-cubic-meters"
              className="text-2xl font-bold font-mono text-sky-400 mt-1 block tabular-nums"
            >
              {result.cubicMeters.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">m³ metric</span>
          </div>
        </div>

        {/* Pre-Mix Bag Outputs (Rounded UP via Math.ceil) */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Pre-Mix Concrete Bags (Rounded Up)</span>
            <span className="font-mono text-slate-400">Math.ceil()</span>
          </div>

          <div
            role="group"
            aria-label="Select Pre-Mix Concrete Bag Size"
            onKeyDown={(e) =>
              handleSegmentedKeyDown(e, BAG_SIZE_OPTIONS, selectedBagType, (next) => {
                setSelectedBagType(next);
                setCostBasis('bags');
              })
            }
            className="grid grid-cols-2 gap-2.5"
          >
            <button
              type="button"
              aria-pressed={selectedBagType === '80lb' && costBasis === 'bags'}
              onClick={() => {
                setSelectedBagType('80lb');
                setCostBasis('bags');
              }}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                selectedBagType === '80lb' && costBasis === 'bags'
                  ? 'bg-amber-500/15 border-amber-400 text-white'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>80 lb Bags</span>
                <span className="font-mono text-[11px] text-slate-400">0.60 ft³</span>
              </div>
              <div
                data-testid="concrete-bags-80lb"
                className="text-xl font-bold font-mono tabular-nums mt-1 text-white"
              >
                {result.bags80lb} <span className="text-xs font-normal text-slate-300">bags</span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={selectedBagType === '60lb' && costBasis === 'bags'}
              onClick={() => {
                setSelectedBagType('60lb');
                setCostBasis('bags');
              }}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                selectedBagType === '60lb' && costBasis === 'bags'
                  ? 'bg-amber-500/15 border-amber-400 text-white'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>60 lb Bags</span>
                <span className="font-mono text-[11px] text-slate-400">0.45 ft³</span>
              </div>
              <div
                data-testid="concrete-bags-60lb"
                className="text-xl font-bold font-mono tabular-nums mt-1 text-white"
              >
                {result.bags60lb} <span className="text-xs font-normal text-slate-300">bags</span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={selectedBagType === '30kg' && costBasis === 'bags'}
              onClick={() => {
                setSelectedBagType('30kg');
                setCostBasis('bags');
              }}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                selectedBagType === '30kg' && costBasis === 'bags'
                  ? 'bg-amber-500/15 border-amber-400 text-white'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>30 kg Canadian</span>
                <span className="font-mono text-[11px] text-slate-400">0.50 ft³</span>
              </div>
              <div
                data-testid="concrete-bags-30kg"
                className="text-xl font-bold font-mono tabular-nums mt-1 text-white"
              >
                {result.bags30kg} <span className="text-xs font-normal text-slate-300">bags</span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={selectedBagType === '50lb' && costBasis === 'bags'}
              onClick={() => {
                setSelectedBagType('50lb');
                setCostBasis('bags');
              }}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                selectedBagType === '50lb' && costBasis === 'bags'
                  ? 'bg-amber-500/15 border-amber-400 text-white'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>50 lb Bags</span>
                <span className="font-mono text-[11px] text-slate-400">0.375 ft³</span>
              </div>
              <div
                data-testid="concrete-bags-50lb"
                className="text-xl font-bold font-mono tabular-nums mt-1 text-white"
              >
                {result.bags50lb} <span className="text-xs font-normal text-slate-300">bags</span>
              </div>
            </button>
          </div>
        </div>

        {/* Cost Summary Box */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              Pre-Mix Bag Cost ({result.selectedBagCount} × {selectedBagType} @{' '}
              {formatCurrency(pricePerBag, currency)})
            </span>
            <span className="font-mono font-semibold text-white">
              {formatCurrency(result.estimatedBagCost, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              Bulk Ready-Mix Cost ({result.cubicYards.toFixed(2)} yd³ @{' '}
              {formatCurrency(readyMixPricePerYard, currency)}/yd³)
            </span>
            <span className="font-mono font-semibold text-white">
              {formatCurrency(result.estimatedReadyMixCost, currency)}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <span className="text-sm font-semibold text-slate-200">
              Selected Material Estimate
            </span>
            <span
              data-testid="concrete-estimated-cost"
              className="text-2xl font-bold font-mono text-amber-400 tabular-nums"
            >
              {formatCurrency(activeCost, currency)}
            </span>
          </div>
        </div>

        {/* Add to Project Quote CTA */}
        <button
          type="button"
          onClick={handleAdd}
          className="mt-5 w-full min-h-[48px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          {addedFlash ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              Added Concrete to Project Quote!
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
