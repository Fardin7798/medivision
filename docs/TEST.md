# TEST.md — MediVision Verification & Smoke Testing Matrix

> Living reference of exact terminal and browser commands to verify that MediVision is fully functional, healthy, and bug-free.

---

## 1. Environment Setup Verification
```bash
# Check Node.js version (Requires Node 18+ or 20+)
node --version
# Output Verified: v24.20.0

# Check npm version
npm --version
# Output Verified: 11.19.0

# Check Git status
git status
```

---

## 2. Frontend & Web Engine Verification
```bash
# 1. Install all frontend dependencies
cd frontend && npm install

# 2. Run TypeScript typecheck
npx tsc --noEmit
# Output Verified: 0 errors

# 3. Start local development server (when ready to test)
npm run dev
# Expected Output: Ready in http://localhost:3000

# 4. Production build verification
npm run build
# Output Verified: Compiled successfully in 2.2s (Static 4/4 pages generated)
```

---

## 3. Backend Service Verification
```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Production build
npm run build
# Output Verified: 0 errors (dist/index.js generated)

# 3. Run Phase 3, 6, 8 test suites
npx ts-node src/test_contracts.ts
npx ts-node src/test_core_pipeline.ts
npx ts-node src/test_ai_smart_layer.ts
# Output Verified: All suites passing with 100% compliance
```

---

## 4. Medical Viewport & 3D Smoke Tests (Playwright Verified)

### Test 4.1: NiiVue WebGL2 Volume & Orthogonal MPR
- **Verification**: The 4-quadrant layout initializes. Active cases load across Axial, Sagittal, and Coronal views.
- **Crosshair Check**: Clicking or sliding coordinates synchronizes all 3 orthogonal planes.

### Test 4.2: 3D Anatomical Organ Rendering
- **Verification**: 3D brain/liver/spine meshes and glowing tumor target core render smoothly at 60 FPS.
- **Layer Check**: Opacity sliders adjust mesh transparency in real-time.

---

## 5. Surgical Navigation & Telemetry Verification

### Test 5.1: Probe Tip Distance Calculation & Margin State Machine
- **Mathematical Check**: Distance to Target ($d\text{ mm}$) matches Euclidean metric.
- **Margin Alert Check**:
  - Distance $> 12.5\text{ mm}$ $\to$ 🟢 `SAFE ZONE`
  - Distance $5.0 - 12.5\text{ mm}$ $\to$ 🟡 `APPROACHING MARGIN`
  - Distance $\le 5.0\text{ mm}$ $\to$ 🔴 `CRITICAL MARGIN BREACH`

### Test 5.2: Kabsch Landmark Registration
- **Verification**: 3 paired fiducials (Nasion, Left Tragus, Right Tragus) align with $\text{TRE} \le 1.319\text{ mm} < 2.0\text{ mm}$ clinical tolerance.

---

## 6. Verified Failure Points & Protections

| Item | Potential Issue | Solution Implemented |
|---|---|---|
| Memory / CPU Load | Persistent background servers consuming resources | Strict server lifecycle management (clean process teardown) |
| Fallback Data | Unclear whether AI is live or simulated | Explicit `source: 'huggingface-medsam-live'` vs `'medivision-ai-engine-simulated'` badges |
| Cross-Directory Types | TypeScript `rootDir` constraints | Excluded standalone test runners from production `tsconfig.json` |
