export type ItemCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Meat & Seafood'
  | 'Bakery'
  | 'Pantry & Cans'
  | 'Frozen'
  | 'Beverages'
  | 'Condiments & Spices'
  | 'Other';

export type StorageLocation = 'Fridge' | 'Pantry' | 'Freezer';

export type ItemStatus = 'active' | 'consumed' | 'wasted';

export interface PantryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string;   // YYYY-MM-DD
  storageLocation: StorageLocation;
  isOpened: boolean;
  openedDate?: string;
  estimatedCost: number; // in USD
  status: ItemStatus;
  consumedAt?: string;
  wastedAt?: string;
  wasteReason?: string;
  preservationTip?: string;
  createdAt: string;
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  description: string;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  servings: number;
  expiringIngredientsUsed: string[];
  otherPantryIngredients: string[];
  missingOrOptionalIngredients: string[];
  instructions: string[];
  zeroWasteTip: string;
  estimatedSavingsUsd: number;
}

export interface ShelfLifeEstimateResult {
  estimatedDays: number;
  optimalStorage: StorageLocation;
  preservationTip: string;
  typicalCostUsd: number;
  category: ItemCategory;
}

export interface ScannedFoodItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  estimatedShelfLifeDays: number;
  expiryDate: string; // YYYY-MM-DD
  estimatedCost: number;
  preservationTip: string;
  confidence?: 'high' | 'medium' | 'low';
  selected?: boolean;
}

export interface PantryAnalytics {
  totalActiveItems: number;
  expiringIn3DaysCount: number;
  expiredCount: number;
  freshCount: number;
  totalPantryValueUsd: number;
  totalMoneySavedUsd: number;
  totalMoneyWastedUsd: number;
  wasteDivertedKg: number;
  wasteRatioPercent: number;
  itemsByCategory: Record<string, number>;
}
