# 🏗️ BuildQuote Pro: Contractor & DIY Material Estimator

**BuildQuote Pro** is a fully responsive, offline-first Progressive Web App (PWA) built for contractors, builders, and DIYers to calculate material quantities, snap/annotate job site photos, and generate professional PDF client estimates instantly on the go.

---

## ✨ Key Features

* **Accurate Trade Calculators:** 
  * **Concrete:** Slabs, footings, and round post holes with volume math and rounded-up pre-mix bag counts (80lb, 60lb, 30kg Canadian, 50lb).
  * **Drywall:** Room/area modes with automated door/window deductions, sheet sizes (4x8, 4x12), ready-mix mud, tape, and screw counts.
  * **Tile:** Area with waste factor, individual tiles, boxes, thinset mortar bags, and grout bags.
  * **Paint:** Finish paint and primer calculations with door/window deductions and metric/imperial unit conversions.
* **Job Site Photo Studio:** Capture or upload site photos with automatic canvas image compression (preventing `localStorage` quota crashes), touch/mouse annotations (drawing pens & text stamps), and 1-tap JPEG export.
* **Client Estimate Cart & PDF Generator:** Multi-item cart, custom labor, material markups, taxes, project scope notes, and a clean single-page printable quote layout (`@media print`).
* **Pro Unlock System:** Dual-hook monetization supporting PayPal checkout links (`.me`) and offline unlock codes (`BUILDPRO26`) or URL parameters (`?pro=unlocked`).
* **Utility Tools:** Standalone Unit Converter, Quick Add Custom Items, Dark/Light Mode toggle, and Currency selector (CAD, USD, EUR, GBP).
* **PWA Support:** 100% browser-based, offline-ready with service worker caching and mobile installability.

---

## 🚀 Built With
* React / TypeScript / Vite
* Tailwind CSS (Vite plugin)
* HTML5 Canvas & Web APIs (`navigator.share`, `localStorage`, `getUserMedia`)

## Development and publishing

Install the locked dependencies and run the existing checks:

```sh
npm ci
npm test
npm run lint
npm run build
```

Use `npm run dev` for local development, or `npm run preview` to inspect the production build locally. Vite writes the production app to `dist/`; `vercel.json` explicitly serves that directory instead of the repository root.

Keep esbuild compatible with Vite's peer dependency range, and commit the regenerated `package-lock.json` when updating dependencies. Do not use `--force` or `--legacy-peer-deps` to bypass dependency conflicts.

## Install on a phone

After these changes are deployed, open the site in your phone browser and tap **Install App**.

- **Android (Chrome):** confirm the install prompt, or use the browser menu → Install app / Add to Home screen.
- **iPhone / iPad (Safari):** Share → Add to Home Screen → Add. Leave Open as Web App enabled if offered.

Use one domain consistently. Each domain is a separate app origin with separate saved quotes, photos, and Pro status; they do not sync. Use the existing JSON backup export/restore to move saved data between origins.

Keep the first visit online long enough for the service worker to finish caching. Calculators and locally saved estimates can then work offline; payments, external links, and first-time downloads still require a connection. External web fonts fall back to system fonts offline. A new version waits for old app windows to close before activating, so an update won't reload an open estimate.

The static manifest is in `public/manifest.webmanifest`. PNG installation icons are raster exports of the existing `public/icon.svg` artwork; the maskable version adds safe padding on an opaque background. `vite-plugin-pwa` generates `dist/sw.js` and precaches the final hashed JavaScript, CSS, HTML, manifest, and icons on every build. Do not add a competing worker in `public/sw.js`.
