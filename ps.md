# CLI Exercises Learn — Problem Solving & Debugging Guide

## CRITICAL RULE: Bilingual Parity (EN/FR)

**ABSOLUTE REQUIREMENT**: Whatever exists in English MUST have a French equivalent.

- All UI strings: EN + FR
- All short explanations (e field): EN + FR
- All detailed explanations (de field): EN + FR
- Glossary: EN + FR
- Code snippets: Shell/CLI commands stay the same (universal)

When adding new content, add both languages in the same commit. Never ship English-only content.

---

## Rifle Ballistic App — Full offline (no internet)

**Requirement:** The app must open and work with no internet (e.g. in the field). See AGENTS.md § “URGENT — Full offline requirement”.

**What was done to fix offline:**
- Removed all CDN/external URLs from the built app: Tailwind and Font Awesome are bundled via npm; fonts use system stack; PWA icon is `public/icon-512.png`.
- Removed the import map from `index.html` so the app does not load React or any runtime from `esm.sh`.
- **Service worker is generated at build time** by `scripts/generate-sw.cjs` (run after `vite build`). It precaches **every file in `dist/`** (index.html, manifest.json, icon, all hashed JS/CSS/fonts) so the app works offline as soon as the SW installs. There is no `public/sw.js`; the only SW is `dist/sw.js` produced by the build.
- Fetch strategy: cache-first for all requests (serve from cache when available, else fetch and cache).

**If the app fails offline:**
1. User must open the app at least once **with network** so the SW can install and run the install handler (which precaches all URLs).
2. Do not re-add CDN scripts, styles, or fonts to `index.html`; keep everything bundled or local.
3. After changing SW logic, edit `scripts/generate-sw.cjs` and bump `CACHE_NAME` version; rebuild and redeploy.
4. Test: `npm run build`, serve `dist` with correct base (e.g. `npx serve dist` and open the path that matches your base, or deploy and open the app), go offline in DevTools, reload; the app should load from cache.

---

## Flags Reference (syntax highlighting)

**Requirement**: The Flags/Commands reference view must **not** be all green. It must use clear syntax highlighting (e.g. comments grey, flags/options blue, descriptions amber, base text slate/grey) so it is readable and matches AGENTS.md.

**If you see changes locally but not on your phone**: The app on your phone loads the **deployed** version (e.g. from GitHub Pages). Local changes are only on your machine until you **push to GitHub** and the site **re-deploys**. To fix "still all green on phone": (1) Commit the FlagsView changes, (2) Push to GitHub (`git push`), (3) Wait for the deployment (e.g. GitHub Actions or Pages rebuild). Then hard-refresh or re-open the app on your phone so it loads the new bundle.

---

## GitHub Pages deploy (Actions source)

**Keep Source = GitHub Actions:** Repo **Settings → Pages → Build and deployment → Source** = **"GitHub Actions"**.

The workflow (`.github/workflows/deploy.yml`) must match the **last successful run (Run 3, commit 3e32dcd)**: single job, **configure-pages@v4**, **upload-pages-artifact@v3**, **deploy-pages@v4**, path `dist`, `cancel-in-progress: true`. In this repo, v5+v4 failed; only v4+v3 has been observed to pass.

**If the workflow is red:**  
- Confirm Source is "GitHub Actions" (not "Deploy from a branch").  
- Revert the workflow to the exact Run 3 version: `configure-pages@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4` in one job.  
- Do not split into two jobs; do not upgrade to v5/v4 without testing.

### What we tried and failed (do not repeat)

- **Split jobs (build + deploy with `needs: build`):** Deploy job failed with "No artifacts named 'github-pages' were found" or exit code 1; artifact from build job not visible to deploy job in this repo.
- **Single job with `configure-pages@v5` + `upload-pages-artifact@v4`:** Failed (run 8). Do not use v5+v4 in this repo.
- **Single job with `upload-pages-artifact@v3`** (after other changes): Failed when combined with v5; see below for working combo.
- **`peaceiris/actions-gh-pages` (deploy from branch):** User wants to keep Source = GitHub Actions, not "Deploy from a branch", so reverted.
- **`cancel-in-progress: false`:** Tried to reduce flakiness; last successful run (3) had `cancel-in-progress: true`.

