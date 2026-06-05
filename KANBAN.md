# Kanban Task Tree: Migrasi Vite+

> **Project:** api-hari-libur → Vite+ + Nitro + Hono + pnpm + Cloudflare Pages
> **Status:** Planning
> **Priority Scale:** 3=Critical · 2=High · 1=Med · 0=Low · -1=Backlog

---

## Phase 0: Warmup & Validation [Priority: 3]

### `[0.1]` Verify baseline: all current tests pass
- **Scope:** Run `npm test`, `npm run typecheck`, `npm run lint` on current main branch
- **Why:** Must confirm green signal before touching anything
- **Owner:** Rin (code) → Kira (QA)
- **Acceptance:** `npm test` all pass, `tsc --noEmit` clean, `eslint` clean
- **Dependencies:** None

### `[0.2]` Verify wrangler dev server works locally
- **Scope:** Run `npm run dev`, hit `GET /api/today` via curl, confirm JSON response
- **Why:** Baseline smoke-test before architecture change
- **Owner:** Rin
- **Acceptance:** curl returns 200 with valid holiday JSON

### `[0.3]` Understand Vite+/Nitro scaffold output
- **Scope:** `pnpm create vite@latest` → choose Vite+ preset → inspect generated `vite.config.ts`, `nitro.config.ts`, `server.ts`, `vp` commands
- **Why:** Reference target structure before writing own config
- **Owner:** Rin (research)
- **Acceptance:** Known directory layout and config patterns documented in AGENTS.md

---

## Phase 1: Toolchain Migration (npm → pnpm) [Priority: 3]

### `[1.1]` Install pnpm globally
- **Scope:** `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`
- **Why:** pnpm is the required package manager
- **Owner:** Rin
- **Acceptance:** `pnpm --version` returns a version number

### `[1.2]` Run `pnpm import` to generate pnpm-lock.yaml from package-lock.json
- **Scope:** `cd ~/api-hari-libur && pnpm import`
- **Why:** Preserves exact dependency versions from existing lockfile
- **Owner:** Rin
- **Acceptance:** `pnpm-lock.yaml` exists with matching dependency tree

### `[1.3]` Delete `package-lock.json` and `node_modules/`
- **Scope:** `rm -rf package-lock.json node_modules/`
- **Why:** Clean slate for pnpm install; lockfile conflict avoidance
- **Owner:** Rin
- **Acceptance:** Only `pnpm-lock.yaml` remains for lock

### `[1.4]` Run `pnpm install` and verify resolution
- **Scope:** `pnpm install` → check for peer dep warnings, validate installed packages
- **Why:** Ensure all dependencies resolve correctly under pnpm
- **Owner:** Rin
- **Acceptance:** `pnpm install` exits 0, `pnpm ls` shows all expected packages

### `[1.5]` Run baseline tests under pnpm
- **Scope:** `pnpm test` (still uses vitest directly for now)
- **Why:** Verify pnpm didn't break anything — same tests, same vitest config
- **Owner:** Rin (code) → Kira (QA)
- **Acceptance:** All tests pass via `pnpm test`

---

## Phase 2: Vite+ CLI & Nitro Setup [Priority: 3]

### `[2.1]` Install `create-vite` globally (for `vp` command)
- **Scope:** `pnpm add -g create-vite` (or ensure Vite+ CLI available)
- **Why:** `vp` is the Vite+ CLI used for dev/build/test/check
- **Owner:** Rin
- **Acceptance:** `vp --version` works

### `[2.2]` Create `vite.config.ts` with Nitro plugin
- **Scope:** Write new `vite.config.ts` at project root
- **Content:**
  ```ts
  import { defineConfig } from 'vite'
  import { nitro } from 'nitro/vite'

  export default defineConfig({
    plugins: [
      nitro({
        preset: 'cloudflare_pages',
        serverEntry: './server.ts',
      }),
    ],
  })
  ```
- **Why:** This is the core config — Nitro replaces Pages Functions entry
- **Owner:** Rin
- **Acceptance:** Valid config file, no syntax errors

### `[2.3]` Create `nitro.config.ts` (Nitro-specific overrides)
- **Scope:** Write `nitro.config.ts` if needed for:
  - `nodeCompat` (since linkedom needs node:html)
  - `externals` or `inline` rules if linkedom causes issues
  - `alias` config matching `@/` → `./src/`
- **Why:** Nitro may need specific config for Node compatibility in linkedom
- **Owner:** Rin
- **Acceptance:** Nitro config exists, `vp build` doesn't error on Node deps

