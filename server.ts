import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { PantryItem, ItemCategory, StorageLocation, RecipeSuggestion, ShelfLifeEstimateResult } from './src/types';

dotenv.config();

const app = express();
const isStandalone = process.env.STANDALONE_BACKEND === 'true' || process.argv.includes('--standalone');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (isStandalone ? 5000 : 3000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI client initialization
let genAiClient: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// In-memory data store with realistic initial seeds
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return formatDate(res);
};

let pantryItems: PantryItem[] = [
  {
    id: 'item-1',
    name: 'Organic Baby Spinach',
    category: 'Produce',
    quantity: 1,
    unit: 'tub (300g)',
    purchaseDate: addDays(today, -4),
    expiryDate: addDays(today, 1),
    storageLocation: 'Fridge',
    isOpened: true,
    openedDate: addDays(today, -2),
    estimatedCost: 3.99,
    status: 'active',
    preservationTip: 'Slip a paper towel inside the tub to absorb condensation and prevent leaves from wilting.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    name: 'Whole Milk',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'half-gallon',
    purchaseDate: addDays(today, -5),
    expiryDate: addDays(today, 2),
    storageLocation: 'Fridge',
    isOpened: true,
    openedDate: addDays(today, -3),
    estimatedCost: 2.89,
    status: 'active',
    preservationTip: 'Store on an interior fridge shelf rather than the door for constant 37°F temperature.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    name: 'Boneless Chicken Breast',
    category: 'Meat & Seafood',
    quantity: 2,
    unit: 'breasts (500g)',
    purchaseDate: addDays(today, -1),
    expiryDate: addDays(today, 1),
    storageLocation: 'Fridge',
    isOpened: false,
    estimatedCost: 6.50,
    status: 'active',
    preservationTip: 'Cook today or freeze immediately in an airtight freezer bag to extend shelf life by 9 months.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    name: 'Artisan Sourdough Loaf',
    category: 'Bakery',
    quantity: 0.5,
    unit: 'loaf',
    purchaseDate: addDays(today, -3),
    expiryDate: addDays(today, 2),
    storageLocation: 'Pantry',
    isOpened: true,
    estimatedCost: 4.50,
    status: 'active',
    preservationTip: 'Store cut side down on a wooden cutting board or freeze pre-sliced for easy toasting.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-5',
    name: 'Fresh Strawberries',
    category: 'Produce',
    quantity: 1,
    unit: 'punnet (400g)',
    purchaseDate: addDays(today, -3),
    expiryDate: addDays(today, 2),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 4.25,
    status: 'active',
    preservationTip: 'Wash only right before eating. A quick vinegar-water rinse when purchased kills mold spores.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-6',
    name: 'Greek Plain Yogurt',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'tub (500g)',
    purchaseDate: addDays(today, -7),
    expiryDate: addDays(today, 3),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 3.49,
    status: 'active',
    preservationTip: 'Level off the top after spooning out to keep whey submerged and prevent surface spoilage.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-7',
    name: 'Bell Peppers (Trio)',
    category: 'Produce',
    quantity: 3,
    unit: 'peppers',
    purchaseDate: addDays(today, -2),
    expiryDate: addDays(today, 5),
    storageLocation: 'Fridge',
    isOpened: false,
    estimatedCost: 3.75,
    status: 'active',
    preservationTip: 'Keep in vegetable crisper drawer with moderate humidity; slice and freeze if not cooking soon.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-8',
    name: 'Pasture-Raised Large Eggs',
    category: 'Dairy & Eggs',
    quantity: 8,
    unit: 'eggs',
    purchaseDate: addDays(today, -4),
    expiryDate: addDays(today, 18),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 4.80,
    status: 'active',
    preservationTip: 'Keep in original carton to protect shells and prevent egg odors absorption.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-9',
    name: 'Sharp Cheddar Cheese Block',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'block (250g)',
    purchaseDate: addDays(today, -10),
    expiryDate: addDays(today, 22),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 4.20,
    status: 'active',
    preservationTip: 'Wrap loosely in parchment paper, then in a loose zip bag to allow cheese to breathe without drying.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-10',
    name: 'Dry Rigatoni Pasta',
    category: 'Pantry & Cans',
    quantity: 2,
    unit: 'boxes (500g)',
    purchaseDate: addDays(today, -20),
    expiryDate: addDays(today, 300),
    storageLocation: 'Pantry',
    isOpened: false,
    estimatedCost: 2.50,
    status: 'active',
    preservationTip: 'Store in airtight container away from heat or sunlight.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-11',
    name: 'Canned Crushed San Marzano Tomatoes',
    category: 'Pantry & Cans',
    quantity: 2,
    unit: 'cans (800g)',
    purchaseDate: addDays(today, -15),
    expiryDate: addDays(today, 360),
    storageLocation: 'Pantry',
    isOpened: false,
    estimatedCost: 4.90,
    status: 'active',
    preservationTip: 'Once opened, transfer leftover tomato puree into glass container; never leave in opened tin can.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-12',
    name: 'Extra Virgin Olive Oil',
    category: 'Condiments & Spices',
    quantity: 1,
    unit: 'bottle (750ml)',
    purchaseDate: addDays(today, -30),
    expiryDate: addDays(today, 240),
    storageLocation: 'Pantry',
    isOpened: true,
    estimatedCost: 11.50,
    status: 'active',
    preservationTip: 'Keep in dark cool cupboard away from stove heat to prevent rancidity.',
    createdAt: new Date().toISOString(),
  },
  // Previous logs to seed historical analytics
  {
    id: 'item-hist-1',
    name: 'Ripe Avocados',
    category: 'Produce',
    quantity: 2,
    unit: 'avocados',
    purchaseDate: addDays(today, -8),
    expiryDate: addDays(today, -2),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 3.50,
    status: 'consumed',
    consumedAt: addDays(today, -3),
    createdAt: addDays(today, -8),
  },
  {
    id: 'item-hist-2',
    name: 'Atlantic Salmon Fillet',
    category: 'Meat & Seafood',
    quantity: 1,
    unit: 'pack (400g)',
    purchaseDate: addDays(today, -10),
    expiryDate: addDays(today, -7),
    storageLocation: 'Fridge',
    isOpened: false,
    estimatedCost: 9.80,
    status: 'consumed',
    consumedAt: addDays(today, -8),
    createdAt: addDays(today, -10),
  },
  {
    id: 'item-hist-3',
    name: 'Heavy Cream',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'small carton',
    purchaseDate: addDays(today, -14),
    expiryDate: addDays(today, -4),
    storageLocation: 'Fridge',
    isOpened: true,
    estimatedCost: 2.75,
    status: 'wasted',
    wastedAt: addDays(today, -3),
    wasteReason: 'Sour smell / separation after forgotten in door',
    createdAt: addDays(today, -14),
  },
];

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    itemCount: pantryItems.length,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Inventory CRUD
app.get('/api/inventory', (req: Request, res: Response) => {
  const statusFilter = req.query.status as string;
  let items = [...pantryItems];
  if (statusFilter) {
    items = items.filter((it) => it.status === statusFilter);
  }
  res.json({ success: true, items });
});

