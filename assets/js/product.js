/* ============================================================
   Luna — Product detail page
   ============================================================ */
window.LUNA.onReady(function () {
  const { products, getProduct, formatPrice, productCardHTML, Store, I } = window.LUNA;
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

  const sel = { color: p.colors[0].name, size: null };

  function priceHTML() {
    return p.compareAt
      ? `<b>${formatPrice(p.price)}</b><del>${formatPrice(p.compareAt)}</del><span class="off">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>`
      : `<b>${formatPrice(p.price)}</b>`;
  }

  root.innerHTML = `
    <nav class="crumb container" style="padding-inline:0">
      <a href="index.html">Home</a> / <a href="collection.html?c=all&dept=men">${p.dept}</a> / <b>${p.name}</b>
    </nav>
    <div class="pdp">
      <div class="pdp__gallery">
        <div class="pdp__thumbs" data-thumbs>
          ${p.images.map((src, i) => `<button class="pdp__thumb ${i === 0 ? 'is-active' : ''}" data-thumb="${i}"><img src="${src}" alt="${p.name} view ${i + 1}"></button>`).join('')}
        </div>
        <div class="pdp__main"><img src="${p.images[0]}" alt="${p.name}" data-main-img></div>
      </div>
      <div class="pdp__details">
        ${p.badge ? `<span class="eyebrow" style="color:var(--sale)">${p.badge === 'sale' ? `Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs` : 'New Arrival'}</span>` : ''}
        <h1 class="pdp__title">${p.name}</h1>
        <p class="pdp__sub">${p.subtitle}</p>
        <div class="pdp__price">${priceHTML()}</div>

        <span class="pdp__label">Color: <span data-color-name>${sel.color}</span></span>
        <div class="swatches" data-swatches>
          ${p.colors.map((c, i) => `<button class="swatch ${i === 0 ? 'is-active' : ''}" data-color="${c.name}" style="background:${c.hex}" aria-label="${c.name}"></button>`).join('')}
        </div>

        <span class="pdp__label">Select Size</span>
        <div class="sizes" data-sizes>
          ${p.sizes.map((s) => `<button class="size" data-size="${s}">${s}</button>`).join('')}
        </div>

        <div class="pdp__actions">
          <button class="btn btn--lg" data-add>${I.bag}<span>Add to Basket</span></button>
          <button class="iconbtn iconbtn--square ${Store.isWished(p.id) ? 'is-active' : ''}" data-wish-btn aria-label="Wishlist">${I.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.6"')}</button>
        </div>

        <div class="accordion">
          ${accordion('Description', p.description || `A wardrobe staple reimagined. The ${p.name.toLowerCase()} is cut for a ${p.fit.toLowerCase()} and finished with premium, durable fabrication for everyday wear.`)}
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

  // Gallery thumbs
  const mainImg = root.querySelector('[data-main-img]');
  root.querySelectorAll('[data-thumb]').forEach((btn) => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-thumb]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    mainImg.src = p.images[+btn.dataset.thumb];
  }));

  // Swatches
  root.querySelectorAll('[data-color]').forEach((btn) => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-color]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    sel.color = btn.dataset.color;
    root.querySelector('[data-color-name]').textContent = sel.color;
  }));

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
