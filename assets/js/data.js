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
      images: Array.isArray(row.images) && row.images.length ? row.images : [''],
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
  window.LUNA.products = products;
  window.LUNA.categories = categories;
  window.LUNA.formatPrice = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
  window.LUNA.getProduct = (id) => products.find((p) => p.id === id);
  window.LUNA.live = live;
  window.LUNA.api = api;
  window.LUNA.ready = Promise.all([domReady, dataReady]);
  window.LUNA.onReady = (fn) => window.LUNA.ready.then(fn);
})();
