/* ============================================================
   Luna — Footer render + misc icon injection
   ============================================================ */
(function () {
  const I = window.LUNA.I;

  const footerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__brand">
          <span class="logo">
            <svg class="logo__moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 2A10 10 0 1 0 22 14.5 8 8 0 0 1 15.5 2z"/></svg>
            <b>LUNA</b>
          </span>
          <p>Modern essentials and seasonal apparel, designed in a refined monochrome palette for everyday wear.</p>
          <div class="footer__social">
            <a href="#" aria-label="Instagram">${I.ig}</a>
            <a href="#" aria-label="Facebook">${I.fb}</a>
            <a href="#" aria-label="TikTok">${I.tt}</a>
            <a href="#" aria-label="YouTube">${I.yt}</a>
          </div>
        </div>
        <div class="footer__col">
          <h5>Shop</h5>
          <a href="collection.html?c=all&dept=men">Men</a>
          <a href="collection.html?c=all&dept=women">Women</a>
          <a href="collection.html?c=all&dept=juniors">Juniors</a>
          <a href="collection.html?c=all&sale=1">Sale</a>
          <a href="collection.html?c=footwear&dept=men">Footwear</a>
        </div>
        <div class="footer__col">
          <h5>Help</h5>
          <a href="#">Track Your Order</a>
          <a href="#">Shipping &amp; Delivery</a>
          <a href="#">Returns &amp; Exchanges</a>
          <a href="#">Size Guide</a>
          <a href="#">Contact Us</a>
        </div>
        <div class="footer__col">
          <h5>Company</h5>
          <a href="#">About Luna</a>
          <a href="#">Stores</a>
          <a href="#">Careers</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms &amp; Conditions</a>
        </div>
      </div>
      <div class="footer__bottom">
        <p>© ${new Date().getFullYear()} Luna. All rights reserved. A demo storefront — not a real store.</p>
        <div class="footer__pay">
          <span>VISA</span><span>MASTERCARD</span><span>COD</span><span>EASYPAISA</span>
        </div>
      </div>
    </div>
  </footer>`;

  function boot() {
    const slot = document.querySelector('[data-slot="footer"]');
    if (slot) slot.innerHTML = footerHTML;

    // Inject feature-row icons where requested
    document.querySelectorAll('[data-feature]').forEach((el) => {
      const ico = el.querySelector('[data-ico]');
      if (ico && I[el.dataset.feature]) ico.innerHTML = I[el.dataset.feature];
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
