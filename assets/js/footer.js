/* ============================================================
   Luno — Footer render + misc icon injection
   ============================================================ */
(function () {
  const I = window.LUNA.I;
  const logo = window.LUNA.logoHTML ? window.LUNA.logoHTML() : 'LUNO';

  const footerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__brand">
          <span class="logo">${logo}</span>
          <p>Modern essentials and seasonal apparel, designed in a refined monochrome palette for everyday wear.</p>
          <div class="footer__social">
            <a href="https://www.instagram.com/stylistwear" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${I.ig}</a>
            <a href="https://www.facebook.com/profile.php?id=61572334771470" target="_blank" rel="noopener noreferrer" aria-label="Facebook">${I.fb}</a>
          </div>
          <div class="footer__moon"><span class="moon" aria-hidden="true"></span></div>
        </div>
        <div class="footer__col">
          <h5>Shop</h5>
          <a href="collection.html?c=all&dept=men">Men</a>
          <a href="coming-soon.html?dept=women">Women <span class="soon-tag">Soon</span></a>
          <a href="coming-soon.html?dept=juniors">Juniors <span class="soon-tag">Soon</span></a>
          <a href="collection.html?c=all&sale=1">Sale</a>
          <a href="collection.html?c=footwear&dept=men">Footwear</a>
        </div>
        <div class="footer__col">
          <h5>Help</h5>
          <a href="track.html">Track Your Order</a>
          <a href="#">Shipping &amp; Delivery</a>
          <a href="#">Returns &amp; Exchanges</a>
          <a href="#">Size Guide</a>
          <a href="contact.html">Contact Us</a>
        </div>
        <div class="footer__col">
          <h5>Company</h5>
          <a href="about.html">About Luno</a>
          <a href="#">Stores</a>
          <a href="why-choose-us.html">Why Choose Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms &amp; Conditions</a>
        </div>
      </div>
      <div class="footer__bottom">
        <p>© ${new Date().getFullYear()} Luno. All rights reserved. A demo storefront — not a real store.</p>
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
