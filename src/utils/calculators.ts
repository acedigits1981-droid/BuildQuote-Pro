export type UnitSystem = 'imperial' | 'metric';
export type WasteFactor = 0 | 10 | 15;
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'CAD', label: 'CAD $', symbol: 'CA$' },
  { code: 'USD', label: 'USD $', symbol: '$' },
  { code: 'EUR', label: 'EUR €', symbol: '€' },
  { code: 'GBP', label: 'GBP £', symbol: '£' },
];

export function getCurrencySymbol(currency: CurrencyCode): string {
  const found = CURRENCY_OPTIONS.find((c) => c.code === currency);
  return found ? found.symbol : '$';
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const sym = getCurrencySymbol(currency);
  const val = Number.isFinite(amount) ? amount : 0;
  return `${sym}${val.toFixed(2)}`;
}

export interface ConcreteSlabInput {
  mode: 'slab' | 'post';
  // Slab inputs (canonical in ft / in)
  lengthFt: number;
  widthFt: number;
  thicknessIn: number;
  // Post hole inputs (canonical in in / ft)
  diameterIn: number;
  depthFt: number;
  holeCount: number;
  // Shared
  wastePercent: WasteFactor;
  selectedBagType: '80lb' | '60lb' | '30kg' | '50lb';
  pricePerBag: number;
  readyMixPricePerYard: number;
}

export interface ConcreteResult {
  rawCubicFeet: number;
  cubicFeetWithWaste: number;
  cubicFeetRounded: number;
  cubicYards: number;
  cubicYardsRounded: number;
  cubicMeters: number;
  bags80lb: number;
  bags60lb: number;
  bags30kg: number;
  bags50lb: number;
  selectedBagCount: number;
  estimatedBagCost: number;
  estimatedReadyMixCost: number;
}

function ceilClean(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(Number(value.toFixed(6)));
}

export function calculateConcrete(input: ConcreteSlabInput): ConcreteResult {
  const length = Math.max(0, Number(input.lengthFt) || 0);
  const width = Math.max(0, Number(input.widthFt) || 0);
  const thickness = Math.max(0, Number(input.thicknessIn) || 0);
  const diameter = Math.max(0, Number(input.diameterIn) || 0);
  const depth = Math.max(0, Number(input.depthFt) || 0);
  const holes = Math.max(0, Math.floor(Number(input.holeCount) || 0));
  const wasteMultiplier = (100 + (Number(input.wastePercent) || 0)) / 100;

  let rawCubicFeet = 0;
  if (input.mode === 'slab') {
    // Mode 1 (Slab/Footing): Length (ft) * Width (ft) * (Thickness (in) / 12) = Cubic Feet
    rawCubicFeet = length * width * (thickness / 12);
  } else {
    // Mode 2 (Round Post Holes): PI * ((Diameter (in) / 24)^2) * Depth (ft) * Number of Holes = Cubic Feet
    rawCubicFeet = Math.PI * Math.pow(diameter / 24, 2) * depth * holes;
  }

  const cubicFeetWithWaste = Number((rawCubicFeet * wasteMultiplier).toFixed(6));
  const cubicFeetRounded = ceilClean(cubicFeetWithWaste);
  const cubicYards = cubicFeetWithWaste / 27;
  const cubicYardsRounded = ceilClean(cubicYards * 100) / 100;
  const cubicMeters = cubicFeetWithWaste * 0.0283168;

  // Pre-Mix Bag Outputs (round up using Math.ceil)
  const bags80lb = ceilClean(cubicFeetWithWaste / 0.60);
  const bags60lb = ceilClean(cubicFeetWithWaste / 0.45);
  const bags30kg = ceilClean(cubicFeetWithWaste / 0.50);
  const bags50lb = ceilClean(cubicFeetWithWaste / 0.375);

  const bagMap: Record<ConcreteSlabInput['selectedBagType'], number> = {
    '80lb': bags80lb,
    '60lb': bags60lb,
    '30kg': bags30kg,
    '50lb': bags50lb,
  };

  const selectedBagCount = bagMap[input.selectedBagType] ?? bags80lb;
  const pricePerBag = Math.max(0, Number(input.pricePerBag) || 0);
  const readyMixPricePerYard = Math.max(0, Number(input.readyMixPricePerYard) || 0);

  const estimatedBagCost = Number((selectedBagCount * pricePerBag).toFixed(2));
  const estimatedReadyMixCost = Number((cubicYards * readyMixPricePerYard).toFixed(2));

  return {
    rawCubicFeet,
    cubicFeetWithWaste,
    cubicFeetRounded,
    cubicYards,
    cubicYardsRounded,
    cubicMeters,
    bags80lb,
    bags60lb,
    bags30kg,
    bags50lb,
    selectedBagCount,
    estimatedBagCost,
    estimatedReadyMixCost,
  };
}

export interface DrywallInput {
  inputMode: 'area' | 'room';
  directAreaSqFt: number;
  roomLengthFt: number;
  roomWidthFt: number;
  roomHeightFt: number;
  includeCeiling: boolean;
  doorCount: number;
  windowCount: number;
  sheetSize: 32 | 48; // 4x8 = 32 sq ft or 4x12 = 48 sq ft
  wastePercent: WasteFactor;
  pricePerSheet: number;
  pricePerBucketMud: number;
  pricePerTapeRoll: number;
  pricePerScrewBox: number;
}

export interface DrywallResult {
  rawAreaSqFt: number;
  deductedSqFt: number;
  netAreaSqFt: number;
  grossSqFt: number;
  totalSheets: number;
  compoundGallonsExact: number;
  compoundGallons: number;
  compoundLiters: number;
  compoundBuckets45Gal: number;
  tapeFeet: number;
  tapeRolls: number;
  drywallScrews: number;
  screwBoxes1lb: number;
  estimatedMaterialCost: number;
}

