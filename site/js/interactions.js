/**
 * interactions.js — Hover states and category tooltips
 *
 * Handles interactive elements in the World Tree section:
 * - Category items highlight their corresponding SVG node
 * - Active seeds show additional info on hover
 */

(function () {
  function init() {
    initCategoryHovers();
    initSmoothScrollLinks();
  }

  // ── Category hover → SVG node highlight ────────────────────────────

  function initCategoryHovers() {
    const items = document.querySelectorAll('.category-item');

    items.forEach((item) => {
      const category = item.dataset.category;
      if (!category) return;

      const node = document.querySelector(`#node-${category}`);
      if (!node) return;

      item.addEventListener('mouseenter', () => {
        gsap.to(node, {
          stroke: '#c9a94e',
          strokeWidth: 3,
          r: node.tagName === 'circle' ? 8 : undefined,
          duration: 0.3,
          ease: 'power2.out',
        });
        item.style.opacity = '1';
      });

      item.addEventListener('mouseleave', () => {
        const originalColor = getComputedStyle(node).stroke;
        gsap.to(node, {
          stroke: originalColor,
          strokeWidth: parseFloat(node.getAttribute('stroke-width')) || 1.5,
          r: node.tagName === 'circle' ? parseFloat(node.getAttribute('r')) || 5 : undefined,
          duration: 0.3,
          ease: 'power2.out',
        });
        if (!item.classList.contains('active')) {
          item.style.opacity = '';
        }
      });
    });
  }

  // ── Smooth scroll for any anchor links ─────────────────────────────

  function initSmoothScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          gsap.to(window, {
            scrollTo: { y: target, offsetY: 50 },
            duration: 1,
            ease: 'power2.inOut',
          });
        }
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
