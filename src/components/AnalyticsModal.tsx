import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { PantryAnalytics } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: PantryAnalytics | null;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
}) => {
  if (!isOpen || !analytics) return null;

  const totalSaved = analytics.totalMoneySavedUsd || 0;
  const totalWasted = analytics.totalMoneyWastedUsd || 0;
  const totalHandled = totalSaved + totalWasted;
  const saveRate = totalHandled > 0 ? Math.round((totalSaved / totalHandled) * 100) : 100;
  const kgDiverted = analytics.wasteDivertedKg || 0;
  const co2AvoidedKg = (kgDiverted * 2.5).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-stone-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Food & Savings Analytics</h2>
            <p className="text-xs text-stone-700">Your household waste diversion track record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-stone-700 font-medium block">Grocery Money Saved</span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                ${totalSaved.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                {saveRate}% of items eaten on time
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-stone-700 font-medium block">Spoilage Loss</span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                ${totalWasted.toFixed(2)}
              </span>
              <span className="text-[11px] text-stone-700 mt-0.5 block">
                {analytics.wastedCount} items spoiled
              </span>
            </div>
          </div>

          {/* Environmental Impact summary */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
            <div>
              <span className="text-stone-700 font-medium block">Landfill Diversion</span>
              <span className="text-sm font-bold text-stone-900 mt-0.5 block">
                {kgDiverted} kg food rescued
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-700 font-medium block">CO₂ Emissions Averted</span>
              <span className="text-sm font-bold text-emerald-800 mt-0.5 block">
                ~{co2AvoidedKg} kg CO₂
              </span>
            </div>
          </div>

          {/* Categories in Pantry */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-2">Category Breakdown</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(analytics.itemsByCategory).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100 text-stone-700">
                  <span>{cat}</span>
                  <span className="font-semibold text-stone-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
