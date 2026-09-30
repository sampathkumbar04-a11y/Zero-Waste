import React, { useState } from 'react';
import { 
  Check, 
  Flame, 
  Refrigerator, 
  Package, 
  Snowflake, 
  Sparkles, 
  Plus, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Leaf,
  ChevronRight,
  RotateCcw,
  ChefHat,
  Users,
  Camera
} from 'lucide-react';
import { PantryItem, PantryAnalytics, StorageLocation } from '../types';

interface PhoneScreenProps {
  screenId: 'urgent' | 'fridge' | 'pantry' | 'freezer' | 'chef' | 'analytics';
  items: PantryItem[];
  analytics: PantryAnalytics | null;
  onMarkConsumed: (item: PantryItem) => void;
  onMarkWasted: (item: PantryItem, reason?: string) => void;
  onToggleOpened: (item: PantryItem) => void;
  onChangeLocation: (item: PantryItem, newLoc: StorageLocation) => void;
  onOpenAddModal: (defaultLoc?: StorageLocation) => void;
  onOpenScanModal?: (defaultLoc?: StorageLocation) => void;
  onOpenRecipeModal: () => void;
  onOpenAnalyticsModal: () => void;
  onNavigateScreen?: (screenId: 'urgent' | 'fridge' | 'pantry' | 'freezer' | 'chef' | 'analytics') => void;
}