### `[2.4]` Create `server.ts` — Nitro server entry point
- **Scope:** Write `server.ts` at project root
- **Content:**
  ```ts
  import { Hono } from 'hono'
  import app from './src/app'
  export default app
  ```
  (Re-exports the existing Hono app from `src/app.ts`)
- **Why:** Nitro auto-detects `server.ts` as server entry — replaces `functions/api/[[catchall]].ts`
- **Owner:** Rin
- **Acceptance:** File exists, `vp dev` starts without crash

### `[2.5]` Test `vp dev` serves the app
- **Scope:** Run `vp dev`, hit `GET /api/today` via curl
- **Why:** Validate Nitro + Hono integration locally
- **Owner:** Rin (code) → Kira (QA)
- **Acceptance:** curl returns same JSON shape as Phase 0.2

---

## Phase 3: Update package.json Scripts & Dependencies [Priority: 3]

### `[3.1]` Rewrite `package.json` scripts
- **Scope:** Replace npm scripts with vp equivalents:
  ```
  "dev": "vp dev",
  "build": "vp build",
  "check": "vp check",           // Oxc-based lint+typecheck
  "test": "vp test",
  "deploy": "wrangler pages deploy"
  ```
- **Why:** New toolchain uses `vp` commands; remove old ESLint/tsc-only scripts
- **Owner:** Rin
- **Acceptance:** `vp dev`, `vp build`, `vp check`, `vp test` all recognized commands

### `[3.2]` Add Nitro as dependency
- **Scope:** `pnpm add nitro@beta` (or specific version from Vite+ scaffold)
- **Why:** Nitro v3 is the server engine; needed at runtime for build/dev
- **Owner:** Rin
- **Acceptance:** `nitro` listed in `package.json` dependencies

### `[3.3]` Remove obsolete devDependencies
- **Scope:** `pnpm remove` these (no longer needed):
  - `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint` (replaced by `vp check`)
  - `vitest` (replaced by `vp test`, which bundles it)
  - `wrangler` (keep for deploy, or move to global)
  - `esbuild` (Nitro/Rolldown handles bundling)
- **Why:** Clean up deps that vp toolchain replaces
- **Owner:** Rin
- **Acceptance:** `pnpm ls` shows only needed deps

### `[3.4]` Update `pnpm-lock.yaml` after dep changes
- **Scope:** `pnpm install` after script/dep edits to regenerate lock
- **Why:** Keep lockfile consistent
- **Owner:** Rin
- **Acceptance:** `pnpm install` exits 0

---

## Phase 4: Delete Obsolete Configs & Files [Priority: 2]

### `[4.1]` Delete `vitest.config.ts`
- **Scope:** `rm vitest.config.ts`
- **Why:** Vitest config is now managed by Vite+ (`vp test` reads vite.config.ts)
- **Note:** The `@/` alias needs to be in `vite.config.ts` resolve.alias instead
- **Owner:** Rin
- **Acceptance:** `vp test` still picks up test files correctly

### `[4.2]` Delete `eslint.config.js`
- **Scope:** `rm eslint.config.js`
- **Why:** ESLint replaced by `vp check` (Oxc-based)
- **Owner:** Rin
- **Acceptance:** `vp check` lints without referencing eslint config

### `[4.3]` Delete `functions/api/[[catchall]].ts` and parent dirs
- **Scope:** `rm -rf functions/`
- **Why:** Pages Functions entry replaced by `server.ts` + Nitro
- **Owner:** Rin
- **Acceptance:** No more `functions/` directory; `vp dev` still works

### `[4.4]` Delete `.wrangler/` cache
- **Scope:** `rm -rf .wrangler/`
- **Why:** Stale wrangler cache from old Pages Functions setup
- **Owner:** Rin
- **Acceptance:** Directory gone; `vp build` fresh

### `[4.5]` Update `.gitignore`
- **Scope:** Add entries for new build artifacts:
  ```
  .output/
  dist/
  .nitro/
  node_modules/
  .wrangler/
  ```
- **Why:** Nitro outputs to `.output/`, Vite+ may use `dist/` or `.nitro/`
- **Owner:** Rin
- **Acceptance:** New build artifacts not tracked by git

---

## Phase 5: Update TypeScript Config [Priority: 2]

### `[5.1]` Update `tsconfig.json` for Nitro/Vite+ compatibility
- **Scope:** Adjust compilerOptions:
  - Remove `types: ["@cloudflare/workers-types"]` if Nitro handles CF types
  - Keep `@/*` path alias (migrate to vite.config.ts resolve.alias)
  - Remove `noEmit: true` if Vite+ expects output (or keep — Vite bundles anyway)
  - Update `include` to reflect new structure (drop `functions/**/*`)
