import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Users, Check, RefreshCw, Loader2 } from 'lucide-react';
import { PantryItem, RecipeSuggestion } from '../types';

interface AiRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeItems: PantryItem[];
  onCookedRecipe: (usedItemNames: string[]) => void;
}

const DIETARY_OPTIONS = [
  'Any Diet',
  'Vegetarian',
  'Quick (<20m)',
  'High Protein',
  'Kid-Friendly',
];

export const AiRecipeModal: React.FC<AiRecipeModalProps> = ({
  isOpen,
  onClose,
  activeItems,
  onCookedRecipe,
}) => {
  const [dietary, setDietary] = useState('Any Diet');
  const [isLoading, setIsLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [cookedFeedback, setCookedFeedback] = useState<string | null>(null);

  const fetchRecipes = async (diet: string) => {
    setIsLoading(true);
    setCookedFeedback(null);
    try {
      const res = await fetch('/api/ai/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietaryPreference: diet }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
        setSelectedRecipeIndex(0);
      }
    } catch (err) {
      console.error('Failed to generate recipes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recipes.length === 0) {
      fetchRecipes(dietary);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRecipe = recipes[selectedRecipeIndex];

  const handleCookRecipe = (recipe: RecipeSuggestion) => {
    onCookedRecipe(recipe.expiringIngredientsUsed);
    setCookedFeedback(`Marked ingredients as consumed. Saved ~$${recipe.estimatedSavingsUsd?.toFixed(2)}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-stone-200/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-sm font-semibold text-stone-900">Rescue Recipes</h2>
            <span className="text-xs text-stone-700">· Turn expiring items into meals</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRecipes(dietary)}
              disabled={isLoading}
              className="p-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Regenerate ideas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dietary filters */}
        <div className="px-5 py-2 border-b border-stone-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setDietary(opt);
                  fetchRecipes(opt);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  dietary === opt
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {currentRecipe && (
            <span className="text-xs font-semibold text-emerald-800 shrink-0">
              Save ${currentRecipe.estimatedSavingsUsd?.toFixed(2)}
            </span>
          )}
        </div>

        {/* Feedback message */}
        {cookedFeedback && (
          <div className="bg-emerald-50 text-emerald-900 px-5 py-2 text-xs font-medium border-b border-emerald-100 flex items-center justify-between">
            <span>✓ {cookedFeedback}</span>
            <button
              type="button"
              onClick={() => setCookedFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-stone-400" />
              <p className="text-stone-500 font-medium">Analyzing expiring items & creating meals...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="py-12 text-center text-stone-700">
              <p>No recipes found. Tap refresh to generate new ideas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recipe tabs */}
              {recipes.length > 1 && (
                <div className="flex gap-1.5 border-b border-stone-100 pb-2">
                  {recipes.map((rec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRecipeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors truncate max-w-[180px] cursor-pointer ${
                        selectedRecipeIndex === idx
                          ? 'bg-stone-100 text-stone-900 font-semibold'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {rec.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Current Recipe Content */}
              {currentRecipe && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 text-stone-700 mb-1">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Clock className="w-3.5 h-3.5" />
                        {currentRecipe.cookTimeMinutes}m
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Users className="w-3.5 h-3.5" />
                        {currentRecipe.servings} servings
                      </span>
                      <span>·</span>
                      <span className="capitalize">{currentRecipe.difficulty}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 mb-1">
                      {currentRecipe.title}
                    </h3>
                    <p className="text-stone-700 leading-relaxed">
                      {currentRecipe.description}
                    </p>
                  </div>

                  {/* Rescued Ingredients */}
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    <span className="font-semibold text-amber-950 block mb-1.5">
                      Rescued from expiration:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRecipe.expiringIngredientsUsed.map((ing) => (
                        <span
                          key={ing}
                          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900 font-medium text-xs"
                        >
                          ✓ {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Instructions</h4>
                    <ol className="space-y-2 text-stone-700">
                      {currentRecipe.instructions.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-stone-700 shrink-0">{idx + 1}.</span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Pro Tip */}
                  {currentRecipe.zeroWasteTip && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-stone-700 leading-relaxed">
                      <strong className="text-stone-900 font-semibold block mb-0.5">Kitchen Tip:</strong>
                      {currentRecipe.zeroWasteTip}
                    </div>
                  )}

                  {/* Bottom Action: Cooked! */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCookRecipe(currentRecipe)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>I made this (mark used as eaten)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
