/* ==========================================================================
   HUGH MAGUIRE BUTCHERS & SMOKEHOUSE — script.js
   Vanilla JS only. No frameworks, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initPreloader();
    initHeaderScroll();
    initMobileNav();
    initSmoothAnchors();
    initRevealOnScroll();
    initCounters();
    initTimeline();
    initTestimonialSlider();
    initGalleryLightbox();
    initBackToTop();
    initFooterYear();
    initBrochurePlaceholder();
  });

  /* ---------------------------------------------------------------------
     PRELOADER — fades out once the page (and images) have settled
  --------------------------------------------------------------------- */
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;
    var done = false;
    function hide() {
      if (done) return;
      done = true;
      preloader.classList.add('loaded');
      setTimeout(function () { preloader.style.display = 'none'; }, 700);
    }
    window.addEventListener('load', function () { setTimeout(hide, 350); });
    // Safety net in case load event is delayed by slow external images
    setTimeout(hide, 2500);
  }

  /* ---------------------------------------------------------------------
     STICKY NAV — solid background once the hero has been scrolled past
  --------------------------------------------------------------------- */
  function initHeaderScroll() {
    var header = document.getElementById('site-header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
     MOBILE NAV TOGGLE
  --------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------------------------------------------------------------
     SMOOTH SCROLL for in-page anchors (works alongside CSS scroll-behavior,
     but keeps focus management sane for accessibility)
  --------------------------------------------------------------------- */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------------------------------------------------------------------
     REVEAL ON SCROLL — fade/slide elements up into view once
  --------------------------------------------------------------------- */
  function initRevealOnScroll() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     ANIMATED COUNTERS — stat strip numbers count up once visible
  --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('.stat-num[data-count]');
    if (!counters.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) {
        el.textContent = target.toLocaleString('en-IE') + suffix;
        return;
      }
      var duration = 1400;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var value = Math.floor(eased * target);
        el.textContent = value.toLocaleString('en-IE') + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-IE') + suffix;
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     TIMELINE — click a node to reveal its panel
  --------------------------------------------------------------------- */
  function initTimeline() {
    var nodes = document.querySelectorAll('.timeline-node');
    var panels = document.querySelectorAll('.timeline-panel');
    if (!nodes.length || !panels.length) return;

    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var year = node.getAttribute('data-year');

        nodes.forEach(function (n) {
          n.classList.remove('active');
          n.setAttribute('aria-expanded', 'false');
        });
        node.classList.add('active');
        node.setAttribute('aria-expanded', 'true');

        panels.forEach(function (panel) {
          panel.classList.toggle('active', panel.getAttribute('data-panel') === year);
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     TESTIMONIAL SLIDER — auto-rotate, dot navigation, pause on hover
  --------------------------------------------------------------------- */
  function initTestimonialSlider() {
    var slider = document.querySelector('.testimonial-slider');
    if (!slider) return;
    var slides = slider.querySelectorAll('.testimonial');
    var dotsWrap = slider.querySelector('.testimonial-dots');
    if (!slides.length || !dotsWrap) return;

    var current = 0;
    var interval = null;
    var AUTO_MS = 6500;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 't-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('.t-dot');

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function next() { goTo(current + 1); }

    function start() {
      if (reduceMotion) return;
      interval = setInterval(next, AUTO_MS);
    }
    function stop() { clearInterval(interval); }
    function restart() { stop(); start(); }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
  }

  /* ---------------------------------------------------------------------
     GALLERY LIGHTBOX
  --------------------------------------------------------------------- */
  function initGalleryLightbox() {
    var items = document.querySelectorAll('.masonry-item');
    var lightbox = document.getElementById('lightbox');
    if (!items.length || !lightbox) return;

    var imgEl = lightbox.querySelector('.lightbox-img');
    var captionEl = lightbox.querySelector('.lightbox-caption');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var prevBtn = lightbox.querySelector('.lightbox-prev');
    var nextBtn = lightbox.querySelector('.lightbox-next');
    var current = 0;
    var lastFocused = null;

    var images = Array.prototype.map.call(items, function (item) {
      var img = item.querySelector('img');
      return { src: img ? img.currentSrc || img.src : '', label: item.getAttribute('data-label') || '' };
    });

    function open(index) {
      current = index;
      show(current);
      lastFocused = document.activeElement;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function show(index) {
      var data = images[index];
      imgEl.src = data.src;
      imgEl.alt = data.label;
      captionEl.textContent = data.label;
    }

    function close() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    function prev() { current = (current - 1 + images.length) % images.length; show(current); }
    function next() { current = (current + 1) % images.length; show(current); }

    items.forEach(function (item, i) {
      item.addEventListener('click', function () { open(i); });
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', 'View image: ' + (item.getAttribute('data-label') || 'gallery photo'));
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  /* ---------------------------------------------------------------------
     BACK TO TOP
  --------------------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    function onScroll() {
      if (window.scrollY > 600) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------
     FOOTER YEAR
  --------------------------------------------------------------------- */
  function initFooterYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     BROCHURE PLACEHOLDER NOTICES
     Each replaced once its real PDF is added to assets/documents/ and the
     matching href below is updated in index.html.
  --------------------------------------------------------------------- */
  function initBrochurePlaceholder() {
    var brochures = {
      'brochure-deli': 'Delicatessen brochure coming soon. Add the PDF to assets/documents/ and update the link in index.html.',
      'brochure-hospitality': 'Hotel & Restaurant brochure coming soon. Add the PDF to assets/documents/ and update the link in index.html.',
      'brochure-beef': 'Dry Aged Beef brochure coming soon. Add the PDF to assets/documents/ and update the link in index.html.'
    };
    Object.keys(brochures).forEach(function (id) {
      var link = document.getElementById(id);
      if (!link) return;
      link.addEventListener('click', function (e) {
        if (link.getAttribute('href') === '#') {
          e.preventDefault();
          alert(brochures[id]);
        }
      });
    });
  }

})();
