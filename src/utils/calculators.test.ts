import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateConcrete,
  calculateDrywall,
  calculateTile,
  calculatePaint,
  calculateQuoteFinancials,
  isValidProCode,
  checkUrlForProUnlock,
} from './calculators';

test('Concrete Mode 1 (Slab) verifies cubic feet, cubic yards, cubic meters, and bag rounding', () => {
  // 10 ft x 12 ft x 4 in slab, 10% waste
  // Raw ft3 = 10 * 12 * (4/12) = 40 ft3
  // With 10% waste = 44 ft3
  // Yards = 44 / 27 = 1.6296 yd3
  // 80lb bags = ceil(44 / 0.60) = ceil(73.333) = 74
  // 60lb bags = ceil(44 / 0.45) = ceil(97.777) = 98
  // 30kg bags = ceil(44 / 0.50) = 88
  // 50lb bags = ceil(44 / 0.375) = ceil(117.333) = 118
  const res = calculateConcrete({
    mode: 'slab',
    lengthFt: 10,
    widthFt: 12,
    thicknessIn: 4,
    diameterIn: 10,
    depthFt: 3,
    holeCount: 4,
    wastePercent: 10,
    selectedBagType: '80lb',
    pricePerBag: 6.5,
    readyMixPricePerYard: 160,
  });

  assert.equal(Math.round(res.rawCubicFeet * 100) / 100, 40);
  assert.equal(Math.round(res.cubicFeetWithWaste * 100) / 100, 44);
  assert.equal(res.bags80lb, 74);
  assert.equal(res.bags60lb, 98);
  assert.equal(res.bags30kg, 88);
  assert.equal(res.bags50lb, 118);
  assert.equal(res.estimatedBagCost, 74 * 6.5);
});

test('Concrete Mode 2 (Round Post Holes) verifies post hole formula', () => {
  // PI * ((12 / 24)^2) * 4 ft * 6 holes = PI * 0.25 * 24 = 6 * PI = 18.8495559 ft3
  const res = calculateConcrete({
    mode: 'post',
    lengthFt: 10,
    widthFt: 10,
    thicknessIn: 4,
    diameterIn: 12,
    depthFt: 4,
    holeCount: 6,
    wastePercent: 0,
    selectedBagType: '60lb',
    pricePerBag: 5.0,
    readyMixPricePerYard: 150,
  });

  const expectedFt3 = Math.PI * Math.pow(12 / 24, 2) * 4 * 6;
  assert.ok(Math.abs(res.cubicFeetWithWaste - expectedFt3) < 1e-6);
  assert.equal(res.bags80lb, Math.ceil(expectedFt3 / 0.60));
  assert.equal(res.bags60lb, Math.ceil(expectedFt3 / 0.45));
});

test('Drywall Estimator deducts 21 sqft per door and 15 sqft per window and uses 0.014 gal/sqft mud formula', () => {
  // 640 sq ft, 2 doors (-42), 2 windows (-30) => net 568 sq ft
  // 10% waste => 624.8 gross sq ft
  // 4x8 sheets (32 sq ft) => ceil(624.8 / 32) = 20 sheets
  // Mud gallons => ceil(624.8 * 0.014) = ceil(8.7472) = 9 gal
  // 4.5-Gal buckets => ceil(8.7472 / 4.5) = 2 buckets
  // Tape rolls => ceil(624.8 * 0.37 / 250) = ceil(0.9247) = 1 roll
  // Screws => ceil(624.8) = 625 screws, boxes = ceil(625 / 300) = 3 boxes
  const res = calculateDrywall({
    inputMode: 'area',
    directAreaSqFt: 640,
    roomLengthFt: 0,
    roomWidthFt: 0,
    roomHeightFt: 0,
    includeCeiling: false,
    doorCount: 2,
    windowCount: 2,
    sheetSize: 32,
    wastePercent: 10,
    pricePerSheet: 15,
    pricePerBucketMud: 22,
    pricePerTapeRoll: 8,
    pricePerScrewBox: 9,
  });

  assert.equal(res.deductedSqFt, 72);
  assert.equal(res.netAreaSqFt, 568);
  assert.equal(Math.round(res.grossSqFt * 10) / 10, 624.8);
  assert.equal(res.totalSheets, 20);
  assert.equal(res.compoundGallons, 9);
  assert.equal(res.compoundBuckets45Gal, 2);
  assert.equal(res.tapeRolls, 1);
  assert.equal(res.drywallScrews, 625);
  assert.equal(res.screwBoxes1lb, 3);
});

