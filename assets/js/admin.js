/* ============================================================
   Luno Admin — products, categories & orders management.
   Auth + writes go through Supabase; Row Level Security on the
   server decides what an account may do (see supabase/schema.sql).
   ============================================================ */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');

  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-open'), 2600);
  }

  /* ---------- config gate ---------- */
  const cfg = window.LUNA_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && !String(cfg.url).includes('YOUR-') && !String(cfg.anonKey).includes('YOUR-'));
  $('[data-view="login"]').hidden = false;
  if (!configured) {
    $('[data-setup-note]').innerHTML = `<div class="adm-setup">
      <b>Not connected yet.</b> Follow <code>SETUP.md</code>: create a free Supabase project,
      run <code>supabase/schema.sql</code>, then paste your project URL and anon key into
      <code>assets/js/supabase-config.js</code>.</div>`;
    $('[data-login-form]').style.display = 'none';
    return;
  }
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  const state = {
    tab: 'products',
    products: [],
    categories: [],
    orders: [],
    prodQuery: '',
    orderFilter: '',
    editing: null,     // product being edited (null = new)
    gallery: { mains: [] }, // mains: [{url, color}] — one photo per color, color assigned by position
    dragFrom: null,    // index of the main row currently being dragged
  };

  function show(view) {
    $$('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== view; });
  }

  /* ================= AUTH ================= */

  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return show('login');
    const { data: ok, error } = await sb.rpc('is_admin');
    if (error || !ok) {
      await sb.auth.signOut();
      loginError('This account does not have admin access.');
      return show('login');
    }
    $('[data-admin-email]').textContent = session.user.email;
    show('app');
    await loadAll();
    renderTab();
  }

  function loginError(msg) {
    const el = $('[data-login-error]');
    el.textContent = msg;
    el.hidden = !msg;
  }

  $('[data-login-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError('');
    const btn = $('[data-login-btn]');
    btn.disabled = true; btn.textContent = 'Signing in…';
    const fd = new FormData(e.target);
    const { error } = await sb.auth.signInWithPassword({
      email: String(fd.get('email')).trim(),
      password: String(fd.get('password')),
    });
    btn.disabled = false; btn.textContent = 'Sign In';
    if (error) return loginError(error.message);
    boot();
  });

  $('[data-logout]').addEventListener('click', async () => {
    await sb.auth.signOut();
    show('login');
  });

  /* ================= DATA ================= */

  async function loadAll() {
    const [p, c, o] = await Promise.all([
      sb.from('products').select('*').order('position').order('created_at', { ascending: false }),
      sb.from('categories').select('*').order('position'),
      sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
    ]);
    if (p.error || c.error || o.error) {
      toast('Failed to load data: ' + (p.error || c.error || o.error).message);
      return;
    }
    state.products = p.data;
    state.categories = c.data;
    state.orders = o.data;
  }

  /* ================= TABS ================= */

  $$('.adm-nav button').forEach((b) => b.addEventListener('click', () => {
    state.tab = b.dataset.tab;
    $$('.adm-nav button').forEach((x) => x.classList.toggle('is-active', x === b));
    renderTab();
  }));

  function renderTab() {
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== state.tab; });
    if (state.tab === 'products') renderProducts();
    if (state.tab === 'categories') renderCategories();
    if (state.tab === 'orders') renderOrders();
  }

  /* ================= PRODUCTS ================= */

  const catName = (slug) => (state.categories.find((c) => c.slug === slug) || {}).name || slug;

  function renderProducts() {
    const q = state.prodQuery.toLowerCase();
    const list = state.products.filter((p) =>
      !q || (p.name + ' ' + p.category_slug).toLowerCase().includes(q));
    $('[data-prod-count]').textContent = `(${list.length})`;
    $('[data-prod-table]').innerHTML = `
      <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Badge</th><th>Status</th><th></th></tr>` +
      list.map((p) => `<tr>
        <td><img class="adm-thumb" src="${esc((p.images || [])[0] || '')}" alt="" loading="lazy"/></td>
        <td><b>${esc(p.name)}</b><br><span class="adm-hint">${esc(p.fit || '')}</span></td>
        <td>${esc(catName(p.category_slug))}</td>
        <td>${money(p.price)}${p.compare_at ? `<br><span class="adm-hint"><s>${money(p.compare_at)}</s></span>` : ''}</td>
        <td>${(p.compare_at && p.compare_at > p.price)
          ? `<span class="adm-tag adm-tag--sale">Sale</span>`
          : (p.badge === 'new' ? `<span class="adm-tag adm-tag--new">New</span>` : '')}</td>
        <td>${p.active ? '' : '<span class="adm-tag adm-tag--off">Hidden</span> '}${p.sold_out ? '<span class="adm-tag">Sold out</span>' : ''}</td>
        <td><div class="adm-actions">
          <button class="adm-btn adm-btn--ghost" data-edit="${p.id}">Edit</button>
          <button class="adm-btn adm-btn--danger" data-del="${p.id}">Delete</button>
        </div></td>
      </tr>`).join('');

    $$('[data-edit]').forEach((b) => b.addEventListener('click', () =>
      openEditor(state.products.find((p) => p.id === b.dataset.edit))));
    $$('[data-del]').forEach((b) => b.addEventListener('click', () => deleteProduct(b.dataset.del)));
  }

  $('[data-prod-search]').addEventListener('input', (e) => {
    state.prodQuery = e.target.value;
    renderProducts();
  });

  async function deleteProduct(id) {
    const p = state.products.find((x) => x.id === id);
    if (!confirm(`Delete "${p.name}" permanently?\nTip: untick "Visible in store" instead to just hide it.`)) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) return toast('Delete failed: ' + error.message);
    state.products = state.products.filter((x) => x.id !== id);
    renderProducts();
    toast('Product deleted');
  }

  /* ---------- editor ---------- */

  const dlg = $('[data-editor]');
  const form = $('[data-editor-form]');

  function editorError(msg) {
    const el = $('[data-editor-error]');
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function openEditor(p) {
    state.editing = p || null;
    // One photo per color. Every stored image (including any legacy per-color
    // "variant" images) becomes a plain photo; renderImages assigns each one a
    // color by its position (photo #1 = 1st color, #2 = 2nd, …), so opening &
    // re-saving an old product self-heals it into the positional model.
    const imgs = p ? (p.images || []) : [];
    state.gallery = { mains: imgs.map((url) => ({ url, color: '' })) };
    state.dragFrom = null;
    editorError('');
    $('[data-editor-title]').textContent = p ? 'Edit Product' : 'New Product';
    $('[data-cat-select]').innerHTML = state.categories.map((c) =>
      `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('');
    form.name.value = p ? p.name : '';
    form.category_slug.value = p ? p.category_slug : (state.categories[0] || {}).slug || '';
    form.fit.value = p ? (p.fit || '') : '';
    form.dept.value = p ? (p.dept || 'MEN') : 'MEN';
    form.badge.value = p ? (p.badge || '') : '';
    form.price.value = p ? p.price : '';
    form.compare_at.value = p && p.compare_at ? p.compare_at : '';
    form.description.value = p ? (p.description || '') : '';
    form.sizes.value = p ? (p.sizes || []).join(', ') : 'S, M, L, XL, XXL';
    form.active.checked = p ? !!p.active : true;
    form.sold_out.checked = p ? !!p.sold_out : false;
    form.position.value = p ? p.position : state.products.length;
    renderColorRows(p ? (p.colors || []) : [{ name: 'Black', hex: '#1a1a1a' }]);
    renderImages();
    dlg.showModal();
  }

  $('[data-add-product]').addEventListener('click', () => {
    if (!state.categories.length) return toast('Add a category first');
    openEditor(null);
  });
  $$('[data-editor-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));

  /* colors */
  function renderColorRows(colors) {
    $('[data-color-rows]').innerHTML = colors.map((c) => colorRowHTML(c)).join('');
    wireColorRows();
  }
  const colorRowHTML = (c) => `<div class="adm-color-row">
    <input type="color" value="${esc(c.hex || '#1a1a1a')}" />
    <input type="text" value="${esc(c.name || '')}" maxlength="30" placeholder="Color name" />
    <button type="button" class="adm-btn adm-btn--ghost" data-color-del>✕</button>
  </div>`;
  function wireColorRows() {
    $$('[data-color-del]').forEach((b) => b.addEventListener('click', () => {
      b.parentElement.remove();
      renderImages(); // keep per-image color dropdowns in sync
    }));
    $$('.adm-color-row input[type=text]').forEach((inp) => inp.addEventListener('change', renderImages));
  }
  $('[data-add-color]').addEventListener('click', () => {
    $('[data-color-rows]').insertAdjacentHTML('beforeend', colorRowHTML({ name: '', hex: '#1a1a1a' }));
    wireColorRows();
  });
  function readColors() {
    return $$('.adm-color-row').map((row) => ({
      hex: row.querySelector('input[type=color]').value,
      name: row.querySelector('input[type=text]').value.trim(),
    })).filter((c) => c.name);
  }

  /* images — a sortable list; every photo stays a MAIN photo. Its color is
     chosen from the dropdown beneath it, and a color already used by another
     photo is hidden from the rest, so no two photos can share a color. Drag a
     row by its ⠿ handle to reorder; each photo keeps its chosen color. */
  function renderImages() {
    const g = state.gallery;
    const colorNames = readColors().map((c) => c.name);
    const usedByOthers = (skip) => new Set(
      g.mains.filter((_, i) => i !== skip).map((m) => m.color).filter(Boolean));
    // give any blank/stale photo the first still-free color as a sensible default
    g.mains.forEach((m, i) => {
      if (!m.color || !colorNames.includes(m.color)) {
        const taken = usedByOthers(i);
        m.color = colorNames.find((n) => !taken.has(n)) || '';
      }
    });
    const optionsFor = (mi) => {
      const taken = usedByOthers(mi), cur = g.mains[mi].color;
      const avail = colorNames.filter((n) => n === cur || !taken.has(n));
      return `<option value="" ${cur ? '' : 'selected'} disabled>Pick color…</option>` +
        avail.map((n) => `<option value="${esc(n)}" ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('');
    };
    $('[data-image-list]').innerHTML = g.mains.map((m, mi) => `
      <div class="adm-imgrow" data-row="${mi}">
        <span class="adm-drag" draggable="true" title="Drag to reorder">⠿</span>
        <div class="adm-imgcell">
          <div class="adm-img">
            <img src="${esc(m.url)}" alt="" draggable="false" />
            ${mi === 0 ? '<span class="main-tag">Cover</span>' : ''}
            <button type="button" data-main-del="${mi}" title="Remove photo">✕</button>
          </div>
          <select class="adm-img-color" data-main-color="${mi}" title="Which color this photo is">
            ${optionsFor(mi)}
          </select>
        </div>
      </div>`).join('') +
    `<button type="button" class="adm-addtile adm-addtile--main" data-add-main>+ ${g.mains.length ? 'Add image' : 'Upload first image'}</button>`;

    $('[data-add-main]').addEventListener('click', () => { $('[data-image-input]').click(); });
    $$('[data-main-del]').forEach((b) => b.addEventListener('click', () => {
      g.mains.splice(+b.dataset.mainDel, 1);
      renderImages();
    }));
    $$('[data-main-color]').forEach((s) => s.addEventListener('change', () => {
      g.mains[+s.dataset.mainColor].color = s.value; // stays a main photo
      renderImages(); // re-render so this color drops out of the other dropdowns
    }));
    // drag by the handle only, so the color dropdowns stay clickable
    $$('.adm-drag').forEach((h) => {
      const row = h.closest('.adm-imgrow');
      h.addEventListener('dragstart', (e) => {
        state.dragFrom = +row.dataset.row;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('is-dragging');
      });
      h.addEventListener('dragend', () => { row.classList.remove('is-dragging'); state.dragFrom = null; });
    });
    $$('.adm-imgrow').forEach((row) => {
      row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('is-drop'); });
      row.addEventListener('dragleave', () => row.classList.remove('is-drop'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('is-drop');
        const to = +row.dataset.row, from = state.dragFrom;
        if (from === null || from === to) return;
        const [m] = g.mains.splice(from, 1);
        g.mains.splice(to, 0, m);
        renderImages();
      });
    });
  }

  $('[data-image-input]').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    const status = $('[data-upload-status]');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { toast(`${file.name}: over 5 MB, skipped`); continue; }
      status.textContent = `Uploading ${i + 1}/${files.length}…`;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from('product-images').upload(path, file, { cacheControl: '31536000' });
      if (error) { toast(`Upload failed: ${error.message}`); continue; }
      const { data } = sb.storage.from('product-images').getPublicUrl(path);
      state.gallery.mains.push({ url: data.publicUrl, color: '' }); // color assigned by position on render
      renderImages();
    }
    status.textContent = '';
  });

  /* save */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    editorError('');
    const name = form.name.value.trim();
    const price = parseInt(form.price.value, 10);
    const compareAt = form.compare_at.value ? parseInt(form.compare_at.value, 10) : null;
    const colors = readColors();
    const sizes = form.sizes.value.split(',').map((s) => s.trim()).filter(Boolean);
    if (!name) return editorError('Name is required.');
    if (!(price >= 0)) return editorError('Price is required.');
    if (compareAt !== null && compareAt <= price) return editorError('Compare-at price must be higher than the price.');
    if (!colors.length) return editorError('Add at least one color (with a name).');
    if (!sizes.length) return editorError('Add at least one size.');
    const g = state.gallery;
    const known = colors.map((c) => c.name);
    if (!g.mains.length) return editorError('Upload at least one image.');
    if (g.mains.some((m) => !m.color)) return editorError('Pick a color for every image.');
    const orphan = g.mains.find((m) => !known.includes(m.color));
    if (orphan) return editorError(`An image uses color "${orphan.color}" which isn't in this product's colors.`);
    const seen = new Set();
    const dup = g.mains.find((m) => seen.has(m.color) || (seen.add(m.color), false));
    if (dup) return editorError(`Two images share the color "${dup.color}". Each color can be used by one image only.`);

    const row = {
      name,
      category_slug: form.category_slug.value,
      fit: form.fit.value.trim(),
      dept: form.dept.value.trim() || 'MEN',
      badge: form.badge.value || null,
      price,
      compare_at: compareAt,
      description: form.description.value.trim(),
      sizes,
      colors,
      images: g.mains.map((m) => m.url),
      // one photo per color; each stores its chosen color: image_colors[i] = { color }
      image_colors: g.mains.map((m) => ({ color: m.color })),
      active: form.active.checked,
      sold_out: form.sold_out.checked,
      position: parseInt(form.position.value, 10) || 0,
    };

    const btn = $('[data-editor-save]');
    btn.disabled = true; btn.textContent = 'Saving…';
    const save = (r) => state.editing
      ? sb.from('products').update(r).eq('id', state.editing.id).select().single()
      : sb.from('products').insert(r).select().single();
    let { data, error } = await save(row);
    if (error && /image_colors/i.test(error.message)) {
      // DB migration schema4-image-colors.sql not run yet. Every image now
      // carries a color, so we can't save without the column — block clearly.
      btn.disabled = false; btn.textContent = 'Save Product';
      return editorError('Image colors need a one-time database update: run supabase/schema4-image-colors.sql in the Supabase SQL Editor, then save again.');
    }
    btn.disabled = false; btn.textContent = 'Save Product';
    if (error) return editorError('Save failed: ' + error.message);

    if (state.editing) {
      const i = state.products.findIndex((p) => p.id === data.id);
      if (i > -1) state.products[i] = data;
    } else {
      state.products.unshift(data);
    }
    dlg.close();
    renderProducts();
    toast(state.editing ? 'Product updated' : 'Product added');
  });

  /* ================= CATEGORIES ================= */

  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function renderCategories() {
    const counts = {};
    state.products.forEach((p) => { counts[p.category_slug] = (counts[p.category_slug] || 0) + 1; });
    $('[data-cat-table]').innerHTML = `
      <tr><th>Name</th><th>Slug</th><th>Products</th><th>Position</th><th></th></tr>` +
      state.categories.map((c) => `<tr>
        <td><b>${esc(c.name)}</b></td>
        <td class="adm-hint">${esc(c.slug)}</td>
        <td>${counts[c.slug] || 0}</td>
        <td>${c.position}</td>
        <td><div class="adm-actions">
          <button class="adm-btn adm-btn--ghost" data-cat-edit="${c.id}">Rename</button>
          <button class="adm-btn adm-btn--danger" data-cat-del="${c.id}">Delete</button>
        </div></td>
      </tr>`).join('');

    $$('[data-cat-edit]').forEach((b) => b.addEventListener('click', async () => {
      const c = state.categories.find((x) => x.id === b.dataset.catEdit);
      const name = prompt('Category name:', c.name);
      if (!name || name.trim() === c.name) return;
      const { error } = await sb.from('categories').update({ name: name.trim() }).eq('id', c.id);
      if (error) return toast('Rename failed: ' + error.message);
      c.name = name.trim();
      renderCategories();
      toast('Category renamed');
    }));

    $$('[data-cat-del]').forEach((b) => b.addEventListener('click', async () => {
      const c = state.categories.find((x) => x.id === b.dataset.catDel);
      const n = counts[c.slug] || 0;
      if (n > 0) return toast(`Move or delete the ${n} product(s) in "${c.name}" first.`);
      if (!confirm(`Delete category "${c.name}"?`)) return;
      const { error } = await sb.from('categories').delete().eq('id', c.id);
      if (error) return toast('Delete failed: ' + error.message);
      state.categories = state.categories.filter((x) => x.id !== c.id);
      renderCategories();
      toast('Category deleted');
    }));
  }

  $('[data-cat-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name').trim();
    if (!name) return;
    const slug = slugify(name);
    if (!slug || slug === 'all') return toast('That name is not allowed.');
    if (state.categories.some((c) => c.slug === slug)) return toast('That category already exists.');
    const position = state.categories.length;
    const { data, error } = await sb.from('categories').insert({ slug, name, position }).select().single();
    if (error) return toast('Add failed: ' + error.message);
    state.categories.push(data);
    e.target.reset();
    renderCategories();
    toast('Category added');
  });

  /* ================= ORDERS ================= */

  const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  function renderOrders() {
    const list = state.orders.filter((o) => !state.orderFilter || o.status === state.orderFilter);
    $('[data-order-count]').textContent = `(${list.length})`;
    if (!list.length) {
      $('[data-order-table]').innerHTML = '<tr><td class="adm-hint" style="padding:1.4rem">No orders yet.</td></tr>';
      return;
    }
    $('[data-order-table]').innerHTML = `
      <tr><th>Order</th><th>Date</th><th>Customer</th><th>City</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>` +
      list.map((o) => {
        const items = o.order_items || [];
        return `<tr>
        <td><b>${esc(o.order_number)}</b></td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>${esc(o.customer_name)}</td>
        <td>${esc(o.city || '—')}</td>
        <td>${items.reduce((n, i) => n + i.qty, 0)}</td>
        <td>${money(o.total)}</td>
        <td><select class="adm-select adm-status adm-status--${o.status}" data-status="${o.id}">
          ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}
        </select></td>
        <td><button class="adm-btn adm-btn--ghost" data-order-open="${o.id}">Details</button></td>
      </tr>
      <tr class="adm-order-detail" data-order-detail="${o.id}" hidden><td colspan="8"><div class="inner">
        <div>
          <span class="adm-label">Items</span>
          ${items.map((it) => `<div class="adm-order-item">
            ${it.image ? `<img src="${esc(it.image)}" alt=""/>` : ''}
            <div style="flex:1">${esc(it.name)}<br><span class="adm-hint">${esc([it.size, it.color].filter(Boolean).join(' · '))} × ${it.qty}</span></div>
            <div>${money(it.price * it.qty)}</div>
          </div>`).join('')}
        </div>
        <div>
          <span class="adm-label">Delivery</span>
          <p style="margin:.2rem 0">${esc(o.customer_name)}<br>${esc(o.address)}${o.city ? ', ' + esc(o.city) : ''}<br>
          ${esc(o.phone || '')}<br><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>
          <span class="adm-hint">Last updated ${new Date(o.updated_at).toLocaleString()}</span>
        </div>
      </div></td></tr>`;
      }).join('');

    $$('[data-order-open]').forEach((b) => b.addEventListener('click', () => {
      const row = $(`[data-order-detail="${b.dataset.orderOpen}"]`);
      row.hidden = !row.hidden;
    }));

    $$('[data-status]').forEach((sel) => sel.addEventListener('change', async () => {
      const id = sel.dataset.status;
      const status = sel.value;
      const { data, error } = await sb.from('orders').update({ status }).eq('id', id).select('id');
      if (error || !data.length) return toast('Update failed: ' + (error ? error.message : 'no permission — sign in again'));
      const o = state.orders.find((x) => x.id === id);
      o.status = status;
      sel.className = `adm-select adm-status adm-status--${status}`;
      toast(`Order ${o.order_number} → ${status}`);
    }));
  }

  $('[data-order-filter]').addEventListener('change', (e) => {
    state.orderFilter = e.target.value;
    renderOrders();
  });

  /* ================= GO ================= */
  boot();
})();
