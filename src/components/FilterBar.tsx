import React from 'react';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { ItemCategory } from '../types';

export type ViewTab = 'all' | 'urgent' | 'fridge' | 'pantry' | 'freezer' | 'history';
export type SortOption = 'expiry-asc' | 'expiry-desc' | 'name-asc' | 'cost-desc';
export type DisplayMode = 'grid' | 'list';

interface FilterBarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  urgentCount: number;
  totalActiveCount: number;
  filteredCount: number;
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

export const FilterBar: React.FC<FilterBarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  displayMode,
  onDisplayModeChange,
  urgentCount,
  totalActiveCount,
  filteredCount,
}) => {
  return (
    <div className="space-y-3 mb-6">
      {/* Top row: Tab pills, Search, Layout mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Clean Segmented Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-stone-200/60 border border-stone-200/50 self-start overflow-x-auto max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            All ({totalActiveCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange('urgent')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'urgent'
                ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span>Eat Soon</span>
            {urgentCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('fridge')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'fridge'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Fridge
          </button>

          <button
            type="button"
            onClick={() => onTabChange('pantry')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'pantry'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Pantry
          </button>

          <button
            type="button"
            onClick={() => onTabChange('freezer')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'freezer'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Freezer
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'history'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            History
          </button>
        </div>

        {/* Right side: Search + Sort + View Toggle */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-2.5 py-1.5 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="expiry-asc">Expiry (Earliest)</option>
            <option value="expiry-desc">Expiry (Latest)</option>
            <option value="cost-desc">Price (Highest)</option>
            <option value="name-asc">Name (A-Z)</option>
          </select>

          {/* Grid / List Mode */}
          <div className="inline-flex p-0.5 rounded-lg bg-stone-200/60 border border-stone-200/50">
            <button
              type="button"
              onClick={() => onDisplayModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-700 hover:text-stone-900'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDisplayModeChange('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'list' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-700 hover:text-stone-900'
              }`}
              title="Compact list view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category pills row (subtle and scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === ''
              ? 'bg-stone-900 text-white font-medium'
              : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200/60'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(selectedCategory === cat ? '' : cat)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-stone-900 text-white font-medium'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