**What actually worked (run 2 and 3 green):** Single job with `configure-pages@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`, `cancel-in-progress: true`. If deploy breaks again, revert workflow to match commit 3e32dcd (Run 3).

---

## French in browser vs app / PWA cache

**Symptom:** French works in desktop browser but not in "GitHub app" or mobile app (PWA).

**Likely cause:** The app (or PWA/add-to-home) is serving a **cached** bundle (old JS/assets) or the service worker is caching the previous deployment. The browser gets the latest deployment; the app may be using an older cached version without the French translation code.

**What to try (user):**

1. **Hard refresh / clear cache in the app:** Force-reload or clear site data for the app/PWA (e.g. in browser app: clear site data for the Pages URL, or uninstall PWA and re-add).
2. **Service worker:** If the site uses a service worker, it may cache aggressively. After a new deploy, the SW might still serve old assets until it updates (e.g. close all tabs of the site, reopen, or trigger an update).
3. **Confirm deployment:** In GitHub repo → Actions, confirm the latest "Deploy to GitHub Pages" run is green and that the commit with French changes is the one that was deployed. Then open the **exact** Pages URL in the app (e.g. `https://llomj.github.io/CLI_exercises/`) and force-refresh.

**For agents:** Do not assume "French not in app" means code is wrong; check cache/deploy first. Document in ps.md if we add cache-busting or SW versioning later.

**Checking GitHub in Cursor:** Open the repo in Cursor’s browser (e.g. Simple Browser or browser panel) at `https://github.com/llomj/CLI_exercises`. Sign in to GitHub there to access **Settings → Pages** (Source = GitHub Actions) and **Settings → Actions → General** (workflow permissions). Agents cannot sign in; the user must do this. The README currently links to `python-exercises-learn`; the CLI app URL is `https://llomj.github.io/CLI_exercises/`.

### March 2026 — Desktop browser shows changes, phone app does not

**Pattern:** You see new features/content (e.g. CLI Operations & Math) in the desktop browser, but the GitHub mobile app / PWA still shows the **old Python layout**.

**Root cause:**  
- Desktop browser is often running a **local dev build** or the latest deployed Pages build.  
- The phone app is a **cached PWA from GitHub Pages** and only updates when: (1) a new commit is **pushed** to `origin/main`, (2) the **Pages deploy** run is green, and (3) the PWA cache/service worker is refreshed.

**Mandatory checklist before debugging code again:**

1. **Confirm commit is on origin/main**  
   - `git status` must NOT say “ahead of 'origin/main'”.  
   - If it does: `git push` first.
2. **Confirm GitHub Pages deploy is green**  
   - GitHub → `Actions` → latest Pages workflow must show **conclusion = success** for the commit with your change.
3. **Reset the PWA cache on the phone ONCE per deploy**  
   - Open: `https://llomj.github.io/CLI_exercises/clear-sw.html` in the same browser/app the icon uses.  
   - Fully close the app/tab, then reopen `https://llomj.github.io/CLI_exercises/` from the icon or browser.

**Rule:** If desktop shows the change and code looks correct, assume **deploy/cache** is the problem first, **not** the feature implementation. Do not re‑implement the same feature just because the phone app still serves an old bundle.

---

## March 4, 2026 — French options incident (browser OK, phone app stale)

### Confirmed findings

1. Local fix commit existed but was initially not on `origin/main` (local `main` was ahead by 1 commit).
2. After push, GitHub Actions run **#10** (`head_sha` `9be7752`) still failed in **Build** step, so Pages was not updated.
3. Root build blocker: `src/components/QuizView.tsx` imports `../utils/detailedExplanationLevel`, but `src/utils/detailedExplanationLevel.ts` was missing from tracked files on `main`.
4. Result: desktop browser may show local/latest build, while phone app (GitHub/PWA) keeps old deployed bundle with English A/B/C/D options.

### Fix procedure (must follow in order)

1. Ensure `src/utils/detailedExplanationLevel.ts` is committed to `main`.
2. Push to GitHub and confirm Actions run is green for that exact commit.
3. Open deployed URL exactly: `https://llomj.github.io/CLI_exercises/`.
4. On phone app, run cache reset URL once: `https://llomj.github.io/CLI_exercises/clear-sw.html`.
5. Reopen app from Home Screen/GitHub app and switch language to French.

