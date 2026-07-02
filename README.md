# Luno — Storefront

A modern, responsive fashion e-commerce storefront. The layout, architecture,
color system, and interaction patterns follow a premium monochrome apparel
aesthetic (inspired by the structure of large fashion retailers), rebranded as
**Luna** with a custom textual wordmark and **placeholder product imagery**.

> Demo project. All product data is mock; images are dummy placeholders
> (picsum.photos). No third-party logos, photos, or copy are used.

## Run it

No build step, no dependencies. You need Node.js installed.

```bash
node server.mjs
# then open http://localhost:4321
```

Or serve the folder with any static server (e.g. `npx serve`).

## What's included

| Page             | File               | Highlights                                           |
| ---------------- | ------------------ | ---------------------------------------------------- |
| Home             | `index.html`       | Overlay header, hero slider, category tiles, product carousels, "Categories in Focus" split, lookbook, newsletter |
| Collection/PLP   | `collection.html`  | Category tab bar, sort, 2/4-column layout toggle, live filtering & search |
| Product/PDP      | `product.html`     | Image gallery + thumbnails, color swatches, size selector, add-to-bag, wishlist, accordion, related products |
| Account          | `account.html`     | Sign-in UI (demo only)                               |

Shared chrome (announcement bar, header, cart drawer, wishlist drawer, mobile
menu, toast, footer) is injected on every page.

## Architecture

```
index.html / collection.html / product.html / account.html
assets/
  css/
    tokens.css      # design system: colors, type, spacing, motion (CSS variables)
    main.css        # all component styles + responsive rules
  js/
    data.js         # mock catalog + categories + price formatting
    store.js        # cart + wishlist state, localStorage, 'luna:change' events
    ui.js           # icons, header, drawers, product-card template, toast (shared)
    footer.js       # footer render + feature-row icons
    home.js         # hero slider, focus tabs, carousels
    collection.js   # listing: tabs, sort, filter, layout toggle
    product.js      # PDP: gallery, swatches, sizes, accordion, related
server.mjs          # tiny zero-dependency static file server
```

### Design tokens (in `assets/css/tokens.css`)

- **Surfaces:** white background, cool light-grey (`#eef0f2`) product cards, near-black dark sections
- **Ink:** near-black text with grey secondary/tertiary tiers
- **Accents:** black primary buttons, restrained red for sale/discount
- **Type:** `Archivo` (display/headings/nav), `Inter` (body), `Fraunces` (Luna wordmark)
- **Feel:** sharp corners, generous whitespace, uppercase display type

### State

`store.js` keeps `cart` and `wishlist` in `localStorage` and dispatches a
`luna:change` event; `ui.js` re-renders badges and drawers in response. No
framework required.

## Customizing

- **Colors / fonts / spacing:** edit `assets/css/tokens.css` only.
- **Products:** edit the `RAW` array in `assets/js/data.js`.
- **Real images:** replace the `img()` helper in `data.js` and the `picsum.photos`
  URLs in `index.html` with your own asset paths.

## Notes

- Checkout and account are UI-only demos.
- Requires internet for Google Fonts and placeholder images; both degrade
  gracefully to system fonts / grey boxes offline.
