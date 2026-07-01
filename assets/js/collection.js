/* ============================================================
   Luna — Collection/listing page: tabs, sort, filter, layout
   ============================================================ */
(function () {
  const { products, categories, productCardHTML } = window.LUNA;
  const params = new URLSearchParams(location.search);

  const state = {
    category: params.get('c') || 'all',
    dept: params.get('dept') || 'men',
    query: (params.get('q') || '').toLowerCase(),
    saleOnly: params.get('sale') === '1',
    sort: 'featured',
    cols: 4,
  };

  const els = {
    tabbar: document.querySelector('[data-tabbar]'),
    grid: document.querySelector('[data-grid]'),
    count: document.querySelector('[data-count]'),
    crumb: document.querySelector('[data-crumb-cat]'),
    title: document.querySelector('[data-title]'),
    sort: document.querySelector('[data-sort]'),
    layout: document.querySelectorAll('[data-layout]'),
  };

  function currentLabel() {
    if (state.query) return `Search: “${state.query}”`;
    const c = categories.find((x) => x.slug === state.category);
    const base = c && c.slug !== 'all' ? c.label : `${state.dept} View All Collection`;
    return base;
  }

  function filtered() {
    let list = products.slice();
    if (state.category !== 'all') list = list.filter((p) => p.category === state.category);
    if (state.saleOnly) list = list.filter((p) => p.compareAt);
    if (state.query) list = list.filter((p) =>
      (p.name + ' ' + p.category + ' ' + p.subtitle).toLowerCase().includes(state.query));
    switch (state.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'discount': list.sort((a, b) => b.discount - a.discount); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }

  function renderTabs() {
    els.tabbar.innerHTML = categories.map((c) =>
      `<button class="tab ${c.slug === state.category ? 'is-active' : ''}" data-cat="${c.slug}">${c.label}</button>`
    ).join('');
    els.tabbar.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      state.category = t.dataset.cat;
      state.query = '';
      syncURL();
      renderAll();
    }));
  }

  function renderGrid() {
    const list = filtered();
    els.grid.dataset.cols = state.cols;
    els.grid.innerHTML = list.length
      ? list.map(productCardHTML).join('')
      : `<div class="empty-note" style="grid-column:1/-1">No products match your selection.</div>`;
    els.count.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  }

  function renderHeadings() {
    const label = currentLabel();
    if (els.title) els.title.textContent = label.toUpperCase();
    if (els.crumb) els.crumb.textContent = label.toUpperCase();
    document.title = `${label} — Luno`;
  }

  function syncURL() {
    const p = new URLSearchParams();
    p.set('c', state.category);
    p.set('dept', state.dept);
    if (state.saleOnly) p.set('sale', '1');
    history.replaceState(null, '', `?${p.toString()}`);
  }

  function renderAll() {
    renderTabs();
    renderHeadings();
    renderGrid();
  }

  function wire() {
    if (els.sort) els.sort.addEventListener('change', () => { state.sort = els.sort.value; renderGrid(); });
    els.layout.forEach((btn) => btn.addEventListener('click', () => {
      els.layout.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.cols = parseInt(btn.dataset.layout, 10);
      renderGrid();
    }));
  }

  function boot() {
    if (!els.grid) return;
    wire();
    renderAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
