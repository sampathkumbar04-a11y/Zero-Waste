import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Flame, 
  Refrigerator, 
  Package, 
  Snowflake, 
  ChefHat, 
  TrendingUp
} from 'lucide-react';
import { PhoneScreen } from './PhoneScreen';
import { PantryItem, PantryAnalytics, StorageLocation } from '../types';

interface PhoneCarouselProps {
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
}

export type PhoneScreenType = 'urgent' | 'fridge' | 'pantry' | 'freezer' | 'chef' | 'analytics';

interface ScreenDef {
  id: PhoneScreenType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeCount?: (items: PantryItem[]) => number;
}

const SCREENS: ScreenDef[] = [
  {
    id: 'urgent',
    title: 'Eat Soon',
    subtitle: 'Freshness Radar',
    icon: <Flame className="w-4 h-4 text-amber-500" />,
    badgeCount: (items) => {
      const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return items.filter((it) => it.status === 'active' && it.expiryDate <= threeDays).length;
    },
  },
  {
    id: 'fridge',
    title: 'The Fridge',
    subtitle: 'Chilled Zone',
    icon: <Refrigerator className="w-4 h-4 text-sky-500" />,
    badgeCount: (items) => items.filter((it) => it.status === 'active' && it.storageLocation === 'Fridge').length,
  },
  {
    id: 'pantry',
    title: 'Pantry',
    subtitle: 'Dry Goods & Cans',
    icon: <Package className="w-4 h-4 text-amber-600" />,
    badgeCount: (items) => items.filter((it) => it.status === 'active' && it.storageLocation === 'Pantry').length,
  },
  {
    id: 'freezer',
    title: 'Freezer',
    subtitle: 'Frozen Vault',
    icon: <Snowflake className="w-4 h-4 text-indigo-500" />,
    badgeCount: (items) => items.filter((it) => it.status === 'active' && it.storageLocation === 'Freezer').length,
  },
  {
    id: 'chef',
    title: 'AI Chef',
    subtitle: 'Zero-Waste Recipes',
    icon: <ChefHat className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'analytics',
    title: 'Impact',
    subtitle: 'Saved $ & Diversion',
    icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
  },
];

export const PhoneCarousel: React.FC<PhoneCarouselProps> = ({
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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SCREENS.length) % SCREENS.length);
  };

  const handleNavigateScreen = (screenId: PhoneScreenType) => {
    const idx = SCREENS.findIndex((s) => s.id === screenId);
    if (idx !== -1) setCurrentIndex(idx);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-4 sm:py-8 flex flex-col items-center">
      {/* Top Slider Navigation & Autoplay Bar */}
      <div className="w-full max-w-4xl px-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Screen selector chips */}
        <div className="inline-flex p-1 rounded-2xl bg-white border border-stone-200/80 shadow-2xs overflow-x-auto max-w-full scrollbar-none">
          {SCREENS.map((screen, idx) => {
            const isSelected = currentIndex === idx;
            const badge = screen.badgeCount ? screen.badgeCount(items) : undefined;
            return (
              <button
                key={screen.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                {screen.icon}
                <span>{screen.title}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-stone-700 text-stone-100'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
            title={isAutoPlaying ? 'Pause automatic slide' : 'Start automatic slide show'}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-700" />
                <span>Sliding...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-stone-600" />
                <span>Auto Slide</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* The 3-Phone Stage with Horizontal Sliding Animations */}
      <div className="relative w-full max-w-6xl h-[700px] sm:h-[750px] flex items-center justify-center">
        {/* Floating Left Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 z-30 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-xl border border-stone-200/80 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          title="Previous Screen"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Floating Right Arrow */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 sm:right-6 z-30 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-xl border border-stone-200/80 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          title="Next Screen"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* The Animated Sliding Smartphones */}
        <div className="relative w-full h-full flex items-center justify-center">
          {SCREENS.map((screen, idx) => {
            // Compute offset relative to current center
            const count = SCREENS.length;
            let offset = idx - currentIndex;
            // Wrap around for seamless circular feel
            if (offset < -Math.floor(count / 2)) offset += count;
            if (offset > Math.floor(count / 2)) offset -= count;

            const isCenter = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            // Positioning calculations matching the video
            const translateX = offset * 360;
            const scale = isCenter ? 1 : Math.abs(offset) === 1 ? 0.88 : 0.78;
            const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.55 : 0;
            const zIndex = isCenter ? 20 : 10 - Math.abs(offset);

            return (
              <motion.div
                key={screen.id}
                animate={{
                  x: translateX,
                  scale,
                  opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 30,
                  mass: 0.9,
                }}
                onClick={() => {
                  if (!isCenter) setCurrentIndex(idx);
                }}
                style={{ zIndex }}
                className={`absolute w-[335px] sm:w-[360px] h-[670px] sm:h-[720px] transition-shadow duration-300 ${
                  !isCenter ? 'cursor-pointer hover:opacity-80' : ''
                }`}
              >
                {/* Modern Minimalist Phone Device Frame */}
                <div className="w-full h-full rounded-[44px] bg-stone-900 p-[7px] shadow-2xl shadow-stone-900/20 ring-1 ring-white/20 relative flex flex-col">
                  {/* Screen Display Shell */}
                  <div className="w-full h-full rounded-[38px] overflow-hidden bg-white flex flex-col relative">
                    {/* Interactive App Screen inside the Phone */}
                    <div className="flex-1 overflow-hidden relative">
                      <PhoneScreen
                        screenId={screen.id}
                        items={items}
                        analytics={analytics}
                        onMarkConsumed={onMarkConsumed}
                        onMarkWasted={onMarkWasted}
                        onToggleOpened={onToggleOpened}
                        onChangeLocation={onChangeLocation}
                        onOpenAddModal={onOpenAddModal}
                        onOpenScanModal={onOpenScanModal}
                        onOpenRecipeModal={onOpenRecipeModal}
                        onOpenAnalyticsModal={onOpenAnalyticsModal}
                        onNavigateScreen={handleNavigateScreen}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom title pill underneath side phones */}
                {!isCenter && (
                  <div className="text-center mt-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 shadow-sm border border-stone-200 text-xs font-semibold text-stone-700 backdrop-blur-xs">
                      {screen.title}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots indicator */}
      <div className="flex items-center gap-2 mt-4">
        {SCREENS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === idx
                ? 'w-8 h-2 bg-stone-900'
                : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
            }`}
            title={`Go to ${s.title}`}
          />
        ))}
      </div>
    </div>
  );
};
