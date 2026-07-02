/* ============================================================
   Luna — Checkout: renders bag summary, places order through the
   Supabase `place_order` RPC (server computes prices; client input
   is never trusted for totals). Demo toast when Supabase not set up.
   ============================================================ */
window.LUNA.onReady(function () {
  const { Store, getProduct, formatPrice } = window.LUNA;
  const root = document.querySelector('[data-checkout]');
  if (!root) return;

  const itemsEl = root.querySelector('[data-co-items]');
  const totalEl = root.querySelector('[data-co-total]');
  const form = root.querySelector('[data-co-form]');
  const errEl = root.querySelector('[data-co-error]');
  const submitBtn = root.querySelector('[data-co-submit]');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderSummary() {
    const cart = Store.cart;
    if (!cart.length) {
      root.innerHTML = `<div class="co-done"><h1 class="sec-title">Your bag is empty</h1>
        <a class="btn btn--lg" style="margin-top:1.5rem" href="collection.html?c=all&dept=men">Start Shopping</a></div>`;
      return false;
    }
    itemsEl.innerHTML = cart.map((item) => {
      const p = getProduct(item.id);
      if (!p) return '';
      return `<div class="co-line">
        <img src="${esc(p.images[0])}" alt="" />
        <div style="flex:1">
          <div>${esc(p.name)}</div>
          <small>${esc([item.size, item.color].filter(Boolean).join(' · '))} × ${item.qty}</small>
        </div>
        <div>${formatPrice(p.price * item.qty)}</div>
      </div>`;
    }).join('');
    totalEl.textContent = formatPrice(Store.subtotal());
    return true;
  }

  if (!renderSummary()) return;
  window.addEventListener('luna:change', () => { if (Store.cart.length) renderSummary(); });

  // Signed-in customers get their saved details pre-filled.
  window.LUNA.authReady.then(async (user) => {
    if (!user || !window.LUNA.sb || !document.contains(form)) return;
    if (!form.email.value) form.email.value = user.email || '';
    const { data } = await window.LUNA.sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!data || !document.contains(form)) return;
    if (!form.name.value) form.name.value = data.full_name || '';
    if (!form.phone.value) form.phone.value = data.phone || '';
    if (!form.address.value) form.address.value = data.address || '';
    if (!form.city.value) form.city.value = data.city || '';
  });

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';

    if (!window.LUNA.live) {
      window.LUNA.toast('Checkout is a demo — Supabase not configured yet');
      return;
    }
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const address = String(fd.get('address') || '').trim();
    if (name.length < 2) return showError('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError('Please enter a valid email.');
    if (address.length < 5) return showError('Please enter a delivery address.');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing order…';
    try {
      const result = await window.LUNA.api('/rest/v1/rpc/place_order', {
        method: 'POST',
        body: JSON.stringify({
          p_name: name,
          p_email: email,
          p_phone: String(fd.get('phone') || '').trim(),
          p_address: address,
          p_city: String(fd.get('city') || '').trim(),
          p_items: Store.cart.map((i) => ({ id: i.id, size: i.size, color: i.color, qty: i.qty })),
        }),
      });
      Store.clearCart();
      root.innerHTML = `<div class="co-done">
        <h1 class="sec-title">Order Placed</h1>
        <p style="color:var(--ink-2);margin-top:1rem">Thank you, ${esc(name)}. Save your order number:</p>
        <div class="co-num">${esc(result.order_number)}</div>
        <p style="color:var(--ink-2)">Total: <b>${formatPrice(result.total)}</b> — Cash on Delivery</p>
        <a class="btn btn--lg" style="margin-top:1.5rem" href="track.html?o=${encodeURIComponent(result.order_number)}&e=${encodeURIComponent(email)}">Track Your Order</a>
      </div>`;
      window.scrollTo({ top: 0 });
    } catch (err) {
      showError(err.message || 'Could not place order. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  });
});
