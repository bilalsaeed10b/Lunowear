/* ============================================================
   Luna — Product catalog, loaded ONLY from Supabase (config in
   supabase-config.js). No demo data: if the database is not
   reachable the catalog stays empty and pages show empty states.
   Pages that need catalog data must boot via LUNA.onReady(fn).
   ============================================================ */
(function () {
  // Live arrays — consumers keep references to these, so they are
  // mutated in place (never reassigned) when data arrives.
  const products = [];
  const categories = [{ slug: 'all', label: 'All' }];

  const cfg = window.LUNA_SUPABASE || {};
  const live = !!(cfg.url && cfg.anonKey && !String(cfg.url).includes('YOUR-') && !String(cfg.anonKey).includes('YOUR-'));

  // Minimal REST client (anon key only — safe to expose; RLS guards writes).
  async function api(path, opts = {}) {
    const res = await fetch(cfg.url + path, {
      ...opts,
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.anonKey,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = text;
      try { msg = JSON.parse(text).message || text; } catch {}
      throw new Error(msg || `Request failed (${res.status})`);
    }
    return text ? JSON.parse(text) : null;
  }

  function fromRow(row) {
    const fit = row.fit || '';
    const dept = row.dept || 'MEN';
    // image_colors is parallel to images. Entry per image:
    //   null/''            -> main photo (shown by default)
    //   {color, main}      -> variant of mains[main], shown when color selected
    //   "Black" (legacy)   -> variant paired by order within its color
    const allImages = Array.isArray(row.images) && row.images.length ? row.images : [''];
    const ic = Array.isArray(row.image_colors) ? row.image_colors : [];
    const norm = (i) => {
      const t = ic[i];
      if (typeof t === 'string' && t.trim()) return { color: t.trim(), main: null };
      if (t && typeof t === 'object' && t.color) return { color: String(t.color), main: Number.isInteger(t.main) ? t.main : null };
      return null;
    };
    const mainImages = allImages.filter((_, i) => !norm(i));
    const variantMap = {}; // color -> { mainIndex: url }
    const legacySeq = {};
    allImages.forEach((src, i) => {
      const v = norm(i);
      if (!v) return;
      const m = v.main !== null ? v.main : (legacySeq[v.color] = (legacySeq[v.color] || 0) + 1) - 1;
      (variantMap[v.color] = variantMap[v.color] || {})[m] = src;
    });
    // Full gallery per color: the variant where one exists, else the original —
    // so a color with partial variants still shows every photo position.
    const imagesByColor = {};
    Object.keys(variantMap).forEach((c) => {
      imagesByColor[c] = mainImages.map((src, i) => variantMap[c][i] || src);
    });
    return {
      id: row.id,
      name: row.name,
      category: row.category_slug,
      fit,
      dept,
      subtitle: `${fit} | ${dept}`,
      price: row.price,
      compareAt: row.compare_at || null,
      discount: row.compare_at ? Math.round((1 - row.price / row.compare_at) * 100) : 0,
      colors: Array.isArray(row.colors) && row.colors.length ? row.colors : [{ name: 'Default', hex: '#1a1a1a' }],
      sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : ['One Size'],
      badge: row.badge || null,
      soldOut: !!row.sold_out,
      description: row.description || '',
      images: mainImages.length ? mainImages : allImages, // main photos (cards, cart, default gallery)
      allImages,
      imagesByColor, // { "Black": [urls...] } — gallery swaps to these on color select
    };
  }

  async function loadLive() {
    const [prows, crows] = await Promise.all([
      api('/rest/v1/products?active=is.true&select=*&order=position.asc,created_at.desc'),
      api('/rest/v1/categories?select=slug,name&order=position.asc'),
    ]);
    products.length = 0;
    prows.forEach((r) => products.push(fromRow(r)));
    categories.length = 0;
    categories.push({ slug: 'all', label: 'All' });
    crows.forEach((c) => categories.push({ slug: c.slug, label: c.name }));
    // Re-render badges/drawers that may have rendered before data arrived.
    window.dispatchEvent(new CustomEvent('luna:change'));
  }

  /* ---------- Ready gate: DOM parsed + catalog resolved ---------- */
  const domReady = new Promise((resolve) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => resolve());
    else resolve();
  });
  const dataReady = live
    ? loadLive().catch((e) => console.warn('Luna: catalog unavailable.', e))
    : Promise.resolve(console.warn('Luna: Supabase not configured — catalog is empty. See SETUP.md.'));

  window.LUNA = window.LUNA || {};
  // HTML-escape helper used by every template that renders DB content.
  window.LUNA.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  window.LUNA.products = products;
  window.LUNA.categories = categories;
  window.LUNA.formatPrice = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
  window.LUNA.getProduct = (id) => products.find((p) => p.id === id);
  window.LUNA.live = live;
  window.LUNA.api = api;
  window.LUNA.ready = Promise.all([domReady, dataReady]);
  window.LUNA.onReady = (fn) => window.LUNA.ready.then(fn);
})();
