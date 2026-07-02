/* ============================================================
   Luna — Shared Supabase client + auth state (all pages).
   Requires the supabase-js CDN script and supabase-config.js
   to be loaded first. Emits 'luna:auth' with the user (or null)
   on load and whenever the session changes.
   ============================================================ */
(function () {
  const cfg = window.LUNA_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && !String(cfg.url).includes('YOUR-') && !String(cfg.anonKey).includes('YOUR-'));
  const sb = (configured && window.supabase) ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  window.LUNA = window.LUNA || {};
  window.LUNA.sb = sb;
  window.LUNA.user = null;

  const emit = (user) => {
    window.LUNA.user = user;
    window.dispatchEvent(new CustomEvent('luna:auth', { detail: user }));
  };

  window.LUNA.authReady = sb
    ? sb.auth.getSession().then(({ data }) => {
        const user = data.session ? data.session.user : null;
        emit(user);
        return user;
      }).catch(() => null)
    : Promise.resolve(null);

  if (sb) {
    sb.auth.onAuthStateChange((_event, session) => emit(session ? session.user : null));
  }
})();
