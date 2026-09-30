import React from 'react';
import { Plus, Sparkles, Receipt, BarChart2, CheckCircle2, Camera } from 'lucide-react';
import { PantryAnalytics } from '../types';

interface HeaderProps {
  analytics: PantryAnalytics | null;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
  onOpenRecipeModal: () => void;
  onOpenImportModal: () => void;
  onOpenAnalyticsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  analytics,
  onOpenAddModal,
  onOpenScanModal,
  onOpenRecipeModal,
  onOpenImportModal,
  onOpenAnalyticsModal,
}) => {
  const urgentCount = analytics?.expiringIn3DaysCount ?? 0;
  const totalSaved = analytics?.totalMoneySavedUsd ?? 0;

  return (
    <header className="bg-stone-50/80 backdrop-blur-md border-b border-stone-200/70 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-sm tracking-tighter shadow-2xs">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-sm sm:text-base tracking-tight">
                Pantry
              </span>
              {urgentCount > 0 ? (
                <button
                  type="button"
                  onClick={onOpenRecipeModal}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Click to see rescue recipes for expiring items"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  <span>{urgentCount} to eat soon</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-stone-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  All fresh
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Stats Button */}
          <button
            type="button"
            onClick={onOpenAnalyticsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="View saved money and waste analytics"
          >
            <BarChart2 className="w-3.5 h-3.5 text-stone-700" />
            <span className="hidden sm:inline">Saved:</span>
            <span className="font-semibold text-stone-900">${totalSaved.toFixed(0)}</span>
          </button>

          {/* Quick Paste / Import */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Paste grocery list or receipt text"
          >
            <Receipt className="w-3.5 h-3.5 text-stone-700" />
            <span>Paste List</span>
          </button>

          {/* AI Chef */}
          <button
            type="button"
            onClick={onOpenRecipeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors cursor-pointer"
            title="Generate zero-waste recipes from expiring items"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xs:inline">Rescue</span> Recipes
          </button>

          {/* Snap / Scan Picture */}
          <button
            type="button"
            onClick={onOpenScanModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300/80 transition-colors cursor-pointer"
            title="Snap a photo of food to recognize items and configure expiration dates"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Snap</span> Picture
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
