/* ============================================================
   Luna — Order tracking. Looks up an order via the `track_order`
   RPC (needs order number + email, so strangers can't browse orders).
   ============================================================ */
window.LUNA.onReady(function () {
  const { formatPrice } = window.LUNA;
  const root = document.querySelector('[data-track]');
  if (!root) return;

  const form = root.querySelector('[data-tr-form]');
  const errEl = root.querySelector('[data-tr-error]');
  const resultEl = root.querySelector('[data-tr-result]');
  const submitBtn = root.querySelector('[data-tr-submit]');
  const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
  const LABELS = { pending: 'Order Placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render(o) {
    const cancelled = o.status === 'cancelled';
    const reached = STEPS.indexOf(o.status);
    const steps = cancelled
      ? `<div class="tr-cancel">This order was cancelled. Contact us if this is unexpected.</div>`
      : `<div class="tr-steps">${STEPS.map((s, i) =>
          `<div class="tr-step ${i <= reached ? 'is-done' : ''}">${LABELS[s]}</div>`).join('')}</div>`;
    const items = (o.items || []).map((it) => `<div class="tr-line">
        ${it.image ? `<img src="${esc(it.image)}" alt="" />` : ''}
        <div style="flex:1"><div>${esc(it.name)}</div>
        <small>${esc([it.size, it.color].filter(Boolean).join(' · '))} × ${it.qty}</small></div>
        <div>${formatPrice(it.price * it.qty)}</div>
      </div>`).join('');
    resultEl.innerHTML = `
      <div style="border:1px solid var(--line-2);padding:1.4rem;margin-top:2rem">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
          <b>${esc(o.order_number)}</b>
          <span style="color:var(--ink-2)">Placed ${new Date(o.placed_at).toLocaleDateString()}</span>
        </div>
        ${steps}
        ${items}
        <div class="tr-total"><span>Total (Cash on Delivery)</span><span>${formatPrice(o.total)}</span></div>
      </div>`;
  }

  async function lookup(order, email) {
    errEl.style.display = 'none';
    resultEl.innerHTML = '';
    if (!window.LUNA.live) {
      errEl.textContent = 'Order tracking is not available in demo mode.';
      errEl.style.display = 'block';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching…';
    try {
      const o = await window.LUNA.api('/rest/v1/rpc/track_order', {
        method: 'POST',
        body: JSON.stringify({ p_order_number: order, p_email: email }),
      });
      if (!o) {
        errEl.textContent = 'No order found for that number and email.';
        errEl.style.display = 'block';
      } else {
        render(o);
      }
    } catch (err) {
      errEl.textContent = err.message || 'Could not look up order. Try again.';
      errEl.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Track Order';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    lookup(String(fd.get('order') || '').trim(), String(fd.get('email') || '').trim());
  });

  // Prefill from ?o=LW-XXXX&e=email (link from checkout confirmation).
  const params = new URLSearchParams(location.search);
  if (params.get('o')) form.order.value = params.get('o');
  if (params.get('e')) form.email.value = params.get('e');
  if (params.get('o') && params.get('e')) lookup(params.get('o'), params.get('e'));
});