app.post('/api/inventory', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.name.trim()) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  const purchaseDate = data.purchaseDate || formatDate(new Date());
  let expiryDate = data.expiryDate;

  // Fallback default if not specified
  if (!expiryDate) {
    expiryDate = addDays(new Date(purchaseDate), 7);
  }

  const newItem: PantryItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    category: data.category || 'Produce',
    quantity: Number(data.quantity) || 1,
    unit: data.unit || 'pcs',
    purchaseDate,
    expiryDate,
    storageLocation: data.storageLocation || 'Fridge',
    isOpened: Boolean(data.isOpened),
    openedDate: data.isOpened ? (data.openedDate || purchaseDate) : undefined,
    estimatedCost: Number(data.estimatedCost) >= 0 ? Number(data.estimatedCost) : 3.5,
    status: 'active',
    preservationTip: data.preservationTip || 'Keep in appropriate cool, dry environment.',
    createdAt: new Date().toISOString(),
  };

  pantryItems.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = pantryItems.findIndex((it) => it.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const existing = pantryItems[index];
  const updates = req.body;

  // Handle status transitions
  if (updates.status === 'consumed' && existing.status !== 'consumed') {
    updates.consumedAt = new Date().toISOString().split('T')[0];
  } else if (updates.status === 'wasted' && existing.status !== 'wasted') {
    updates.wastedAt = new Date().toISOString().split('T')[0];
  }

  pantryItems[index] = {
    ...existing,
    ...updates,
    id: existing.id, // prevent overwriting ID
  };

  res.json({ success: true, item: pantryItems[index] });
});

