# GitHub Pages Setup Instructions (GitHub Actions)

This repo is set up to build and deploy via **GitHub Actions**. Pages → Build and deployment → **Source: GitHub Actions**.

## Repository & live URL

- **Repo**: https://github.com/llomj/CLI_exercises
- **App URL (PWA)**: https://llomj.github.io/CLI_exercises/

## Enable Pages (one-time)

1. Go to **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save. Each push to `main` will run the workflow and deploy.

## Verify deployment

1. **Actions** tab: https://github.com/llomj/CLI_exercises/actions  
2. Wait for **Deploy to GitHub Pages** to finish (green check).
3. Open on phone or desktop: **https://llomj.github.io/CLI_exercises/**  
4. Add to home screen for PWA install (HTTPS required).

## Current configuration

- Base path: `/CLI_exercises/` (from repo name in workflow).
- Workflow: `.github/workflows/deploy.yml` — checkout → `npm ci` → `npm run build` (with `VITE_BASE_REPO`) → upload `dist` → deploy-pages.

## Troubleshooting

### "Not working" or 404 on phone

1. **Set Pages source to GitHub Actions**
   - Repo → **Settings** → **Pages**
   - Under **Build and deployment**, set **Source** to **GitHub Actions** (not "Deploy from a branch"). Save.

2. **Run the workflow**
   - Go to **Actions** → **Deploy to GitHub Pages** → **Run workflow** (Run workflow button), or push a commit to `main`.
   - Wait until the run is green.

3. **Wait and hard-refresh**
   - After the first deploy, wait 1–2 minutes. On your phone, open **https://llomj.github.io/CLI_exercises/** and do a hard refresh or clear the site data for that URL.

4. **Use the exact URL**
   - Open: `https://llomj.github.io/CLI_exercises/` (with trailing slash is fine; without slash should redirect).

### Other issues

- **Blank or wrong base**: Workflow sets `VITE_BASE_REPO` to the repo name so assets load from `/CLI_exercises/`.
- **Actions failing**: Check the run logs; ensure `package.json` and dependencies are committed.