### Validation checklist

- GitHub Actions latest run: `conclusion = success`.
- Pages deploy points to the commit containing French option fix + missing util file.
- In quiz view with French selected, A/B/C/D option text appears in French.

---

## March 4, 2026 — Level 0-4 in-depth explanation overhaul (batch tracker)

### Batch completed (this update)

1. Added a foundation explanation formatter for **Level 0 through Level 4** with enforced depth modes:
   - Beginner explanation
   - Intermediate explanation
   - Expert explanation
2. Added structured verbose output for these levels with:
   - clear heading by depth
   - step-by-step command example flow
   - retention/checklist blocks for learning
3. Applied the same rule to **French mode** so depth selection is respected (not a single static detailed block).
4. Wired the new behavior in all explanation surfaces:
   - Quiz view
   - ID search modal
   - ID log view
5. Kept layout unchanged; only explanation content pipeline changed.

### What still needs to be done (next batches)

1. Batch QA pass on live content for IDs **1-1500**:
   - verify command example extraction quality
   - verify no awkward phrasing for conceptual (non-command) questions
2. French quality pass:
   - tune vocabulary for beginner friendliness
   - reduce any machine-like phrasing in generated expert blocks
3. Optional content hardening:
   - add per-topic custom step templates (navigation/files/processes/text tools) for even more precise examples in Level 0-4.

---

## March 4, 2026 — Full 3000+ in-depth verbosity rollout (EN + FR)

### Completed now

1. Extended the verbosity formatter from Level 0-4 to **all levels (0-10)**.
2. Detailed explanation depth selector now yields structured verbose output for:
   - Beginner
   - Intermediate
   - Expert
   across the full question bank.
3. French detailed explanation flow now follows the same depth behavior for all IDs, with fallback normalization still respected.
4. No layout changes were made; this is a content-pipeline upgrade only.

### Remaining QA

1. Spot-check random IDs across Levels 5-10 in EN + FR for:
   - natural phrasing
   - command example relevance
   - consistency between Beginner/Intermediate/Expert depth.
2. Tune per-topic templates if needed (networking/security/containers levels) to reduce generic examples.

---

## March 8, 2026 — Target panel too low on calculate page

**Problem:** The target input panel appears far below the circle, not directly under it.

**Root cause:** The circle is inside a container with height `CIRCLE_SLOT_HEIGHT` (55vh), but the circle is centered within this space, leaving empty space above AND below the circle. The panel was appearing below the entire container, not right under the circle.

**Solution:** Use negative margin to pull the panel up to overlap with the empty space below the circle:

```tsx
// Instead of mt-0 or mt-1, use:
<div className="w-full max-w-md -mt-[20vh] ...">
```

This pulls the panel UP by 20% of the viewport height, positioning it right at the bottom edge of the circle. Adjust the percentage as needed for the desired visual overlap.

---

## March 2026 — Ammunition / Scope / Rifle list selection (BallisticHub)

**Problem:** In BallisticHub, when opening the list via the chevron (v) for Ammunition, Scope, or Rifle, selecting an option could leave the UI "stuck" and the list would disappear, preventing re-selection.

**Solution (updated):** (1) Call `e.stopPropagation()` and `e.preventDefault()` on list item button clicks so no parent swallows the click. (2) Add `onClick={(e) => e.stopPropagation()}` on the scrollable list container. (3) **Do NOT close the panel after selection** — do not call `setScopeExpanded(false)`, `setRifleExpanded(false)`, or `setAmmunitionExpanded(false)`. The rifle and scope lists must **always persist** when the section is expanded so the user can re-select another rifle or scope at any time.

**Panel order:** Turret table → Rifle → Ammunition → Scope (rifle first so ammunition can filter by rifle caliber).

**Ammunition filtered by rifle:** When a rifle is selected, the ammunition list shows only bullets for that rifle's caliber. Use `selectedCaliberKey = rifle?.caliberKey ?? filterCaliberKey ?? bullet?.caliberKey ?? ...` so rifle caliber takes precedence. Sync `filterCaliberKey` when rifle changes: `useEffect(() => { if (rifle?.caliberKey) setFilterCaliberKey(rifle.caliberKey); }, [rifle?.caliberKey])`.