app.delete('/api/inventory/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = pantryItems.length;
  pantryItems = pantryItems.filter((it) => it.id !== id);
  if (pantryItems.length === initialLen) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ success: true, message: 'Item deleted' });
});

// 3. Analytics Endpoint
app.get('/api/analytics', (req: Request, res: Response) => {
  const todayStr = formatDate(new Date());
  const threeDaysStr = addDays(new Date(), 3);

  const activeItems = pantryItems.filter((it) => it.status === 'active');
  const consumedItems = pantryItems.filter((it) => it.status === 'consumed');
  const wastedItems = pantryItems.filter((it) => it.status === 'wasted');

  let expiringIn3DaysCount = 0;
  let expiredCount = 0;
  let freshCount = 0;
  let totalPantryValueUsd = 0;

  const itemsByCategory: Record<string, number> = {};

  activeItems.forEach((item) => {
    totalPantryValueUsd += item.estimatedCost || 0;
    itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;

    if (item.expiryDate < todayStr) {
      expiredCount++;
    } else if (item.expiryDate <= threeDaysStr) {
      expiringIn3DaysCount++;
    } else {
      freshCount++;
    }
  });

  const totalMoneySavedUsd = consumedItems.reduce((sum, it) => sum + (it.estimatedCost || 0), 0);
  const totalMoneyWastedUsd = wastedItems.reduce((sum, it) => sum + (it.estimatedCost || 0), 0);

  const totalResolvedCost = totalMoneySavedUsd + totalMoneyWastedUsd;
  const wasteRatioPercent = totalResolvedCost > 0
    ? Math.round((totalMoneyWastedUsd / totalResolvedCost) * 100)
    : 0;

  // Approximate 0.7kg waste diverted per consumed item
  const wasteDivertedKg = Number((consumedItems.length * 0.65).toFixed(1));

  res.json({
    totalActiveItems: activeItems.length,
    expiringIn3DaysCount,
    expiredCount,
    freshCount,
    totalPantryValueUsd: Number(totalPantryValueUsd.toFixed(2)),
    totalMoneySavedUsd: Number(totalMoneySavedUsd.toFixed(2)),
    totalMoneyWastedUsd: Number(totalMoneyWastedUsd.toFixed(2)),
    wasteDivertedKg,
    wasteRatioPercent,
    itemsByCategory,
  });
});

