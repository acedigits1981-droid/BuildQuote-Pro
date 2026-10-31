import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { CalculatorTrade, getTradeProTips } from '../utils/calculators';

interface ProTipsAccordionProps {
  trade: CalculatorTrade;
}

export const ProTipsAccordion: React.FC<ProTipsAccordionProps> = ({ trade }) => {
  const tips = getTradeProTips(trade);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [expandedTipIds, setExpandedTipIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const tip of tips) {
      initial[tip.id] = true;
    }
    return initial;
  });

  const toggleSingleTip = (id: string) => {
    setExpandedTipIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      data-testid={`pro-tips-accordion-${trade.toLowerCase()}`}
      className="no-print mt-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors"
    >
      {/* Main Pro-Tips Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        data-testid="pro-tips-toggle-btn"
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Pro-Tips: {trade} Construction Best Practices
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                DIY &amp; Field Guide ({tips.length} Tips)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
              {trade === 'Concrete' &&
                'Curing times (24h / 7d / 28d), subgrade compaction, control joints & water ratios'}
              {trade === 'Drywall' &&
                'Hanging sequence, staggered butt joints, screw dimple depth & 3-coat mud schedule'}
              {trade === 'Tile' &&
                'Subfloor flatness prep, directional trowel ridges, back-buttering & 24h grout cure'}
              {trade === 'Paint' &&
                'Surface degreasing, primer selection, maintaining a wet edge & recoat windows'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          <span className="hidden sm:inline">{isOpen ? 'Hide Pro-Tips' : 'Show Pro-Tips'}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-amber-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </button>

      {/* Accordion Content Body */}
      {isOpen && (
        <div
          data-testid="pro-tips-content"
          className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
        >
          {tips.map((tip) => {
            const isTipExpanded = expandedTipIds[tip.id] ?? true;
            return (
              <div
                key={tip.id}
                data-testid={`pro-tip-card-${tip.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSingleTip(tip.id)}
                  aria-expanded={isTipExpanded}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      {tip.badge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {tip.title}
                    </h4>
                  </div>
                  {isTipExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isTipExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tip.summary}
                    </p>
                    <ul className="space-y-1.5">
                      {tip.bullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
