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
    // Colors carry a stable id so two colors may share a display name.
    const rawColors = Array.isArray(row.colors) && row.colors.length ? row.colors : [{ name: 'Default', hex: '#1a1a1a' }];
    const colors = rawColors.map((c, i) => ({ id: c.id || ('lc' + i), name: c.name || 'Color', hex: c.hex || '#1a1a1a' }));
    const colorById = {}; colors.forEach((c) => { colorById[c.id] = c; });
    // image_colors[i] "color" is a color id (new) or a color name (legacy).
    const toId = (v) => {
      if (!v) return null;
      if (colorById[v]) return v;
      const byName = colors.find((c) => c.name === v);
      return byName ? byName.id : null;
    };
    // image_colors is parallel to images:
    //   {color}             -> a MAIN photo (gallery slot), tagged with a color
    //   {color, main:<int>} -> a COLOR IMAGE of slot #main, shown when its color is picked
    //   "Name" (legacy str) -> color image paired by order;  null -> legacy colorless main
    const allImages = Array.isArray(row.images) && row.images.length ? row.images : [''];
    const ic = Array.isArray(row.image_colors) ? row.image_colors : [];
    const mains = [], variants = [], legacySeq = {};
    allImages.forEach((url, i) => {
      const t = ic[i];
      if (typeof t === 'string' && t.trim()) {
        const cid = toId(t.trim());
        variants.push({ url, colorId: cid, main: (legacySeq[cid] = (legacySeq[cid] || 0) + 1) - 1 });
      } else if (t && typeof t === 'object' && Number.isInteger(t.main)) {
        variants.push({ url, colorId: toId(t.color), main: t.main });
      } else if (t && typeof t === 'object' && t.color) {
        mains.push({ url, colorId: toId(t.color) });
      } else {
        mains.push({ url, colorId: null });
      }
    });
    if (!mains.length) mains.push({ url: allImages[0], colorId: null });
    variants.forEach((v) => { v.main = Math.max(0, Math.min(mains.length - 1, v.main)); });
    // Per-slot color groups: each slot exposes the colors of its main photo +
    // its color images, and the image to show for each of those colors.
    const mainGroups = mains.map((m) => ({ url: m.url, mainColorId: m.colorId, byColor: {}, colorIds: [] }));
    mains.forEach((m, i) => {
      if (m.colorId) { mainGroups[i].byColor[m.colorId] = m.url; mainGroups[i].colorIds.push(m.colorId); }
    });
    variants.forEach((v) => {
      const grp = mainGroups[v.main];
      if (grp && v.colorId && !grp.byColor[v.colorId]) { grp.byColor[v.colorId] = v.url; grp.colorIds.push(v.colorId); }
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
      colors, // [{id, name, hex}]
      sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : ['One Size'],
      badge: row.badge || null,
      soldOut: !!row.sold_out,
      description: row.description || '',
      images: mains.map((m) => m.url), // gallery slots (cover = images[0])
      mainGroups,                      // per slot: { url, mainColorId, byColor:{id:url}, colorIds:[] }
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
