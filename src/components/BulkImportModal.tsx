import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2, Trash2 } from 'lucide-react';
import { PantryItem } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsImported: (newItems: PantryItem[]) => void;
}

const SAMPLE_LISTS = [
  {
    name: 'Weekly Essentials',
    text: '2 gallons Whole Milk, 1 box Baby Spinach, 6 Bananas, 1 lb Ground Beef, 1 loaf Sourdough Bread, 1 carton Eggs',
  },
  {
    name: 'Produce Haul',
    text: '2 bunches Kale, 1 punnet Blueberries, 3 Heirloom Tomatoes, 1 bag Carrots, fresh Basil',
  },
];

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onItemsImported,
}) => {
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!text.trim()) return;

    setIsParsing(true);
    setParsedItems([]);

    try {
      const res = await fetch('/api/ai/parse-receipt-or-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setParsedItems(data.items);
      }
    } catch (err) {
      console.error('Failed to parse text:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveParsed = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportAll = async () => {
    if (parsedItems.length === 0) return;

    setIsSaving(true);
    try {
      const createdItems: PantryItem[] = [];
      for (const item of parsedItems) {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        const data = await res.json();
        if (data.success && data.item) {
          createdItems.push(data.item);
        }
      }

      onItemsImported(createdItems);
      onClose();
    } catch (err) {
      console.error('Failed to bulk save items:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-stone-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Paste Grocery Notes or Receipt</h2>
            <p className="text-xs text-stone-700">Gemini will auto-assign categories, places, and expiration dates</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-stone-700 font-medium">Quick samples:</span>
            {SAMPLE_LISTS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => setText(sample.text)}
                className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
              >
                {sample.name}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw text (e.g. 1 gal milk, 2 avocados, loaf sourdough, bag spinach...)"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none font-mono text-xs"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParse}
              disabled={!text.trim() || isParsing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Parse Items</span>
                </>
              )}
            </button>
          </div>

          {/* Parsed Results */}
          {parsedItems.length > 0 && (
            <div className="border border-stone-200 rounded-xl overflow-hidden mt-3">
              <div className="bg-stone-50 px-3.5 py-2 border-b border-stone-100 flex items-center justify-between">
                <span className="font-semibold text-stone-800">
                  Ready to add ({parsedItems.length} items)
                </span>
                <span className="text-stone-700">
                  Est. ${parsedItems.reduce((s, it) => s + (it.estimatedCost || 0), 0).toFixed(2)}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-stone-100">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-stone-50">
                    <div className="min-w-0">
                      <span className="font-medium text-stone-900 block truncate">{item.name}</span>
                      <span className="text-[11px] text-stone-700 block">
                        {item.quantity} {item.unit} · {item.storageLocation} · Expires {item.expiryDate}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParsed(idx)}
                      className="text-stone-600 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleImportAll}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add all to pantry</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
