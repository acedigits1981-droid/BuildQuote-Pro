import React, { useState } from 'react';
import { PlusCircle, Check, PackagePlus } from 'lucide-react';
import {
  CurrencyCode,
  QuoteCartItem,
  createCustomQuoteItem,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculators';

interface QuickAddCustomItemProps {
  currency: CurrencyCode;
  onAddCustomItem: (item: Omit<QuoteCartItem, 'id'>) => void;
}

export const QuickAddCustomItem: React.FC<QuickAddCustomItemProps> = ({
  currency,
  onAddCustomItem,
}) => {
  const [itemName, setItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(45);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  const sym = getCurrencySymbol(currency);
  const lineTotal = Math.max(0, Number(quantity) || 0) * Math.max(0, Number(unitPrice) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = createCustomQuoteItem({
      name: itemName.trim() || 'Custom Material / Labor Add-On',
      quantity: Math.max(0.01, Number(quantity) || 1),
      unitPrice: Math.max(0, Number(unitPrice) || 0),
      unitLabel: 'units',
      currency,
    });
    onAddCustomItem(newItem);
    setItemName('');
    setQuantity(1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  return (
    <section
      aria-label="Quick Add Custom Item"
      data-testid="quick-add-custom-item-section"
      className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quick Add Custom Item
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Append custom materials, hardware, permits, or labor line items directly to the Project Estimate Cart &amp; PDF invoice
            </p>
          </div>
        </div>
        <div
          data-testid="quick-add-line-total"
          className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums"
        >
          Line Total: {formatCurrency(lineTotal, currency)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-5">
          <label
            htmlFor="quick-add-item-name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Custom Material / Labor Item Name
          </label>
          <input
            id="quick-add-item-name"
            data-testid="quick-add-item-name"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Rebar #4 Grid, Dumpster Rental, Prep Labor..."
            className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="quick-add-item-qty"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Quantity
          </label>
          <input
            id="quick-add-item-qty"
            data-testid="quick-add-item-qty"
            type="number"
            min="0.01"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="quick-add-item-price"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Unit Price ({sym})
          </label>
          <input
            id="quick-add-item-price"
            data-testid="quick-add-item-price"
            type="number"
            min="0"
            step="0.5"
            value={unitPrice}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            className="w-full min-h-[42px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            data-testid="quick-add-submit-btn"
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            {addedToast ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>Added to Quote Cart!</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 stroke-[2.2] shrink-0" />
                <span>Add Custom Item</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