test('Tile Estimator calculates tiles, boxes, thinset (small vs large), and grout', () => {
  // 200 sq ft, 10% waste = 220 sq ft
  // 12x24 tile = 2 sq ft per tile => 110 tiles
  // 8 tiles per box => ceil(110 / 8) = 14 boxes
  // Large tile thinset => ceil(220 / 60) = 4 bags
  // Grout => ceil(220 / 100) = 3 bags
  const res = calculateTile({
    areaSqFt: 200,
    tileWidthIn: 12,
    tileLengthIn: 24,
    tileCategory: 'large',
    tilesPerBox: 8,
    pricingBasis: 'box',
    unitPrice: 45,
    thinsetPricePerBag: 24,
    groutPricePerBag: 20,
    wastePercent: 10,
  });

  assert.equal(res.totalSqFtWithWaste, 220);
  assert.equal(res.individualTiles, 110);
  assert.equal(res.totalBoxes, 14);
  assert.equal(res.thinsetBags50lb, 4);
  assert.equal(res.groutBags25lb, 3);
});

test('Paint & Primer Calculator deducts openings and computes gallons & liters', () => {
  // 800 sq ft, 2 doors (-42), 2 windows (-30) = 728 sq ft net (0% waste)
  // Paint: 2 coats => (728 * 2) / 350 = 4.16 => 5 gallons
  // Primer: 1 coat => (728 * 1) / 300 = 2.426 => 3 gallons
  const res = calculatePaint({
    wallAreaSqFt: 800,
    doorCount: 2,
    windowCount: 2,
    paintCoats: 2,
    primerCoats: 1,
    pricePerGallonPaint: 48,
    pricePerGallonPrimer: 32,
    wastePercent: 0,
  });

  assert.equal(res.netAreaSqFt, 728);
  assert.equal(res.paintGallons, 5);
  assert.equal(res.primerGallons, 3);
  assert.equal(res.estimatedMaterialCost, 5 * 48 + 3 * 32);
});

test('Quote financials and Pro unlock helpers work accurately', () => {
  const quote = calculateQuoteFinancials({
    items: [
      { id: '1', trade: 'Concrete', title: 'Slab', summary: '74 bags', details: [], materialCost: 500 },
      { id: '2', trade: 'Paint', title: 'Walls', summary: '5 gal', details: [], materialCost: 300 },
    ],
    customLaborCost: 1000,
    materialMarkupPercent: 15,
    taxRatePercent: 8,
  });

  assert.equal(quote.rawMaterialsSubtotal, 800);
  assert.equal(quote.markupAmount, 120);
  assert.equal(quote.materialsWithMarkup, 920);
  assert.equal(quote.taxAmount, 73.6);
  assert.equal(quote.grandTotal, 1993.6);

  assert.equal(isValidProCode('buildpro26'), true);
  assert.equal(isValidProCode('PRO2026'), true);
  assert.equal(isValidProCode('WRONG'), false);
  assert.equal(checkUrlForProUnlock('?pro=unlocked', ''), true);
  assert.equal(checkUrlForProUnlock('', '#pro-unlocked'), true);
  assert.equal(checkUrlForProUnlock('', ''), false);
});

