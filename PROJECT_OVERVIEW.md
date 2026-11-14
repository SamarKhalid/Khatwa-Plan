# Khatwa Plan (خطوة بلان) — Project Overview & Architecture Guide

> Living document. Keep it updated whenever an architectural decision, module, or feature changes.  
> Current Status: **Active Rebuild · Core, Auth, Drawing Engine, Firestore Storage & History Implemented**  
> Workspace Root: `E:\khatwa-plan`

---

## 1. What We Are Building

**Khatwa Plan (خطوة بلان)** is a professional, high-precision floor-plan sketching application built specifically for **architectural and civil engineers, site inspectors, and contractors**.

Instead of complex CAD software on site, the engineer sketches room layouts by "walking" a pen:
1. Select a start point (origin `0,0`).
2. Choose a direction (↑ Up, ↓ Down, ← Left, → Right).
3. Input the exact wall length in **centimetres** (supporting decimals like `125.5` or `125.25`).
4. Insert doors and windows directly along the path (the path resumes from their end).
5. Save drawings to a cloud account (Firebase Firestore) with timestamped history.
6. Export production-grade **DXF** (with CAD layers `WALL`, `DOOR`, `WINDOW`, swing arcs, and dimension annotations) or lossless **JSON**.

### Target Platforms
- **Web App (PWA)**: Hosted initially on GitHub Pages.
- **Android App**: Native Android package for Google Play Store using **Capacitor**.

### Core Product Principles
1. **Engineering Precision**: Centimetre units with decimal support; output designed for AutoCAD, Revit, and LibreCAD.
2. **Offline-First & Fast**: Works seamlessly in field conditions with spotty or no internet connection.
3. **True Bilingualism**: Native Arabic (RTL) and English (LTR) with runtime switching, zero layout duplication (CSS Logical Properties).
4. **Clean Decoupled Architecture**: Domain geometry and algorithms are 100% pure TypeScript with no DOM, UI, or cloud dependencies.
5. **Mobile-First Responsive UX**: Optimized for phones (portrait and landscape) and tablets, with touch-target ergonomics, safe-area insets, and gesture pan/pinch-zoom.
6. **Guest vs. Account Distinction**: Guest mode enables unrestricted instant sketching; cloud saving and persistent history require a verified Google account.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Build & Dev Tool** | **Vite 8** | Sub-second HMR, optimized multi-chunk production bundles |
| **Language** | **TypeScript 6** (Strict Mode) | Strong type safety across domain geometry, state, and serialization |
| **UI Framework** | **Svelte 5** (Runes) | Ultra-lightweight reactive UI, zero virtual DOM overhead, high performance |
| **Canvas Engine** | **HTML5 Canvas 2D (Pure TS)** | Pixel-crisp HiDPI rendering, pan/pinch-zoom, dynamic CAD grid |
| **Authentication** | **Firebase Auth (Google Provider)** | Fast, secure OAuth sign-in; lazy loaded on demand |
| **Cloud Storage** | **Firebase Firestore** | Real-time multi-device sync, local cache persistence, scoped under `/users/{uid}/plans` |
| **Mobile Runtime** | **Capacitor** | Direct bridge to Android without rewriting web application logic |
| **Testing** | **Vitest** | Blazing-fast unit and integration testing |
| **Type Checking** | **svelte-check** | Full AST and template type verification |
| **Styling** | **CSS Variables + Logical Properties** | Seamless RTL/LTR layout transitions with zero styling hacks |

---

## 3. Project Directory & File-by-File Usage

Below is the directory structure in `E:\khatwa-plan` and the exact responsibility of every file:

