/* ============================================================
   Luno — Homepage behaviour: hero slider + feature grids (FEAR-style)
   ============================================================ */
(function () {
  const { products, fearCardHTML } = window.LUNA;

  /* ---------- Hero slider ---------- */
  function initHero() {
    const slides = [...document.querySelectorAll('.hero__slide')];
    const dots = [...document.querySelectorAll('.hero__dot')];
    if (!slides.length) return;
    let i = 0, timer;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    };
    const start = () => { timer = setInterval(() => go(i + 1), 5500); };
    dots.forEach((d, k) => d.addEventListener('click', () => { clearInterval(timer); go(k); start(); }));
    go(0); start();
  }

  function fill(selector, list) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = list.map(fearCardHTML).join('');
  }

  function boot() {
    initHero();
    // NEW IN — newest first, then fill up
    const newIn = products.filter((p) => p.badge === 'new').concat(products).slice(0, 8);
    fill('[data-new-in]', newIn);
    // BEST SELLERS — discounted / most-loved
    const best = products.filter((p) => p.compareAt).concat(products.slice(0, 8)).slice(0, 8);
    fill('[data-best]', best);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