export function calculateDrywall(input: DrywallInput): DrywallResult {
  let rawAreaSqFt = 0;
  if (input.inputMode === 'room') {
    const l = Math.max(0, Number(input.roomLengthFt) || 0);
    const w = Math.max(0, Number(input.roomWidthFt) || 0);
    const h = Math.max(0, Number(input.roomHeightFt) || 0);
    const walls = 2 * (l + w) * h;
    const ceiling = input.includeCeiling ? l * w : 0;
    rawAreaSqFt = walls + ceiling;
  } else {
    rawAreaSqFt = Math.max(0, Number(input.directAreaSqFt) || 0);
  }

  const doors = Math.max(0, Math.floor(Number(input.doorCount) || 0));
  const windows = Math.max(0, Math.floor(Number(input.windowCount) || 0));
  // Door count (deduct 21 sq ft each), Window count (deduct 15 sq ft each)
  const deductedSqFt = doors * 21 + windows * 15;
  const netAreaSqFt = Math.max(0, rawAreaSqFt - deductedSqFt);

  const wasteMultiplier = (100 + (Number(input.wastePercent) || 0)) / 100;
  const grossSqFt = Number((netAreaSqFt * wasteMultiplier).toFixed(6));

  const sheetSize = input.sheetSize === 48 ? 48 : 32;
  const totalSheets = ceilClean(grossSqFt / sheetSize);

  // Ready-Mix Joint Compound Gallons: standard contractor coverage (~0.014 gal per sq ft, ~18 sq ft per liter)
  const compoundGallonsExact = grossSqFt * 0.014;
  const compoundGallons = ceilClean(compoundGallonsExact);
  const compoundLiters = ceilClean(compoundGallonsExact * 3.78541);
  const compoundBuckets45Gal = ceilClean(compoundGallonsExact / 4.5);

  // Paper/Mesh Tape Rolls (Gross SqFt * 0.37 / 250)
  const tapeFeet = ceilClean(grossSqFt * 0.37);
  const tapeRolls = ceilClean((grossSqFt * 0.37) / 250);

  // Drywall Screws (1 screw per SqFt, plus 1lb boxes at 300 screws/box)
  const drywallScrews = ceilClean(grossSqFt * 1);
  const screwBoxes1lb = ceilClean(drywallScrews / 300);

  const sheetCost = totalSheets * Math.max(0, Number(input.pricePerSheet) || 0);
  const mudCost = compoundBuckets45Gal * Math.max(0, Number(input.pricePerBucketMud) || 0);
  const tapeCost = tapeRolls * Math.max(0, Number(input.pricePerTapeRoll) || 0);
  const screwCost = screwBoxes1lb * Math.max(0, Number(input.pricePerScrewBox) || 0);

  const estimatedMaterialCost = Number((sheetCost + mudCost + tapeCost + screwCost).toFixed(2));

  return {
    rawAreaSqFt,
    deductedSqFt,
    netAreaSqFt,
    grossSqFt,
    totalSheets,
    compoundGallonsExact,
    compoundGallons,
    compoundLiters,
    compoundBuckets45Gal,
    tapeFeet,
    tapeRolls,
    drywallScrews,
    screwBoxes1lb,
    estimatedMaterialCost,
  };
}

export interface TileInput {
  areaSqFt: number;
  tileWidthIn: number;
  tileLengthIn: number;
  tileCategory: 'small' | 'large'; // Small under 12x12 vs Large 12x12+
  tilesPerBox: number;
  pricingBasis: 'sqft' | 'box';
  unitPrice: number;
  thinsetPricePerBag: number;
  groutPricePerBag: number;
  wastePercent: WasteFactor;
}

export interface TileResult {
  grossSqFtExact: number;
  totalSqFtWithWaste: number;
  totalSqMetersWithWaste: number;
  tileAreaSqFt: number;
  individualTiles: number;
  totalBoxes: number;
  thinsetBags50lb: number;
  groutBags25lb: number;
  tileCost: number;
  settingMaterialsCost: number;
  estimatedMaterialCost: number;
}

export function calculateTile(input: TileInput): TileResult {
  const area = Math.max(0, Number(input.areaSqFt) || 0);
  const widthIn = Math.max(0.5, Number(input.tileWidthIn) || 12);
  const lengthIn = Math.max(0.5, Number(input.tileLengthIn) || 12);
  const tilesPerBox = Math.max(1, Math.floor(Number(input.tilesPerBox) || 1));
  const wasteMultiplier = (100 + (Number(input.wastePercent) || 0)) / 100;

  const grossSqFtExact = Number((area * wasteMultiplier).toFixed(6));
  const totalSqFtWithWaste = ceilClean(grossSqFtExact);
  const totalSqMetersWithWaste = Number((grossSqFtExact * 0.092903).toFixed(2));

  const tileAreaSqFt = (widthIn * lengthIn) / 144;
  const individualTiles = ceilClean(grossSqFtExact / tileAreaSqFt);
  const totalBoxes = ceilClean(individualTiles / tilesPerBox);

  // 50lb Thinset Mortar Bags (Gross SqFt / 60 for large tile or Gross SqFt / 90 for small tile)
  const thinsetDivisor = input.tileCategory === 'large' ? 60 : 90;
  const thinsetBags50lb = ceilClean(grossSqFtExact / thinsetDivisor);

  // 25lb Grout Bags (Gross SqFt / 100)
  const groutBags25lb = ceilClean(grossSqFtExact / 100);

  const unitPrice = Math.max(0, Number(input.unitPrice) || 0);
  const tileCost =
    input.pricingBasis === 'box'
      ? totalBoxes * unitPrice
      : totalSqFtWithWaste * unitPrice;

  const settingMaterialsCost =
    thinsetBags50lb * Math.max(0, Number(input.thinsetPricePerBag) || 0) +
    groutBags25lb * Math.max(0, Number(input.groutPricePerBag) || 0);

  const estimatedMaterialCost = Number((tileCost + settingMaterialsCost).toFixed(2));

  return {
    grossSqFtExact,
    totalSqFtWithWaste,
    totalSqMetersWithWaste,
    tileAreaSqFt,
    individualTiles,
    totalBoxes,
    thinsetBags50lb,
    groutBags25lb,
    tileCost: Number(tileCost.toFixed(2)),
    settingMaterialsCost: Number(settingMaterialsCost.toFixed(2)),
    estimatedMaterialCost,
  };
}