test('Currency formatting and Share/Clipboard Quote Summary formatter work accurately', async () => {
  const { formatCurrency, formatQuoteTextSummary, calculateQuoteFinancials } = await import(
    './calculators'
  );
  assert.equal(formatCurrency(125.5, 'CAD'), 'CA$125.50');
  assert.equal(formatCurrency(125.5, 'USD'), '$125.50');
  assert.equal(formatCurrency(125.5, 'EUR'), '€125.50');
  assert.equal(formatCurrency(125.5, 'GBP'), '£125.50');

  const items = [
    {
      id: '1',
      trade: 'Concrete' as const,
      title: 'Patio Slab',
      summary: '74 bags',
      details: [],
      materialCost: 480,
    },
  ];
  const financials = calculateQuoteFinancials({
    items,
    customLaborCost: 500,
    materialMarkupPercent: 10,
    taxRatePercent: 5,
  });

  const summary = formatQuoteTextSummary({
    quoteNumber: 'BQ-2026-999',
    quoteDate: '2026-10-30',
    clientName: 'Sarah Connor',
    projectAddress: '100 Main St',
    companyName: 'Apex Builders',
    companyPhone: '555-0199',
    isPro: true,
    items,
    financials,
    materialMarkupPercent: 10,
    taxRatePercent: 5,
    projectNotes: 'Remove old concrete and pour 4 inch reinforced slab.',
    currency: 'CAD',
  });

  assert.ok(summary.includes('Sarah Connor'));
  assert.ok(summary.includes('CA$1054.40'));
  assert.ok(summary.includes('Remove old concrete and pour 4 inch reinforced slab.'));
});

test('Quick Add Custom Item and Standalone Unit Converter (Length, Area, Volume) work accurately', async () => {
  const {
    createCustomQuoteItem,
    convertLength,
    convertArea,
    convertVolume,
  } = await import('./calculators');

  const customItem = createCustomQuoteItem({
    name: 'Rebar #4 Grid & Wire Ties',
    quantity: 12,
    unitPrice: 14.5,
    unitLabel: 'bars',
    currency: 'CAD',
  });
  assert.equal(customItem.trade, 'Custom');
  assert.equal(customItem.title, 'Rebar #4 Grid & Wire Ties');
  assert.equal(customItem.materialCost, 174);
  assert.ok(customItem.summary.includes('CA$14.50'));

  // Length: 12 feet = 144 inches = 4 yards = 3.6576 meters = 365.76 cm
  const len = convertLength(12, 'ft');
  assert.equal(len.feet, 12);
  assert.equal(len.inches, 144);
  assert.equal(len.yards, 4);
  assert.equal(len.meters, 3.6576);
  assert.equal(len.centimeters, 365.76);

  // Area: 90 sq ft = 10 sq yd = ~8.361 sq m
  const area = convertArea(90, 'sqft');
  assert.equal(area.squareFeet, 90);
  assert.equal(area.squareYards, 10);
  assert.equal(area.squareMeters, 8.361);

  // Volume: 2 cubic yards = 54 cubic feet = ~1.529 cubic meters
  const vol = convertVolume(2, 'cuyd');
  assert.equal(vol.cubicYards, 2);
  assert.equal(vol.cubicFeet, 54);
  assert.equal(vol.cubicMeters, 1.529);
});

