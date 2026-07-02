/* ============================================================
   Luna — Client-side store (cart + wishlist, localStorage-backed)
   Emits 'luna:change' on window whenever state mutates.
   ============================================================ */
(function () {
  const CART_KEY = 'luna.cart.v1';
  const WISH_KEY = 'luna.wishlist.v1';

  const read = (k) => {
    try { return JSON.parse(localStorage.getItem(k)) || []; }
    catch { return []; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const state = {
    cart: read(CART_KEY),     // [{ id, size, color, qty }]
    wishlist: read(WISH_KEY), // [ id ]
  };

  const emit = () => window.dispatchEvent(new CustomEvent('luna:change'));

  const Store = {
    get cart() { return state.cart; },
    get wishlist() { return state.wishlist; },

    cartCount() { return state.cart.reduce((n, i) => n + i.qty, 0); },
    wishCount() { return state.wishlist.length; },

    subtotal() {
      return state.cart.reduce((sum, i) => {
        const p = window.LUNA.getProduct(i.id);
        return sum + (p ? p.price * i.qty : 0);
      }, 0);
    },

    addToCart(id, { size = null, color = null, qty = 1 } = {}) {
      const key = (x) => `${x.id}|${x.size}|${x.color}`;
      const line = { id, size, color, qty };
      const existing = state.cart.find((i) => key(i) === key(line));
      if (existing) existing.qty += qty;
      else state.cart.push(line);
      write(CART_KEY, state.cart);
      emit();
    },

    updateQty(index, delta) {
      const item = state.cart[index];
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) state.cart.splice(index, 1);
      write(CART_KEY, state.cart);
      emit();
    },

    removeFromCart(index) {
      state.cart.splice(index, 1);
      write(CART_KEY, state.cart);
      emit();
    },

    clearCart() {
      state.cart.length = 0;
      write(CART_KEY, state.cart);
      emit();
    },

    isWished(id) { return state.wishlist.includes(id); },

    toggleWish(id) {
      const i = state.wishlist.indexOf(id);
      if (i > -1) state.wishlist.splice(i, 1);
      else state.wishlist.push(id);
      write(WISH_KEY, state.wishlist);
      emit();
      return this.isWished(id);
    },
  };

  window.LUNA = window.LUNA || {};
  window.LUNA.Store = Store;

  /* ---------- Account sync: saved cart + wishlist ----------
     When signed in, the bag/wishlist live in the `carts` table
     (one row per user, guarded by RLS) and follow the customer
     across devices. Local storage stays the source while guest. */
  let remoteLoaded = false;
  let pushTimer;

  async function pullRemote(user) {
    const sb = window.LUNA.sb;
    if (!sb || !user) return;
    try {
      const { data } = await sb.from('carts').select('items, wishlist').eq('user_id', user.id).maybeSingle();
      if (data) {
        if (!state.cart.length && Array.isArray(data.items) && data.items.length) {
          state.cart.push(...data.items);
          write(CART_KEY, state.cart);
        }
        if (!state.wishlist.length && Array.isArray(data.wishlist) && data.wishlist.length) {
          state.wishlist.push(...data.wishlist);
          write(WISH_KEY, state.wishlist);
        }
      }
      remoteLoaded = true;
      emit();
    } catch (e) {
      console.warn('Luna: cart sync failed', e);
    }
  }

  function pushRemote() {
    const sb = window.LUNA.sb;
    const user = window.LUNA.user;
    if (!sb || !user || !remoteLoaded) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      sb.from('carts').upsert({
        user_id: user.id,
        items: state.cart,
        wishlist: state.wishlist,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => { if (error) console.warn('Luna: cart save failed', error.message); });
    }, 700);
  }

  window.addEventListener('luna:auth', (e) => {
    if (e.detail) pullRemote(e.detail);
    else remoteLoaded = false;
  });
  window.addEventListener('luna:change', pushRemote);

  // Drop bag/wishlist entries whose product no longer exists in the
  // catalog (e.g. deleted in the admin panel). Only when the catalog
  // actually loaded — never wipe the bag on a network failure.
  if (window.LUNA.ready) window.LUNA.ready.then(() => {
    if (!window.LUNA.live || !window.LUNA.products.length) return;
    const known = (id) => !!window.LUNA.getProduct(id);
    const cartLen = state.cart.length, wishLen = state.wishlist.length;
    for (let i = state.cart.length - 1; i >= 0; i--) if (!known(state.cart[i].id)) state.cart.splice(i, 1);
    for (let i = state.wishlist.length - 1; i >= 0; i--) if (!known(state.wishlist[i])) state.wishlist.splice(i, 1);
    if (cartLen !== state.cart.length || wishLen !== state.wishlist.length) {
      write(CART_KEY, state.cart);
      write(WISH_KEY, state.wishlist);
      emit();
    }
  });
})();