export interface PaintInput {
  wallAreaSqFt: number;
  doorCount: number;
  windowCount: number;
  paintCoats: number;
  primerCoats: number;
  pricePerGallonPaint: number;
  pricePerGallonPrimer: number;
  wastePercent: WasteFactor;
}

export interface PaintResult {
  deductedSqFt: number;
  netAreaBeforeWaste: number;
  netAreaSqFt: number;
  paintGallonsExact: number;
  paintGallons: number;
  paintLiters: number;
  primerGallonsExact: number;
  primerGallons: number;
  primerLiters: number;
  estimatedMaterialCost: number;
}

export function calculatePaint(input: PaintInput): PaintResult {
  const wallArea = Math.max(0, Number(input.wallAreaSqFt) || 0);
  const doors = Math.max(0, Math.floor(Number(input.doorCount) || 0));
  const windows = Math.max(0, Math.floor(Number(input.windowCount) || 0));
  const paintCoats = Math.max(0, Math.floor(Number(input.paintCoats) || 0));
  const primerCoats = Math.max(0, Math.floor(Number(input.primerCoats) || 0));
  const wasteMultiplier = (100 + (Number(input.wastePercent) || 0)) / 100;

  const deductedSqFt = doors * 21 + windows * 15;
  const netAreaBeforeWaste = Math.max(0, wallArea - deductedSqFt);
  const netAreaSqFt = Number((netAreaBeforeWaste * wasteMultiplier).toFixed(6));

  // Finish Paint Gallons & Liters (Net Area * Paint Coats / 350 sq ft per gal)
  const paintGallonsExact = (netAreaSqFt * paintCoats) / 350;
  const paintGallons = ceilClean(paintGallonsExact);
  const paintLiters = ceilClean(paintGallonsExact * 3.78541);

  // Primer Gallons & Liters (Net Area * Primer Coats / 300 sq ft per gal)
  const primerGallonsExact = (netAreaSqFt * primerCoats) / 300;
  const primerGallons = ceilClean(primerGallonsExact);
  const primerLiters = ceilClean(primerGallonsExact * 3.78541);

  const paintCost = paintGallons * Math.max(0, Number(input.pricePerGallonPaint) || 0);
  const primerCost = primerGallons * Math.max(0, Number(input.pricePerGallonPrimer) || 0);
  const estimatedMaterialCost = Number((paintCost + primerCost).toFixed(2));

  return {
    deductedSqFt,
    netAreaBeforeWaste,
    netAreaSqFt,
    paintGallonsExact,
    paintGallons,
    paintLiters,
    primerGallonsExact,
    primerGallons,
    primerLiters,
    estimatedMaterialCost,
  };
}

export interface JobSitePhoto {
  id: string;
  dataUrl: string;
  baseDataUrl?: string;
  caption: string;
  timestamp: string;
  sizeKb: number;
}

export function estimateDataUrlSizeKb(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64Index = dataUrl.indexOf(',');
  const base64Length = base64Index >= 0 ? dataUrl.length - (base64Index + 1) : dataUrl.length;
  const bytes = (base64Length * 3) / 4;
  return Math.max(1, Math.round(bytes / 1024));
}

export interface QuoteCartItem {
  id: string;
  trade: 'Concrete' | 'Drywall' | 'Tile' | 'Paint' | 'Custom';
  title: string;
  summary: string;
  details: string[];
  materialCost: number;
}

export interface CustomQuoteItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  unitLabel?: string;
  currency?: CurrencyCode;
}

export function createCustomQuoteItem(input: CustomQuoteItemInput): Omit<QuoteCartItem, 'id'> {
  const cleanName = (input.name || '').trim() || 'Custom Material / Labor Item';
  const qty = Math.max(0.01, Number(input.quantity) || 1);
  const price = Math.max(0, Number(input.unitPrice) || 0);
  const unitLabel = (input.unitLabel || 'units').trim() || 'units';
  const currency = input.currency || 'USD';
  const totalCost = Number((qty * price).toFixed(2));

  return {
    trade: 'Custom',
    title: cleanName,
    summary: `${qty} ${unitLabel} × ${formatCurrency(price, currency)}/${unitLabel.replace(/s$/, '') || 'unit'}`,
    details: [
      `Custom Add-On: ${qty} ${unitLabel} @ ${formatCurrency(price, currency)} each = ${formatCurrency(totalCost, currency)}`,
    ],
    materialCost: totalCost,
  };
}

export type LengthUnit = 'ft' | 'in' | 'yd' | 'm' | 'cm';
export type AreaUnit = 'sqft' | 'sqm' | 'sqyd';
export type VolumeUnit = 'cuft' | 'cuyd' | 'cum';

