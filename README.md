# Zero-Waste Pantry & Expiration Tracker

An interactive pantry inventory and food-waste prevention application featuring an animated **Sliding Smartphone Carousel** interface, **AI Vision Food Recognition**, smart shelf-life estimation, and zero-waste rescue recipe generation.

---

## Features

- **Sliding Smartphone Carousel UI**
  - Interactive 3D-styled sliding device screens dedicated to each storage zone:
    - **Eat First (Urgent)**: Items expiring within 3 days.
    - **Fridge Zone**: Perishables, dairy, produce, and chilled items.
    - **Dry Pantry**: Grains, canned goods, bakery, and shelf-stable staples.
    - **Deep Freezer**: Long-term frozen storage items.
  - Supports touch/mouse drag gestures, keyboard arrow navigation (`←` / `→`), and quick-jump screen pills.

- **Snap Picture — AI Food Scanner**
  - Capture groceries directly with your live camera or upload a photo.
  - Automatically identifies food items, classifies categories, estimates typical shelf life and cost, and suggests optimal storage locations (`Fridge`, `Pantry`, or `Freezer`).
  - Interactive review step lets you adjust expiration dates, apply 1-tap shelf-life presets (`+3d`, `+1w`, `+2w`, `+1m`), edit quantities, or add/remove items before saving.

- **AI Rescue Recipes**
  - Generates creative recipes prioritizing ingredients in your pantry that are closest to expiring.
  - One-click **"Cooked This"** button automatically marks used pantry ingredients as consumed and tracks money saved.

- **Smart Shelf-Life Estimator & Receipt Bulk Import**
  - Auto-fills optimal storage zone, estimated expiration date, and preservation tips when adding a single item or pasting a grocery receipt.

- **Zero-Waste Impact Analytics**
  - Tracks total pantry value, money saved vs. wasted, waste diverted (kg), and rescue efficiency score.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **AI Integration**: `@google/genai` (Server-side food image recognition, recipe generation, and shelf-life estimation with built-in fallback knowledge base)

---

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (or `bun` / `yarn`)

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the project root (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API key:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
   *(Note: If `GEMINI_API_KEY` is omitted, the backend automatically falls back to its built-in culinary & shelf-life engine so all features remain functional.)*

---

## Running the Application

You can run the **Backend** and **Frontend** **separately in two terminals** (recommended for separate client/server development) or together in a single unified server.

### Option 1: Run Backend & Frontend Separately (2 Terminals)

#### **Step 1 — Terminal 1 (Start Backend First)**
```bash
npm run dev:server
```
- Starts the standalone Express API server on **`http://localhost:5000`** with CORS enabled.

#### **Step 2 — Terminal 2 (Start Frontend Second)**
```bash
npm run dev:client
```
- Starts the Vite React development server on **`http://localhost:5173`**.
- All `/api/*` requests from the frontend are automatically proxied to `http://localhost:5000`.

---

### Option 2: Run Unified Full-Stack Server (1 Terminal)

```bash
npm run dev
```
- Runs both the Express API and Vite middleware together on **`http://localhost:3000`**.

---

## Production Build

To compile both the frontend assets and bundle the backend server for production:

```bash
# Build frontend (dist/) and backend bundle (dist/server.cjs)
npm run build

# Start unified production server on port 3000
npm start

# Or start standalone production API server on port 5000
npm run start:server
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:server` | Starts the standalone backend API server on `http://localhost:5000` |
| `npm run dev:client` | Starts the Vite frontend dev server on `http://localhost:5173` |
| `npm run dev` | Starts the unified full-stack server on `http://localhost:3000` |
| `npm run build` | Builds the React frontend and bundles the Express backend into `dist/` |
| `npm start` | Runs the compiled production build |
| `npm run start:server` | Runs the compiled backend in standalone API mode |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) |

---

## Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory` | Fetch all pantry items |
| `POST` | `/api/inventory` | Add a single pantry item |
| `POST` | `/api/inventory/bulk` | Bulk-add multiple items (from camera scan or receipt import) |
| `PATCH` | `/api/inventory/:id` | Update item status (`active`, `consumed`, `wasted`), location, or opened state |
| `DELETE` | `/api/inventory/:id` | Remove an item from inventory |
| `POST` | `/api/inventory/reset` | Reset inventory to sample starter data |
| `GET` | `/api/analytics` | Get real-time financial & food-waste impact metrics |
| `POST` | `/api/ai/scan-food-image` | Analyze a captured photo (`base64`) to detect food items and expiry estimates |
| `POST` | `/api/ai/estimate-shelf-life` | Estimate shelf life, optimal storage zone, and preservation tips for an item |
| `POST` | `/api/ai/parse-receipt` | Parse raw grocery receipt text into structured pantry items |
| `POST` | `/api/ai/zero-waste-recipes` | Generate rescue recipes using expiring pantry items |

---

## Project Structure

```text
├── server.ts                  # Express backend API & AI endpoints
├── vite.config.ts             # Vite configuration with /api proxy to port 5000
├── package.json               # Scripts and dependencies
├── .env.example               # Example environment variables
└── src/
    ├── main.tsx               # React application entry point
    ├── App.tsx                # Root application state & modal orchestration
    ├── types.ts               # Shared TypeScript interfaces
    ├── index.css              # Tailwind CSS imports & custom utilities
    └── components/
        ├── Header.tsx         # Top navigation bar & quick actions
        ├── PhoneCarousel.tsx  # 3D sliding smartphone carousel container
        ├── PhoneScreen.tsx    # Individual smartphone screen UI per zone
        ├── CameraScanModal.tsx# Live camera capture, upload & AI item review
        ├── AddItemModal.tsx   # Manual item entry with AI shelf-life auto-fill
        ├── AiRecipeModal.tsx  # Zero-waste rescue recipe generator
        ├── AnalyticsModal.tsx # Financial & environmental impact dashboard
        ├── BulkImportModal.tsx# Receipt text parser & bulk importer
        └── Toast.tsx          # Notification toast alerts
```
