console.log("Website environment initialized successfully!");

document.addEventListener('DOMContentLoaded', () => {
  // --- Lazy Video Play/Pause via IntersectionObserver ---
  const lazyVideos = document.querySelectorAll('video[loop][muted]')
  if (lazyVideos.length > 0) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => {})
        } else {
          entry.target.pause()
        }
      })
    }, { threshold: 0.25 })

    lazyVideos.forEach(video => videoObserver.observe(video))
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded. Animations disabled.')
    return
  }

  gsap.registerPlugin(ScrollTrigger)

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

    let rafScheduled = false
    const updateActiveCard = () => {
      let activeIndex = -1
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect()
        if (rect.top <= stickyTop + 15) {
          activeIndex = i
        }
      })

      cards.forEach((card, i) => {
        card.classList.remove(activeClass, inactiveClass, 'card--past', 'card--upcoming')

        if (i === activeIndex) {
          card.classList.add(activeClass)
        } else if (i < activeIndex) {
          card.classList.add(inactiveClass)
          card.classList.add('card--past')
        } else {
          card.classList.add(inactiveClass)
          card.classList.add('card--upcoming')
        }

        const dots = card.querySelectorAll('.card-dot')
        dots.forEach((dot, di) => {
          if (di === activeIndex) dot.classList.add('card-dot--active')
          else dot.classList.remove('card-dot--active')
        })
      })
    }
    const onScroll = () => {
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(() => {
        updateActiveCard()
        rafScheduled = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    updateActiveCard()

    // Refresh ScrollTrigger to ensure calculations are correct after initial load
    ScrollTrigger.refresh();
  };

  // Use 64 for 4rem (16px * 4) and 80 for 5rem (16px * 5)
  initStackingCards('.usecase-card', 'usecase-card--active', 'usecase-card--inactive', 64, true);
  initStackingCards('.testimonial-card', 'testimonial-card--active', 'testimonial-card--inactive', 80, true);

  // --- Custom Illustration Animation for "There's more!" card ---
  const lastUsecaseCard = document.querySelector('.usecase-card[data-index="4"]')
  if (lastUsecaseCard) {
    const moreItems = lastUsecaseCard.querySelectorAll('.more-item')
    const moreMain = lastUsecaseCard.querySelector('.more-main')

    const buildMoreTimeline = (opts) => {
      gsap.set(moreItems, { y: 400 })
      gsap.set(moreMain, { y: 220 })

      const moreTl = gsap.timeline({
        scrollTrigger: {
          trigger: lastUsecaseCard,
          start: 'top bottom',
          end: opts.end,
          scrub: opts.scrub,
          invalidateOnRefresh: true
        }
      })

      moreTl.to([moreItems, moreMain], {
        y: 0,
        stagger: 0.08,
        duration: 1.2,
        ease: 'power2.out'
      })
        .to('.item-1', { y: opts.dispersalLarge, duration: 2, ease: 'power1.out' }, 1.2)
        .to('.item-2', { y: opts.dispersalLarge, duration: 2, ease: 'power1.out' }, 1.3)
        .to('.item-3', { y: opts.dispersalSmall, duration: 2, ease: 'power1.out' }, 1.4)
        .to('.item-4', { y: opts.dispersalSmall, duration: 2, ease: 'power1.out' }, 1.5)
    }

    const mm = gsap.matchMedia()
    mm.add('(max-width: 767px)', () => {
      buildMoreTimeline({ end: 'bottom top+=1200', scrub: 2, dispersalLarge: -150, dispersalSmall: -120 })
    })
    mm.add('(min-width: 768px)', () => {
      buildMoreTimeline({ end: 'bottom top+=800', scrub: 1.5, dispersalLarge: -280, dispersalSmall: -220 })
    })
  }

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

    const underlineTrigger = createMainTitle.parentElement.querySelector('.ai-underline-trigger')

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
    h2List.forEach(wrapCharactersInSpans)

    const cachedChars = Array.from(h2List).map(h2 => Array.from(h2.querySelectorAll('.distraction-h2-char')))

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
        const progress = self.progress
        cachedChars.forEach(chars => {
          const N = chars.length
          chars.forEach((span, i) => {
            const sliceStart = i / N
            const sliceEnd = (i + 1) / N
            const localProgress = (progress - sliceStart) / (sliceEnd - sliceStart)
            const t = Math.max(0, Math.min(1, localProgress))
            span.style.opacity = (0.3 + 0.7 * t).toFixed(4)
          })
        })
      }
    });

  }


  // --- INTERACTIVE ELEMENTS ---

  // FAQ Accordion
  const accordionItems = [...document.querySelectorAll('.accordion-item')];

  const minusPath = '<path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"></path>';
  const plusPath = '<path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"></path>';

  const itemMap = accordionItems.map(item => ({
    item,
    header: item.querySelector('.accordion-header'),
    icon: item.querySelector('.accordion-icon')
  }));

  function updateItem(target, active) {
    target.item.classList.toggle('active', active);
    if (target.icon) {
      target.icon.innerHTML = active ? minusPath : plusPath
    }
  }

  itemMap.forEach(target => {
    updateItem(target, target.item.classList.contains('active'))

    if (!target.header) return

    target.header.addEventListener('click', () => {
      const willOpen = !target.item.classList.contains('active')

      itemMap.forEach(entry => updateItem(entry, false))

      if (willOpen) {
        updateItem(target, true)
      }
    })
  })

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