- **Owner:** Rin
- **Acceptance:** `vp check` or `vp build` doesn't complain about tsconfig

### `[5.2]` Verify `@/` path alias works in both Vite and Nitro
- **Scope:** Add `resolve.alias` to `vite.config.ts`:
  ```ts
  resolve: {
    alias: {
      '@': '/src'
    }
  }
  ```
- **Why:** Source files use `@/schema/...` imports; must resolve in build & dev
- **Owner:** Rin
- **Acceptance:** `vp dev` resolves `@/` imports correctly

---

## Phase 6: Test Adaptation [Priority: 2]

### `[6.1]` Run `vp test` — see if existing tests pass as-is
- **Scope:** Execute `vp test`, collect failures
- **Why:** Baseline — vitest config embedded in Vite+ should auto-detect test files
- **Owner:** Rin (code) → Kira (QA)
- **Acceptance:** Note any failing tests for next steps

### `[6.2]` Fix test configuration if needed
- **Scope:** If `vp test` doesn't pick up `test/*.test.ts` or globals, add `test` block to `vite.config.ts`:
  ```ts
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    testTimeout: 10_000,
  }
  ```
  (Vite+ uses Vitest under the hood via `vite.config.ts`)
- **Why:** Tests must run under new toolchain
- **Owner:** Rin
- **Acceptance:** `vp test` runs all test files

### `[6.3]` Verify cache isolation in test environment
- **Scope:** Check that module-level cache in `holiday.ts` doesn't break under vp test runner
- **Why:** Different bundler behavior might affect module singleton lifecycle
- **Owner:** Rin
- **Acceptance:** All 49 tests pass without cache pollution

### `[6.4]` Update test mock strategy if scraper dependencies change
- **Scope:** Check if linkedom import paths or global fetch mocking needs adjustment under Nitro
- **Why:** Nitro runs in workers sandbox — global mock might behave differently
- **Owner:** Rin
- **Acceptance:** API integration tests pass with mocked fetch

---

## Phase 7: CI Pipeline Update [Priority: 2]

### `[7.1]` Update `.github/workflows/ci.yml` for pnpm
- **Scope:** Add pnpm setup before install:
  ```yaml
  - uses: pnpm/action-setup@v4
    with:
      version: latest
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: 'pnpm'
  - run: pnpm install
  ```
- **Why:** CI must use pnpm instead of npm
- **Owner:** Rin
- **Acceptance:** Workload file validates

### `[7.2]` Replace lint + typecheck steps with `vp check`
- **Scope:** Change:
  ```yaml
  - name: Quality checks (lint + typecheck)
    run: pnpm check
  ```
  (single command replaces old `npm run lint` + `npm run typecheck`)
- **Why:** `vp check` does both lint and typecheck via Oxc
- **Owner:** Rin
- **Acceptance:** CI step runs `vp check` successfully

### `[7.3]` Update test step to `pnpm test`
- **Scope:** Keep `pnpm test` (which now runs `vp test`)
- **Why:** Minimal change; just ensure the command works
- **Owner:** Rin
- **Acceptance:** CI test step runs and passes

### `[7.4]` Add build validation step
- **Scope:** Add `pnpm build` step to CI (after tests, before deploy)
  ```yaml
  - name: Build (Vite+ Nitro)
    run: pnpm build
  ```
- **Why:** Ensure build doesn't break; catch Rolldown/Nitro bundling issues early
- **Owner:** Rin
- **Acceptance:** CI build produces `.output/` folder

### `[7.5]` Update wrangler deploy step
- **Scope:** If `wrangler.toml` `pages_build_output_dir` changed from `"public"` to `".output/public"`, update the deploy command accordingly
- **Why:** Nitro outputs CF Pages-compatible build to `.output/public/`
- **Note:** May need `wrangler pages deploy .output/public --branch main`
- **Owner:** Rin
- **Acceptance:** Deploy step works with new output dir

---

## Phase 8: wrangler.toml & Deploy Config [Priority: 1]

### `[8.1]` Update `wrangler.toml` for new build output
- **Scope:** Change:
  ```toml
  name = "api-hari-libur"
  compatibility_date = "2025-01-01"
  pages_build_output_dir = ".output/public"
  ```
- **Why:** Nitro outputs CF-compatible build to `.output/public/` instead of `public/`
- **Owner:** Rin
- **Acceptance:** `wrangler pages deploy .output/public --dry-run` validates

### `[8.2]` Dry-run deploy locally
- **Scope:** Run `pnpm build && npx wrangler pages deploy .output/public --dry-run`
- **Why:** Validate that the build output structure matches CF Pages expectations
- **Owner:** Rin
- **Acceptance:** Dry run exits 0, no warnings about missing _routes.json or _headers

