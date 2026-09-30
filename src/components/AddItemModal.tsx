import React, { useState } from 'react';
import { X, Sparkles, Loader2, Calendar, Camera } from 'lucide-react';
import { ItemCategory, StorageLocation, ShelfLifeEstimateResult } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: any) => void;
  initialLocation?: StorageLocation;
  onOpenScanModal?: () => void;
}

const CATEGORIES: ItemCategory[] = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Cans',
  'Frozen',
  'Beverages',
  'Condiments & Spices',
  'Other',
];

export const AddItemModal: React.FC<AddItemModalProps> = ({ 
  isOpen, 
  onClose, 
  onItemAdded,
  initialLocation = 'Fridge',
  onOpenScanModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpiryStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(initialLocation);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryStr);
  const [isOpened, setIsOpened] = useState(false);
  const [cost, setCost] = useState('3.00');

  React.useEffect(() => {
    if (initialLocation) {
      setStorageLocation(initialLocation);
    }
  }, [initialLocation, isOpen]);

  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preservationTip, setPreservationTip] = useState('');
  const [aiNote, setAiNote] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quick preset days helper
  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  // Auto-estimate shelf-life via AI
  const handleAutoEstimate = async (itemName: string) => {
    if (!itemName.trim()) return;
    setIsEstimating(true);
    setAiNote(null);

    try {
      const res = await fetch('/api/ai/estimate-shelf-life', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemName.trim(),
          category,
          storageLocation,
          isOpened,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        const result: ShelfLifeEstimateResult = data.result;
        setPresetDays(result.estimatedDays || 7);
        if (result.optimalStorage) setStorageLocation(result.optimalStorage);
        if (result.category) setCategory(result.category);
        if (result.typicalCostUsd) setCost(result.typicalCostUsd.toFixed(2));
        if (result.preservationTip) setPreservationTip(result.preservationTip);
        setAiNote(`~${result.estimatedDays}d in ${result.optimalStorage}`);
      }
    } catch (err) {
      console.error('Failed to estimate shelf life:', err);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || 'pcs',
        storageLocation,
        purchaseDate: todayStr,
        expiryDate,
        estimatedCost: parseFloat(cost) || 3.0,
        isOpened,
        preservationTip: preservationTip.trim() || undefined,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.item) {
        onItemAdded(data.item);
        onClose();
        // Reset form
        setName('');
        setPreservationTip('');
        setAiNote(null);
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-stone-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Add Groceries</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Camera Scan Callout */}
        {onOpenScanModal && (
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanModal();
              }}
              className="w-full p-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-all flex items-center justify-between shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block leading-tight">📸 Snap Picture to Add Items</span>
                  <span className="text-[10px] text-stone-300 block">AI defines item names, then lets you enter expiry dates</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-white/90 bg-white/10 px-2 py-0.5 rounded-md group-hover:bg-white/20">
                Scan Food →
              </span>
            </button>
          </div>
        )}

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Item Name with smart AI helper */}
          <div>
            <label className="block font-medium text-stone-700 mb-1.5">
              What did you buy?
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Milk, Baby Spinach, Sourdough, Apples..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (name.trim() && !aiNote) {
                    handleAutoEstimate(name);
                  }
                }}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
              <button
                type="button"
                onClick={() => handleAutoEstimate(name)}
                disabled={!name.trim() || isEstimating}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200/60 disabled:opacity-40 transition-colors cursor-pointer"
                title="Auto-detect shelf-life"
              >
                {isEstimating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-600" />
                )}
                <span>Auto</span>
              </button>
            </div>
            {aiNote && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                ✓ Auto-detected: {aiNote}
              </p>
            )}
          </div>

          {/* Storage Location Selector */}
          <div>
            <label className="block font-medium text-stone-700 mb-1.5">Storage</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
              {(['Fridge', 'Pantry', 'Freezer'] as StorageLocation[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setStorageLocation(loc)}
                  className={`py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                    storageLocation === loc
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Expiration Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-stone-700">Expires</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="text-[11px] text-stone-600 border border-stone-200 rounded px-1.5 py-0.5 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+2d', days: 2 },
                { label: '+4d', days: 4 },
                { label: '+1 wk', days: 7 },
                { label: '+2 wks', days: 14 },
                { label: '+1 mo', days: 30 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPresetDays(preset.days)}
                  className="px-2.5 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Category */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Quantity</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-16 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opened checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isOpened}
              onChange={(e) => setIsOpened(e.target.checked)}
              className="w-3.5 h-3.5 text-stone-900 rounded border-stone-300"
            />
            <span className="text-stone-600 text-xs">Already opened package</span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
