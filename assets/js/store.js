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
})();
