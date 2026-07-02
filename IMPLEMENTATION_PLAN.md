# Luno — Implementation Plan

Persistent build plan for the Luno storefront. **Read this file first, execute exactly one phase, then update
the Status table and that phase's Progress log.** This keeps context small across sessions.

Stack: static HTML + `assets/css/{tokens,main}.css` + vanilla-JS IIFE modules on `window.LUNA`, served by
`node server.mjs` (http://localhost:4321). No build step, no dependencies.

## Status

| # | Phase | Status |
|---|-------|--------|
| 1 | Foundation & Homepage Prototype | ✅ Done |
| 2 | Catalog & Data Foundation (Men depth) | ⬜ Not started |
| 3 | Collection/PLP Pro — Filters & Category Landing | ⬜ Not started |
| 4 | Product Page Depth (PDP) | ⬜ Not started |
| 5 | Cart, Checkout & Order Flow | ⬜ Not started |
| 6 | Account & Wishlist Suite | ⬜ Not started |
| 7 | Brand & Content Pages | ⬜ Not started |
| 8 | Customer Service & Legal | ⬜ Not started |
| 9 | Search, Discovery & Navigation | ⬜ Not started |
| 10 | Polish, SEO, PWA & Launch | ⬜ Not started |

## Global Guardrails (apply to EVERY phase)

- **Additive only.** Add new files or append new functions/sections. Never remove, rewrite, or restyle
  working code. If a shared file (`data.js`, `store.js`, `ui.js`, `main.css`) must grow, only **extend** it.
- **Never touch the theme.** Do not edit `assets/css/tokens.css`. Do not change the palette, fonts, sharp
  corners, spacing scale, or the **moon** brand. New CSS goes at the END of `main.css` under a commented
  `/* ===== Phase N: <name> ===== */` block and uses **tokens only** (`var(--...)`).
- **Reuse `window.LUNA`.** Use existing APIs/components: `I` (icons), `logoHTML`, `productCardHTML`,
  `fearCardHTML`, `openDrawer`/`closeDrawers`, `toast`, `Store`, `formatPrice`, `getProduct`, `products`,
  `categories`. Match the existing code style (IIFE, `const`, no framework, no deps).
- **Every new page** includes: the standard `<head>` (Google Fonts + `tokens.css` + `main.css`), the
  `<div class="loader" id="luno-loader">`, `<div data-slot="header">` / `<div data-slot="footer">`, and the
  script order `loader.js → data.js → store.js → ui.js → footer.js → [page].js`.
- **Men only.** Women/Juniors stay gated to `coming-soon.html`. Do not link them to catalogs.
- **Naming.** Display brand is **Luno** on all new pages/titles/meta (match the built prototype). Keep the
  internal `window.LUNA` namespace and `luna.*` `localStorage` keys / `luna:change` event — do not rename them.
- **README is the brief.** Honor `README.md`'s "Customizing" + "Notes" rules: customize look via `tokens.css`
  only (which we don't touch here), products live in `data.js`, real photos later swap the `img()` helper +
  `picsum` URLs, and checkout/account remain UI-only demos. Don't edit `README.md` except in Phase 10.
- **Currency** is PKR via `formatPrice`. Keep the `picsum.photos` `img()` placeholder approach (swappable later).
- **Verify** before marking done: `node server.mjs`, open the affected pages, console clean, header/drawers/
  toast still work, responsive at 900px & 620px, `prefers-reduced-motion` respected.
- **Finish** by updating this file: flip the Status row to ✅ and add a dated one-liner to the phase Progress log.

---

## Phase 1 — Foundation & Homepage Prototype  ✅ Done
The design system (`tokens.css`), moon brand + loader, shared chrome (header/footer/cart+wishlist+menu drawers/
toast), the home page, and the base scaffolds of PLP/PDP/account/coming-soon, plus the 30-product Men catalog
and the `localStorage` cart/wishlist store. **No work required.** This is the pattern library every later
phase reuses.

---

## Phase 2 — Catalog & Data Foundation (Men depth)
**Goal:** Give the catalog the depth every later phase needs — without changing the theme.
**Files:** `assets/js/data.js` (extend).
**Do:**
- Expand the Men catalog so each `category` is well populated (aim ~60–80 products); keep the existing 30
  intact and append.
- Enrich each product (additive fields, defaulted so old code keeps working): `description` (long), `material`,
  `care`, `fitNote`, `rating`, `reviewCount`, `stockBySize` (map), `tags[]`, `isNew`, `isBestSeller`,
  `imagesByColor` (per-color seed sets built from the existing `img()` helper).
- Add query helpers on `window.LUNA`: `byCategory`, `bestSellers`, `newIn`, `related(id)`, `searchProducts(q)`,
  `priceRange`, `allColors`, `allSizes`, `getStock(id,size)`.
**Reuse:** existing `img()`, `COLORS`, `SIZES_*`, `formatPrice`, `getProduct`, `categories`.
**Accept:** home, PLP, PDP render unchanged; new helpers return correct data; no console errors.

## Phase 3 — Collection/PLP Pro — Filters & Category Landing
**Goal:** Turn the listing into a real PLP and add a shop-by-category landing.
**Files:** `collection.html`, `assets/js/collection.js` (extend), new `shop.html` + `assets/js/shop.js`, append CSS.
**Do:**
- Filter rail (desktop) + filter drawer (mobile, reuse drawer pattern): size, color, price range, fit,
  availability, on-sale. Active-filter chips + "Clear all". Keep tabs/sort/layout. URL-synced (extend `syncURL`).
- "Load more"/pagination for large result sets.
- `shop.html`: Men landing that delivers the README's promised-but-unbuilt home modules using the latent CSS —
  hero + `.cat-grid` **category tiles**, a **"Categories in Focus"** split (`.focus` tabs → `newIn`/`bestSellers`),
  and horizontal **product carousels** (`.carousel`) — all linking into the filtered PLP. `index.html` untouched.
**Reuse:** `productCardHTML`, `categories`, Phase-2 helpers, existing tab/sort/layout code, `.cat-grid`/`.focus`/`.carousel`.
**Accept:** filters compose correctly and survive reload via URL; tiles route to the right category; mobile
filter drawer opens/closes; existing sort/layout untouched.

## Phase 4 — Product Page Depth (PDP)
**Goal:** Make `product.html` a complete PDP.
**Files:** `assets/js/product.js` (extend), append CSS; optional `assets/js/recent.js` helper.
**Do:** color→image switching via `imagesByColor`; **Size Guide** modal (reuse overlay/drawer pattern);
stock / low-stock messaging from `stockBySize`; ratings + reviews block (mock from `rating`/`reviewCount`);
"Complete the Look" (related) + "Recently Viewed" (localStorage); sticky add-to-bag on mobile; share button.
**Reuse:** gallery/thumbs, accordion, swatches/sizes, `Store.addToCart`, `toast`, `related()`, `productCardHTML`.
**Accept:** swatch changes gallery; sold-out/low-stock reflects data; size-guide opens; recently-viewed persists;
add-to-bag + wishlist still work.

## Phase 5 — Cart, Checkout & Order Flow
**Goal:** Real purchase flow (demo).
**Files:** new `cart.html`+`assets/js/cart.js`, `checkout.html`+`assets/js/checkout.js`,
`order-confirmation.html`+`assets/js/confirmation.js`; extend `store.js` with an **orders** API
(`placeOrder`, `getOrders`, `getOrder`) persisted in `localStorage`.
**Do:** full cart page (line items, qty, remove, subtotal, promo stub); multi-step checkout
(contact/shipping → payment: COD / Easypaisa / card demo → review); confirmation with order number + summary.
Wire the cart-drawer "Checkout" button → `checkout.html`. Keep the drawer.
**Reuse:** `Store` cart, `formatPrice`, `getProduct`, cart-item markup pattern, `.btn`/form styles.
**Accept:** cart↔drawer stay in sync; placing an order clears the cart, writes an order, and lands on
confirmation; refresh preserves orders.

## Phase 6 — Account & Wishlist Suite
**Goal:** Complete the account area + a wishlist page.
**Files:** `account.html` (extend to tabbed Sign in / Register + dashboard), new `wishlist.html`+
`assets/js/wishlist.js`; extend `store.js` with a demo **user/session** API (`localStorage`).
**Do:** dashboard = profile, **order history** (Phase-5 orders), saved addresses; standalone wishlist page
mirroring the drawer with add-to-bag.
**Reuse:** wishlist `Store`, `productCardHTML`, `getOrders`, existing form styles, `toast`.
**Accept:** register/sign-in (demo) persists a session; dashboard lists real orders; wishlist page ↔ drawer stay
in sync.

## Phase 7 — Brand & Content Pages
**Goal:** The "brand" of a brand website.
**Files:** new `about.html`, `journal.html`, `journal-article.html`, `sustainability.html`, `careers.html`,
`stores.html`, `contact.html` (+ a small shared `assets/js/content.js` if useful); append a `.content-page` CSS block.
**Do:** About / Our Story built around the moon motif; Journal index + article template (reuse lookbook banner
style); Sustainability; Careers; Stores (locator list + map placeholder); Contact (form → `toast`).
**Reuse:** `.eyebrow`, `.sec-title`, `.lookbook`, `.newsletter`, moon, footer/header slots.
**Accept:** all pages share chrome + theme; links resolve; forms give feedback; fully responsive.

## Phase 8 — Customer Service & Legal
**Goal:** Wire every footer/help link to a real page.
**Files:** new `help.html`, `shipping.html`, `returns.html`, `size-guide.html`, `faq.html`, `track-order.html`,
`privacy.html`, `terms.html`, `cookies.html`; extend `footer.js` links; append `.content-page` styles if needed.
**Do:** a shared long-form content template; FAQ + policies via the existing accordion; Track Order + Size
Guide interactive stubs. Replace `href="#"` in `footer.js` (and menu) with real routes.
**Reuse:** accordion, `.content-page`, `formatPrice` where relevant.
**Accept:** no `href="#"` left in footer/menu; every page loads with shared chrome; accordions work.

## Phase 9 — Search, Discovery & Navigation
**Goal:** Findability + graceful edges.
**Files:** new `search.html`+`assets/js/search.js`, `404.html`; extend `ui.js` (nav dropdown + search wiring)
and `server.mjs` (serve `404.html` on miss — additive).
**Do:** search results page (reuse `searchProducts` + Phase-3 filters + empty state); header category dropdown/
mega-menu (additive); a reusable recently-viewed rail; real 404 page + server wiring; breadcrumb consistency.
**Reuse:** `productCardHTML`, `searchProducts`, `doSearch`, drawer/overlay patterns.
**Accept:** `doSearch` lands on `search.html?q=`; results filter/sort; unknown URLs render `404.html`; menu
dropdown works and is keyboard-accessible.

## Phase 10 — Polish, SEO, PWA & Launch
**Goal:** Production finish (still a demo, but complete).
**Files:** all pages (`<head>` meta — additive), new `favicon.svg` + moon app icons, `site.webmanifest`,
`sitemap.xml`, `robots.txt`; small `assets/js/analytics.js` stub; a "Swap real images" note in `README`.
**Do:** per-page title/description/OG/Twitter; favicon + moon PWA icons + manifest; JSON-LD (Organization +
Product); a11y pass (aria, focus-trap in drawers/modals, reduced-motion already partial); perf (preload fonts,
lazy images); analytics hook stub; final cross-page QA checklist. **README reconciliation (opt-in):** update
`README.md` to the live **Luno** name, the full built page/feature list, and a "Swap real images" note.
**Reuse:** the moon for icons; existing meta pattern in `index.html`.
**Accept:** every page has unique meta + favicon; manifest validates; Product JSON-LD present on PDP; keyboard
nav works end-to-end; QA checklist passes.

---

## Per-Phase Prompts (paste one into a fresh Opus 4.8 session)

> Each prompt is standalone. It assumes `CLAUDE.md` and `IMPLEMENTATION_PLAN.md` exist at the repo root.

**Phase 2**
```
Ultrathink. Extend the Luno storefront — Phase 2 (Catalog & Data Foundation). First read CLAUDE.md and
IMPLEMENTATION_PLAN.md in full and obey the Global Guardrails (additive only; never edit tokens.css or the
theme; reuse window.LUNA; Men only; PKR; keep placeholder images).
Work only in assets/js/data.js: keep the existing 30 products, append more so every category is well
populated (~60–80 total), and add defaulted fields description/material/care/fitNote/rating/reviewCount/
stockBySize/tags/isNew/isBestSeller/imagesByColor (build image seeds from the existing img() helper). Add
helpers byCategory, bestSellers, newIn, related(id), searchProducts(q), priceRange, allColors, allSizes,
getStock(id,size) on window.LUNA. Do not change store.js/ui.js/home.js behaviour.
Verify with `node server.mjs`: home, collection.html, product.html render unchanged and console is clean.
Then flip Phase 2 to ✅ in the Status table and add a dated line to its Progress log.
```

**Phase 3**
```
Ultrathink. Luno storefront — Phase 3 (Collection/PLP Pro: Filters & Category Landing). Read CLAUDE.md +
IMPLEMENTATION_PLAN.md; obey Global Guardrails. Depends on Phase 2 helpers.
Extend collection.html + assets/js/collection.js with a desktop filter rail and a mobile filter drawer
(reuse the drawer/overlay pattern): size, color, price range, fit, availability, on-sale; active-filter
chips + Clear all; keep the existing tabs/sort/layout; URL-sync all filters (extend syncURL). Add load-more/
pagination. Create shop.html + assets/js/shop.js: a Men landing using the latent .cat-grid tiles, a
.focus "Categories in Focus" split, and .carousel product rows, all linking into filtered PLP. New CSS only
at the end of main.css using tokens.
Verify filters compose and survive reload, tiles route correctly, mobile drawer works, sort/layout unchanged.
Update the Status table + Progress log.
```

**Phase 4**
```
Ultrathink. Luno storefront — Phase 4 (Product Page Depth). Read CLAUDE.md + IMPLEMENTATION_PLAN.md; obey
Global Guardrails. Depends on Phase 2.
Extend assets/js/product.js: color→image switching via imagesByColor; a Size Guide modal (reuse overlay/
drawer pattern); stock/low-stock from stockBySize; a ratings+reviews block from rating/reviewCount; "Complete
the Look" (related()) and "Recently Viewed" (localStorage); sticky mobile add-to-bag; a share button. Keep the
gallery, accordion, swatches, sizes, add-to-bag and wishlist working. New CSS at the end of main.css (tokens).
Verify swatch changes gallery, stock states reflect data, size-guide opens/closes, recently-viewed persists,
add-to-bag + wishlist still fire toasts/drawers. Update Status + Progress log.
```

**Phase 5**
```
Ultrathink. Luno storefront — Phase 5 (Cart, Checkout & Order Flow). Read CLAUDE.md + IMPLEMENTATION_PLAN.md;
obey Global Guardrails.
Add cart.html+assets/js/cart.js (full cart: qty/remove/subtotal/promo stub), checkout.html+assets/js/
checkout.js (steps: contact/shipping → payment COD/Easypaisa/card demo → review), and order-confirmation.html+
assets/js/confirmation.js. Extend store.js additively with an orders API (placeOrder/getOrders/getOrder) in
localStorage. Wire the cart drawer's Checkout button to checkout.html; keep the drawer. Reuse Store, getProduct,
formatPrice, the cart-item markup and .btn/form styles. New CSS at end of main.css (tokens).
Verify drawer↔cart sync, placing an order clears cart + records the order + lands on confirmation, and orders
survive refresh. Update Status + Progress log.
```

**Phase 6**
```
Ultrathink. Luno storefront — Phase 6 (Account & Wishlist Suite). Read CLAUDE.md + IMPLEMENTATION_PLAN.md;
obey Global Guardrails. Depends on Phase 5 orders.
Extend account.html into tabbed Sign in / Register + a dashboard (profile, order history from getOrders, saved
addresses). Add wishlist.html+assets/js/wishlist.js mirroring the wishlist drawer with add-to-bag. Extend
store.js with a demo user/session API in localStorage. Reuse Store wishlist, productCardHTML, existing form
styles, toast. New CSS at end of main.css (tokens).
Verify demo session persists, dashboard lists real orders, wishlist page ↔ drawer stay in sync. Update Status
+ Progress log.
```

**Phase 7**
```
Ultrathink. Luno storefront — Phase 7 (Brand & Content Pages). Read CLAUDE.md + IMPLEMENTATION_PLAN.md; obey
Global Guardrails.
Create about.html, journal.html, journal-article.html, sustainability.html, careers.html, stores.html,
contact.html, each with the standard chrome/script order. Build About around the moon motif; Journal index +
article template reusing the .lookbook banner; Stores = locator list + map placeholder; Contact form → toast.
Reuse .eyebrow/.sec-title/.lookbook/.newsletter/moon. New CSS (.content-page) at end of main.css (tokens).
Verify shared chrome + theme on every page, links resolve, forms give feedback, responsive. Update Status +
Progress log.
```

**Phase 8**
```
Ultrathink. Luno storefront — Phase 8 (Customer Service & Legal). Read CLAUDE.md + IMPLEMENTATION_PLAN.md;
obey Global Guardrails.
Create help.html, shipping.html, returns.html, size-guide.html, faq.html, track-order.html, privacy.html,
terms.html, cookies.html using one shared long-form .content-page template; FAQ + policies via the existing
accordion; Track Order + Size Guide interactive stubs. Extend footer.js (and the mobile menu) so every
href="#" points to the right new page. New CSS only if needed, at end of main.css (tokens).
Verify no href="#" remains in footer/menu, every page loads with chrome, accordions work. Update Status +
Progress log.
```

**Phase 9**
```
Ultrathink. Luno storefront — Phase 9 (Search, Discovery & Navigation). Read CLAUDE.md + IMPLEMENTATION_PLAN.md;
obey Global Guardrails. Depends on Phases 2–3.
Add search.html+assets/js/search.js (results reusing searchProducts + Phase-3 filters + empty state). Extend
ui.js with a keyboard-accessible header category dropdown/mega-menu and point doSearch at search.html?q=. Add
a reusable recently-viewed rail. Add 404.html and extend server.mjs to serve it on a miss (additive). Keep
breadcrumbs consistent. New CSS at end of main.css (tokens).
Verify search lands + filters/sorts, unknown URLs render 404.html, the menu dropdown is mouse+keyboard
accessible. Update Status + Progress log.
```

**Phase 10**
```
Ultrathink. Luno storefront — Phase 10 (Polish, SEO, PWA & Launch). Read CLAUDE.md + IMPLEMENTATION_PLAN.md;
obey Global Guardrails.
Add per-page title/description/OG/Twitter meta (additive to each <head>), a moon favicon.svg + PWA icons +
site.webmanifest, sitemap.xml, robots.txt, JSON-LD (Organization sitewide + Product on PDP), and an
assets/js/analytics.js stub. Do an a11y pass (aria labels, focus-trap in drawers/modals, reduced-motion) and
perf pass (preload fonts, lazy images). Reconcile README.md to the live "Luno" name + the full built
page/feature list + a "Swap real images" note. Change no theme tokens.
Verify unique meta + favicon per page, manifest validates, PDP has Product JSON-LD, keyboard nav works
end-to-end. Run the final QA checklist. Update Status + Progress log → all phases ✅.
```

## Verification (per phase)
1. `node server.mjs` → http://localhost:4321.
2. Open each affected page; confirm the loader, header, footer, cart/wishlist drawers, and toast still work.
3. Browser console clean (no errors/warnings from new code).
4. Resize to 900px and 620px; confirm layout holds and the mobile menu/filter drawers work.
5. Confirm `tokens.css` and the moon are untouched and the palette/fonts are unchanged.
6. Update this file's Status table + the phase Progress log.

## Progress log
- Phase 1 — complete (pre-existing prototype).