test('Material Price Settings and Local JSON Backup Export/Restore roundtrip accurately', async () => {
  const {
    DEFAULT_MATERIAL_PRICES,
    DEFAULT_QUOTE_METADATA,
    serializeBackupJson,
    parseAndValidateBackupJson,
  } = await import('./calculators');

  const sampleBackup = {
    app: 'BuildQuote Pro' as const,
    version: '1.0' as const,
    exportedAt: '2026-10-30T10:00:00.000Z',
    currency: 'CAD' as const,
    unitSystem: 'metric' as const,
    wastePercent: 15 as const,
    materialPrices: {
      ...DEFAULT_MATERIAL_PRICES,
      concreteBagPrice: 8.25,
      drywallSheetPrice: 19.5,
      tilePricePerSqFt: 5.75,
      paintGallonPrice: 54.0,
    },
    quoteMetadata: {
      ...DEFAULT_QUOTE_METADATA,
      clientName: 'Elena Rostova',
      quoteNumber: 'BQ-2026-777',
      customLaborCost: 1200,
    },
    quoteItems: [
      {
        id: 'custom-1',
        trade: 'Custom' as const,
        title: 'Custom Framing Lumber',
        summary: '20 studs',
        details: [],
        materialCost: 180,
      },
    ],
    sitePhotos: [],
  };

  const json = serializeBackupJson(sampleBackup);
  const restored = parseAndValidateBackupJson(json);

  assert.ok(restored);
  assert.equal(restored.currency, 'CAD');
  assert.equal(restored.unitSystem, 'metric');
  assert.equal(restored.wastePercent, 15);
  assert.equal(restored.materialPrices.concreteBagPrice, 8.25);
  assert.equal(restored.materialPrices.drywallSheetPrice, 19.5);
  assert.equal(restored.materialPrices.tilePricePerSqFt, 5.75);
  assert.equal(restored.materialPrices.paintGallonPrice, 54.0);
  assert.equal(restored.quoteMetadata.clientName, 'Elena Rostova');
  assert.equal(restored.quoteItems.length, 1);
  assert.equal(restored.quoteItems[0].title, 'Custom Framing Lumber');
  assert.equal(parseAndValidateBackupJson('invalid-json{{{'), null);
});

test('Pro-Tips trade guide provides context-specific construction best practices for all 4 calculators', async () => {
  const { getTradeProTips } = await import('./calculators');

  const concreteTips = getTradeProTips('Concrete');
  const drywallTips = getTradeProTips('Drywall');
  const tileTips = getTradeProTips('Tile');
  const paintTips = getTradeProTips('Paint');

  assert.equal(concreteTips.length, 3);
  assert.ok(concreteTips.some((t) => t.title.toLowerCase().includes('curing')));

  assert.equal(drywallTips.length, 3);
  assert.ok(drywallTips.some((t) => t.title.toLowerCase().includes('joint compound')));

  assert.equal(tileTips.length, 3);
  assert.ok(tileTips.some((t) => t.badge.toLowerCase().includes('surface prep')));

  assert.equal(paintTips.length, 3);
  assert.ok(paintTips.some((t) => t.title.toLowerCase().includes('wet edge')));
});

test('Keyboard navigation helpers for custom segmented controls and modal focus trapping work accurately', async () => {
  const { getNextSegmentedOption, getTrappedFocusIndex } = await import('./calculators');

  const tabs = ['concrete', 'drywall', 'tile', 'paint', 'quote'] as const;
  assert.deepEqual(getNextSegmentedOption(tabs, 'concrete', 'ArrowRight'), {
    nextValue: 'drywall',
    nextIndex: 1,
  });
  assert.deepEqual(getNextSegmentedOption(tabs, 'concrete', 'ArrowLeft'), {
    nextValue: 'quote',
    nextIndex: 4,
  });
  assert.deepEqual(getNextSegmentedOption(tabs, 'quote', 'ArrowRight'), {
    nextValue: 'concrete',
    nextIndex: 0,
  });
  assert.deepEqual(getNextSegmentedOption(tabs, 'tile', 'Home'), {
    nextValue: 'concrete',
    nextIndex: 0,
  });
  assert.deepEqual(getNextSegmentedOption(tabs, 'tile', 'End'), {
    nextValue: 'quote',
    nextIndex: 4,
  });
  assert.equal(getNextSegmentedOption(tabs, 'tile', 'Enter'), null);

  // Modal focus trap boundary wrapping
  assert.equal(getTrappedFocusIndex(5, 4, false), 0); // Tab on last element wraps to 0
  assert.equal(getTrappedFocusIndex(5, 0, true), 4); // Shift+Tab on first element wraps to 4
  assert.equal(getTrappedFocusIndex(5, 2, false), null); // Middle element uses native Tab
  assert.equal(getTrappedFocusIndex(5, 2, true), null); // Middle element uses native Shift+Tab
});




