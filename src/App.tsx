import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PhoneCarousel } from './components/PhoneCarousel';
import { AddItemModal } from './components/AddItemModal';
import { BulkImportModal } from './components/BulkImportModal';
import { AiRecipeModal } from './components/AiRecipeModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { CameraScanModal } from './components/CameraScanModal';
import { Toast, ToastMessage } from './components/Toast';
import { PantryItem, PantryAnalytics, StorageLocation } from './types';

export default function App() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [analytics, setAnalytics] = useState<PantryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialLoc, setAddModalInitialLoc] = useState<StorageLocation>('Fridge');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanModalInitialLoc, setScanModalInitialLoc] = useState<StorageLocation>('Fridge');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [invRes, anaRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/analytics'),
      ]);
      const invData = await invRes.json();
      const anaData = await anaRes.json();

      if (invData.success && Array.isArray(invData.items)) {
        setItems(invData.items);
      }
      if (anaData) {
        setAnalytics(anaData);
      }
    } catch (err) {
      console.error('Error fetching pantry data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshAnalytics = async () => {
    try {
      const anaRes = await fetch('/api/analytics');
      const anaData = await anaRes.json();
      if (anaData) setAnalytics(anaData);
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
    }
  };

  // Handlers
  const handleMarkConsumed = async (item: PantryItem) => {
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'consumed' }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((it) => (it.id === item.id ? data.item : it)));
        refreshAnalytics();
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: `Ate ${item.name}!`,
          message: `Saved $${item.estimatedCost.toFixed(2)}.`,
        });
      }
    } catch (err) {
      console.error('Failed to mark consumed:', err);
    }
  };

  const handleMarkWasted = async (item: PantryItem, reason?: string) => {
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'wasted', wasteReason: reason }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((it) => (it.id === item.id ? data.item : it)));
        refreshAnalytics();
        setToast({
          id: String(Date.now()),
          type: 'warning',
          title: `Logged as spoiled: ${item.name}`,
        });
      }
    } catch (err) {
      console.error('Failed to mark wasted:', err);
    }
  };

  const handleToggleOpened = async (item: PantryItem) => {
    const nextOpened = !item.isOpened;
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpened: nextOpened,
          openedDate: nextOpened ? new Date().toISOString().split('T')[0] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((it) => (it.id === item.id ? data.item : it)));
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: `${item.name} marked ${nextOpened ? 'Opened' : 'Sealed'}`,
        });
      }
    } catch (err) {
      console.error('Failed to toggle opened:', err);
    }
  };

  const handleChangeLocation = async (item: PantryItem, newLoc: StorageLocation) => {
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLocation: newLoc }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((it) => (it.id === item.id ? data.item : it)));
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: `Moved to ${newLoc}`,
        });
      }
    } catch (err) {
      console.error('Failed to change location:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        refreshAnalytics();
        setToast({
          id: String(Date.now()),
          type: 'info',
          title: 'Item removed',
        });
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleItemAdded = (newItem: PantryItem) => {
    setItems((prev) => [newItem, ...prev]);
    refreshAnalytics();
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: `Added ${newItem.name}`,
    });
  };

  const handleItemsImported = (newItems: PantryItem[]) => {
    setItems((prev) => [...newItems, ...prev]);
    refreshAnalytics();
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: `Added ${newItems.length} items`,
    });
  };

  const handleOpenAddModal = (defaultLoc: StorageLocation = 'Fridge') => {
    setAddModalInitialLoc(defaultLoc);
    setIsAddModalOpen(true);
  };

  const handleOpenScanModal = (defaultLoc: StorageLocation = 'Fridge') => {
    setScanModalInitialLoc(defaultLoc);
    setIsScanModalOpen(true);
  };

  const handleScannedItemsAdded = (newItems: PantryItem[]) => {
    setItems((prev) => [...newItems, ...prev]);
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: 'Items Added From Photo 📸',
      message: `Added ${newItems.length} scanned ${newItems.length === 1 ? 'item' : 'items'} with calculated expiration dates!`,
    });
    refreshAnalytics();
  };

  const handleCookedRecipe = (usedItemNames: string[]) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setItems((prev) =>
      prev.map((item) => {
        if (
          item.status === 'active' &&
          usedItemNames.some((n) => item.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(item.name.toLowerCase()))
        ) {
          fetch(`/api/inventory/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'consumed' }),
          });
          return {
            ...item,
            status: 'consumed',
            consumedAt: todayStr,
          };
        }
        return item;
      })
    );

    refreshAnalytics();
    setToast({
      id: String(Date.now()),
      type: 'success',
      title: 'Recipe Cooked 🎉',
      message: `Used ingredients marked as eaten.`,
    });
  };

  // Active items for recipe generator
  const activeItems = useMemo(() => items.filter((it) => it.status === 'active'), [items]);

  return (
    <div className="min-h-screen bg-[#f3f7fa] text-stone-900 font-sans flex flex-col selection:bg-stone-200">
      {/* Top Header */}
      <Header
        analytics={analytics}
        onOpenAddModal={() => handleOpenAddModal('Fridge')}
        onOpenScanModal={() => handleOpenScanModal('Fridge')}
        onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
      />

      {/* Main Container - Sliding Smartphone Carousel */}
      <main className="flex-1 w-full mx-auto flex flex-col justify-center">
        {isLoading ? (
          <div className="py-28 text-center text-stone-700">
            <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Starting pantry engine...</p>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <PhoneCarousel
              items={items}
              analytics={analytics}
              onMarkConsumed={handleMarkConsumed}
              onMarkWasted={handleMarkWasted}
              onToggleOpened={handleToggleOpened}
              onChangeLocation={handleChangeLocation}
              onOpenAddModal={handleOpenAddModal}
              onOpenScanModal={handleOpenScanModal}
              onOpenRecipeModal={() => setIsRecipeModalOpen(true)}
              onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/70 bg-white/70 backdrop-blur-xs py-3.5 text-center text-xs text-stone-700 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span className="font-medium text-stone-700">Zero-Waste Pantry OS</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRecipeModalOpen(true)}
              className="text-stone-700 hover:text-stone-900 hover:underline cursor-pointer"
            >
              Rescue Recipes
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="text-stone-700 hover:text-stone-900 hover:underline cursor-pointer"
            >
              Impact Stats
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        initialLocation={addModalInitialLoc}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
        onOpenScanModal={() => {
          setIsAddModalOpen(false);
          setIsScanModalOpen(true);
        }}
      />

      <CameraScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddItems={handleScannedItemsAdded}
        initialLocation={scanModalInitialLoc}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onItemsImported={handleItemsImported}
      />

      <AiRecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        activeItems={activeItems}
        onCookedRecipe={handleCookedRecipe}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        analytics={analytics}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