// 4. AI Shelf-Life Estimator
app.post('/api/ai/estimate-shelf-life', async (req: Request, res: Response) => {
  const { itemName, category, storageLocation, isOpened } = req.body;

  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ error: 'itemName is required' });
  }

  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `Estimate shelf life, storage recommendation, typical unit cost in USD, and optimal preservation tip for:
Item: "${itemName}"
Specified Category (if any): "${category || 'Unknown'}"
Current Storage Location: "${storageLocation || 'Fridge'}"
Is Opened: ${Boolean(isOpened)}

Return realistic shelf life days from today.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedDays: {
                type: Type.INTEGER,
                description: 'Realistic shelf-life in days from today under recommended storage.',
              },
              optimalStorage: {
                type: Type.STRING,
                description: 'One of: "Fridge", "Pantry", "Freezer"',
              },
              category: {
                type: Type.STRING,
                description: 'One of: "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry & Cans", "Frozen", "Beverages", "Condiments & Spices", "Other"',
              },
              typicalCostUsd: {
                type: Type.NUMBER,
                description: 'Estimated average grocery retail cost in USD for this item.',
              },
              preservationTip: {
                type: Type.STRING,
                description: 'A crisp, actionable 1-2 sentence food science preservation or storage tip to maximize freshness.',
              },
            },
            required: ['estimatedDays', 'optimalStorage', 'category', 'typicalCostUsd', 'preservationTip'],
          },
        },
      });

      const parsed: ShelfLifeEstimateResult = JSON.parse(response.text?.trim() || '{}');
      return res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.warn('Gemini shelf life estimation failed, falling back to rule-based engine:', err?.message);
    }
  }

  // Rule-based fallback if no Gemini key or on error
  const nameLower = itemName.toLowerCase();
  let estimatedDays = 7;
  let optimalStorage: StorageLocation = 'Fridge';
  let cat: ItemCategory = 'Produce';
  let typicalCostUsd = 3.50;
  let preservationTip = 'Store in a cool dry place and seal tightly after opening.';

  if (nameLower.includes('spinach') || nameLower.includes('lettuce') || nameLower.includes('herb') || nameLower.includes('kale')) {
    estimatedDays = isOpened ? 3 : 5;
    optimalStorage = 'Fridge';
    cat = 'Produce';
    preservationTip = 'Slip a dry paper towel into the container to absorb moisture and stop slime.';
    typicalCostUsd = 2.99;
  } else if (nameLower.includes('milk') || nameLower.includes('cream')) {
    estimatedDays = isOpened ? 4 : 8;
    optimalStorage = 'Fridge';
    cat = 'Dairy & Eggs';
    preservationTip = 'Keep on main fridge shelves where temperature stays constant, not door pockets.';
    typicalCostUsd = 3.29;
  } else if (nameLower.includes('chicken') || nameLower.includes('fish') || nameLower.includes('beef') || nameLower.includes('pork')) {
    estimatedDays = isOpened ? 1 : 2;
    optimalStorage = 'Fridge';
    cat = 'Meat & Seafood';
    preservationTip = 'Freeze immediately in airtight freezer wraps if not cooking within 48 hours.';
    typicalCostUsd = 7.50;
  } else if (nameLower.includes('bread') || nameLower.includes('bagel') || nameLower.includes('croissant')) {
    estimatedDays = 4;
    optimalStorage = 'Pantry';
    cat = 'Bakery';
    preservationTip = 'Avoid the fridge which accelerates starch retrogradation; slice and freeze instead.';
    typicalCostUsd = 4.00;
  } else if (nameLower.includes('pasta') || nameLower.includes('rice') || nameLower.includes('oat') || nameLower.includes('can')) {
    estimatedDays = 180;
    optimalStorage = 'Pantry';
    cat = 'Pantry & Cans';
    preservationTip = 'Keep in airtight glass or container away from pantry pests and humidity.';
    typicalCostUsd = 2.50;
  }

  return res.json({
    success: true,
    result: {
      estimatedDays,
      optimalStorage,
      category: cat,
      typicalCostUsd,
      preservationTip,
    },
  });
});

// 5. AI Zero-Waste Recipe Generator
app.post('/api/ai/generate-recipes', async (req: Request, res: Response) => {
  const { dietaryPreference, selectedItemIds } = req.body;

  // Gather expiring and active items
  const activeItems = pantryItems.filter((it) => it.status === 'active');
  const todayStr = formatDate(new Date());
  const threeDaysStr = addDays(new Date(), 4);

  let candidateItems = activeItems.filter((it) => it.expiryDate <= threeDaysStr);
  if (candidateItems.length === 0) {
    // If none are expiring in 4 days, pick earliest expiring active items
    candidateItems = [...activeItems].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0, 4);
  }

  // If specific IDs were selected, prioritize them
  if (selectedItemIds && Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
    const selected = activeItems.filter((it) => selectedItemIds.includes(it.id));
    if (selected.length > 0) candidateItems = selected;
  }

  const expiringList = candidateItems.map((it) => `${it.name} (${it.quantity} ${it.unit}, expires in ${Math.max(0, Math.ceil((new Date(it.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days, stored in ${it.storageLocation})`).join(', ');
  const otherPantryList = activeItems.filter((it) => !candidateItems.some((c) => c.id === it.id)).map((it) => it.name).join(', ');

  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `You are an expert Zero-Waste Executive Chef.
Help the user cook delicious meals that immediately rescue food nearing its expiration date.

URGENT EXPIRING INGREDIENTS TO RESCUE:
${expiringList || 'Organic Baby Spinach, Whole Milk, Chicken Breast, Sourdough Loaf'}

OTHER PANTRY INGREDIENTS AVAILABLE:
${otherPantryList || 'Pasta, Canned Tomatoes, Olive Oil, Eggs, Cheddar Cheese'}

DIETARY PREFERENCE: ${dietaryPreference || 'Any'}

Generate 3 creative, delicious, home-cook-friendly zero-waste recipes.
Requirements:
1. Each recipe MUST highlight one or more of the urgent expiring ingredients.
2. Provide step-by-step instructions.
3. Include a specific Zero-Waste culinary tip (e.g. how to use stems, freeze leftovers, repurpose scraps).
4. Estimate grocery dollars saved by cooking this dish instead of letting items spoil.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                cookTimeMinutes: { type: Type.INTEGER },
                difficulty: { type: Type.STRING, description: '"Easy", "Medium", or "Advanced"' },
                servings: { type: Type.INTEGER },
                expiringIngredientsUsed: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                otherPantryIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                missingOrOptionalIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                zeroWasteTip: { type: Type.STRING },
                estimatedSavingsUsd: { type: Type.NUMBER },
              },
              required: [
                'id',
                'title',
                'description',
                'cookTimeMinutes',
                'difficulty',
                'servings',
                'expiringIngredientsUsed',
                'instructions',
                'zeroWasteTip',
                'estimatedSavingsUsd',
              ],
            },
          },
        },
      });

      const recipes: RecipeSuggestion[] = JSON.parse(response.text?.trim() || '[]');
      return res.json({ success: true, recipes });
    } catch (err: any) {
      console.warn('Gemini recipe generation failed, using intelligent chef fallback:', err?.message);
    }
  }

  // Fallback chef recipes if Gemini is unavailable
  const fallbackRecipes: RecipeSuggestion[] = [
    {
      id: 'recipe-1',
      title: 'Skillet Chicken Florentine with Wilted Greens & Sourdough Croutons',
      description: 'Pan-seared tender chicken smothered in a rich garlic cream sauce over an entire tub of wilted baby spinach, topped with golden crispy sourdough croutons.',
      cookTimeMinutes: 25,
      difficulty: 'Easy',
      servings: 2,
      expiringIngredientsUsed: ['Organic Baby Spinach', 'Boneless Chicken Breast', 'Artisan Sourdough Loaf'],
      otherPantryIngredients: ['Olive Oil', 'Whole Milk', 'Cheddar Cheese'],
      missingOrOptionalIngredients: ['Garlic clove', 'Salt & black pepper'],
      instructions: [
        'Cube the sourdough bread, toss in 1 tbsp olive oil with salt, and toast in a dry skillet until crunchy and golden.',
        'Season chicken breast with salt and pepper. Sear in olive oil over medium-high heat for 6 minutes per side until golden.',
        'Remove chicken, reduce heat to low, pour in 1/2 cup milk and simmer gently with grated cheddar cheese.',
        'Toss in all baby spinach and let it wilt down completely into the sauce (takes 90 seconds).',
        'Slice chicken over the creamed greens and scatter crunchy croutons on top.',
      ],
      zeroWasteTip: 'Wilted spinach cooks down to 1/10th its raw volume, making it the fastest way to rescue a full container before it turns slimy.',
      estimatedSavingsUsd: 14.50,
    },
    {
      id: 'recipe-2',
      title: 'One-Pot Creamy Tomato & Spinach Rigatoni Bake',
      description: 'Al dente pasta simmered in rich crushed tomatoes, whisked with milk and melted cheddar, folded with vibrant greens.',
      cookTimeMinutes: 20,
      difficulty: 'Easy',
      servings: 4,
      expiringIngredientsUsed: ['Whole Milk', 'Organic Baby Spinach'],
      otherPantryIngredients: ['Dry Rigatoni Pasta', 'Canned Crushed San Marzano Tomatoes', 'Sharp Cheddar Cheese Block'],
      missingOrOptionalIngredients: ['Dried oregano', 'Chili flakes'],
      instructions: [
        'Boil rigatoni in salted water until 1 minute shy of al dente; reserve 1/2 cup pasta cooking water.',
        'In a deep skillet, warm crushed tomatoes and whisk in whole milk to create a velvety pink rosa sauce.',
        'Fold in drained pasta, remaining spinach leaves, and grated sharp cheddar.',
        'Stir vigorously for 2 minutes until sauce clings to pasta and cheese is bubbly.',
      ],
      zeroWasteTip: 'Using near-date milk in warm tomato pasta sauces creates an instant Italian pink sauce while rescuing every drop.',
      estimatedSavingsUsd: 8.75,
    },
    {
      id: 'recipe-3',
      title: 'Quick Caramelized Strawberry French Toast Bake',
      description: 'Stale sourdough slices soaked in a rich vanilla custard, baked until custard-soft in the center and crowned with warm strawberry compote.',
      cookTimeMinutes: 18,
      difficulty: 'Easy',
      servings: 2,
      expiringIngredientsUsed: ['Artisan Sourdough Loaf', 'Fresh Strawberries', 'Whole Milk'],
      otherPantryIngredients: ['Pasture-Raised Large Eggs'],
      missingOrOptionalIngredients: ['Honey or maple syrup', 'Pinch of cinnamon'],
      instructions: [
        'Whisk 2 eggs with 1/2 cup whole milk and a pinch of cinnamon in a wide shallow bowl.',
        'Slice strawberries and toss into a small warm saucepan with 1 tsp honey until juicy and jammy.',
        'Soak dry sourdough slices for 40 seconds per side so they drink up the custard.',
        'Cook in a hot buttered skillet for 3 minutes per side until caramelized.',
        'Spoon warm strawberries and their syrup generously over toast.',
      ],
      zeroWasteTip: 'Dry, day-old bread absorbs custard without becoming mushy, making it actually superior to fresh bread for French toast.',
      estimatedSavingsUsd: 9.20,
    },
  ];

  return res.json({ success: true, recipes: fallbackRecipes });
});

