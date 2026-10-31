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
* HTML5 / Tailwind CSS (via CDN)
* Vanilla JavaScript (ES6+)
* HTML5 Canvas & Web APIs (`navigator.share`, `localStorage`, `getUserMedia`)