export interface LengthConversionResult {
  feet: number;
  inches: number;
  yards: number;
  meters: number;
  centimeters: number;
}

export interface AreaConversionResult {
  squareFeet: number;
  squareMeters: number;
  squareYards: number;
}

export interface VolumeConversionResult {
  cubicFeet: number;
  cubicYards: number;
  cubicMeters: number;
}

export function convertLength(value: number, from: LengthUnit): LengthConversionResult {
  const val = Math.max(0, Number(value) || 0);
  let meters = 0;
  switch (from) {
    case 'ft':
      meters = val * 0.3048;
      break;
    case 'in':
      meters = val * 0.0254;
      break;
    case 'yd':
      meters = val * 0.9144;
      break;
    case 'm':
      meters = val;
      break;
    case 'cm':
      meters = val / 100;
      break;
  }

  const feet = meters / 0.3048;
  const inches = meters / 0.0254;
  const yards = meters / 0.9144;
  const centimeters = meters * 100;

  return {
    feet: Number(feet.toFixed(4)),
    inches: Number(inches.toFixed(4)),
    yards: Number(yards.toFixed(4)),
    meters: Number(meters.toFixed(4)),
    centimeters: Number(centimeters.toFixed(2)),
  };
}

export function convertArea(value: number, from: AreaUnit): AreaConversionResult {
  const val = Math.max(0, Number(value) || 0);
  let sqFeet = 0;
  switch (from) {
    case 'sqft':
      sqFeet = val;
      break;
    case 'sqm':
      sqFeet = val / 0.09290304;
      break;
    case 'sqyd':
      sqFeet = val * 9;
      break;
  }

  return {
    squareFeet: Number(sqFeet.toFixed(3)),
    squareMeters: Number((sqFeet * 0.09290304).toFixed(3)),
    squareYards: Number((sqFeet / 9).toFixed(3)),
  };
}

export function convertVolume(value: number, from: VolumeUnit): VolumeConversionResult {
  const val = Math.max(0, Number(value) || 0);
  let cuFeet = 0;
  switch (from) {
    case 'cuft':
      cuFeet = val;
      break;
    case 'cuyd':
      cuFeet = val * 27;
      break;
    case 'cum':
      cuFeet = val / 0.0283168466;
      break;
  }

  return {
    cubicFeet: Number(cuFeet.toFixed(3)),
    cubicYards: Number((cuFeet / 27).toFixed(3)),
    cubicMeters: Number((cuFeet * 0.0283168466).toFixed(3)),
  };
}

export interface QuoteFinancialsInput {
  items: QuoteCartItem[];
  customLaborCost: number;
  materialMarkupPercent: number;
  taxRatePercent: number;
}

export interface QuoteFinancialsResult {
  rawMaterialsSubtotal: number;
  markupAmount: number;
  materialsWithMarkup: number;
  laborCost: number;
  preTaxSubtotal: number;
  taxAmount: number;
  grandTotal: number;
}

export function calculateQuoteFinancials(input: QuoteFinancialsInput): QuoteFinancialsResult {
  const rawMaterialsSubtotal = Number(
    input.items.reduce((sum, item) => sum + (Number(item.materialCost) || 0), 0).toFixed(2)
  );
  const markupPct = Math.max(0, Number(input.materialMarkupPercent) || 0);
  const markupAmount = Number(((rawMaterialsSubtotal * markupPct) / 100).toFixed(2));
  const materialsWithMarkup = Number((rawMaterialsSubtotal + markupAmount).toFixed(2));
  const laborCost = Number(Math.max(0, Number(input.customLaborCost) || 0).toFixed(2));
  const preTaxSubtotal = Number((materialsWithMarkup + laborCost).toFixed(2));
  const taxPct = Math.max(0, Number(input.taxRatePercent) || 0);
  const taxAmount = Number(((materialsWithMarkup * taxPct) / 100).toFixed(2));
  const grandTotal = Number((preTaxSubtotal + taxAmount).toFixed(2));

  return {
    rawMaterialsSubtotal,
    markupAmount,
    materialsWithMarkup,
    laborCost,
    preTaxSubtotal,
    taxAmount,
    grandTotal,
  };
}

export interface QuoteSummaryTextInput {
  quoteNumber: string;
  quoteDate: string;
  clientName: string;
  projectAddress: string;
  companyName: string;
  companyPhone: string;
  isPro: boolean;
  items: QuoteCartItem[];
  financials: QuoteFinancialsResult;
  materialMarkupPercent: number;
  taxRatePercent: number;
  projectNotes: string;
  currency: CurrencyCode;
}

