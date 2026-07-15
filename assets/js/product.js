/* ============================================================
   Luna — Product detail page
   ============================================================ */
window.LUNA.onReady(function () {
  const { products, getProduct, formatPrice, productCardHTML, Store, I, esc } = window.LUNA;
  const id = new URLSearchParams(location.search).get('id');
  const p = getProduct(id) || products[0];
  const root = document.querySelector('[data-pdp]');
  if (!root) return;
  if (!p) {
    root.innerHTML = `<div class="empty-note" style="text-align:center;padding:4rem 1rem">
      <h1 class="sec-title">Product not found</h1>
      <p style="color:var(--ink-2);margin:1rem 0 2rem">It may have been removed or the store is still being set up.</p>
      <a class="btn btn--lg" href="collection.html?c=all&dept=men">Browse Collection</a></div>`;
    return;
  }

  const sel = { color: '', colorId: null, size: null }; // color set once the gallery inits
  const hasDiscount = p.compareAt && p.compareAt > p.price;

  function priceHTML() {
    return hasDiscount
      ? `<b>${formatPrice(p.price)}</b><del>${formatPrice(p.compareAt)}</del><span class="off">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>`
      : `<b>${formatPrice(p.price)}</b>`;
  }

  root.innerHTML = `
    <nav class="crumb container" style="padding-inline:0">
      <a href="index.html">Home</a> / <a href="collection.html?c=all&dept=men">${esc(p.dept)}</a> / <b>${esc(p.name)}</b>
    </nav>
    <div class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__thumbwrap">
          <div class="pdp__thumbs" data-thumbs></div>
          <button type="button" class="pdp__thumbnav" data-thumb-next hidden aria-label="More images">${I.chevR}</button>
        </div>
        <div class="pdp__main" data-stage>
          <div class="pdp__track" data-track></div>
        </div>
      </div>
      <div class="pdp__details">
        ${hasDiscount
          ? `<span class="eyebrow" style="color:var(--sale)">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>`
          : (p.badge === 'new' ? `<span class="eyebrow" style="color:var(--sale)">New Arrival</span>` : '')}
        <h1 class="pdp__title">${esc(p.name)}</h1>
        <p class="pdp__sub">${esc(p.subtitle)}</p>
        <div class="pdp__price">${priceHTML()}</div>

        <span class="pdp__label">Color: <span data-color-name></span></span>
        <div class="swatches" data-swatches></div>

        <span class="pdp__label">Select Size</span>
        <div class="sizes" data-sizes>
          ${p.sizes.map((s) => `<button class="size" data-size="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>

        <div class="pdp__actions">
          <button class="btn btn--lg" data-add>${I.bag}<span>Add to Basket</span></button>
          <button class="iconbtn iconbtn--square ${Store.isWished(p.id) ? 'is-active' : ''}" data-wish-btn aria-label="Wishlist">${I.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.6"')}</button>
        </div>

        <div class="accordion">
          ${accordion('Description', esc(p.description || `A wardrobe staple reimagined. The ${p.name.toLowerCase()} is cut for a ${p.fit.toLowerCase()} and finished with premium, durable fabrication for everyday wear.`))}
          ${accordion('Material & Care', 'Premium cotton-blend. Machine wash cold, tumble dry low, do not bleach. Iron on reverse if needed.')}
          ${accordion('Delivery & Returns', 'Free standard delivery on orders over PKR 3,500. Easy 14-day returns on unworn items with tags attached.')}
        </div>
      </div>
    </div>

    <section class="section container">
      <div class="sec-head"><h2 class="sec-title">You May Also Like</h2></div>
      <div class="grid-products" data-related></div>
    </section>
  `;

  function accordion(title, body) {
    return `<div class="accordion__item">
      <button class="accordion__head">${title} ${I.plus}</button>
      <div class="accordion__body"><p>${body}</p></div>
    </div>`;
  }

  // Wishlist button state
  const wishBtn = root.querySelector('[data-wish-btn]');
  wishBtn.classList.toggle('is-active', Store.isWished(p.id));

  // Gallery: one slide per gallery slot (main photo). Each slot has its own set
  // of colours — its main photo's colour plus its "color images". The swatches
  // show only the colours of the slot you're viewing; picking one swaps that
  // slot's image in place. Swiping / thumbnails move between slots.
  const stage = root.querySelector('[data-stage]');
  const track = root.querySelector('[data-track]');
  const thumbsEl = root.querySelector('[data-thumbs]');
  const nextBtn = root.querySelector('[data-thumb-next]');
  const swatchEl = root.querySelector('[data-swatches]');
  const nameEl = root.querySelector('[data-color-name]');
  const groups = (p.mainGroups && p.mainGroups.length)
    ? p.mainGroups
    : [{ url: p.images[0], mainColorId: null, byColor: {}, colorIds: [] }];
  const set = groups; // one carousel slide per slot (drag code reads set.length)
  let cur = 0;

  const colorObj = (id) => p.colors.find((c) => c.id === id) || null;
  // the colour selected within each slot (defaults to the slot's main colour)
  const pick = groups.map((g) => g.mainColorId || g.colorIds[0] || null);
  const slotImage = (i) => groups[i].byColor[pick[i]] || groups[i].url;

  track.innerHTML = groups.map((g, i) =>
    `<div class="pdp__slide"><img src="${esc(slotImage(i))}" alt="${esc(p.name)} view ${i + 1}" draggable="false"></div>`).join('');
  thumbsEl.innerHTML = groups.map((g, i) =>
    `<button type="button" class="pdp__thumb" data-thumb="${i}"><img src="${esc(slotImage(i))}" alt="${esc(p.name)} view ${i + 1}"></button>`).join('');
  [...thumbsEl.children].forEach((btn) => btn.addEventListener('click', () => goTo(+btn.dataset.thumb, true)));

  function refreshSlot(i) {
    const src = slotImage(i);
    const s = track.children[i] && track.children[i].querySelector('img');
    const t = thumbsEl.children[i] && thumbsEl.children[i].querySelector('img');
    if (s) s.src = src;
    if (t) t.src = src;
  }
  function syncColorLabel() {
    const c = colorObj(pick[cur]);
    sel.colorId = pick[cur];
    sel.color = c ? c.name : '';
    nameEl.textContent = sel.color;
  }
  function renderSwatches() {
    const g = groups[cur];
    swatchEl.innerHTML = g.colorIds.map((id) => {
      const c = colorObj(id);
      return `<button class="swatch ${id === pick[cur] ? 'is-active' : ''}" data-cid="${esc(id)}" style="background:${esc(c ? c.hex : '#1a1a1a')}" aria-label="${esc(c ? c.name : '')}"></button>`;
    }).join('');
    swatchEl.querySelectorAll('[data-cid]').forEach((b) => b.addEventListener('click', () => {
      pick[cur] = b.dataset.cid;                 // change only the current slot
      refreshSlot(cur);
      syncColorLabel();
      [...swatchEl.children].forEach((s) => s.classList.toggle('is-active', s.dataset.cid === pick[cur]));
    }));
  }

  function goTo(i, animate) {
    cur = Math.max(0, Math.min(groups.length - 1, i));
    track.classList.toggle('is-anim', !!animate);
    track.style.transform = `translateX(${-cur * 100}%)`;
    [...thumbsEl.children].forEach((b, bi) => b.classList.toggle('is-active', bi === cur));
    // keep the active thumb in view inside the strip
    const active = thumbsEl.children[cur];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    renderSwatches(); // swatches reflect the slot you're now viewing
    syncColorLabel();
  }
  // next button only when the strip overflows by a usable amount (a few px of
  // sub-pixel rounding — e.g. Windows 125% display scaling — must not count)
  function updateThumbNav() {
    const vertical = getComputedStyle(thumbsEl).flexDirection === 'column';
    const over = vertical
      ? thumbsEl.scrollHeight - thumbsEl.clientHeight
      : thumbsEl.scrollWidth - thumbsEl.clientWidth;
    nextBtn.hidden = over <= 4;
  }
  window.addEventListener('resize', updateThumbNav);
  window.addEventListener('load', updateThumbNav);
  // Open on the cover slot with its colour selected.
  goTo(0, false);
  updateThumbNav(); // sync — rAF may never fire in a background tab
  requestAnimationFrame(updateThumbNav); // and re-check once painted

  nextBtn.addEventListener('click', () => {
    const vertical = thumbsEl.scrollHeight > thumbsEl.clientHeight;
    const step = (thumbsEl.children[0] ? (vertical ? thumbsEl.children[0].offsetHeight : thumbsEl.children[0].offsetWidth) : 80) + 10;
    const atEnd = vertical
      ? thumbsEl.scrollTop + thumbsEl.clientHeight >= thumbsEl.scrollHeight - 2
      : thumbsEl.scrollLeft + thumbsEl.clientWidth >= thumbsEl.scrollWidth - 2;
    if (atEnd) thumbsEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    else thumbsEl.scrollBy({ top: vertical ? step : 0, left: vertical ? 0 : step, behavior: 'smooth' });
  });

  if (stage) {
    let x0 = 0, y0 = 0, w = 1, dragging = false, axis = null;
    stage.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; y0 = e.clientY; w = stage.clientWidth || 1;
      dragging = true; axis = null;
      track.classList.remove('is-anim');
      stage.classList.add('is-grabbing');
      if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis !== 'x') return;                       // vertical -> let the page scroll
      e.preventDefault();
      // rubber-band resistance at the first/last image
      const d = ((cur === 0 && dx > 0) || (cur === set.length - 1 && dx < 0)) ? dx * 0.35 : dx;
      track.style.transform = `translateX(${-cur * 100 + (d / w) * 100}%)`; // follow finger live
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-grabbing');
      const dx = (e.clientX || x0) - x0;
      if (axis === 'x' && Math.abs(dx) > w * 0.18) goTo(cur + (dx < 0 ? 1 : -1), true);
      else goTo(cur, true);                           // snap back
      axis = null;
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  // Sizes
  root.querySelectorAll('[data-size]').forEach((btn) => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    sel.size = btn.dataset.size;
  }));

  // Add to basket
  root.querySelector('[data-add]').addEventListener('click', () => {
    if (!sel.size) { window.LUNA.toast('Please select a size'); return; }
    Store.addToCart(p.id, { size: sel.size, color: sel.color, qty: 1 });
    window.LUNA.toast('Added to bag');
    window.LUNA.openDrawer('cart');
  });

  // Wishlist
  wishBtn.addEventListener('click', () => window.LUNA.onWish(wishBtn, p.id));

  // Accordion
  root.querySelectorAll('.accordion__head').forEach((h) => h.addEventListener('click', () => {
    const item = h.parentElement;
    const body = h.nextElementSibling;
    const open = item.classList.toggle('is-open');
    body.style.maxHeight = open ? body.scrollHeight + 'px' : 0;
  }));

  // Related
  const related = products.filter((x) => x.category === p.category && x.id !== p.id)
    .concat(products.filter((x) => x.category !== p.category))
    .slice(0, 4);
  root.querySelector('[data-related]').innerHTML = related.map(productCardHTML).join('');

  document.title = `${p.name} — Luno`;
});
