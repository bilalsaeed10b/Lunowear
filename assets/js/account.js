/* ============================================================
   Luna — Account page: customer sign in / sign up (email or
   Google), saved profile details, and order history.
   All access is enforced by RLS — users only ever see their own
   profile, cart, and orders.
   ============================================================ */
window.LUNA.onReady(function () {
  const root = document.querySelector('[data-acc-root]');
  if (!root) return;
  const sb = window.LUNA.sb;
  const { formatPrice } = window.LUNA;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (!sb) {
    root.innerHTML = `<div class="acc-card" style="text-align:center">
      <h1 class="sec-title">Account</h1>
      <p style="color:var(--ink-2);margin-top:1rem">Accounts are not available yet — the store is still being set up.</p></div>`;
    return;
  }

  let mode = 'signin';

  /* ================= AUTH (guest) ================= */

  function renderAuth(message) {
    root.innerHTML = `
    <div class="acc-card">
      <h1 class="sec-title" style="text-align:center;margin-bottom:.5rem">${mode === 'signin' ? 'Welcome Back' : 'Join Luno'}</h1>
      <p style="text-align:center;color:var(--ink-2);margin-bottom:2rem">Your bag, wishlist and orders — saved to your account.</p>
      <div class="acc-tabs">
        <button data-mode="signin" class="${mode === 'signin' ? 'is-active' : ''}">Sign In</button>
        <button data-mode="signup" class="${mode === 'signup' ? 'is-active' : ''}">Create Account</button>
      </div>
      <form data-auth-form>
        ${mode === 'signup' ? `<div class="acc-field"><label class="pdp__label">Full Name</label>
          <input name="name" required maxlength="80" placeholder="Your name" /></div>` : ''}
        <div class="acc-field"><label class="pdp__label">Email</label>
          <input name="email" type="email" required placeholder="you@example.com" autocomplete="username" /></div>
        <div class="acc-field"><label class="pdp__label">Password</label>
          <input name="password" type="password" required minlength="8" placeholder="${mode === 'signup' ? 'Min. 8 characters' : '••••••••'}"
            autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" /></div>
        <button class="btn btn--block btn--lg" type="submit" data-auth-btn>${mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
        <p class="acc-error" data-auth-msg hidden></p>
      </form>
      <div class="acc-divider">or</div>
      <button class="btn--google" data-google>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
        Continue with Google
      </button>
      <p class="acc-admin">Store staff? <a href="admin.html">Log in as admin →</a></p>
    </div>`;

    const msgEl = root.querySelector('[data-auth-msg]');
    function say(msg, ok) {
      msgEl.textContent = msg;
      msgEl.className = ok ? 'acc-ok' : 'acc-error';
      msgEl.hidden = !msg;
    }
    if (message) say(message.text, message.ok);

    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      renderAuth();
    }));

    root.querySelector('[data-auth-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      say('');
      const btn = root.querySelector('[data-auth-btn]');
      const fd = new FormData(e.target);
      const email = String(fd.get('email')).trim();
      const password = String(fd.get('password'));
      btn.disabled = true;
      btn.textContent = 'Please wait…';
      try {
        if (mode === 'signup') {
          const name = String(fd.get('name')).trim();
          const { data, error } = await sb.auth.signUp({
            email, password,
            options: { data: { full_name: name } },
          });
          if (error) throw error;
          if (!data.session) {
            say('Account created — check your email inbox to confirm, then sign in.', true);
            btn.disabled = false;
            btn.textContent = 'Create Account';
            return;
          }
          await sb.from('profiles').upsert({ user_id: data.session.user.id, full_name: name });
          renderAccount(data.session.user);
        } else {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          renderAccount(data.user);
        }
      } catch (err) {
        say(err.message || 'Something went wrong. Try again.');
        btn.disabled = false;
        btn.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
      }
    });

    root.querySelector('[data-google]').addEventListener('click', async () => {
      if (location.protocol === 'file:') return say('Google sign-in needs the site served over http — run "node server.mjs" and open http://localhost:4321/account.html');
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname },
      });
      if (error) say(error.message);
    });
  }

  /* ================= ACCOUNT (signed in) ================= */

  async function renderAccount(user) {
    const displayName = (user.user_metadata && user.user_metadata.full_name) || user.email;
    root.innerHTML = `
    <div class="acc-panel">
      <div class="acc-head">
        <div>
          <h1 class="sec-title" style="margin-bottom:.3rem">My Account</h1>
          <p style="color:var(--ink-2)">${esc(displayName)} · ${esc(user.email)}</p>
        </div>
        <button class="btn btn--outline" data-signout>Sign Out</button>
      </div>

      <div class="acc-section">
        <h2>My Details</h2>
        <p style="color:var(--ink-2);font-size:var(--fs-sm);margin-bottom:1.2rem">Saved details pre-fill your checkout.</p>
        <form class="acc-grid" data-profile-form>
          <label>Full Name<input name="full_name" maxlength="80" /></label>
          <label>Phone<input name="phone" maxlength="40" placeholder="03xx-xxxxxxx" /></label>
          <label class="span2">Address<input name="address" maxlength="500" placeholder="House, street, area" /></label>
          <label>City<input name="city" maxlength="100" /></label>
          <div style="display:flex;align-items:flex-end"><button class="btn" type="submit" data-profile-save>Save Details</button></div>
          <p class="span2" data-profile-msg hidden></p>
        </form>
      </div>

      <div class="acc-section">
        <h2>My Orders</h2>
        <div data-orders><p style="color:var(--ink-2)">Loading…</p></div>
      </div>
    </div>`;

    root.querySelector('[data-signout]').addEventListener('click', async () => {
      await sb.auth.signOut();
      mode = 'signin';
      renderAuth({ text: 'Signed out.', ok: true });
    });

    /* profile */
    const pform = root.querySelector('[data-profile-form]');
    const pmsg = root.querySelector('[data-profile-msg]');
    sb.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (!data) {
        pform.full_name.value = (user.user_metadata && user.user_metadata.full_name) || '';
        return;
      }
      pform.full_name.value = data.full_name || '';
      pform.phone.value = data.phone || '';
      pform.address.value = data.address || '';
      pform.city.value = data.city || '';
    });
    pform.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = root.querySelector('[data-profile-save]');
      btn.disabled = true;
      const { error } = await sb.from('profiles').upsert({
        user_id: user.id,
        full_name: pform.full_name.value.trim(),
        phone: pform.phone.value.trim(),
        address: pform.address.value.trim(),
        city: pform.city.value.trim(),
        updated_at: new Date().toISOString(),
      });
      btn.disabled = false;
      pmsg.textContent = error ? 'Save failed: ' + error.message : 'Details saved.';
      pmsg.className = 'span2 ' + (error ? 'acc-error' : 'acc-ok');
      pmsg.hidden = false;
    });

    /* orders */
    const ordersEl = root.querySelector('[data-orders]');
    const { data: orders, error } = await sb
      .from('orders').select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      ordersEl.innerHTML = `<p class="acc-error">Could not load orders: ${esc(error.message)}</p>`;
      return;
    }
    if (!orders.length) {
      ordersEl.innerHTML = `<p style="color:var(--ink-2)">No orders yet.
        <a href="collection.html?c=all&dept=men" style="color:var(--ink);border-bottom:1px solid var(--ink)">Start shopping</a>.</p>
        <p style="color:var(--ink-3);font-size:var(--fs-xs);margin-top:.6rem">Ordered as a guest? Track it on the
        <a href="track.html" style="color:var(--ink-2);text-decoration:underline">order tracking page</a>.</p>`;
      return;
    }
    ordersEl.innerHTML = orders.map((o) => `<div class="acc-order">
      <div>
        <b>${esc(o.order_number)}</b>
        <span style="color:var(--ink-3);font-size:var(--fs-xs);margin-left:.6rem">${new Date(o.created_at).toLocaleDateString()}</span><br>
        <span style="color:var(--ink-2);font-size:var(--fs-sm)">${(o.order_items || []).reduce((n, i) => n + i.qty, 0)} item(s) · ${formatPrice(o.total)}</span>
      </div>
      <div style="display:flex;gap:.8rem;align-items:center">
        <span class="acc-status acc-status--${esc(o.status)}">${esc(o.status)}</span>
        <a href="track.html?o=${encodeURIComponent(o.order_number)}&e=${encodeURIComponent(o.email)}"
           style="font-size:var(--fs-sm);color:var(--ink);border-bottom:1px solid var(--ink)">Track</a>
      </div>
    </div>`).join('');
  }

  /* ================= GO ================= */
  window.LUNA.authReady.then((user) => (user ? renderAccount(user) : renderAuth()));
});