```text
E:\khatwa-plan\
├── public/
│   └── icon.svg                          # Vector application brand icon
│
├── src/
│   ├── app/                              # State orchestration & session services
│   │   └── editor.ts                     # Editor store: ties history, plan, and naming together
│   │
│   ├── auth/                             # Authentication domain & provider adapters
│   │   ├── types.ts                      # AuthUser, AuthState, AuthService interfaces & error types
│   │   ├── store.ts                      # Session state machine (guest vs. signed-in vs. loading)
│   │   ├── firebase-auth-service.ts      # Firebase Google sign-in implementation (lazy-loaded)
│   │   └── index.ts                      # Auth store singleton export
│   │
│   ├── config/                           # Environment & provider configuration
│   │   └── firebase.ts                   # Public Firebase project config (app ID, keys, domain)
│   │
│   ├── core/                             # PURE DOMAIN (Zero DOM, zero Firebase imports)
│   │   ├── plan.ts                       # Plan model: move, addOpening, snap, fmt, vectors
│   │   ├── geometry.ts                   # Opening geometry (door leafs, swing arcs, window glass)
│   │   ├── history.ts                    # Generic immutable undo/redo history stack
│   │   ├── serialization.ts              # StoredPlan schema, validation, stats & migrations
│   │   └── export/
│   │       ├── dxf.ts                    # Production-grade ASCII DXF exporter (WALL, DOOR, WINDOW)
│   │       └── json.ts                   # Lossless versioned JSON exporter (khatwa-plan-v1)
│   │
│   ├── i18n/                             # Internationalization & localization
│   │   ├── index.ts                      # Locale detector, reactive translation store ($t), direction
│   │   └── locales/
│   │       ├── en.ts                     # English master string catalog & MessageKey type
│   │       └── ar.ts                     # Arabic string catalog (strictly typed to match en.ts)
│   │
│   ├── platform/                         # Host environment & browser abstraction adapters
│   │   ├── storage.ts                    # Safe LocalStorage wrapper (never throws on quota/private mode)
│   │   ├── files.ts                      # Safe cross-platform file download & filename sanitization
│   │   └── firebase.ts                   # Shared lazy FirebaseApp instance initializer
│   │
│   ├── render/                           # Canvas rendering & viewport math
│   │   ├── viewport.ts                   # World-to-screen transforms, pan, zoomAt cursor, dynamic grid
│   │   └── renderer.ts                   # Multi-layer canvas painter (axes, grid, walls, openings, pen)
│   │
│   ├── storage/                          # Plan persistence abstraction & Firestore implementation
│   │   ├── types.ts                      # PlanRepository, SavedPlanMeta, StorageError interfaces
│   │   ├── firestore-plan-repository.ts  # Firestore CRUD scoped under /users/{userId}/plans
│   │   └── index.ts                      # Storage repository singleton export
│   │
│   ├── ui/                               # Svelte 5 User Interface Components
│   │   ├── App.svelte                    # Root coordinator (loading splash, auth page, or editor)
│   │   ├── toast.ts                      # Transient notification toast message store
│   │   ├── styles/
│   │   │   └── global.css                # Global design tokens, typography, CSS reset, accessibility
│   │   └── components/
│   │       ├── AuthPage.svelte           # Sign-in & account registration tabs with Google button
│   │       ├── GoogleIcon.svelte         # Official Google branding vector SVG
│   │       ├── LanguageSwitcher.svelte   # One-click Arabic/English language toggle button
│   │       ├── Editor.svelte             # Main workspace: canvas, dpad, actions, header, shortcuts
│   │       ├── PlanCanvas.svelte         # Interactive canvas wrapper (gestures, mouse wheel, pinch)
│   │       ├── AmountDialog.svelte       # Modal dialog for inputting wall/opening distances (cm)
│   │       ├── ConfirmDialog.svelte      # Generic confirmation modal (e.g. redraw confirmation)
│   │       ├── SavePlanDialog.svelte     # Save modal with custom plan name input
│   │       ├── SavedPlansModal.svelte    # History modal: lists cloud plans with dates, stats & actions
│   │       ├── GuestNoticeDialog.svelte  # Friendly modal prompting guests to sign in for save/history
│   │       └── Toast.svelte              # Accessible floating notification pill
│   │
│   ├── env.d.ts                          # Vite and Svelte type declarations
│   └── main.ts                           # App bootstrapper (initializes i18n, auth, and mounts App)
│
├── tests/                                # Automated Unit & Integration Tests (Vitest)
│   ├── auth/store.test.ts                # Session state machine, guest mode & sign-in tests
│   ├── core/plan.test.ts                 # Plan geometry, movement vectors & decimal accuracy tests
│   ├── core/history.test.ts              # Immutable history, undo, redo, commit & cap tests
│   ├── core/export.test.ts               # DXF layer verification, entity generation & JSON export tests
│   ├── core/serialization.test.ts       # Serialization, deserialization, stats & corruption tests
│   ├── i18n/i18n.test.ts                 # Translation completeness, placeholder & direction tests
│   └── render/viewport.test.ts           # Zoom anchoring, pan math, world-screen conversion tests
│
├── .gitignore                            # Comprehensive ignore rules for secrets, cache, build artifacts
├── .prettierrc                           # Code style formatting rules (with svelte plugin)
├── index.html                            # Single Page Application HTML entry point
├── package.json                          # Dependencies, scripts, and package metadata
├── svelte.config.js                      # Svelte compiler & preprocessor configuration
├── tsconfig.json                         # Strict TypeScript configuration
└── vite.config.ts                        # Vite configuration (relative base for Pages & Capacitor)
```

---

## 4. Key Architectural Features & Flows

### 4.1 Authentication & Guest Mode
- **State Machine**:
  - `loading` → Check if `khatwa.guest === '1'` in local storage.
  - If guest: resolves immediately to `guest` status **without loading Firebase SDK**.
  - If not guest: loads Firebase Auth listener to restore existing Google session.