export function formatQuoteTextSummary(input: QuoteSummaryTextInput): string {
  const lines: string[] = [];
  const headerBrand = input.isPro
    ? `${input.companyName || 'Contractor Estimate'} (${input.companyPhone || ''})`.trim()
    : 'BuildQuote Estimate (Free Trial Mode)';

  lines.push(`=== PROJECT ESTIMATE #${input.quoteNumber || 'BQ-101'} ===`);
  lines.push(`From: ${headerBrand}`);
  lines.push(`Date: ${input.quoteDate}`);
  lines.push(`Client: ${input.clientName || 'Valued Client'}`);
  lines.push(`Job Site: ${input.projectAddress || 'On-Site Project'}`);
  lines.push('');
  lines.push('--- MATERIAL & TRADE BREAKDOWN ---');

  if (input.items.length === 0) {
    lines.push('No material line items listed.');
  } else {
    input.items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. [${item.trade}] ${item.title}: ${formatCurrency(item.materialCost, input.currency)}`
      );
      lines.push(`   ${item.summary}`);
    });
  }

  lines.push('');
  lines.push('--- ESTIMATE TOTALS ---');
  lines.push(
    `Materials Subtotal: ${formatCurrency(input.financials.rawMaterialsSubtotal, input.currency)}`
  );
  lines.push(
    `Material Markup (${input.materialMarkupPercent}%): +${formatCurrency(input.financials.markupAmount, input.currency)}`
  );
  lines.push(`Labor Cost: ${formatCurrency(input.financials.laborCost, input.currency)}`);
  lines.push(
    `Estimated Tax (${input.taxRatePercent}%): ${formatCurrency(input.financials.taxAmount, input.currency)}`
  );
  lines.push(`TOTAL ESTIMATE: ${formatCurrency(input.financials.grandTotal, input.currency)}`);

  if (input.projectNotes && input.projectNotes.trim()) {
    lines.push('');
    lines.push('--- PROJECT SCOPE & NOTES ---');
    lines.push(input.projectNotes.trim());
  }

  return lines.join('\n');
}

export function isValidProCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return normalized === 'BUILDPRO26' || normalized === 'PRO2026';
}

export function checkUrlForProUnlock(search: string, hash: string): boolean {
  const s = (search || '').toLowerCase();
  const h = (hash || '').toLowerCase();
  return s.includes('pro=unlocked') || h.includes('#pro-unlocked') || h.includes('pro=unlocked');
}

export interface MaterialPricingDefaults {
  concreteBagPrice: number;
  concreteReadyMixPerYard: number;
  drywallSheetPrice: number;
  drywallMudBucketPrice: number;
  drywallTapeRollPrice: number;
  drywallScrewBoxPrice: number;
  tilePricePerSqFt: number;
  tileThinsetBagPrice: number;
  tileGroutBagPrice: number;
  paintGallonPrice: number;
  primerGallonPrice: number;
}

export const DEFAULT_MATERIAL_PRICES: MaterialPricingDefaults = {
  concreteBagPrice: 6.48,
  concreteReadyMixPerYard: 165,
  drywallSheetPrice: 16.5,
  drywallMudBucketPrice: 21.0,
  drywallTapeRollPrice: 7.5,
  drywallScrewBoxPrice: 8.95,
  tilePricePerSqFt: 4.25,
  tileThinsetBagPrice: 24.0,
  tileGroutBagPrice: 19.5,
  paintGallonPrice: 46.0,
  primerGallonPrice: 32.0,
};

export interface QuoteMetadata {
  clientName: string;
  projectAddress: string;
  quoteNumber: string;
  quoteDate: string;
  customLaborCost: number;
  materialMarkupPercent: number;
  taxRatePercent: number;
  companyName: string;
  companyPhone: string;
  companyLogoText: string;
  projectNotes: string;
}

export const DEFAULT_QUOTE_METADATA: QuoteMetadata = {
  clientName: 'Marcus Vance',
  projectAddress: '742 Evergreen Terrace, Suite B',
  quoteNumber: 'BQ-2026-104',
  quoteDate: '2026-10-29',
  customLaborCost: 850,
  materialMarkupPercent: 15,
  taxRatePercent: 8.25,
  companyName: 'Apex Builders & Remodeling LLC',
  companyPhone: '(555) 234-8910',
  companyLogoText: 'APEX LICENSED #994120',
  projectNotes:
    'Estimate valid for 30 days. Material quantities include standard trade waste factor. 50% deposit due upon scheduling.',
};

export interface BuildQuoteBackupPayload {
  app: 'BuildQuote Pro';
  version: '1.0';
  exportedAt: string;
  currency: CurrencyCode;
  unitSystem: UnitSystem;
  wastePercent: WasteFactor;
  materialPrices: MaterialPricingDefaults;
  quoteMetadata: QuoteMetadata;
  quoteItems: QuoteCartItem[];
  sitePhotos: JobSitePhoto[];
}

export function serializeBackupJson(payload: BuildQuoteBackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function parseAndValidateBackupJson(rawJson: string): BuildQuoteBackupPayload | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return null;

    const currency: CurrencyCode = ['CAD', 'USD', 'EUR', 'GBP'].includes(parsed.currency)
      ? parsed.currency
      : 'USD';
    const unitSystem: UnitSystem = parsed.unitSystem === 'metric' ? 'metric' : 'imperial';
    const wastePercent: WasteFactor = [0, 10, 15].includes(Number(parsed.wastePercent))
      ? (Number(parsed.wastePercent) as WasteFactor)
      : 10;

    const mp = parsed.materialPrices || {};
    const materialPrices: MaterialPricingDefaults = {
      concreteBagPrice:
        typeof mp.concreteBagPrice === 'number' && mp.concreteBagPrice >= 0
          ? mp.concreteBagPrice
          : DEFAULT_MATERIAL_PRICES.concreteBagPrice,
      concreteReadyMixPerYard:
        typeof mp.concreteReadyMixPerYard === 'number' && mp.concreteReadyMixPerYard >= 0
          ? mp.concreteReadyMixPerYard
          : DEFAULT_MATERIAL_PRICES.concreteReadyMixPerYard,
      drywallSheetPrice:
        typeof mp.drywallSheetPrice === 'number' && mp.drywallSheetPrice >= 0
          ? mp.drywallSheetPrice
          : DEFAULT_MATERIAL_PRICES.drywallSheetPrice,
      drywallMudBucketPrice:
        typeof mp.drywallMudBucketPrice === 'number' && mp.drywallMudBucketPrice >= 0
          ? mp.drywallMudBucketPrice
          : DEFAULT_MATERIAL_PRICES.drywallMudBucketPrice,
      drywallTapeRollPrice:
        typeof mp.drywallTapeRollPrice === 'number' && mp.drywallTapeRollPrice >= 0
          ? mp.drywallTapeRollPrice
          : DEFAULT_MATERIAL_PRICES.drywallTapeRollPrice,
      drywallScrewBoxPrice:
        typeof mp.drywallScrewBoxPrice === 'number' && mp.drywallScrewBoxPrice >= 0
          ? mp.drywallScrewBoxPrice
          : DEFAULT_MATERIAL_PRICES.drywallScrewBoxPrice,
      tilePricePerSqFt:
        typeof mp.tilePricePerSqFt === 'number' && mp.tilePricePerSqFt >= 0
          ? mp.tilePricePerSqFt
          : DEFAULT_MATERIAL_PRICES.tilePricePerSqFt,
      tileThinsetBagPrice:
        typeof mp.tileThinsetBagPrice === 'number' && mp.tileThinsetBagPrice >= 0
          ? mp.tileThinsetBagPrice
          : DEFAULT_MATERIAL_PRICES.tileThinsetBagPrice,
      tileGroutBagPrice:
        typeof mp.tileGroutBagPrice === 'number' && mp.tileGroutBagPrice >= 0
          ? mp.tileGroutBagPrice
          : DEFAULT_MATERIAL_PRICES.tileGroutBagPrice,
      paintGallonPrice:
        typeof mp.paintGallonPrice === 'number' && mp.paintGallonPrice >= 0
          ? mp.paintGallonPrice
          : DEFAULT_MATERIAL_PRICES.paintGallonPrice,
      primerGallonPrice:
        typeof mp.primerGallonPrice === 'number' && mp.primerGallonPrice >= 0
          ? mp.primerGallonPrice
          : DEFAULT_MATERIAL_PRICES.primerGallonPrice,
    };

    const qm = parsed.quoteMetadata || {};
    const quoteMetadata: QuoteMetadata = {
      clientName:
        typeof qm.clientName === 'string' ? qm.clientName : DEFAULT_QUOTE_METADATA.clientName,
      projectAddress:
        typeof qm.projectAddress === 'string'
          ? qm.projectAddress
          : DEFAULT_QUOTE_METADATA.projectAddress,
      quoteNumber:
        typeof qm.quoteNumber === 'string' ? qm.quoteNumber : DEFAULT_QUOTE_METADATA.quoteNumber,
      quoteDate:
        typeof qm.quoteDate === 'string' ? qm.quoteDate : DEFAULT_QUOTE_METADATA.quoteDate,
      customLaborCost:
        typeof qm.customLaborCost === 'number' && qm.customLaborCost >= 0
          ? qm.customLaborCost
          : DEFAULT_QUOTE_METADATA.customLaborCost,
      materialMarkupPercent:
        typeof qm.materialMarkupPercent === 'number' && qm.materialMarkupPercent >= 0
          ? qm.materialMarkupPercent
          : DEFAULT_QUOTE_METADATA.materialMarkupPercent,
      taxRatePercent:
        typeof qm.taxRatePercent === 'number' && qm.taxRatePercent >= 0
          ? qm.taxRatePercent
          : DEFAULT_QUOTE_METADATA.taxRatePercent,
      companyName:
        typeof qm.companyName === 'string' ? qm.companyName : DEFAULT_QUOTE_METADATA.companyName,
      companyPhone:
        typeof qm.companyPhone === 'string' ? qm.companyPhone : DEFAULT_QUOTE_METADATA.companyPhone,
      companyLogoText:
        typeof qm.companyLogoText === 'string'
          ? qm.companyLogoText
          : DEFAULT_QUOTE_METADATA.companyLogoText,
      projectNotes:
        typeof qm.projectNotes === 'string' ? qm.projectNotes : DEFAULT_QUOTE_METADATA.projectNotes,
    };

    const quoteItems: QuoteCartItem[] = Array.isArray(parsed.quoteItems)
      ? parsed.quoteItems.filter(
          (item: unknown): item is QuoteCartItem =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as QuoteCartItem).title === 'string' &&
            typeof (item as QuoteCartItem).materialCost === 'number'
        )
      : [];

    const sitePhotos: JobSitePhoto[] = Array.isArray(parsed.sitePhotos)
      ? parsed.sitePhotos.filter(
          (photo: unknown): photo is JobSitePhoto =>
            Boolean(photo) &&
            typeof photo === 'object' &&
            typeof (photo as JobSitePhoto).dataUrl === 'string'
        )
      : [];

    return {
      app: 'BuildQuote Pro',
      version: '1.0',
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      currency,
      unitSystem,
      wastePercent,
      materialPrices,
      quoteMetadata,
      quoteItems,
      sitePhotos,
    };
  } catch {
    return null;
  }
}

export type CalculatorTrade = 'Concrete' | 'Drywall' | 'Tile' | 'Paint';

export interface ProTipItem {
  id: string;
  badge: string;
  title: string;
  summary: string;
  bullets: string[];
}

export function getTradeProTips(trade: CalculatorTrade): ProTipItem[] {
  switch (trade) {
    case 'Concrete':
      return [
        {
          id: 'concrete-curing',
          badge: 'Curing & Strength',
          title: 'Curing Times & Moisture Control (24h / 7d / 28d Schedule)',
          summary:
            'Proper hydration after finishing prevents surface craze-cracking and ensures the slab reaches full compressive strength (PSI).',
          bullets: [
            'Foot Traffic (24–48 Hours): Wait at least 24 hours in warm weather (48 hours below 55°F / 13°C) before walking on the slab or stripping perimeter forms.',
            'Vehicle & Heavy Loads (7–10 Days): Concrete reaches ~70% of its rated compressive strength at 7 days—keep cars, trailers, and heavy pallets off until day 7.',
            'Full Structural Cure (28 Days): Keep the slab damp-cured (mist with water, cover with poly sheeting, or apply a liquid curing compound) during the first 7 days to hit full 28-day PSI.',
          ],
        },
        {
          id: 'concrete-subbase',
          badge: 'Subbase & Forms',
          title: 'Subgrade Compaction, Vapor Barrier & Control Joints',
          summary:
            'Most concrete cracks originate from settling subgrades or missing expansion/control joints rather than the mix itself.',
          bullets: [
            'Compacted Gravel Base: Remove all topsoil/sod and compact 4" to 6" of 3/4" crushed stone (road base) using a plate compactor in 2" lifts.',
            'Control Joint Spacing: Tool or saw-cut control joints to 1/4 of the slab thickness (e.g., 1" deep for a 4" slab) spaced every 8 to 10 feet within 6–18 hours of pouring.',
            'Reinforcement Placement: Support rebar grids (#3 or #4 at 18" OC) or welded wire mesh on plastic chairs so steel sits in the middle third of the slab—never flat on the dirt.',
          ],
        },
        {
          id: 'concrete-water-mix',
          badge: 'Mixing & Pouring',
          title: 'Water-to-Cement Ratio & Slump Control',
          summary:
            'Adding extra water makes concrete easier to push but drastically reduces final strength and causes surface scaling.',
          bullets: [
            'Measure Water Strictly: Use ~3.5 quarts (3.3 L) of clean water per 80lb bag (or ~2.7 quarts per 60lb bag) for a workable 4" slump.',
            'Screed & Bull Float Immediately: Strike off flush with a straight 2×4 screed board, then bull float before bleed water rises to the surface.',
            'Wait for Bleed Water to Evaporate: Never steel-trowel or broom-finish while standing bleed water is visible on top—doing so traps water and causes delamination.',
          ],
        },
      ];

    case 'Drywall':
      return [
        {
          id: 'drywall-hanging',
          badge: 'Board Layout',
          title: 'Hanging Sequence, Staggered Butt Joints & Opening Cutouts',
          summary:
            'Hanging boards in the proper sequence locks wall top edges tight and minimizes difficult overhead taping seams.',
          bullets: [
            'Ceilings First, Then Top Wall Sheets: Hang ceiling panels perpendicular to joists first, then push the top row of wall panels tight against the ceiling perimeter.',
            'Stagger Butt Joints: Offset vertical butt ends by at least one stud bay (16" or 24") between top and bottom courses so four corners never meet at a single intersection.',
            'Cut Doors & Windows Out in Place: Notch L-shapes over door/window headers rather than aligning vertical board seams directly with door jamb corners (where settling cracks form).',
          ],
        },
        {
          id: 'drywall-fastening',
          badge: 'Fastening',
          title: 'Screw Depth, Spacing & Adhesive Best Practices',
          summary:
            'Properly dimpled screws hold the gypsum core via the face paper—tearing the paper destroys holding power and causes nail pops.',
          bullets: [
            'Spacing Schedule: Drive 1-1/4" coarse-thread drywall screws every 12" on ceilings and every 16" along wall studs, keeping fasteners 3/8" away from board edges.',
            'Set the Dimple Depth: Use a collated screw gun or clutch bit so the bugle head sits 1/32" below the surface without breaking the heavy face paper.',
            'Eliminate Loose Framing First: Sister bowed studs and shim uneven framing before hanging so panels lie flat without bridging.',
          ],
        },
        {
          id: 'drywall-taping-mud',
          badge: 'Mud & Taping',
          title: '3-Coat Joint Compound Schedule & Drying Times',
          summary:
            'Thin, progressively wider coats dry flatter and require 70% less sanding than one thick, heavy buildup.',
          bullets: [
            'Coat 1 (Embed Tape - 4" Knife): Use All-Purpose Ready-Mix compound to embed paper tape over flat seams and inside corners; wipe firmly to prevent air blisters.',
            'Coat 2 (Fill Coat - 8"–10" Knife): Wait 18–24 hours until Coat 1 turns stark white and dry, scrape ridges, then feather a wider fill coat 4"–5" past each side of the joint.',
            'Coat 3 (Skim/Finish - 12" Knife): Apply a thin tight skim coat with Lightweight Topping compound, let dry 12–24 hours, and sand lightly with a 180–220 grit pole sander.',
          ],
        },
      ];

    case 'Tile':
      return [
        {
          id: 'tile-surface-prep',
          badge: 'Surface Prep',
          title: 'Subfloor Flatness, Deflection & Waterproofing Prep',
          summary:
            'Tile assemblies are only as strong as the substrate beneath them—prep accounts for 80% of a crack-free tile installation.',
          bullets: [
            'Flatness Tolerance: Grind high spots and pour self-leveling underlayment in low spots so the floor is flat within 1/8" in 10 ft (or 1/16" in 10 ft for large-format 12×24+ tile).',
            'Cement Backer or Uncoupling Membrane: Never set ceramic or porcelain tile directly over bare dimensional lumber; install 1/4"–1/2" cement board set in thinset with alkali-resistant mesh tape on joints.',
            'Wet Area Waterproofing: Apply 2 coats of roll-on liquid waterproofing membrane or sheet membrane in showers and tub surrounds prior to tiling.',
          ],
        },
        {
          id: 'tile-mortar-trowel',
          badge: 'Mortar & Layout',
          title: 'Directional Troweling, Back-Buttering & Lippage Control',
          summary:
            'Correct trowel notch size and directional ridges collapse air pockets and achieve full bond coverage.',
          bullets: [
            'Comb Mortar in One Direction: Comb thinset ridges in straight parallel lines (never swirls) along the short dimension of the tile so air escapes when the tile is bedded.',
            'Back-Butter Large Format Tiles: Skim the back of 12"×24" or larger tiles with the flat side of the trowel to reach ≥80% coverage in dry rooms and ≥95% in wet areas.',
            'Balanced Centerline Layout: Snap chalk lines in the center of the room and dry-fit a row to avoid narrow sliver cuts (<2" wide) along visible walls.',
          ],
        },
        {
          id: 'tile-grout-cure',
          badge: 'Curing & Grout',
          title: 'Cure Times Before Grouting & Flexible Expansion Joints',
          summary:
            'Walking on freshly set tile or grouting too early breaks the initial crystalline bond of the thinset mortar.',
          bullets: [
            'Wait 24 Hours Before Grouting: Keep all foot traffic off newly set tile for 24 hours while thinset cures; clear excess mortar from grout joints while still fresh.',
            'Perimeter Movement Gap: Leave a 1/8" to 1/4" expansion space wherever tile meets perimeter walls, cabinets, or tubs—never pack rigid grout tight against walls.',
            'Caulk All Changes of Plane: Use 100% color-matched silicone sealant (not grout) at all inside corners, wall-to-floor transitions, and tub/shower perimeters.',
          ],
        },
      ];

    case 'Paint':
      return [
        {
          id: 'paint-surface-prep',
          badge: 'Surface Prep',
          title: 'Degreasing, Scuff-Sanding & Spot-Priming Repairs',
          summary:
            'Paint will not bond to kitchen grease, drywall dust, or glossy enamel without proper cleaning and mechanical tooth.',
          bullets: [
            'Wash Before Sanding: Wipe kitchen/bath walls and hand-print zones around switches with a TSP substitute degreaser so sanding does not grind oils into the old film.',
            'De-Gloss Shiny Surfaces: Scuff-sand existing semi-gloss walls, trim, and doors with 150–180 grit sandpaper and vacuum dust with a microfiber tack cloth.',
            'Spot-Prime Spackle & Joint Compound: Always seal bare drywall patches with primer before rolling finish paint—unprimed patches absorb binder and leave dull "flashing" halos.',
          ],
        },
        {
          id: 'paint-primer-sheen',
          badge: 'Primer & Sheen',
          title: 'Choosing the Right Primer & Sheen by Room Type',
          summary:
            'Matching primer chemistry and topcoat sheen to room humidity and traffic prevents peeling and simplifies cleaning.',
          bullets: [
            'Dedicated PVA vs. Stain-Blocker: Use high-build PVA primer on new bare drywall; use shellac or oil/acrylic stain-blocking primer over water stains, smoke, or tannin wood knots.',
            'Sheen Guide: Use Flat/Matte on ceilings to hide imperfections, Eggshell/Satin on living room and hallway walls for washability, and Semi-Gloss on baseboards, doors, and baths.',
            'Box Your Paint Cans: When using multiple 1-gallon cans of the same color, pour them together ("boxing") in a 5-gallon bucket to guarantee uniform color batching.',
          ],
        },
        {
          id: 'paint-application-cure',
          badge: 'Application & Cure',
          title: 'Maintaining a Wet Edge, Recoat Windows & Tape Removal',
          summary:
            'Working from a wet edge in natural light prevents lap marks, roller stipple ridges, and peeled edges.',
          bullets: [
            'Cut In One Wall at a Time: Cut in a 2"–3" border along ceiling and trim with a 2.5" angled sash brush, then immediately roll that wall while the brushed border is still wet.',
            'Recoat vs. Full Cure Time: Latex paint is dry to the touch in 1 hour and ready for Coat 2 in 2–4 hours, but takes 14–30 days to fully cure hard enough for scrubbing.',
            'Score & Pull Painter’s Tape at 45°: Pull masking tape back at a 45-degree angle while the final coat is still slightly tacky (or score the edge with a utility blade) for razor-sharp lines.',
          ],
        },
      ];
  }
}

export interface SegmentedKeyResult<T> {
  nextValue: T;
  nextIndex: number;
}

/**
 * Pure helper for WAI-ARIA keyboard navigation (ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Home, End)
 * across custom segmented controls, radio groups, and tablists.
 */
export function getNextSegmentedOption<T>(
  options: readonly T[],
  currentValue: T,
  key: string
): SegmentedKeyResult<T> | null {
  if (options.length === 0) return null;
  const currentIndex = Math.max(0, options.indexOf(currentValue));

  if (key === 'ArrowRight' || key === 'ArrowDown') {
    const nextIndex = (currentIndex + 1) % options.length;
    return { nextValue: options[nextIndex], nextIndex };
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    const nextIndex = (currentIndex - 1 + options.length) % options.length;
    return { nextValue: options[nextIndex], nextIndex };
  }
  if (key === 'Home') {
    return { nextValue: options[0], nextIndex: 0 };
  }
  if (key === 'End') {
    const lastIndex = options.length - 1;
    return { nextValue: options[lastIndex], nextIndex: lastIndex };
  }
  return null;
}

/**
 * Pure helper for modal focus trapping on Tab / Shift+Tab.
 * Returns the index of the element that should receive focus when wrapping at modal boundaries,
 * or null if native browser tabbing should proceed normally.
 */
export function getTrappedFocusIndex(
  totalFocusable: number,
  activeIndex: number,
  shiftKey: boolean
): number | null {
  if (totalFocusable <= 0) return null;
  if (shiftKey) {
    if (activeIndex <= 0) {
      return totalFocusable - 1;
    }
    return null;
  } else {
    if (activeIndex === -1 || activeIndex >= totalFocusable - 1) {
      return 0;
    }
    return null;
  }
}

