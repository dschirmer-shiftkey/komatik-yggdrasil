/**
 * sections.js — Content reveal animations
 *
 * Fades in content sections and the hero as the user scrolls.
 * Uses GSAP ScrollTrigger for scroll-bound reveals.
 */

(function () {
  // ── Hero entrance animation ────────────────────────────────────────

  function animateHero() {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.to('.hero-title', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
    })
      .to(
        '.hero-subtitle',
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.6'
      )
      .to(
        '.hero-tagline',
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.4'
      );
  }

  // ── Scroll-triggered reveals ───────────────────────────────────────

  function initReveals() {
    const reveals = document.querySelectorAll('.reveal');

    reveals.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('visible'),
        once: true,
      });
    });
  }

  // ── Background color transition ────────────────────────────────────

  function initBackgroundTransition() {
    // No body-level background transitions — dark sections handle their
    // own backgrounds via .section-dark class. This prevents text from
    // becoming unreadable when body darkens under light-text sections.
  }

  // ── Tree container opacity responds to scroll depth ────────────────

  function initTreeOpacity() {
    // Vine visibility is handled by its own container — no dynamic opacity needed.
  }

  // ── Init ───────────────────────────────────────────────────────────

  function init() {
    animateHero();
    initReveals();
    initBackgroundTransition();
    initTreeOpacity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
