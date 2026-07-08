/* ============================================================
   Luno — Shared UI: icons, logo, header, drawers, product cards, toast
   Injected into every page via <script>. Reads window.LUNA.
   (Internal namespace stays window.LUNA for stability.)
   ============================================================ */
(function () {
  const { Store, formatPrice, getProduct, esc } = window.LUNA;

  /* ---------- Icon set (inline SVG) ---------- */
  const I = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.3C.4 8.5 2 5 5.2 5c2 0 3.3 1.1 4.1 2.3C10.1 6.1 11.4 5 13.4 5 16.6 5 18.2 8.5 16.6 11.7 14.1 16.1 12 21 12 21z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M15 6l-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 6l6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M21 4v4h-4M3 20v-4h4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
    support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    grid2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="7" height="16"/><rect x="13" y="4" width="7" height="16"/></svg>',
    grid4: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2 0-3.5 1.5-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3h-3V9.5c0-.3.2-.5.5-.5z"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 3c.3 2.2 1.7 3.9 4 4.2v3c-1.5 0-2.9-.5-4-1.3V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V3z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12s0-3-.4-4.3a2.6 2.6 0 0 0-1.8-1.8C18.5 5.5 12 5.5 12 5.5s-6.5 0-7.8.4A2.6 2.6 0 0 0 2.4 7.7C2 9 2 12 2 12s0 3 .4 4.3a2.6 2.6 0 0 0 1.8 1.8c1.3.4 7.8.4 7.8.4s6.5 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8C22 15 22 12 22 12zm-12 3V9l5 3z"/></svg>',
  };
  window.LUNA.I = I;

  /* ---------- Luno wordmark: the O is a round 3D rotating moon ---------- */
  function logoHTML() {
    return `<span class="logo__word">LUN<span class="logo__o"><span class="moon moon--o" aria-hidden="true"></span><span>O</span></span></span>`;
  }
  window.LUNA.logoHTML = logoHTML;

  /* ---------- Header markup ---------- */
  function headerHTML(overlay) {
    const msgs = ['Free shipping on orders over PKR 3,500', 'New season — up to 40% off', 'Easy 14-day returns', 'New drops every week'];
    const ticker = msgs.concat(msgs).map((m) => `<span class="topbar__msg">${m}</span>`).join('');
    return `
    <div class="topbar"><div class="topbar__track">${ticker}</div></div>
    <header class="header ${overlay ? 'header--overlay' : ''}" id="site-header">
      <div class="container header__inner">
        <div class="header__left">
          <button class="hamburger" data-open="mmenu" aria-label="Menu">${I.menu}</button>
          <nav class="nav">
            <a class="nav__link" href="collection.html?c=all&dept=men">Men</a>
            <a class="nav__link" href="coming-soon.html?dept=women">Women</a>
            <div class="nav__item">
              <a class="nav__link" href="coming-soon.html?dept=juniors">Juniors<span class="nav__caret" aria-hidden="true">▾</span></a>
              <div class="nav__drop">
                <a href="coming-soon.html?dept=juniors&cat=boys">Boys</a>
                <a href="coming-soon.html?dept=juniors&cat=girls">Girls</a>
              </div>
            </div>
          </nav>
        </div>
        <a class="logo" href="index.html" aria-label="Luno home">${logoHTML()}</a>
        <div class="header__right">
          <form class="search" role="search" onsubmit="return LUNA.doSearch(event)">
            <span class="search__icon">${I.search}</span>
            <input type="search" name="q" placeholder="Search" aria-label="Search products" />
          </form>
          <button class="iconbtn iconbtn--mobile-search" data-open="search-mobile" aria-label="Search">${I.search}</button>
          <a class="iconbtn" href="account.html" aria-label="Account">${I.user}</a>
          <button class="iconbtn" data-open="wishlist" aria-label="Wishlist">
            ${I.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.6"')}
            <span class="iconbtn__badge" data-wish-badge hidden></span>
          </button>
          <button class="iconbtn" data-open="cart" aria-label="Cart">
            ${I.bag}
            <span class="iconbtn__badge" data-cart-badge hidden></span>
          </button>
        </div>
      </div>
    </header>`;
  }

  /* ---------- Drawers + overlays markup ---------- */
  function chromeHTML() {
    return `
    <div class="overlay" data-overlay></div>

    <aside class="drawer" data-drawer="cart" aria-label="Shopping bag">
      <div class="drawer__head"><h3>Shopping Bag</h3><button class="iconbtn" data-close aria-label="Close">${I.close}</button></div>
      <div class="drawer__body" data-cart-body></div>
      <div class="drawer__foot" data-cart-foot></div>
    </aside>

    <aside class="drawer" data-drawer="wishlist" aria-label="Wishlist">
      <div class="drawer__head"><h3>Wishlist</h3><button class="iconbtn" data-close aria-label="Close">${I.close}</button></div>
      <div class="drawer__body" data-wish-body></div>
    </aside>

    <nav class="mmenu" data-drawer="mmenu" aria-label="Menu">
      <div class="mmenu__head">${logoHTML()}<button class="iconbtn" data-close aria-label="Close">${I.close}</button></div>
      <div class="mmenu__body">
        <a class="mmenu__link" href="collection.html?c=all&dept=men">Men ${I.chevR}</a>
        <a class="mmenu__link" href="coming-soon.html?dept=women">Women <span class="soon-tag">Soon</span></a>
        <a class="mmenu__link" href="coming-soon.html?dept=juniors">Juniors <span class="soon-tag">Soon</span></a>
        <a class="mmenu__link mmenu__link--sub" href="coming-soon.html?dept=juniors&cat=boys">Boys</a>
        <a class="mmenu__link mmenu__link--sub" href="coming-soon.html?dept=juniors&cat=girls">Girls</a>
        <a class="mmenu__link" href="collection.html?c=all&sale=1">Sale ${I.chevR}</a>
        <a class="mmenu__link" href="collection.html?c=footwear&dept=men">Footwear ${I.chevR}</a>
        <a class="mmenu__link" href="track.html">Track Order ${I.chevR}</a>
        <a class="mmenu__link" href="about.html">About ${I.chevR}</a>
        <a class="mmenu__link" href="contact.html">Contact ${I.chevR}</a>
      </div>
    </nav>

    <div class="toast" data-toast></div>

    <a class="wa-fab" href="https://wa.me/923153909606" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
      <svg class="wa-fab__icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.418A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.94 7.94 0 0 1-4.054-1.113l-.29-.174-3.002.856.843-2.946-.19-.302A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.965c-.242-.121-1.43-.705-1.652-.786-.222-.08-.383-.12-.544.121-.16.242-.623.786-.764.947-.14.162-.281.182-.523.061-.242-.121-1.022-.377-1.947-1.201-.72-.641-1.207-1.433-1.348-1.674-.14-.242-.015-.373.106-.493.109-.109.242-.282.363-.423.121-.14.162-.242.242-.403.08-.16.04-.303-.02-.423-.061-.121-.544-1.311-.745-1.794-.197-.472-.397-.408-.544-.416l-.463-.008c-.16 0-.423.06-.644.302-.222.242-.846.827-.846 2.017 0 1.19.866 2.34.987 2.502.121.16 1.703 2.6 4.127 3.646.577.249 1.027.397 1.378.508.579.184 1.106.158 1.523.096.465-.069 1.43-.585 1.632-1.15.2-.564.2-1.048.14-1.149-.06-.1-.222-.16-.463-.282z"/></svg>
      <span class="wa-fab__label">Chat with us</span>
    </a>`;
  }

  /* ---------- Standard product card (collection / related) ---------- */
  function productCardHTML(p) {
    // A compare-at price above the selling price = on sale (drives the
    // "Save X rs" badge automatically, regardless of the badge field).
    const hasDiscount = p.compareAt && p.compareAt > p.price;
    const badge = hasDiscount
      ? `<span class="prod__badge prod__badge--sale">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>`
      : p.badge === 'new' ? `<span class="prod__badge">New</span>` : '';
    const priceHTML = hasDiscount
      ? `<b>${formatPrice(p.price)}</b><del>${formatPrice(p.compareAt)}</del><span class="off">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>`
      : `<b>${formatPrice(p.price)}</b>`;
    const wished = Store.isWished(p.id) ? 'is-active' : '';
    const id = esc(p.id);
    return `
    <article class="prod" data-id="${id}">
      <a class="prod__media" href="product.html?id=${encodeURIComponent(p.id)}">
        ${badge}
        <img class="prod__img" src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy" />
        <img class="prod__img prod__img--hover" src="${esc(p.images[1] || p.images[0])}" alt="" loading="lazy" />
        <button class="prod__wish ${wished}" data-wish="${id}" aria-label="Add to wishlist" onclick="event.preventDefault();LUNA.onWish(this,'${id}')">${I.heart}</button>
        <button class="prod__add" onclick="event.preventDefault();LUNA.quickAdd('${id}')">${I.bag}<span>Add to Basket</span></button>
      </a>
      <a class="prod__info" href="product.html?id=${encodeURIComponent(p.id)}">
        <h3 class="prod__name">${esc(p.name)}</h3>
        <p class="prod__sub">${esc(p.subtitle)}</p>
        <div class="prod__price">${priceHTML}</div>
      </a>
    </article>`;
  }
  window.LUNA.productCardHTML = productCardHTML;

  /* ---------- Feature (FEAR-style) card — big card, dots, sold-out
       Kept in the LIGHT theme (grey card, existing images). ---------- */
  function fearCardHTML(p) {
    const hasDiscount = p.compareAt && p.compareAt > p.price;
    const dots = p.images.slice(0, 4).map((_, i) => `<span class="fdot ${i === 0 ? 'is-active' : ''}"></span>`).join('');
    // Top-left corner: sold-out takes priority, otherwise show the discount.
    const corner = p.soldOut
      ? `<span class="fcard__sold">Sold Out</span>`
      : hasDiscount ? `<span class="prod__badge prod__badge--sale">Save ${(p.compareAt - p.price).toLocaleString('en-PK')} rs</span>` : '';
    const priceHTML = hasDiscount
      ? `<b>${formatPrice(p.price)}</b><del>${formatPrice(p.compareAt)}</del>`
      : `<b>${formatPrice(p.price)}</b>`;
    const wished = Store.isWished(p.id) ? 'is-active' : '';
    const id = esc(p.id);
    return `
    <article class="fcard ${p.soldOut ? 'is-sold' : ''}" data-id="${id}">
      <a class="fcard__media" href="product.html?id=${encodeURIComponent(p.id)}">
        ${corner}
        <img class="fcard__img" src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy" />
        <img class="fcard__img fcard__img--hover" src="${esc(p.images[1] || p.images[0])}" alt="" loading="lazy" />
        <button class="prod__wish ${wished}" data-wish="${id}" aria-label="Add to wishlist" onclick="event.preventDefault();LUNA.onWish(this,'${id}')">${I.heart}</button>
        <div class="fcard__dots">${dots}</div>
      </a>
      <div class="fcard__info">
        <a class="fcard__name" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
        <div class="fcard__price">${priceHTML}</div>
      </div>
    </article>`;
  }
  window.LUNA.fearCardHTML = fearCardHTML;

  /* ---------- Mount shared chrome ---------- */
  function mount() {
    const overlay = document.body.dataset.overlayHeader === 'true';
    if (overlay) document.body.classList.add('has-overlay-header');
    const headerSlot = document.querySelector('[data-slot="header"]');
    if (headerSlot) headerSlot.innerHTML = headerHTML(overlay);
    document.body.insertAdjacentHTML('beforeend', chromeHTML());

    wireDrawers();
    wireHeaderScroll(overlay);
    renderBadges();
    renderCart();
    renderWishlist();
    markActiveNav();
  }

  function markActiveNav() {
    const dept = new URLSearchParams(location.search).get('dept');
    if (!dept) return;
    document.querySelectorAll('.nav__link').forEach((a) => {
      if (a.href.toLowerCase().includes('dept=' + dept)) a.classList.add('is-active');
    });
  }

  /* ---------- Drawer wiring ---------- */
  const overlayEl = () => document.querySelector('[data-overlay]');
  function openDrawer(name) {
    const el = document.querySelector(`[data-drawer="${name}"]`);
    if (!el) return;
    el.classList.add('is-open');
    overlayEl().classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawers() {
    document.querySelectorAll('[data-drawer]').forEach((d) => d.classList.remove('is-open'));
    overlayEl().classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function wireDrawers() {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open]');
      if (opener) {
        const t = opener.dataset.open;
        if (t === 'search-mobile') { LUNA.focusSearch(); return; }
        openDrawer(t);
      }
      if (e.target.closest('[data-close]') || e.target.matches('[data-overlay]')) closeDrawers();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawers(); });
  }
  window.LUNA.openDrawer = openDrawer;
  window.LUNA.closeDrawers = closeDrawers;

  /* ---------- Header scroll: transparent-over-hero -> solid white ---------- */
  function wireHeaderScroll(overlay) {
    if (!overlay) return;
    const header = document.getElementById('site-header');
    const threshold = () => window.innerHeight * 0.6;
    const onScroll = () => {
      const atTop = window.scrollY < threshold();
      header.classList.toggle('header--overlay', atTop);
      document.body.classList.toggle('nav-solid', !atTop);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Badges ---------- */
  function renderBadges() {
    const c = Store.cartCount(), w = Store.wishCount();
    document.querySelectorAll('[data-cart-badge]').forEach((b) => { b.textContent = c; b.hidden = c === 0; });
    document.querySelectorAll('[data-wish-badge]').forEach((b) => { b.textContent = w; b.hidden = w === 0; });
  }

  /* ---------- Cart render ---------- */
  function renderCart() {
    const body = document.querySelector('[data-cart-body]');
    const foot = document.querySelector('[data-cart-foot]');
    if (!body) return;
    const cart = Store.cart;
    if (!cart.length) {
      body.innerHTML = `<div class="drawer__empty"><p>Your bag is empty.</p><a class="btn btn--outline" href="collection.html?c=all&dept=men" style="margin-top:1rem" onclick="LUNA.closeDrawers()">Start Shopping</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = cart.map((item, i) => {
      const p = getProduct(item.id);
      if (!p) return '';
      return `<div class="cart-item">
        <a class="cart-item__img" href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.images[0])}" alt="${esc(p.name)}"></a>
        <div>
          <a class="cart-item__name" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
          <div class="cart-item__meta">${esc([item.size, item.color].filter(Boolean).join(' · ') || p.subtitle)}</div>
          <div class="cart-item__price">${formatPrice(p.price)}</div>
          <div class="qty">
            <button aria-label="Decrease" onclick="LUNA.qty(${i},-1)">–</button>
            <span>${item.qty}</span>
            <button aria-label="Increase" onclick="LUNA.qty(${i},1)">+</button>
          </div>
        </div>
        <button class="cart-item__remove" onclick="LUNA.removeItem(${i})">Remove</button>
      </div>`;
    }).join('');
    foot.innerHTML = `
      <div class="drawer__row total"><span>Subtotal</span><span>${formatPrice(Store.subtotal())}</span></div>
      <p style="color:var(--ink-2);font-size:var(--fs-xs);margin-bottom:1rem">Shipping & taxes calculated at checkout.</p>
      <a class="btn btn--block btn--lg" href="checkout.html">Checkout</a>`;
  }

  /* ---------- Wishlist render ---------- */
  function renderWishlist() {
    const body = document.querySelector('[data-wish-body]');
    if (!body) return;
    const ids = Store.wishlist;
    if (!ids.length) {
      body.innerHTML = `<div class="drawer__empty"><p>Your wishlist is empty.</p></div>`;
      return;
    }
    body.innerHTML = ids.map((id) => {
      const p = getProduct(id);
      if (!p) return '';
      const pid = esc(p.id);
      return `<div class="cart-item">
        <a class="cart-item__img" href="product.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.images[0])}" alt="${esc(p.name)}"></a>
        <div>
          <a class="cart-item__name" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
          <div class="cart-item__meta">${esc(p.subtitle)}</div>
          <div class="cart-item__price">${formatPrice(p.price)}</div>
          <button class="btn btn--outline" style="margin-top:.6rem;padding:.5rem 1rem;font-size:var(--fs-xs)" onclick="LUNA.quickAdd('${pid}')">Add to Bag</button>
        </div>
        <button class="cart-item__remove" onclick="LUNA.onWish(null,'${pid}')">Remove</button>
      </div>`;
    }).join('');
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.innerHTML = `${I.check}<span>${msg}</span>`;
    el.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-open'), 2400);
  }
  window.LUNA.toast = toast;

  /* ---------- Public actions ---------- */
  window.LUNA.quickAdd = (id) => {
    const p = getProduct(id);
    if (p.soldOut) { toast('Sorry — this item is sold out'); return; }
    Store.addToCart(id, { size: p.sizes[0], color: p.colors[0].name, qty: 1 });
    toast('Added to bag');
    openDrawer('cart');
  };
  window.LUNA.onWish = (btn, id) => {
    const active = Store.toggleWish(id);
    if (btn) btn.classList.toggle('is-active', active);
    document.querySelectorAll(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('is-active', active));
    toast(active ? 'Added to wishlist' : 'Removed from wishlist');
  };
  window.LUNA.qty = (i, d) => Store.updateQty(i, d);
  window.LUNA.removeItem = (i) => Store.removeFromCart(i);
  window.LUNA.doSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q').trim();
    if (q) location.href = `collection.html?c=all&dept=men&q=${encodeURIComponent(q)}`;
    return false;
  };
  window.LUNA.focusSearch = () => {
    const inp = document.querySelector('.search input');
    if (inp) inp.focus();
  };

  /* ---------- React to state changes ---------- */
  window.addEventListener('luna:change', () => {
    renderBadges();
    renderCart();
    renderWishlist();
  });

  /* ---------- Interaction Restrictions ---------- */
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'A' || e.target.closest('a')) {
      e.preventDefault();
    }
  });

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
