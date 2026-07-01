/* ============================================================
   Luna — Homepage behaviour: hero slider, focus tabs, carousels
   ============================================================ */
(function () {
  const { products, productCardHTML } = window.LUNA;

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

  /* ---------- Populate a product carousel/grid by filter ---------- */
  function fill(selector, list) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = list.map(productCardHTML).join('');
  }

  /* ---------- Categories in focus tabs ---------- */
  function initFocus() {
    const tabs = [...document.querySelectorAll('.focus__tab')];
    const track = document.querySelector('[data-focus-track]');
    if (!track) return;
    const render = (cat) => {
      const list = products.filter((p) => cat === 'all' || p.category === cat).slice(0, 8);
      track.innerHTML = list.map(productCardHTML).join('');
    };
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.remove('is-active'));
      t.classList.add('is-active');
      render(t.dataset.cat);
    }));
    render(tabs[0] ? tabs[0].dataset.cat : 'all');
  }

  /* ---------- Carousel arrow buttons ---------- */
  function initCarouselNav() {
    const I = window.LUNA.I;
    document.querySelectorAll('[data-scroll]').forEach((btn) => {
      btn.innerHTML = btn.dataset.scroll === 'next' ? I.chevR : I.chevL;
      btn.addEventListener('click', () => {
        const section = btn.closest('section') || document;
        const track = section.querySelector('.carousel__track');
        if (!track) return;
        const dir = btn.dataset.scroll === 'next' ? 1 : -1;
        track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
  }

  function boot() {
    initHero();
    fill('[data-new-arrivals]', products.filter((p) => p.badge === 'new').concat(products).slice(0, 8));
    fill('[data-best-sellers]', products.filter((p) => p.compareAt).slice(0, 8));
    initFocus();
    initCarouselNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