export const PhoneScreen: React.FC<PhoneScreenProps> = ({
  screenId,
  items,
  analytics,
  onMarkConsumed,
  onMarkWasted,
  onToggleOpened,
  onChangeLocation,
  onOpenAddModal,
  onOpenScanModal,
  onOpenRecipeModal,
  onOpenAnalyticsModal,
  onNavigateScreen,
}) => {
  const [chefLoading, setChefLoading] = useState(false);
  const [quickRecipes, setQuickRecipes] = useState<any[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const activeItems = items.filter((it) => it.status === 'active');
  const urgentItems = activeItems.filter((it) => it.expiryDate <= threeDaysStr);
  const fridgeItems = activeItems.filter((it) => it.storageLocation === 'Fridge');
  const pantryItems = activeItems.filter((it) => it.storageLocation === 'Pantry');
  const freezerItems = activeItems.filter((it) => it.storageLocation === 'Freezer');

  const getDaysLeft = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const generateQuickRecipes = async () => {
    setChefLoading(true);
    try {
      const res = await fetch('/api/ai/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietaryPreference: 'Any Diet' }),
      });
      const data = await res.json();
      if (data.success && data.recipes) {
        setQuickRecipes(data.recipes.slice(0, 2));
      }
    } catch (err) {
      console.error('Quick recipe error:', err);
    } finally {
      setChefLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // SCREEN 1: URGENT & EXPIRATION RADAR
  // ---------------------------------------------------------------
  if (screenId === 'urgent') {
    return (
      <div className="flex flex-col h-full bg-[#fbfbfa] text-stone-900 select-none">
        {/* Screen Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white/70 backdrop-blur-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Freshness Radar
            </span>
            <h2 className="text-base font-bold text-stone-900 leading-tight">Eat Soon</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200">
            {urgentItems.length} critical
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Quick Alert Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-950 block">Expiring Food Value</span>
              <span className="text-[11px] text-amber-900/80 block mt-0.5">
                Save ${urgentItems.reduce((s, it) => s + (it.estimatedCost || 0), 0).toFixed(2)} before it spoils
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenRecipeModal}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Cook</span>
            </button>
          </div>

          {/* Urgent Food List */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-stone-700 px-1 block">
              Urgent Items ({urgentItems.length})
            </span>

            {urgentItems.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-stone-200/70 space-y-2 my-4">
                <span className="text-2xl block">🎉</span>
                <h4 className="text-xs font-bold text-stone-800">Pantry is in the Clear!</h4>
                <p className="text-[11px] text-stone-700">No food is expiring in the next 3 days.</p>
              </div>
            ) : (
              urgentItems.map((item) => {
                const days = getDaysLeft(item.expiryDate);
                const isToday = days === 0;
                const isExpired = days < 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpired ? 'bg-rose-600' : isToday ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-bold text-xs text-stone-900 truncate block">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-700 flex items-center gap-1.5 mt-0.5">
                        <span>{item.quantity} {item.unit}</span>
                        <span>·</span>
                        <span>{item.storageLocation}</span>
                        <span>·</span>
                        <span className="font-semibold text-rose-700">
                          {isExpired ? 'Expired' : isToday ? 'Today!' : `${days}d left`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onMarkConsumed(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      title="Mark as eaten"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Ate</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Quick Action */}
        <div className="p-3 pb-3.5 border-t border-stone-100 bg-white shrink-0 space-y-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={() => onOpenScanModal('Fridge')}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Snap Picture to Add & Set Expiry</span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenAddModal('Fridge')}
              className="flex-1 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Groceries</span>
            </button>
            <button
              type="button"
              onClick={onOpenRecipeModal}
              className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Rescue Chef</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SCREEN 2: FRIDGE ZONE
  // ---------------------------------------------------------------
  if (screenId === 'fridge') {
    return (
      <div className="flex flex-col h-full bg-[#f8fafc] text-stone-900 select-none">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-200/60 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Refrigerator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Zone 01</span>
              <h2 className="text-base font-bold text-stone-900 leading-tight">The Fridge</h2>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
            {fridgeItems.length} items
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          <div className="p-3 bg-sky-50/70 border border-sky-200/60 rounded-2xl flex items-center justify-between text-xs text-sky-950">
            <span>🌡️ Temperature: <strong>37°F Optimal</strong></span>
            <span className="text-[11px] text-sky-800">Crisper calibrated</span>
          </div>

          {fridgeItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/70 space-y-2">
              <Refrigerator className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-xs font-bold text-stone-800">Fridge is empty</h4>
              <p className="text-[11px] text-stone-700">Add milk, produce, eggs, or deli items.</p>
            </div>
          ) : (
            fridgeItems.map((item) => {
              const days = getDaysLeft(item.expiryDate);
              const isUrgent = days <= 3;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-stone-900 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-stone-700 block">
                      {item.quantity} {item.unit} · {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${isUrgent ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'}`}>
                      {days <= 0 ? 'Expires today' : `${days}d`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMarkConsumed(item)}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Ate it"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom */}
        <div className="p-3 pb-3.5 border-t border-stone-200/60 bg-white shrink-0 grid grid-cols-2 gap-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={() => onOpenScanModal('Fridge')}
              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Snap Photo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAddModal('Fridge')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              onOpenScanModal ? 'bg-stone-100 hover:bg-stone-200 text-stone-800' : 'bg-stone-900 hover:bg-stone-800 text-white col-span-2'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Add</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SCREEN 3: PANTRY STAPLES
  // ---------------------------------------------------------------
  if (screenId === 'pantry') {
    return (
      <div className="flex flex-col h-full bg-[#faf8f5] text-stone-900 select-none">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-200/60 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Zone 02</span>
              <h2 className="text-base font-bold text-stone-900 leading-tight">Pantry Staples</h2>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            {pantryItems.length} items
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-xs text-amber-950">
            <span>🌾 Grains, pasta, cans, oils, and dry goods shelf life.</span>
          </div>

          {pantryItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/70 space-y-2">
              <Package className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-xs font-bold text-stone-800">Pantry is empty</h4>
              <p className="text-[11px] text-stone-700">Add rice, beans, pasta, sauces or snacks.</p>
            </div>
          ) : (
            pantryItems.map((item) => {
              const days = getDaysLeft(item.expiryDate);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-stone-900 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-stone-700 block">
                      {item.quantity} {item.unit} · {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {days}d left
                    </span>
                    <button
                      type="button"
                      onClick={() => onMarkConsumed(item)}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Ate it"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom */}
        <div className="p-3 pb-3.5 border-t border-stone-200/60 bg-white shrink-0 grid grid-cols-2 gap-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={() => onOpenScanModal('Pantry')}
              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Snap Photo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAddModal('Pantry')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              onOpenScanModal ? 'bg-stone-100 hover:bg-stone-200 text-stone-800' : 'bg-stone-900 hover:bg-stone-800 text-white col-span-2'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Add</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SCREEN 4: FREEZER VAULT
  // ---------------------------------------------------------------
  if (screenId === 'freezer') {
    return (
      <div className="flex flex-col h-full bg-[#f1f5f9] text-stone-900 select-none">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-200/60 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Zone 03</span>
              <h2 className="text-base font-bold text-stone-900 leading-tight">Freezer Vault</h2>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
            {freezerItems.length} items
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl text-xs text-indigo-950 flex items-center justify-between">
            <span>❄️ Long-term frozen stock paused</span>
            <span className="text-[11px] text-indigo-800 font-semibold">0°F Frozen</span>
          </div>

          {freezerItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/70 space-y-2">
              <Snowflake className="w-8 h-8 text-stone-300 mx-auto" />
              <h4 className="text-xs font-bold text-stone-800">Freezer is empty</h4>
              <p className="text-[11px] text-stone-700">Move meats or ripe bananas here to freeze time.</p>
            </div>
          ) : (
            freezerItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-stone-900 truncate block">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-stone-700 block">
                    {item.quantity} {item.unit} · {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onChangeLocation(item, 'Fridge')}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                    title="Thaw in fridge"
                  >
                    Thaw
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarkConsumed(item)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Ate it"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom */}
        <div className="p-3 pb-3.5 border-t border-stone-200/60 bg-white shrink-0 grid grid-cols-2 gap-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={() => onOpenScanModal('Freezer')}
              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Snap Photo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAddModal('Freezer')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              onOpenScanModal ? 'bg-stone-100 hover:bg-stone-200 text-stone-800' : 'bg-stone-900 hover:bg-stone-800 text-white col-span-2'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Add</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SCREEN 5: ZERO-WASTE CHEF
  // ---------------------------------------------------------------
  if (screenId === 'chef') {
    return (
      <div className="flex flex-col h-full bg-[#fafaf9] text-stone-900 select-none">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-200/60 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Gemini 3.8</span>
              <h2 className="text-base font-bold text-stone-900 leading-tight">Rescue Chef</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRecipeModal}
            className="text-xs font-semibold text-amber-900 hover:underline cursor-pointer"
          >
            Expand
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Target Rescues */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Ingredients to Rescue:
              </span>
              <span className="text-[10px] font-semibold text-amber-900 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                {urgentItems.length} items
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {urgentItems.length > 0 ? (
                urgentItems.map((it) => (
                  <span
                    key={it.id}
                    className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] font-medium text-amber-900"
                  >
                    {it.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-stone-700 italic">No urgent items. Will use fresh stock!</span>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={generateQuickRecipes}
            disabled={chefLoading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{chefLoading ? 'Crafting Recipe...' : 'Generate Rescue Recipes'}</span>
          </button>

          {/* Quick Recipes Display */}
          {quickRecipes.length > 0 ? (
            <div className="space-y-2.5">
              {quickRecipes.map((rec, idx) => (
                <div key={idx} className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{rec.title}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Save ${rec.estimatedSavingsUsd?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700 leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rec.cookTimeMinutes}m
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenRecipeModal()}
                      className="font-semibold text-amber-900 hover:underline"
                    >
                      View Instructions →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-stone-200/70 space-y-1.5">
              <span className="text-2xl block">🍲</span>
              <h4 className="text-xs font-bold text-stone-800">Zero-Waste Cooking</h4>
              <p className="text-[11px] text-stone-700">
                Tap generate to craft a meal pairing your soon-to-expire foods.
              </p>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="p-3.5 pb-4 border-t border-stone-200/60 bg-white shrink-0">
          <button
            type="button"
            onClick={onOpenRecipeModal}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open Recipe Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SCREEN 6: ECO & SAVINGS IMPACT
  // ---------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-[#f8faf9] text-stone-900 select-none">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-stone-200/60 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Impact</span>
            <h2 className="text-base font-bold text-stone-900 leading-tight">Eco & Savings</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAnalyticsModal}
          className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
        >
          Details
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Big Savings Card */}
        <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-1 shadow-xs">
          <span className="text-[11px] text-stone-400 font-medium">Money Rescued</span>
          <span className="text-3xl font-extrabold text-emerald-400 block tracking-tight">
            ${analytics?.totalMoneySavedUsd?.toFixed(2) || '0.00'}
          </span>
          <span className="text-[11px] text-stone-300 block pt-1">
            {analytics?.consumedCount || 0} grocery items eaten before expiring
          </span>
        </div>

        {/* Environmental metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-2xl border border-stone-200/80">
            <span className="text-[10px] font-bold uppercase text-stone-700 block">Food Rescued</span>
            <span className="text-lg font-bold text-stone-900 mt-0.5 block">
              {analytics?.wasteDivertedKg || 0} kg
            </span>
            <span className="text-[10px] text-stone-700">Landfill averted</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200/80">
            <span className="text-[10px] font-bold uppercase text-stone-700 block">CO₂ Saved</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">
              ~{((analytics?.wasteDivertedKg || 0) * 2.5).toFixed(1)} kg
            </span>
            <span className="text-[10px] text-stone-700">Greenhouse gas</span>
          </div>
        </div>

        {/* Spoilage Loss */}
        <div className="p-3 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-700 block font-medium">Spoiled Food Loss</span>
            <span className="text-[11px] text-rose-700 mt-0.5 block">
              ${analytics?.totalMoneyWastedUsd?.toFixed(2) || '0.00'} ({analytics?.wastedCount || 0} items)
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-100 text-stone-700">
            {analytics?.wasteRatioPercent || 0}% waste
          </span>
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3.5 pb-4 border-t border-stone-200/60 bg-white shrink-0">
        <button
          type="button"
          onClick={onOpenAnalyticsModal}
          className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>View Full Analytics Report</span>
        </button>
      </div>
    </div>
  );
};