- **Guest Limitations**:
  - Guests have full, unrestricted access to the drawing canvas, shortcuts, and DXF/JSON exports.
  - Cloud saving and browsing history are restricted. Attempting to click "Save" or "Saved plans" triggers a polite `GuestNoticeDialog` offering instant Google sign-in.
  - Exiting guest mode or signing in seamlessly migrates the user into an active session.

### 4.2 Drawing Engine & Canvas Math
- **CAD Coordinate System**:
  - Origin `(0, 0)` is at the center by default.
  - Direction vectors: `up: [0, 1]`, `down: [0, -1]`, `left: [-1, 0]`, `right: [1, 0]`. (+Y is up, standard CAD convention).
- **Viewport Math**:
  - `zoomAt(vp, mouseX, mouseY, factor)` keeps the exact world point under the cursor stationary while zooming.
  - Clamped between `0.15×` and `4.0×`.
  - Dynamic grid automatically adapts cell size (`1 cm`, `5 cm`, `10 cm`, `50 cm`, `100 cm`, etc.) based on current zoom so the screen never turns into an unreadable mesh.

### 4.3 DXF & JSON Exporters
- **DXF Export**:
  - Generates standard AutoCAD Release 12 compatible ASCII DXF.
  - Sets `$INSUNITS = 5` (Centimetres).
  - Proper separation of layers: `WALL`, `DOOR`, `WINDOW`.
  - Door leaves are rendered as lines, swings as geometric `ARC` entities with true counter-clockwise CAD angles, and openings receive `TEXT` annotations.
  - Numbers are formatted with `fmt()` or clean decimals—**never scientific exponent notation** (`1e-5`), which breaks certain CAD programs.
  - Filename is sanitized and strictly saved with the `.dxf` extension (e.g. `Villa Ground Floor.dxf` or `plan.dxf`).

### 4.4 Cloud Storage & Plan History (Firestore)
- **Multi-Tenant Security Model**:
  - Document Path: `/users/{userId}/plans/{planId}`
  - Ensures no user can query or access another user's plans.
- **Document Payload**:
  - `name`: User-defined title (e.g. "Ground Floor") or null.
  - `savedAt`: Unix timestamp in milliseconds.
  - `stats`: Wall count, opening count, total wall length in cm.
  - `plan`: Validated `StoredPlan` object with schema version `1`.
- **Save vs. Update Existing Workflow**:
  - When opening an existing plan from History, the editor tracks its active `planId`.
  - When clicking **Save** on an existing plan, the user is presented with two explicit choices:
    1. **Update Current Plan** ("تحديث نفس المخطط"): overwrites the existing document with the new edits and updates the timestamp/stats.
    2. **Save as New Plan** ("حفظ كنسخة جديدة"): keeps the original intact and forks the drawing into a brand new document with its own ID.
  - When starting a new drawing, clicking **Save** directly creates a new plan.
- **Offline Support**:
  - Firestore is configured with `persistentLocalCache()`. Writes made while offline are saved locally and synced automatically when network returns.

---

## 5. Security & Gitignore Guidelines

The `.gitignore` has been hardened to prevent accidental leakage of sensitive keys or unnecessary build artifacts:
- **Secrets & Credentials**: `*serviceAccount*.json`, `*.pem`, `*.key`, `*.keystore`, `*.jks`, `.env*`.
- **Firebase & Build Logs**: `firebase-debug.log*`, `firestore-debug.log*`, `npm-debug.log*`.
- **Android / Capacitor Artifacts**: `android/app/build/`, `android/.gradle/`, `android/local.properties`.
- **Client Firebase Config**: Note that `src/config/firebase.ts` contains client-side connection identifiers (`apiKey`, `projectId`, etc.). These are public identifiers for browser SDK connections and are protected by Firebase Auth and Firestore Security Rules.

---

## 6. Development & Quality Commands

Always run these commands from `E:\khatwa-plan`:

```bash
# Start local development server (port 5173)
npm run dev

# Run TypeScript & Svelte type checking (svelte-check)
npm run check

# Run all automated tests (Vitest)
npm test

# Build production bundle for deployment
npm run build

# Preview production build locally
npm run preview
```

---

## 7. Next Steps & Roadmap

1. **Android Setup**: Initialize Capacitor (`@capacitor/core`, `@capacitor/android`), configure package name (`com.khatwaplan.app`), and build the native Android project.
2. **Firestore Security Rules**: Deploy strict rules in Firebase Console to enforce user-only access:
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/plans/{planId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
3. **PWA Assets**: Generate 192×192 and 512×512 PNG icons from `icon.svg` for the Web App Manifest and Android splash screens.