// 6. AI Smart Grocery Receipt / List Text Parser
app.post('/api/ai/parse-receipt-or-list', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `Parse this grocery receipt, shopping note, or messy grocery text into structured pantry items:
"""
${text}
"""

For each food item:
- Identify name cleanly (e.g. "Whole Milk", "Avocados")
- Category (one of: "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry & Cans", "Frozen", "Beverages", "Condiments & Spices", "Other")
- Quantity and unit
- Recommended storageLocation ("Fridge", "Pantry", or "Freezer")
- Estimated days of shelf life from today (realistic number)
- Estimated cost in USD
- Actionable preservation tip`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                storageLocation: { type: Type.STRING },
                estimatedDays: { type: Type.INTEGER },
                estimatedCost: { type: Type.NUMBER },
                preservationTip: { type: Type.STRING },
              },
              required: ['name', 'category', 'quantity', 'unit', 'storageLocation', 'estimatedDays', 'estimatedCost'],
            },
          },
        },
      });

      const rawItems = JSON.parse(response.text?.trim() || '[]');
      const items = rawItems.map((item: any) => {
        const pDate = formatDate(new Date());
        const eDate = addDays(new Date(), item.estimatedDays || 7);
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name,
          category: item.category || 'Produce',
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          purchaseDate: pDate,
          expiryDate: eDate,
          storageLocation: item.storageLocation || 'Fridge',
          isOpened: false,
          estimatedCost: item.estimatedCost || 3.0,
          status: 'active',
          preservationTip: item.preservationTip || 'Store safely in dry cool area.',
          createdAt: new Date().toISOString(),
        };
      });

      return res.json({ success: true, items });
    } catch (err: any) {
      console.warn('Receipt parse failed with Gemini, using regex parser:', err?.message);
    }
  }

  // Fallback basic line parser
  const lines = text.split(/[\n,;]+/).map((l: string) => l.trim()).filter(Boolean);
  const items = lines.map((line: string) => {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: line.replace(/^[\d\s\-*•]+/, '').trim() || line,
      category: 'Produce' as ItemCategory,
      quantity: 1,
      unit: 'pack',
      purchaseDate: formatDate(new Date()),
      expiryDate: addDays(new Date(), 7),
      storageLocation: 'Fridge' as StorageLocation,
      isOpened: false,
      estimatedCost: 3.50,
      status: 'active' as const,
      preservationTip: 'Keep properly chilled to maximize shelf life.',
      createdAt: new Date().toISOString(),
    };
  });

  res.json({ success: true, items });
});

