import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Loader2, 
  Calendar, 
  Check, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Info,
  Refrigerator,
  Package,
  Snowflake,
  AlertCircle
} from 'lucide-react';
import { ItemCategory, StorageLocation, ScannedFoodItem, PantryItem } from '../types';

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsAdded: (items: PantryItem[]) => void;
  initialLocation?: StorageLocation;
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

// Helper to format date YYYY-MM-DD
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// Calculate days difference
const getDaysFromToday = (dateStr: string): number => {
  if (!dateStr) return 0;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Demo sample pictures with pre-rendered grocery images (SVG data URIs)
const DEMO_PRESETS = [
  {
    name: 'Produce (Apples & Greens)',
    desc: 'Crisp apples, fresh baby spinach & lemons',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f4f4f0"/><circle cx="140" cy="150" r="60" fill="%23dc2626"/><circle cx="230" cy="160" r="55" fill="%2316a34a"/><circle cx="180" cy="210" r="45" fill="%23eab308"/><text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2344403c" text-anchor="middle">Fresh Market Produce</text></svg>',
  },
  {
    name: 'Dairy & Eggs',
    desc: 'Whole milk jug, pasture eggs & cheddar',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f0f7fa"/><rect x="110" y="90" width="70" height="130" rx="10" fill="%230284c7"/><rect x="200" y="130" width="90" height="90" rx="8" fill="%23f59e0b"/><circle cx="210" cy="100" r="18" fill="%23fef08a"/><circle cx="250" cy="100" r="18" fill="%23fef08a"/><text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230369a1" text-anchor="middle">Farm Fresh Dairy</text></svg>',
  },
  {
    name: 'Bakery & Bread',
    desc: 'Rustic sourdough loaf & croissants',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23fcf8f2"/><ellipse cx="200" cy="160" rx="90" ry="50" fill="%23b45309"/><ellipse cx="200" cy="145" rx="80" ry="40" fill="%23d97706"/><text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2378350f" text-anchor="middle">Artisan Sourdough Loaf</text></svg>',
  },
];

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  onItemsAdded,
  initialLocation = 'Fridge',
}) => {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'review'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scanned items list for review & editing
  const [items, setItems] = useState<ScannedFoodItem[]>([]);

  // Camera video and canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start live webcam / camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera on phones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access could not be established:', err);
      setCameraError('Camera access not available or permission denied. You can still upload or take a picture via files.');
      setIsCameraActive(false);
    }
  };

  // Reset modal state on close or open
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setCapturedImage(null);
      setItems([]);
      setErrorMessage(null);
      setCameraError(null);
      // Auto-start camera if supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Capture frame from video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        processImage(dataUrl);
      }
    } catch (err) {
      console.error('Failed to capture frame:', err);
      setErrorMessage('Could not capture frame. Please try uploading an image instead.');
    }
  };

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        processImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Process the image with Gemini Vision endpoint
  const processImage = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setStep('analyzing');
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/scan-food-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        const detectedItems: ScannedFoodItem[] = data.items.map((it: any, index: number) => ({
          id: it.id || `scanned-${Date.now()}-${index}`,
          name: it.name || 'Grocery Item',
          category: it.category || 'Produce',
          quantity: it.quantity || 1,
          unit: it.unit || 'pcs',
          storageLocation: (it.storageLocation as StorageLocation) || initialLocation || 'Fridge',
          estimatedShelfLifeDays: it.estimatedShelfLifeDays || 7,
          expiryDate: it.expiryDate || addDays(it.estimatedShelfLifeDays || 7),
          estimatedCost: it.estimatedCost || 3.50,
          preservationTip: it.preservationTip || 'Store safely to maintain freshness.',
          confidence: it.confidence || 'high',
          selected: true,
        }));
        setItems(detectedItems);
        setStep('review');
      } else {
        // If nothing detected, provide a single blank template prefilled for user
        setItems([
          {
            id: `scanned-${Date.now()}-0`,
            name: 'Fresh Grocery Item',
            category: 'Produce',
            quantity: 1,
            unit: 'pcs',
            storageLocation: initialLocation || 'Fridge',
            estimatedShelfLifeDays: 7,
            expiryDate: addDays(7),
            estimatedCost: 3.50,
            preservationTip: 'Keep chilled in refrigerator to extend shelf life.',
            selected: true,
          },
        ]);
        setStep('review');
      }
    } catch (err: any) {
      console.error('Error scanning food image:', err);
      setErrorMessage('Could not analyze photo with AI. You can still review and enter the item manually.');
      // Create fallback item so user flow isn't blocked
      setItems([
        {
          id: `scanned-${Date.now()}-0`,
          name: 'Grocery Item',
          category: 'Produce',
          quantity: 1,
          unit: 'pcs',
          storageLocation: initialLocation || 'Fridge',
          estimatedShelfLifeDays: 7,
          expiryDate: addDays(7),
          estimatedCost: 3.50,
          preservationTip: 'Store in cool, dry place or refrigerate.',
          selected: true,
        },
      ]);
      setStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Modify an item attribute in the review list
  const updateItem = (id: string, updates: Partial<ScannedFoodItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Quick preset days for a specific item
  const setItemPresetDays = (id: string, days: number) => {
    const newExpiry = addDays(days);
    updateItem(id, {
      expiryDate: newExpiry,
      estimatedShelfLifeDays: days,
    });
  };

  // Delete an item from review list
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Add a new empty item to the review list
  const addNewItem = () => {
    const newItem: ScannedFoodItem = {
      id: `scanned-${Date.now()}-${items.length}`,
      name: '',
      category: 'Produce',
      quantity: 1,
      unit: 'pcs',
      storageLocation: (initialLocation || 'Fridge') as StorageLocation,
      estimatedShelfLifeDays: 7,
      expiryDate: addDays(7),
      estimatedCost: 3.00,
      preservationTip: 'Store in optimal zone to preserve crispness.',
      selected: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Final confirmation: Submit all selected items to pantry inventory
  const handleSaveToPantry = async () => {
    const selectedItems = items.filter((it) => it.selected && it.name.trim());
    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one item with a valid name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const addedItems: PantryItem[] = [];
      const todayStr = formatDate(new Date());

      for (const it of selectedItems) {
        const payload = {
          name: it.name.trim(),
          category: it.category,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'pcs',
          purchaseDate: todayStr,
          expiryDate: it.expiryDate,
          storageLocation: it.storageLocation,
          isOpened: false,
          estimatedCost: Number(it.estimatedCost) || 3.0,
          preservationTip: it.preservationTip,
        };

        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.item) {
          addedItems.push(data.item);
        }
      }

      onItemsAdded(addedItems);
      onClose();
    } catch (err) {
      console.error('Failed to save scanned items:', err);
      setErrorMessage('Failed to save some items to inventory. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="scanner-modal-title" className="text-base font-bold text-stone-900 leading-tight">
                {step === 'review' ? 'Verify & Enter Expiry Dates' : 'AI Picture Scanner'}
              </h2>
              <p className="text-xs text-stone-500">
                {step === 'review' 
                  ? 'Gemini identified these food items. Customize expiration dates & storage.' 
                  : 'Capture or upload a picture to automatically define grocery items'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CAPTURE / UPLOAD */}
          {step === 'capture' && (
            <div className="space-y-4">
              {/* Viewfinder Area */}
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl bg-stone-900 overflow-hidden border border-stone-800 flex items-center justify-center shadow-inner">
                {/* Live Video stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isCameraActive ? 'opacity-100' : 'opacity-0 hidden'
                  }`}
                />

                {/* If camera is not active or has error */}
                {!isCameraActive && (
                  <div className="p-6 text-center text-white/80 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Live Camera</p>
                      <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1">
                        {cameraError || 'Allow camera permission to scan food in real time, or upload a photo below.'}
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Camera Overlays and Shutter Button */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-radial from-transparent via-transparent to-black/40">
                    <div className="flex justify-between items-center text-white/90">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Food Viewfinder
                      </span>
                    </div>

                    {/* Camera Shutter Bar */}
                    <div className="flex items-center justify-center pb-1 pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs border-2 border-white transition-transform active:scale-95 hover:bg-white/30 cursor-pointer shadow-lg"
                        title="Take Photo"
                      >
                        <div className="w-12 h-12 rounded-full bg-white group-hover:scale-95 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternative Photo Source Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Upload from file or gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-all flex items-center gap-3 text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 group-hover:text-stone-900 shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Choose Photo / Gallery</span>
                    <span className="text-[11px] text-stone-500 block">PNG, JPG, or WEBP grocery photo</span>
                  </div>
                </button>

                {/* Instant Tryout / Sample Foods */}
                <div className="p-3 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                    ⚡ 1-Click Test Groceries
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DEMO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          stopCamera();
                          processImage(preset.dataUrl);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-200/70 border border-stone-200 text-stone-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        title={preset.desc}
                      >
                        {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING STATE */}
          {step === 'analyzing' && (
            <div className="py-12 px-4 text-center space-y-5">
              {/* Thumbnail with animated scanner laser */}
              <div className="relative w-48 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-stone-800 bg-stone-900 shadow-xl">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured food"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Scanning laser line animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-[bounce_1.5s_infinite]" />
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>Gemini 3.8 Flash Vision</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">Identifying Food & Expiration Dates...</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Scanning your picture to recognize food items, estimate shelf life, suggest storage zones, and prep expiration dates.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-stone-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                <span>Processing image...</span>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & ENTER EXPIRATION DATES ("after that we can enter expire date etc") */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Recognition Summary Header */}
              <div className="p-3.5 rounded-2xl bg-stone-100/80 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Scanned thumbnail"
                      className="w-12 h-12 rounded-xl object-cover border border-stone-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-stone-900 block truncate">
                      Recognized {items.length} Item{items.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Edit names, set expiration dates, and pick storage zones below.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('capture');
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                      startCamera();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>

              {/* Items Review Form List */}
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const daysLeft = getDaysFromToday(item.expiryDate);
                  const isExpiringSoon = daysLeft <= 3;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.selected
                          ? 'bg-white border-stone-300 shadow-xs'
                          : 'bg-stone-50/70 border-stone-200 opacity-60'
                      }`}
                    >
                      {/* Item Top Row: Selection Checkbox, Name Input, Category & Delete */}
                      <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                          className="w-4 h-4 rounded text-stone-900 focus:ring-stone-900 cursor-pointer"
                          title="Include this item"
                        />

                        {/* Editable Item Name */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder="Food item name"
                            className="w-full text-sm font-bold text-stone-900 bg-transparent border-b border-transparent focus:border-stone-400 focus:outline-hidden px-1 py-0.5"
                          />
                        </div>

                        {/* Category Dropdown */}
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, { category: e.target.value as ItemCategory })}
                          className="text-xs bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 font-medium text-stone-700 focus:outline-hidden cursor-pointer shrink-0"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* MAIN CONFIGURATION: EXPIRY DATE & STORAGE ZONE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
                        {/* Expiration Date Input with Quick Jump Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-stone-500" />
                              <span>Expiration Date</span>
                            </label>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                daysLeft <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : isExpiringSoon
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {daysLeft <= 0
                                ? 'Expires today'
                                : daysLeft === 1
                                ? 'Expires tomorrow'
                                : `Expires in ${daysLeft} days`}
                            </span>
                          </div>

                          {/* Date input field */}
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updateItem(item.id, { expiryDate: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-hidden transition-colors"
                          />

                          {/* Quick Relative Date Preset Buttons */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-stone-600 mr-0.5">Quick:</span>
                            {[
                              { label: '+2d', days: 2 },
                              { label: '+4d', days: 4 },
                              { label: '+1w', days: 7 },
                              { label: '+2w', days: 14 },
                              { label: '+1mo', days: 30 },
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => setItemPresetDays(item.id, btn.days)}
                                className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Storage Zone Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-stone-800 block">
                            Storage Location
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { loc: 'Fridge' as StorageLocation, icon: Refrigerator, label: 'Fridge' },
                              { loc: 'Pantry' as StorageLocation, icon: Package, label: 'Pantry' },
                              { loc: 'Freezer' as StorageLocation, icon: Snowflake, label: 'Freezer' },
                            ].map(({ loc, icon: Icon, label }) => {
                              const isSelected = item.storageLocation === loc;
                              return (
                                <button
                                  key={loc}
                                  type="button"
                                  onClick={() => updateItem(item.id, { storageLocation: loc })}
                                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Quantity & Estimated Cost */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-stone-600 font-medium">Qty:</span>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                                className="w-12 px-1.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 text-center focus:bg-white focus:outline-hidden"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                                placeholder="unit"
                                className="w-14 px-1.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 text-center focus:bg-white focus:outline-hidden"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[11px] text-stone-600 font-medium">Cost: $</span>
                              <input
                                type="number"
                                min="0"
                                step="0.05"
                                value={item.estimatedCost}
                                onChange={(e) => updateItem(item.id, { estimatedCost: parseFloat(e.target.value) || 0 })}
                                className="w-16 px-1.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 text-center focus:bg-white focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preservation Tip from AI */}
                      {item.preservationTip && (
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-950 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                          <span><strong>Tip:</strong> {item.preservationTip}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add item button */}
              <button
                type="button"
                onClick={addNewItem}
                className="w-full py-2.5 rounded-2xl border border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Food Item from this Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-stone-200/80 bg-stone-50 flex items-center justify-between gap-3">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('capture');
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    startCamera();
                  }
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Scan Another Picture
              </button>

              <button
                type="button"
                onClick={handleSaveToPantry}
                disabled={isSubmitting || items.filter((it) => it.selected).length === 0}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Pantry...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      Add {items.filter((it) => it.selected).length} Item{items.filter((it) => it.selected).length === 1 ? '' : 's'} to Pantry
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-stone-500">
                Tip: Position grocery items clearly within frame.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
