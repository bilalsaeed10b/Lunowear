/* ============================================================
   Luno — Motion & 3D FX
   - Scroll reveals: elements tilt-in with a subtle 3D rotate
   - Parallax: hero / lookbook imagery drifts while scrolling
   - Pointer tilt: cards rotate in 3D toward the cursor
   - Counters: stats count up when they enter the viewport
   Waits for the loading screen, respects prefers-reduced-motion.
   ============================================================ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  document.documentElement.classList.add('fx');

  /* ---------- Scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('in-view');
      io.unobserve(el);
      // Clear stagger delay once the entrance finished so it never
      // slows down later hover/tilt transitions.
      var ms = parseFloat(el.style.transitionDelay) || 0;
      setTimeout(function () { el.style.transitionDelay = ''; }, ms + 1200);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  function reveal(el, delayMs) {
    if (el.hasAttribute('data-reveal')) return;
    el.setAttribute('data-reveal', '');
    if (delayMs) el.style.transitionDelay = delayMs + 'ms';
    io.observe(el);
  }

  // Solo blocks fade-tilt in as one piece.
  var SINGLES = '.sec-head, .fear-head, .hero__content > div, .lookbook__content, ' +
    '.newsletter__inner > *, .soon__content, .pdp__gallery, .pdp__details, ' +
    '.page-hero__inner, .split > *, .contact-form, .accordion__item, ' +
    '.crumb, .tabbar, .toolbar';
  // Grid-like groups stagger child by child.
  var GROUPS = ['.grid-fear', '.grid-products', '.cat-grid', '.stats', '.vcards', '.ccards', '.features'];

  function tagAll() {
    document.querySelectorAll(SINGLES).forEach(function (el) { reveal(el, 0); });
    GROUPS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (child, i) {
          reveal(child, (i % 8) * 80);
        });
      });
    });
  }

  // Re-tag when product grids re-render (collection tabs / sorting).
  function watchGrids() {
    document.querySelectorAll('.grid-fear, .grid-products').forEach(function (grid) {
      new MutationObserver(tagAll).observe(grid, { childList: true });
    });
  }

  /* ---------- Parallax imagery ---------- */
  function initParallax() {
    var imgs = document.querySelectorAll('.hero__slide .hero__img, .lookbook > img, .soon__bg img');
    if (!imgs.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      imgs.forEach(function (img) {
        var holder = img.closest('.hero') || img.closest('.lookbook') || img.closest('.soon') || img.parentElement;
        var r = holder.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        var progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = 'translateY(' + (-progress * 34).toFixed(1) + 'px) scale(1.12)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Pointer tilt (3D card hover) ---------- */
  var TILT_SEL = '.fcard__media, .prod__media, .vcard, .ccard, [data-tilt]';
  function initTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var active = null, rect = null;

    function resetTilt() {
      if (!active) return;
      active.style.transform = '';
      active.classList.remove('is-tilting');
      active = null; rect = null;
    }

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest(TILT_SEL);
      if (t && t !== active) {
        resetTilt();
        active = t;
        rect = t.getBoundingClientRect();
        t.classList.add('is-tilting');
      }
    });
    document.addEventListener('mousemove', function (e) {
      if (!active || !rect) return;
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      active.style.transform = 'perspective(700px) rotateX(' + (-py * 7).toFixed(2) +
        'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateZ(8px)';
    });
    document.addEventListener('mouseout', function (e) {
      if (active && (!e.relatedTarget || !active.contains(e.relatedTarget))) resetTilt();
    });
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target;
        var to = parseFloat(el.dataset.countTo) || 0;
        var suffix = el.dataset.suffix || '';
        var t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Interactive Moon Rotation & 3D Tilt ---------- */
  function initMoonInteractivity() {
    var moons = Array.prototype.slice.call(document.querySelectorAll('.moon'));
    if (!moons.length) return;

    var defaultSpeedX = -0.0925;
    var defaultSpeedY = 0;
    var friction = 0.95;

    moons.forEach(function (moon) {
      moon.classList.add('moon--js-rotate');
      moon.tx = getBeforeTranslateXPercent(moon);
      moon.ty = 0;
      moon.speedX = defaultSpeedX;
      moon.speedY = defaultSpeedY;
      moon.isDragging = false;
      moon.isHovered = false;
      moon.style.setProperty('--moon-tx', moon.tx);
      moon.style.setProperty('--moon-ty', moon.ty);
    });

    function getBeforeTranslateXPercent(el) {
      try {
        var style = window.getComputedStyle(el, '::before');
        var matrix = style.transform || style.webkitTransform;
        if (matrix && matrix !== 'none') {
          var values = matrix.split('(')[1].split(')')[0].split(',');
          var tx = parseFloat(values[4]) || 0;
          var width = el.getBoundingClientRect().width;
          if (width > 0) {
            return (tx / (width * 2)) * 100;
          }
        }
      } catch (e) {}
      return 0;
    }

    function wrapT(val) {
      var v = val % 50;
      if (v > 0) v -= 50;
      return v;
    }

    function animate() {
      moons.forEach(function (moon) {
        if (!moon.isDragging) {
          moon.tx = wrapT((moon.tx || 0) + moon.speedX);
          moon.ty = wrapT((moon.ty || 0) + moon.speedY);
          moon.style.setProperty('--moon-tx', moon.tx);
          moon.style.setProperty('--moon-ty', moon.ty);
          moon.speedX = moon.speedX * friction + defaultSpeedX * (1 - friction);
          moon.speedY = moon.speedY * friction + defaultSpeedY * (1 - friction);
        }
      });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    var startX = 0, startY = 0;
    var startTx = 0, startTy = 0;
    var lastX = 0, lastY = 0;
    var dragVelocityX = 0, dragVelocityY = 0;

    // Use Pointer Events for robust unified drag handling + capturing
    document.addEventListener('pointerdown', function (e) {
      var moon = e.target.closest('.moon');
      if (!moon) return;
      
      moon.setPointerCapture(e.pointerId);
      moon.isDragging = true;
      moon.classList.add('is-interacting', 'is-grabbing');
      
      startX = e.clientX;
      startY = e.clientY;
      startTx = moon.tx || 0;
      startTy = moon.ty || 0;
      lastX = e.clientX;
      lastY = e.clientY;
      dragVelocityX = 0;
      dragVelocityY = 0;
    });

    document.addEventListener('pointermove', function (e) {
      // Find the moon being dragged
      var draggedMoon = null;
      for (var i = 0; i < moons.length; i++) {
        if (moons[i].isDragging && moons[i].hasPointerCapture(e.pointerId)) {
          draggedMoon = moons[i];
          break;
        }
      }

      if (draggedMoon) {
        var rect = draggedMoon.getBoundingClientRect();
        var width = rect.width || 64;
        var height = rect.height || 64;
        
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        
        var newTx = wrapT(startTx + (dx / width) * 50);
        var newTy = wrapT(startTy + (dy / height) * 50);
        
        var currentDx = e.clientX - lastX;
        var currentDy = e.clientY - lastY;
        dragVelocityX = (currentDx / width) * 50;
        dragVelocityY = (currentDy / height) * 50;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        draggedMoon.tx = newTx;
        draggedMoon.ty = newTy;
        draggedMoon.style.setProperty('--moon-tx', newTx);
        draggedMoon.style.setProperty('--moon-ty', newTy);
      }

      var hoveredMoon = e.target.closest('.moon');
      if (hoveredMoon && !hoveredMoon.isDragging) {
        var rect = hoveredMoon.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        if (px > 0.5) px = 0.5; if (px < -0.5) px = -0.5;
        if (py > 0.5) py = 0.5; if (py < -0.5) py = -0.5;
        var tiltX = (-py * 15).toFixed(2);
        var tiltY = (px * 18).toFixed(2);
        hoveredMoon.style.transform = 'perspective(200px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.08)';
      } else if (draggedMoon) {
        var rect = draggedMoon.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        if (px > 0.5) px = 0.5; if (px < -0.5) px = -0.5;
        if (py > 0.5) py = 0.5; if (py < -0.5) py = -0.5;
        var tiltX = (-py * 15).toFixed(2);
        var tiltY = (px * 18).toFixed(2);
        draggedMoon.style.transform = 'perspective(200px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.08)';
      }
    });

    function endDrag(e) {
      var moon = e.target.closest('.moon');
      if (moon && moon.isDragging) {
        moon.isDragging = false;
        moon.classList.remove('is-grabbing');
        try { moon.releasePointerCapture(e.pointerId); } catch(err) {}
        
        var maxVel = 3.0;
        if (dragVelocityX > maxVel) dragVelocityX = maxVel;
        if (dragVelocityX < -maxVel) dragVelocityX = -maxVel;
        if (dragVelocityY > maxVel) dragVelocityY = maxVel;
        if (dragVelocityY < -maxVel) dragVelocityY = -maxVel;
        
        moon.speedX = dragVelocityX;
        moon.speedY = dragVelocityY;
        
        if (!moon.isHovered) {
          moon.classList.remove('is-interacting');
        }
      }
    }

    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);

    document.addEventListener('pointerover', function (e) {
      var moon = e.target.closest('.moon');
      if (moon && moons.indexOf(moon) !== -1) {
        moon.isHovered = true;
        moon.classList.add('is-interacting', 'is-tilting');
      }
    });

    document.addEventListener('pointerout', function (e) {
      var moon = e.target.closest('.moon');
      if (moon && moons.indexOf(moon) !== -1) {
        if (!e.relatedTarget || !moon.contains(e.relatedTarget)) {
          moon.isHovered = false;
          moon.classList.remove('is-tilting');
          if (!moon.isDragging) {
            moon.style.transform = '';
            moon.classList.remove('is-interacting');
          }
        }
      }
    });
  }

  /* ---------- Boot: wait for the loading screen to lift ---------- */
  function start() {
    tagAll();
    watchGrids();
    initParallax();
    initTilt();
    initCounters();
    initMoonInteractivity();
  }
  function boot() {
    if (document.getElementById('luno-loader')) {
      var fallback = setTimeout(start, 4200);
      window.addEventListener('luno:loader-done', function () {
        clearTimeout(fallback);
        start();
      }, { once: true });
    } else {
      start();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
