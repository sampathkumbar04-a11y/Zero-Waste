import React, { useState } from 'react';
import { 
  Check, 
  MoreHorizontal, 
  Lightbulb, 
  Trash2, 
  AlertCircle,
  PackageOpen,
  Lock,
  Refrigerator,
  Package,
  Snowflake
} from 'lucide-react';
import { PantryItem, StorageLocation } from '../types';

interface PantryCardProps {
  item: PantryItem;
  viewMode?: 'grid' | 'list';
  onMarkConsumed: (item: PantryItem) => void;
  onMarkWasted: (item: PantryItem, reason?: string) => void;
  onToggleOpened: (item: PantryItem) => void;
  onChangeLocation: (item: PantryItem, newLoc: StorageLocation) => void;
  onDelete: (id: string) => void;
}

export const PantryCard: React.FC<PantryCardProps> = ({
  item,
  viewMode = 'grid',
  onMarkConsumed,
  onMarkWasted,
  onToggleOpened,
  onChangeLocation,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Compute days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0;
  const isToday = diffDays === 0;
  const isUrgent = diffDays > 0 && diffDays <= 3;

  // Formatted status text and dot color
  let dotColor = 'bg-emerald-500';
  let expiryLabel = `In ${diffDays} days`;

  if (isExpired) {
    dotColor = 'bg-rose-500';
    expiryLabel = `Expired ${Math.abs(diffDays)}d ago`;
  } else if (isToday) {
    dotColor = 'bg-rose-500 animate-pulse';
    expiryLabel = 'Expires today';
  } else if (diffDays === 1) {
    dotColor = 'bg-amber-500';
    expiryLabel = 'Expires tomorrow';
  } else if (isUrgent) {
    dotColor = 'bg-amber-500';
    expiryLabel = `In ${diffDays} days`;
  }

  // Storage badge icon
  const getStorageIcon = (loc: StorageLocation) => {
    switch (loc) {
      case 'Fridge': return <Refrigerator className="w-3 h-3 text-stone-500" />;
      case 'Freezer': return <Snowflake className="w-3 h-3 text-stone-500" />;
      case 'Pantry': return <Package className="w-3 h-3 text-stone-500" />;
    }
  };

  // ----------------------------------------------------
  // History Item Display
  // ----------------------------------------------------
  if (item.status === 'consumed' || item.status === 'wasted') {
    const isConsumed = item.status === 'consumed';
    return (
      <div className={`bg-white rounded-xl border border-stone-200/70 p-3 flex items-center justify-between gap-3 text-xs opacity-75 hover:opacity-100 transition-opacity ${viewMode === 'list' ? 'w-full' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isConsumed ? 'bg-emerald-500' : 'bg-rose-400'}`} />
          <div className="min-w-0">
            <span className={`font-medium block truncate ${isConsumed ? 'text-stone-900' : 'text-stone-700 line-through'}`}>
              {item.name}
            </span>
            <span className="text-[11px] text-stone-700 block">
              {isConsumed ? `Eaten · Saved $${item.estimatedCost.toFixed(2)}` : `Tossed${item.wasteReason ? `: ${item.wasteReason}` : ''}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-stone-700 hidden sm:inline">
            {item.consumedAt || item.wastedAt}
          </span>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1 text-stone-600 hover:text-stone-800 transition-colors"
            title="Remove from history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Compact List View
  // ----------------------------------------------------
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-stone-200/70 px-4 py-3 flex items-center justify-between gap-4 hover:border-stone-300 transition-all relative">
        <div className="flex items-center gap-3 min-w-0">
          {/* One-click eat button */}
          <button
            type="button"
            onClick={() => onMarkConsumed(item)}
            className="w-5 h-5 rounded-full border border-stone-300 hover:border-emerald-600 hover:bg-emerald-50 text-stone-300 hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Mark as eaten"
          >
            <Check className="w-3 h-3" />
          </button>

          {/* Item details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-xs sm:text-sm truncate">
                {item.name}
              </span>
              {item.isOpened && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-100 text-stone-600 font-medium">
                  Opened
                </span>
              )}
            </div>
            <span className="text-xs text-stone-700 block truncate">
              {item.quantity} {item.unit} · {item.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Storage tag */}
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-700 bg-stone-100/70 px-2 py-0.5 rounded-md">
            {getStorageIcon(item.storageLocation)}
            <span>{item.storageLocation}</span>
          </span>

          {/* Expiry Pill with dot */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
            isExpired ? 'bg-rose-50 text-rose-800' : isToday || isUrgent ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-stone-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{expiryLabel}</span>
          </span>

          {/* Subtle menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-stone-200/80 p-1 z-20 min-w-[130px] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onToggleOpened(item);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {item.isOpened ? <Lock className="w-3.5 h-3.5" /> : <PackageOpen className="w-3.5 h-3.5" />}
                  <span>{item.isOpened ? 'Mark Sealed' : 'Mark Opened'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = item.storageLocation === 'Fridge' ? 'Freezer' : item.storageLocation === 'Freezer' ? 'Pantry' : 'Fridge';
                    onChangeLocation(item, next);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Refrigerator className="w-3.5 h-3.5" />
                  <span>Move Place</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const reason = window.prompt('Reason for tossing?');
                    onMarkWasted(item, reason || undefined);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Toss / Spoiled</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDelete(item.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Minimalist Card View
  // ----------------------------------------------------
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between relative group">
      <div>
        {/* Top: Status dot & Storage Tag & Menu */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-700 font-medium bg-stone-100/80 px-2 py-0.5 rounded-md">
            {getStorageIcon(item.storageLocation)}
            <span>{item.storageLocation}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Preservation tip toggle */}
            {item.preservationTip && (
              <button
                type="button"
                onClick={() => setShowTip(!showTip)}
                className="p-1 rounded text-stone-600 hover:text-amber-700 transition-colors cursor-pointer"
                title="Freshness tip"
              >
                <Lightbulb className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-stone-200/80 p-1 z-20 min-w-[130px] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleOpened(item);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {item.isOpened ? <Lock className="w-3.5 h-3.5" /> : <PackageOpen className="w-3.5 h-3.5" />}
                    <span>{item.isOpened ? 'Mark Sealed' : 'Mark Opened'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = item.storageLocation === 'Fridge' ? 'Freezer' : item.storageLocation === 'Freezer' ? 'Pantry' : 'Fridge';
                      onChangeLocation(item, next);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Refrigerator className="w-3.5 h-3.5" />
                    <span>Move Place</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt('Reason for tossing?');
                      onMarkWasted(item, reason || undefined);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Toss / Spoiled</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDelete(item.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Food Name & Quantity */}
        <div className="mb-3">
          <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">
            {item.name}
          </h3>
          <p className="text-xs text-stone-700 mt-0.5">
            {item.quantity} {item.unit} · {item.category}
            {item.isOpened && ' (opened)'}
          </p>
        </div>

        {/* Tip content if toggled */}
        {showTip && item.preservationTip && (
          <div className="mb-3 p-2.5 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-800">Tip</span>
            {item.preservationTip}
          </div>
        )}
      </div>

      {/* Bottom Row: Expiry Status & Quick Eat Button */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          isExpired ? 'bg-rose-50 text-rose-800' : isToday || isUrgent ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-stone-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <span>{expiryLabel}</span>
        </span>

        <button
          type="button"
          onClick={() => onMarkConsumed(item)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 font-medium text-xs transition-colors cursor-pointer"
          title="Mark eaten"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ate it</span>
        </button>
      </div>
    </div>
  );
};
