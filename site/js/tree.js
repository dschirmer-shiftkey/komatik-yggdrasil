/**
 * tree.js — SVG World Tree scroll animation
 *
 * Uses GSAP ScrollTrigger to progressively draw the background tree
 * as the user scrolls. The trunk grows first, then branches extend,
 * then category nodes appear, then crown hints fade in.
 */

(function () {
  gsap.registerPlugin(ScrollTrigger);

  function preparePath(el) {
    if (!el) return;
    const length = el.getTotalLength();
    el.style.strokeDasharray = length;
    el.style.strokeDashoffset = length;
  }

  function drawPath(selector, scrollConfig) {
    const el = document.querySelector(selector);
    if (!el) return;
    preparePath(el);
    const length = el.getTotalLength();

    gsap.fromTo(el,
      { strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollConfig.trigger || 'body',
          start: scrollConfig.start || 'top top',
          end: scrollConfig.end || 'bottom bottom',
          scrub: 1.5,
        },
      }
    );
  }

  function fadeIn(selector, scrollConfig) {
    const el = document.querySelector(selector);
    if (!el) return;

    gsap.to(el, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: scrollConfig.trigger || 'body',
        start: scrollConfig.start || 'top center',
        toggleActions: 'play none none reverse',
      },
    });
  }

  function pulseNode(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    gsap.to(el, {
      opacity: 1,
      scale: 1.3,
      transformOrigin: 'center center',
      duration: 1.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      scrollTrigger: {
        trigger: '#world-tree-section',
        start: 'top 80%',
        toggleActions: 'play pause resume pause',
      },
    });
  }

  function init() {
    // Prepare all paths
    document.querySelectorAll('#world-tree path').forEach(preparePath);

    // Activate tree container
    const container = document.getElementById('tree-container');
    if (container) container.classList.add('active');

    // Seed appears
    gsap.to('#seed', {
      opacity: 1, scale: 1.2, transformOrigin: 'center center',
      duration: 1, delay: 0.8, ease: 'power2.out',
    });

    // Trunk
    drawPath('#trunk', { trigger: '#story', start: 'top 90%', end: 'bottom 20%' });

    // Branch: Basic Needs
    drawPath('#branch-basic-needs', { trigger: '#world-tree-section', start: 'top 80%', end: 'top 30%' });
    ['#twig-energy','#twig-housing','#twig-hunger','#twig-water','#twig-health'].forEach((id, i) => {
      drawPath(id, { trigger: '#world-tree-section', start: `top ${70-i*5}%`, end: `top ${40-i*5}%` });
    });
    ['#node-energy','#node-housing','#node-hunger','#node-water','#node-health'].forEach((id, i) => {
      fadeIn(id, { trigger: '#world-tree-section', start: `top ${60-i*5}%` });
    });

    // Branch: Human Growth
    drawPath('#branch-human-growth', { trigger: '#world-tree-section', start: 'top 70%', end: 'top 20%' });
    ['#twig-education','#twig-economic','#twig-equality'].forEach((id, i) => {
      drawPath(id, { trigger: '#world-tree-section', start: `top ${60-i*5}%`, end: `top ${30-i*5}%` });
    });
    ['#node-education','#node-economic','#node-equality'].forEach((id, i) => {
      fadeIn(id, { trigger: '#world-tree-section', start: `top ${50-i*5}%` });
    });

    // Branch: Planet & Life
    drawPath('#branch-planet-life', { trigger: '#world-tree-section', start: 'top 60%', end: 'top 10%' });
    ['#twig-climate','#twig-oceans','#twig-ecosystems'].forEach((id, i) => {
      drawPath(id, { trigger: '#world-tree-section', start: `top ${50-i*5}%`, end: `top ${20-i*5}%` });
    });
    ['#node-climate','#node-oceans','#node-ecosystems'].forEach((id, i) => {
      fadeIn(id, { trigger: '#world-tree-section', start: `top ${40-i*5}%` });
    });

    // Branch: Society & Systems
    drawPath('#branch-society-systems', { trigger: '#world-tree-section', start: 'top 50%', end: 'center center' });
    ['#twig-peace','#twig-community','#twig-digital'].forEach((id, i) => {
      drawPath(id, { trigger: '#world-tree-section', start: `top ${40-i*5}%`, end: `top ${10-i*5}%` });
    });
    ['#node-peace','#node-community','#node-digital'].forEach((id, i) => {
      fadeIn(id, { trigger: '#world-tree-section', start: `top ${30-i*5}%` });
    });

    // Crown hints
    ['#crown-left','#crown-right','#crown-center'].forEach((id) => {
      drawPath(id, { trigger: '#knowledge-flow', start: 'top 80%', end: 'top 30%' });
    });

    // Active seed pulses
    pulseNode('#seed-001');
    pulseNode('#seed-002');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
