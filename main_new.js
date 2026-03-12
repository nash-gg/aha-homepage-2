console.log("Website environment initialized successfully!");

document.addEventListener('DOMContentLoaded', () => {
  // Using GSAP from CDN, available globally
  gsap.registerPlugin(ScrollTrigger);
  // Topbar and Hero Height adjustments
  const mainHeader = document.querySelector('header');
  const stickyHeader = document.querySelector('.sticky-header');


  const adjustHeroHeight = () => {
    const topbar = document.querySelector('.topbar');
    let offset = 0;
    if (topbar) offset += topbar.offsetHeight;
    if (mainHeader) offset += mainHeader.offsetHeight;
    document.documentElement.style.setProperty('--header-offset', `${offset}px`);
  };



  window.addEventListener('resize', adjustHeroHeight);
  adjustHeroHeight();

  // --- Hero Visuals Entrance Animation ---
  const heroBg = document.querySelector('.hero-visuals-bg');
  const speaker = document.querySelector('.visual-item.speaker');
  const floatingItems = document.querySelectorAll('.visual-item.floating');

  if (heroBg || speaker || floatingItems.length > 0) {
    const tl = gsap.timeline({ delay: 0.1 });

    // 1. BG Entrance
    if (heroBg) {
      tl.fromTo(heroBg,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }

    // 2. Speaker Entrance
    if (speaker) {
      tl.fromTo(speaker,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        },
        "-=0.2"
      );
    }

    // 3. Floating Elements Entrance (Staggered)
    if (floatingItems.length > 0) {
      tl.fromTo(floatingItems,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.2)"
        },
        "-=0.2"
      );
    }
  }

  // --- Logo Scale Animation ---



  // Sticky Stacking Cards Logic
  const initStackingCards = (cardSelector, activeClass, inactiveClass, stickyTop, immediateTransition = false) => {
    const cards = document.querySelectorAll(cardSelector);
    if (cards.length === 0) return;

    cards.forEach((card, i) => {
      card.style.zIndex = i + 1;

      // Use ScrollTrigger to smoothly scale down the "past" card
      // as the "upcoming" card approaches its sticky position.
      if (i < cards.length - 1) {
        const nextCard = cards[i + 1];
        const cardHeight = card.offsetHeight;

        // Use the current card as trigger if immediateTransition is true
        const triggerEl = immediateTransition ? card : nextCard;
        const startPoint = immediateTransition ? `top ${stickyTop}px` : `top ${stickyTop + (cardHeight * 0.5)}px`;

        gsap.to(card, {
          scale: 0.8,
          opacity: 0,
          scrollTrigger: {
            trigger: triggerEl,
            start: startPoint,
            endTrigger: nextCard,
            end: `top ${stickyTop}px`,
            scrub: true
          }
        });
      }
    });

    const updateActiveCard = () => {
      let activeIndex = -1;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        // A card is considered "active" if it has reached its sticky position
        if (rect.top <= stickyTop + 15) {
          activeIndex = i;
        }
      });

      cards.forEach((card, i) => {
        // Remove all state classes first
        card.classList.remove(activeClass, inactiveClass, 'card--past', 'card--upcoming');

        if (i === activeIndex) {
          card.classList.add(activeClass);
        } else if (i < activeIndex) {
          card.classList.add(inactiveClass);
          card.classList.add('card--past');
        } else {
          card.classList.add(inactiveClass);
          card.classList.add('card--upcoming');
        }

        // Handle dots if they exist
        const dots = card.querySelectorAll('.card-dot');
        dots.forEach((dot, di) => {
          if (di === activeIndex) dot.classList.add('card-dot--active');
          else dot.classList.remove('card-dot--active');
        });
      });
    };
    window.addEventListener('scroll', updateActiveCard, { passive: true });
    updateActiveCard();

    // Refresh ScrollTrigger to ensure calculations are correct after initial load
    ScrollTrigger.refresh();
  };

  // Use 64 for 4rem (16px * 4) and 80 for 5rem (16px * 5)
  initStackingCards('.usecase-card', 'usecase-card--active', 'usecase-card--inactive', 64, true);
  initStackingCards('.testimonial-card', 'testimonial-card--active', 'testimonial-card--inactive', 80, true);

  // --- Custom Illustration Animation for "There's more!" card ---
  const lastUsecaseCard = document.querySelector('.usecase-card[data-index="6"]');
  if (lastUsecaseCard) {
    const moreItems = lastUsecaseCard.querySelectorAll('.more-item');
    const moreMain = lastUsecaseCard.querySelector('.more-main');

    // Initial setup - start slightly off-screen so the motion feels gentle
    gsap.set(moreItems, { y: 400 });
    gsap.set(moreMain, { y: 220 });

    // Single continuous timeline for Rise -> Dispersal without pinning
    const isMobile = window.innerWidth < 768;

    const moreTl = gsap.timeline({
      scrollTrigger: {
        trigger: lastUsecaseCard,
        start: 'top bottom', // Start rising when top of card enters bottom
        end: isMobile ? 'bottom top+=1200' : 'bottom top+=800',
        scrub: isMobile ? 2 : 1.5, // Even more smoothing on mobile
        invalidateOnRefresh: true
      }
    });

    const dispersalLarge = isMobile ? -150 : -280;
    const dispersalSmall = isMobile ? -120 : -220;

    // Rise to center
    moreTl.to([moreItems, moreMain], {
      y: 0,
      stagger: 0.08,
      duration: 1.2,
      ease: 'power2.out'
    })
      // Disperse with screen-size aware values
      .to('.item-1', { y: dispersalLarge, duration: 2, ease: 'power1.out' }, 1.2)
      .to('.item-2', { y: dispersalLarge, duration: 2, ease: 'power1.out' }, 1.3)
      .to('.item-3', { y: dispersalSmall, duration: 2, ease: 'power1.out' }, 1.4)
      .to('.item-4', { y: dispersalSmall, duration: 2, ease: 'power1.out' }, 1.5);
  }

  // --- STICKY HEADER LOGIC ---
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const mainHeaderBottom = mainHeader.offsetHeight + mainHeader.offsetTop;

    // Display sticky header ONLY when the original header is gone AND user scrolls UP
    if (currentScrollY > mainHeaderBottom + 100) {
      if (currentScrollY < lastScrollY) {
        // Scrolling UP - show
        stickyHeader.classList.add('visible');
      } else if (currentScrollY > lastScrollY + 10) {
        // Scrolling DOWN - hide (added 10px threshold to avoid sensitivity issues)
        stickyHeader.classList.remove('visible');
      }
    } else {
      // Near top - hide
      stickyHeader.classList.remove('visible');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });

  // --- THEME & STICKY BG TRANSITIONS ---
  const root = document.documentElement;

  // Zone 0: Hero -> Create
  const trigger0 = document.querySelector('.gradient-transition-hero');
  if (trigger0) {
    gsap.to(root, {
      '--theme-bg': '#1a1a2e',
      '--theme-text': '#ffffff',
      ease: 'none',
      scrollTrigger: { trigger: trigger0, start: 'bottom 95%', end: 'top top', scrub: 1 }
    });
  }

  // Zone 1: Create -> Why Pick
  const trigger1 = document.querySelector('.gradient-transition-what-you-can-create');
  if (trigger1) {
    gsap.to(root, {
      '--theme-1-bg': '#F4F8FF',
      '--theme-1-gradient-start': '#F4F8FF',
      '--theme-text': '#1a1a2e',
      '--theme-text-secondary': '#475569',
      '--theme-card-text': '#1a1a2e',
      '--theme-card-desc': '#64748b',
      '--theme-icon': '#64748b',
      '--theme-cta-bg': '#6d28d9',
      '--theme-cta-text': '#ffffff',
      ease: 'none',
      scrollTrigger: { trigger: trigger1, start: 'center 80%', end: 'center 20%', scrub: 1 }
    });
  }

  // Zone 2: Why Pick -> Testimonials
  const trigger2 = document.querySelector('.gradient-transition-why-pick');
  if (trigger2) {
    gsap.to(root, {
      '--theme-2-bg': '#FFF',
      '--theme-2-gradient-start': '#FFF',
      ease: 'none',
      scrollTrigger: { trigger: trigger2, start: 'center 80%', end: 'center 20%', scrub: 1 }
    });
  }

  // Zone 3: Testimonials -> Distraction
  const trigger3 = document.querySelector('.gradient-transition-testimonials');
  if (trigger3) {
    gsap.to(root, {
      '--theme-3-bg': '#FFE3E9',
      '--theme-3-gradient-start': '#FFE3E9',
      ease: 'none',
      scrollTrigger: { trigger: trigger3, start: 'center 80%', end: 'center 20%', scrub: 1 }
    });
  }

  // Zone 4: Science/Blog -> FAQ
  const trigger4 = document.querySelector('.gradient-transition-blog');
  if (trigger4) {
    gsap.to(root, {
      '--theme-4-bg': '#FFFFFF',
      '--theme-4-gradient-start': '#FFFFFF',
      ease: 'none',
      scrollTrigger: { trigger: trigger4, start: 'center 80%', end: 'center 20%', scrub: 1 }
    });
  }





  // --- UNIFIED REVEAL ANIMATIONS (from "Why pick" to end of page) ---
  const revealConfig = {
    y: 30,
    opacity: 0,
    duration: 0.5,
    ease: "power2.out",
    stagger: 0.1,
    start: "top 85%"
  };

  const setupReveal = (trigger, elements, customConfig = {}) => {
    const triggerEl = document.querySelector(trigger);
    if (!triggerEl) return;

    const config = { ...revealConfig, ...customConfig };
    const els = elements ? triggerEl.querySelectorAll(elements) : [triggerEl];

    if (els.length === 0) return;

    // Set initial state
    gsap.set(els, { y: config.y, opacity: 0 });

    ScrollTrigger.create({
      trigger: triggerEl,
      start: config.start,
      onEnter: () => {
        gsap.to(els, {
          y: 0,
          opacity: 1,
          duration: config.duration,
          stagger: config.stagger,
          ease: config.ease,
          overwrite: 'auto'
        });
      },
      once: true
    });
  };

  // Apply reveals to sections and their matching elements
  setupReveal('.why-pick-header', 'h2, p');
  setupReveal('.why-pick-grid', '.why-pick-card', { stagger: 0.15 });
  setupReveal('.why-pick-cta', '.btn', { stagger: 0.1 });

  setupReveal('.testimonials-header', 'h2');
  setupReveal('.testimonials-list', '.testimonial-card', { stagger: 0.15 });
  setupReveal('.trusted-by', 'p, .trusted-logos img', { stagger: 0.05 });
  setupReveal('.testimonials-cta', '.btn');

  // Distraction section - H2 already has its own character animation
  setupReveal('.distraction-header', '.distraction-cta');
  setupReveal('.distraction-metrics', '.metric-item', { stagger: 0.2 });

  setupReveal('.science-header', 'h2');
  setupReveal('.blog-grid', '.blog-card', { stagger: 0.15 });
  setupReveal('.science-cta', '.btn');

  setupReveal('.faq-header', 'h2, p, .faq-contact');
  setupReveal('.faq-content', '.accordion-item', { stagger: 0.1 });

  setupReveal('.main-footer', '.footer-column, .footer-brand, .footer-bottom > *', { stagger: 0.05, start: "top 95%" });


  // --- "WELCOME TO THE SHOW" ---
  const createMainTitle = document.querySelector('.create-main-title');
  const firstCard = document.querySelector('.usecase-card[data-index="0"]');
  if (createMainTitle && firstCard) {
    const firstCardImageWrap = firstCard.querySelector('.usecase-card__image-wrap');
    const firstCardContent = firstCard.querySelector('.usecase-card__content');
    const firstCardContentEls = firstCardContent ? firstCardContent.children : [];

    // Wrap heading words in spans for staggered word-by-word reveal if needed
    let createWords = createMainTitle.querySelectorAll('.create-h2-word');
    if (createWords.length === 0) {
      const words = createMainTitle.textContent.trim().split(/\s+/);
      createMainTitle.innerHTML = words.map(w => `<span class="create-h2-word" style="display:inline-block">${w}</span>`).join(' ');
      createWords = createMainTitle.querySelectorAll('.create-h2-word');
    }

    const underlineTrigger = createMainTitle.querySelector('.ai-underline-trigger');

    gsap.set(createWords, { y: 28, opacity: 0 });
    gsap.set(firstCardImageWrap, { y: 80, scale: 0.9, opacity: 0 });
    gsap.set(firstCardContentEls, { y: 20, opacity: 0 });

    const welcomeTl = gsap.timeline({ paused: true });
    if (createWords?.length) {
      welcomeTl.to(createWords, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: 'back.out(1.4)',
        overwrite: true
      });
    }

    if (underlineTrigger) {
      welcomeTl.to(underlineTrigger, {
        onStart: () => underlineTrigger.classList.add('ai-underline-active'),
        duration: 0.1
      }, "-=0.2");
    }
    welcomeTl.to(firstCardImageWrap, {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, 0.2);
    welcomeTl.to(firstCardContentEls, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out'
    }, 0.5);

    ScrollTrigger.create({
      trigger: '#what-you-can-create',
      start: 'top 80%',
      onEnter: () => welcomeTl.play(),
      once: true
    });
  }

  // --- DISTRACTION HEADER: scroll-driven per-character opacity ---
  const distractionHeader = document.querySelector('.distraction-header');
  if (distractionHeader) {
    const section = distractionHeader.closest('.distraction-section');
    const h2List = distractionHeader.querySelectorAll('h2');

    // Wrap each character in a span so we can animate opacity per character (works for any text length/content)
    function wrapCharactersInSpans(heading) {
      const text = heading.textContent;
      heading.textContent = '';
      for (const char of text) {
        const span = document.createElement('span');
        span.className = 'distraction-h2-char';
        span.textContent = char;
        span.style.opacity = '0.3';
        heading.appendChild(span);
      }
    }
    h2List.forEach(wrapCharactersInSpans);

    // Reveal non-h2 children (e.g. CTA) when header enters view
    const otherChildren = [...distractionHeader.children].filter(el => el.tagName !== 'H2');
    gsap.set(otherChildren, { y: 30, opacity: 0 });
    ScrollTrigger.create({
      trigger: distractionHeader,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(otherChildren, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
      },
      once: true
    });

    // Scroll-driven opacity: progress 0 when section bottom at 20% from bottom, 1 when section top at top
    ScrollTrigger.create({
      trigger: section || distractionHeader,
      start: 'bottom 80%',
      end: 'top top',
      onUpdate: (self) => {
        const progress = self.progress;
        h2List.forEach(h2 => {
          const chars = h2.querySelectorAll('.distraction-h2-char');
          const N = chars.length;
          chars.forEach((span, i) => {
            const sliceStart = i / N;
            const sliceEnd = (i + 1) / N;
            const localProgress = (progress - sliceStart) / (sliceEnd - sliceStart);
            const t = Math.max(0, Math.min(1, localProgress));
            span.style.opacity = (0.3 + 0.7 * t).toFixed(4);
          });
        });
      }
    });

  }


  // --- INTERACTIVE ELEMENTS ---

  // FAQ Accordion
  const accordionItems = [...document.querySelectorAll('.accordion-item')];

  const plusPath = '<path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"></path>';
  const minusPath = '<path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"></path>';

  const itemMap = accordionItems.map(item => ({
    item,
    header: item.querySelector('.accordion-header'),
    icon: item.querySelector('.accordion-icon')
  }));

  function updateItem(target, active) {
    target.item.classList.toggle('active', active);
    if (target.icon) {
      target.icon.innerHTML = active ? plusPath : minusPath;
    }
  }

  itemMap.forEach(target => {
    if (!target.header) return;

    target.header.addEventListener('click', () => {
      const willOpen = !target.item.classList.contains('active');

      itemMap.forEach(entry => updateItem(entry, false));

      if (willOpen) {
        updateItem(target, true);
      }
    });
  });

  // Metric Counting
  const metrics = document.querySelectorAll('.metric-number');
  metrics.forEach(metric => {
    const target = parseFloat(metric.getAttribute('data-target'));
    const suffix = metric.getAttribute('data-suffix') || '';
    const obj = { value: 0 };
    ScrollTrigger.create({
      trigger: metric,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(obj, {
          value: target,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => {
            const val = target % 1 === 0 ? Math.floor(obj.value) : obj.value.toFixed(1);
            metric.textContent = val + suffix;
          }
        });
      },
      once: true
    });
  });

});
