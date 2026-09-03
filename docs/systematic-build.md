# Systematic Project Build Log — MediVision

Reusable methodology for building MediVision — from planning to production.

---

## Core Principles (Verified in Build)

1. **Verify, never assume.** All external APIs (NiiVue CDN, Hugging Face, BodyParts3D) verified via live curl in Phase 1.
2. **Build in small, independently-testable steps.** Core math, contracts, and viewports built and tested piece-by-piece.
3. **Contract-first when building an API or interface.** All schemas defined in `api-docs.md` before implementation.
4. **Label fake vs. real, always, out loud.** `source: 'huggingface-medsam-live'` vs `source: 'medivision-ai-engine-simulated'` explicitly tagged in code and UI.
5. **Deploy/run early, verify constantly in the real environment.** Ports and production bundles verified throughout.
6. **Fix root causes, not symptoms.** TypeScript rootDir constraints and process management resolved cleanly.
7. **Keep documentation in sync with reality.** `CONTEXT.md` updated per-change.
8. **User rule compliance.** 100% Non-Python, 100% terminal commands.

---

## Systematic Phase Completion Checklist

- [x] **Phase 0 — Read Everything Before Writing Anything**
  - [x] All planning docs read & scope aligned
  - [x] Non-Python architecture decisions confirmed

- [x] **Phase 1 — Verify Every External Dependency**
  - [x] NiiVue NIfTI CDN tested (HTTP 200 OK)
  - [x] Hugging Face MedSAM endpoint tested
  - [x] BodyParts3D archive verified

- [x] **Phase 2 — Fix Stale/Inconsistent Docs or Leftovers First**
  - [x] Cross-doc audit completed
  - [x] Zero leftover placeholder brackets

- [x] **Phase 3 — Build a Skeleton With Fake/Mock Data First**
  - [x] All schema contracts validated in `test_contracts.ts`
  - [x] Telemetry & SVD registration contracts verified

- [x] **Phase 4 — Deploy/Run in the Real Target Environment Early**
  - [x] Backend & Frontend production builds compiled with 0 errors
  - [x] Clean port release verified

- [x] **Phase 5 — Set Up Real Infrastructure (Storage, Config, Secrets)**
  - [x] `.env.example` templates committed
  - [x] Client-side `caseStorage.ts` implemented
  - [x] `public/models/` asset repository created

- [x] **Phase 6 — Build Core Logic/Data Pipeline Incrementally**
  - [x] Physical RAS $\leftrightarrow$ Voxel roundtrip verified ($\Delta \le 0.5\text{ mm}$)
  - [x] 3D Trajectory unit vectors & spherical angles verified
  - [x] Margin boundary transitions validated

- [x] **Phase 7 — Honest Interim Logic (Fallback Labels)**
  - [x] Explicit `source` fields in API responses
  - [x] UI visual badges for Cloud Live vs Local Simulation

- [x] **Phase 8 — Build the "Smart" Part (AI Model & SVD Registration)**
  - [x] SVD Registration benchmarked on all 3 cases ($\text{TRE} \le 1.319\text{ mm} < 2.0\text{ mm}$)
  - [x] MedSAM zero-shot segmentation prompt logic verified ($>94\%$ confidence)

- [x] **Phase 9 — Use Real Tooling/Registries**
  - [x] `lucide-react` medical icons integrated
  - [x] Three.js PBR materials & lighting rigs verified
  - [x] Tailwind CSS clinical dark theme active

- [x] **Phase 10 — UI: Design Intent First, Then Build, Then Visually Verify**
  - [x] Playwright MCP visual browser verification completed
  - [x] 0 console errors verified in live browser
  - [x] Screenshots captured & archived

- [x] **Phase 11 — Deploy Everything, Verify Production Matches Dev**
  - [x] Final production bundle verified (`npm run build` passing in 2.2s)
  - [x] Smoke test matrix in `docs/TEST.md` confirmed
  - [x] Zero lingering zombie processes or resource leaks