// 7. AI Visual Food Identifier (Capture / Upload Picture)
app.post('/api/ai/scan-food-image', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // Strip prefix data:image/...;base64, if present
  let cleanBase64 = imageBase64;
  let detectedMime = mimeType;
  const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    detectedMime = match[1];
    cleanBase64 = match[2];
  }

  const ai = getGenAi();
  if (ai) {
    try {
      const prompt = `Analyze this grocery/food image carefully.
Identify all visible food items, produce, grocery packages, bottles, dairy, bread, meats, or snacks.
For each distinct item recognized in the picture, specify:
1. "name": Specific, clean food name (e.g., "Honeycrisp Apples", "Whole Milk", "Avocados", "Greek Yogurt", "Romaine Lettuce", "Cheddar Cheese").
2. "category": Choose the best matching category from: ["Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry & Cans", "Frozen", "Beverages", "Condiments & Spices", "Other"].
3. "quantity": Approximate count/amount observed in the photo (e.g. 1, 2, 4, 6).
4. "unit": Natural unit (e.g., "pcs", "bunch", "bottle", "carton", "bag", "pack", "loaf", "box").
5. "storageLocation": Best zone to prevent waste: "Fridge", "Pantry", or "Freezer".
6. "estimatedShelfLifeDays": Realistic remaining shelf life in days from today based on visual appearance, ripeness, or standard food shelf-life.
7. "estimatedCost": Realistic retail grocery price in USD for this item/quantity.
8. "preservationTip": 1 actionable sentence on how to store this specific item to delay spoilage as long as possible.
9. "confidence": "high", "medium", or "low".

If no food items can be identified, return an empty array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: [
                    'Produce',
                    'Dairy & Eggs',
                    'Meat & Seafood',
                    'Bakery',
                    'Pantry & Cans',
                    'Frozen',
                    'Beverages',
                    'Condiments & Spices',
                    'Other',
                  ],
                },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                storageLocation: {
                  type: Type.STRING,
                  enum: ['Fridge', 'Pantry', 'Freezer'],
                },
                estimatedShelfLifeDays: { type: Type.INTEGER },
                estimatedCost: { type: Type.NUMBER },
                preservationTip: { type: Type.STRING },
                confidence: {
                  type: Type.STRING,
                  enum: ['high', 'medium', 'low'],
                },
              },
              required: [
                'name',
                'category',
                'quantity',
                'unit',
                'storageLocation',
                'estimatedShelfLifeDays',
                'estimatedCost',
                'preservationTip',
              ],
            },
          },
        },
      });

      const rawItems = JSON.parse(response.text?.trim() || '[]');
      const items = rawItems.map((item: any) => {
        const days = Math.max(1, Number(item.estimatedShelfLifeDays) || 5);
        return {
          id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name,
          category: item.category || 'Produce',
          quantity: Math.max(1, Number(item.quantity) || 1),
          unit: item.unit || 'pcs',
          storageLocation: item.storageLocation || 'Fridge',
          estimatedShelfLifeDays: days,
          expiryDate: addDays(new Date(), days),
          estimatedCost: Number((item.estimatedCost || 3.5).toFixed(2)),
          preservationTip: item.preservationTip || 'Keep properly sealed in recommended storage zone.',
          confidence: item.confidence || 'high',
          selected: true,
        };
      });

      return res.json({ success: true, items });
    } catch (err: any) {
      console.warn('Gemini food image scan failed, using fallback recognition:', err?.message);
    }
  }

  // Fallback intelligent sample detection if Gemini key not set
  const fallbackDetected = [
    {
      id: `scan-${Date.now()}-1`,
      name: 'Fresh Crisp Apples',
      category: 'Produce' as ItemCategory,
      quantity: 4,
      unit: 'pcs',
      storageLocation: 'Fridge' as StorageLocation,
      estimatedShelfLifeDays: 14,
      expiryDate: addDays(new Date(), 14),
      estimatedCost: 4.20,
      preservationTip: 'Keep in crisper drawer away from ethylene-sensitive greens to prevent over-ripening.',
      confidence: 'medium' as const,
      selected: true,
    },
    {
      id: `scan-${Date.now()}-2`,
      name: 'Organic Whole Milk',
      category: 'Dairy & Eggs' as ItemCategory,
      quantity: 1,
      unit: 'half-gallon',
      storageLocation: 'Fridge' as StorageLocation,
      estimatedShelfLifeDays: 7,
      expiryDate: addDays(new Date(), 7),
      estimatedCost: 3.49,
      preservationTip: 'Store on the central middle shelf rather than door racks to keep steady 37°F temperature.',
      confidence: 'medium' as const,
      selected: true,
    },
  ];

  res.json({ success: true, items: fallbackDetected, isFallback: true });
});

// ----------------------------------------------------
// Frontend Serving & Vite Integration
// ----------------------------------------------------
async function startServer() {
  if (isStandalone) {
    // Pure backend API mode - frontend served separately (e.g. via vite on port 5173)
    app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'Zero-Waste Pantry OS API Backend',
        status: 'online',
        port: PORT,
        endpoints: ['/api/inventory', '/api/analytics', '/api/ai/estimate-shelf-life', '/api/ai/zero-waste-recipes', '/api/ai/scan-food-image']
      });
    });
  } else if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zero-Waste Pantry ${isStandalone ? 'API Backend' : 'Server'} running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
