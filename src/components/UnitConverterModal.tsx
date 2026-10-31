import React, { useState } from 'react';
import { X, ArrowLeftRight, Ruler,Maximize2, Box } from 'lucide-react';
import {
  LengthUnit,
  AreaUnit,
  VolumeUnit,
  convertLength,
  convertArea,
  convertVolume,
} from '../utils/calculators';
import { useModalKeyboard } from '../utils/useModalKeyboard';

interface UnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitConverterModal: React.FC<UnitConverterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [lengthValue, setLengthValue] = useState<number>(12);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('ft');

  const [areaValue, setAreaValue] = useState<number>(200);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('sqft');

  const [volumeValue, setVolumeValue] = useState<number>(2);
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('cuyd');
  const modalRef = useModalKeyboard(isOpen, onClose);

  if (!isOpen) return null;

  const lengthResult = convertLength(lengthValue, lengthUnit);
  const areaResult = convertArea(areaValue, areaUnit);
  const volumeResult = convertVolume(volumeValue, volumeUnit);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-converter-modal-title"
      data-testid="unit-converter-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 no-print overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl relative my-auto space-y-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Unit Converter"
          data-testid="close-unit-converter-btn"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="unit-converter-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Standalone Job Site Unit Converter
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Instant Imperial &amp; Metric conversions for Length, Area, and Volume
            </p>
          </div>
        </div>

        {/* 1. Length Converter (Feet, Inches, Yards, Meters, Centimeters) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Ruler className="w-4 h-4" />
            <span>Length (Feet, Inches, Yards, Meters, Centimeters)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="converter-length-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Length Value
              </label>
              <input
                id="converter-length-input"
                data-testid="converter-length-input"
                data-autofocus="true"
                type="number"
                min="0"
                step="0.5"
                value={lengthValue}
                onChange={(e) => setLengthValue(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="converter-length-unit"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                From Unit
              </label>
              <select
                id="converter-length-unit"
                data-testid="converter-length-unit"
                value={lengthUnit}
                onChange={(e) => setLengthUnit(e.target.value as LengthUnit)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ft">Feet (ft)</option>
                <option value="in">Inches (in)</option>
                <option value="yd">Yards (yd)</option>
                <option value="m">Meters (m)</option>
                <option value="cm">Centimeters (cm)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Feet</div>
              <div
                data-testid="converted-length-ft"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {lengthResult.feet} ft
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Inches</div>
              <div
                data-testid="converted-length-in"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {lengthResult.inches} in
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Yards</div>
              <div
                data-testid="converted-length-yd"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {lengthResult.yards} yd
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Meters</div>
              <div
                data-testid="converted-length-m"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {lengthResult.meters} m
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Centimeters</div>
              <div
                data-testid="converted-length-cm"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {lengthResult.centimeters} cm
              </div>
            </div>
          </div>
        </div>

        {/* 2. Area Converter (Square Feet, Square Meters, Square Yards) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Maximize2 className="w-4 h-4" />
            <span>Area (Square Feet, Square Meters &amp; Square Yards)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="converter-area-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Area Value
              </label>
              <input
                id="converter-area-input"
                data-testid="converter-area-input"
                type="number"
                min="0"
                step="5"
                value={areaValue}
                onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="converter-area-unit"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                From Unit
              </label>
              <select
                id="converter-area-unit"
                data-testid="converter-area-unit"
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="sqft">Square Feet (sq ft)</option>
                <option value="sqm">Square Meters (m²)</option>
                <option value="sqyd">Square Yards (sq yd)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Square Feet</div>
              <div
                data-testid="converted-area-sqft"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {areaResult.squareFeet} sq ft
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Square Meters</div>
              <div
                data-testid="converted-area-sqm"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {areaResult.squareMeters} m²
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Square Yards</div>
              <div
                data-testid="converted-area-sqyd"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {areaResult.squareYards} sq yd
              </div>
            </div>
          </div>
        </div>

        {/* 3. Volume Converter (Cubic Yards, Cubic Feet, Cubic Meters) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Box className="w-4 h-4" />
            <span>Volume (Cubic Yards, Cubic Feet &amp; Cubic Meters)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="converter-volume-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Volume Value
              </label>
              <input
                id="converter-volume-input"
                data-testid="converter-volume-input"
                type="number"
                min="0"
                step="0.5"
                value={volumeValue}
                onChange={(e) => setVolumeValue(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="converter-volume-unit"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                From Unit
              </label>
              <select
                id="converter-volume-unit"
                data-testid="converter-volume-unit"
                value={volumeUnit}
                onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                className="w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cuyd">Cubic Yards (yd³)</option>
                <option value="cuft">Cubic Feet (ft³)</option>
                <option value="cum">Cubic Meters (m³)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Cubic Yards</div>
              <div
                data-testid="converted-volume-cuyd"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {volumeResult.cubicYards} yd³
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Cubic Feet</div>
              <div
                data-testid="converted-volume-cuft"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {volumeResult.cubicFeet} ft³
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Cubic Meters</div>
              <div
                data-testid="converted-volume-cum"
                className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5"
              >
                {volumeResult.cubicMeters} m³
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
