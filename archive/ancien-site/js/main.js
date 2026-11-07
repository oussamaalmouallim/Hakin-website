/* ═══════════════════════════════════════════════
   HAKIM AL MOUALLIM — main.js
   Animations, scroll effects, 3D tilt, counters
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. LOADER ──────────────────────────────── */
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
    triggerHeroReveals();
  }, 1800);
  document.body.style.overflow = 'hidden';


  /* ── 2. NAVBAR scroll behavior ──────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });


  /* ── 3. MOBILE MENU ─────────────────────────── */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  const mobLinks = document.querySelectorAll('.mob-link');

  burger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobLinks.forEach(l => l.addEventListener('click', () => mobileMenu.classList.remove('open')));


  /* ── 4. HERO REVEALS ────────────────────────── */
  function triggerHeroReveals() {
    document.querySelectorAll('.hero .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('active'), i * 120);
    });
  }


  /* ── 5. SCROLL REVEAL (Intersection Observer) ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));


  /* ── 6. COUNTER ANIMATION ───────────────────── */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }


  /* ── 7. 3D TILT on hero card ────────────────── */
  const heroCard = document.getElementById('heroCard');
  if (heroCard) {
    heroCard.parentElement.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const rotX = -dy * 8;
      const rotY = dx * 8;
      heroCard.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(${Math.sin(Date.now()/1000)*8}px)`;
    });
    heroCard.parentElement.addEventListener('mouseleave', () => {
      heroCard.style.transform = '';
    });
  }


  /* ── 8. PARALLAX on scroll ──────────────────── */
  const heroBg = document.querySelector('.hero-bg-grid');
  window.addEventListener('scroll', () => {
    if (heroBg) {
      heroBg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    }

    // Subtle parallax on cat visuals
    document.querySelectorAll('.cat-visual').forEach(el => {
      const rect = el.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const offset = (rect.top + rect.height / 2 - center) * 0.06;
      el.querySelector('.cat-img-wrap.main').style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });


  /* ── 9. SMOOTH SCROLL for nav links ─────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
        window.scrollTo({
          top: target.offsetTop - navH,
          behavior: 'smooth'
        });
      }
    });
  });


  /* ── 10. CONTACT FORM SUBMIT ────────────────── */
  window.handleSubmit = function(e) {
    e.preventDefault();
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');

    // Get values for WhatsApp pre-fill
    const name = form.querySelector('input[type="text"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const category = form.querySelector('select').value;
    const message = form.querySelector('textarea').value;

    const waMsg = encodeURIComponent(
      `Bonjour Hakim ! Je m'appelle ${name} (${phone}).\nCatégorie: ${category}\n${message}`
    );

    // Animate form out
    form.style.opacity = '0';
    form.style.transform = 'translateY(-10px)';
    form.style.transition = 'all 0.4s ease';

    setTimeout(() => {
      form.style.display = 'none';
      success.style.display = 'block';
      success.style.opacity = '0';
      success.style.transition = 'opacity 0.4s ease';
      setTimeout(() => success.style.opacity = '1', 50);

      // Update WhatsApp link with message
      const waBtn = success.querySelector('.btn-dark');
      if (waBtn) waBtn.href = `https://wa.me/212625490034?text=${waMsg}`;
    }, 400);
  };


  /* ── 11. BRAND CARDS hover stagger ──────────── */
  document.querySelectorAll('.brand-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 30}ms`;
  });


  /* ── 12. CATEGORY CARDS tilt ─────────────────── */
  document.querySelectorAll('.testi-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      card.style.transform = `translateY(-4px) perspective(600px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});