### `[8.3]` Add `_routes.json` if needed for API routing
- **Scope:** Check if Nitro generates `_routes.json` in `.output/public/`. If not, manually add:
  ```json
  {
    "version": 1,
    "include": ["/api/*"],
    "exclude": []
  }
  ```
- **Why:** Cloudflare Pages Functions need explicit route rules to direct `/api/*` to the worker
- **Owner:** Rin
- **Acceptance:** API routes work post-deploy

---

## Phase 9: Smoke Test & Final Verification [Priority: 3]

### `[9.1]` Full local smoke test
- **Scope:** 
  1. `pnpm build` → exit 0
  2. `pnpm check` → no errors
  3. `pnpm test` → all 49 tests pass
  4. `vp dev` → `curl /api/today` returns valid JSON
  5. `curl /api?year=2026&month=1` returns array of holidays
  6. `curl /api?year=1800` returns 422 validation error
- **Owner:** Rin (code) → Kira (QA)
- **Acceptance:** All 6 checks pass

### `[9.2]` Check public/ static assets served correctly
- **Scope:** Open `http://localhost:3000/` (root) in browser; verify landing page loads
- **Why:** Nitro also serves `public/` as static; must confirm no breakage
- **Owner:** Kira
- **Acceptance:** Landing page HTML/CSS/JS loads and looks correct

### `[9.3]` Deploy to Cloudflare Pages (production)
- **Scope:** `pnpm deploy` (which runs `wrangler pages deploy .output/public`)
- **Why:** Ship it — auto-deploy after all checks pass
- **Owner:** Rin
- **Acceptance:** Deploy URL returns same API responses as local

### `[9.4]` Production smoke test
- **Scope:** Hit production URL endpoints:
  - `GET https://api-hari-libur.pages.dev/api/today`
  - `GET https://api-hari-libur.pages.dev/api?year=2026&month=01`
  - `GET https://api-hari-libur.pages.dev/` (root → landing page)
- **Owner:** Kira
- **Acceptance:** All three return correct HTTP 200 responses

---

## Phase 10: Documentation & Cleanup [Priority: 1]

### `[10.1]` Update `README.md` with new commands
- **Scope:** Replace `npm run dev` → `pnpm dev`, `npm test` → `pnpm test`, etc.
- **Owner:** Rin
- **Acceptance:** README reflects current toolchain

### `[10.2]` Update `AGENTS.md` with new architecture
- **Scope:** Document:
  - Nitro replaces Pages Functions; `server.ts` is entry
  - `vp` commands replace npm scripts
  - Build output is `.output/public/`
  - Config files: `vite.config.ts` + `nitro.config.ts` + `wrangler.toml`
- **Owner:** Rin
- **Acceptance:** AGENTS.md is accurate for future agents

### `[10.3]` Archive old branch
- **Scope:** Tag current `main` branch as `pre-migration` for reference
  ```bash
  git tag pre-migration HEAD
  git push origin pre-migration
  ```
- **Why:** Safe rollback point if needed
- **Owner:** Rin
- **Acceptance:** Tag exists on remote

---

## Summary Block

```
┌─────────────────────────────────────────────────────────────────┐
│                  MIGRASI VITE+ · TASK TREE                       │
├─────────────────────────────────────────────────────────────────┤
│  Phase 0: Warmup & Validation              [P3]  3 tasks        │
│  Phase 1: Toolchain Migration (npm→pnpm)   [P3]  5 tasks        │
│  Phase 2: Vite+ CLI & Nitro Setup          [P3]  5 tasks        │
│  Phase 3: Update package.json & Deps       [P3]  4 tasks        │
│  Phase 4: Delete Obsolete Configs          [P2]  5 tasks        │
│  Phase 5: Update TypeScript Config         [P2]  2 tasks        │
│  Phase 6: Test Adaptation                  [P2]  4 tasks        │
│  Phase 7: CI Pipeline Update               [P2]  5 tasks        │
│  Phase 8: wrangler.toml & Deploy Config    [P1]  3 tasks        │
│  Phase 9: Smoke Test & Final Verification  [P3]  4 tasks        │
│  Phase 10: Documentation & Cleanup         [P1]  3 tasks        │
├─────────────────────────────────────────────────────────────────┤
│  TOTAL: 43 subtasks across 11 phases                            │
│  Sequential: Phase N+1 starts only when Phase N is fully done   │
│  Priority: Phase 0 → 1 → 2 → 3 → 9 → then 4→5→6→7→8→10         │
│  (or: critical-path first, cleanup later)                       │
└─────────────────────────────────────────────────────────────────┘
```
