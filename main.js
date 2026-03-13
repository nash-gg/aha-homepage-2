;(function () {
  'use strict'

  // ============================================================
  // UTILITIES
  // ============================================================

  function onReady(fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function rafThrottle(fn) {
    let scheduled = false
    return function () {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        fn()
        scheduled = false
      })
    }
  }

  // ============================================================
  // TOPBAR ACCESS CODE
  // ============================================================

  function initTopbarForm() {
    const btn = document.querySelector('.topbar-btn')
    const input = document.querySelector('.topbar-input')
    if (!btn || !input) return

    const handleJoin = () => {
      const val = input.value.replace(/\s/g, '')
      if (!val) return

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'GoogleAnalyticsEvent',
        eventCategory: 'Landing Site',
        eventAction: 'Header > Join Presentation > User joins a presentation by typing in the access code ' + val
      })

      window.location.href = 'https://audience.ahaslides.com/' + val
    }

    btn.addEventListener('click', handleJoin)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleJoin()
      }
    })
  }

  // ============================================================
  // HEADER SHOW / HIDE
  // ============================================================

  function initHeaderScroll() {
    const header = document.querySelector('.header.navbar-2')
    if (!header) return

    const THRESHOLD = 170
    let lastY = window.scrollY
    let passed = false

    const update = () => {
      const y = window.scrollY
      const up = y < lastY

      if (y <= THRESHOLD) {
        header.classList.remove('header--hidden')
        passed = false
      } else if (!passed) {
        header.classList.add('header--hidden')
        passed = true
      } else if (up) {
        header.classList.remove('header--hidden')
      } else {
        header.classList.add('header--hidden')
      }

      lastY = y
    }

    window.addEventListener('scroll', rafThrottle(update), { passive: true })
  }

  // ============================================================
  // LAZY VIDEO (IntersectionObserver)
  // ============================================================

  function initLazyVideos() {
    const videos = document.querySelectorAll('video[loop][muted]')
    if (!videos.length) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.play().catch(() => {})
        else entry.target.pause()
      })
    }, { threshold: 0.25 })

    videos.forEach(v => observer.observe(v))
  }

  // ============================================================
  // GSAP — guard & register
  // ============================================================

  function gsapAvailable() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded. Animations disabled.')
      return false
    }
    gsap.registerPlugin(ScrollTrigger)
    return true
  }

  // ============================================================
  // HERO ENTRANCE
  // ============================================================

  function initHeroEntrance() {
    const bg = document.querySelector('.hero-visuals-bg')
    const speaker = document.querySelector('.visual-item.speaker')
    const floats = document.querySelectorAll('.visual-item.floating')
    if (!bg && !speaker && !floats.length) return

    const tl = gsap.timeline({ delay: 0.1 })

    if (bg) {
      tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    }
    if (speaker) {
      tl.fromTo(speaker, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2')
    }
    if (floats.length) {
      tl.fromTo(floats,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' },
        '-=0.2'
      )
    }
  }

  // ============================================================
  // STICKY STACKING CARDS
  // ============================================================

  function initStackingCards(cardSelector, activeClass, inactiveClass, stickyTop, immediateTransition) {
    const cards = document.querySelectorAll(cardSelector)
    if (!cards.length) return

    cards.forEach((card, i) => {
      card.style.zIndex = i + 1

      if (i < cards.length - 1) {
        const nextCard = cards[i + 1]
        const cardHeight = card.offsetHeight
        const triggerEl = immediateTransition ? card : nextCard
        const startPoint = immediateTransition
          ? `top ${stickyTop}px`
          : `top ${stickyTop + cardHeight * 0.5}px`

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
        })
      }
    })

    const updateActive = () => {
      let activeIndex = -1
      cards.forEach((card, i) => {
        if (card.getBoundingClientRect().top <= stickyTop + 15) activeIndex = i
      })

      cards.forEach((card, i) => {
        card.classList.remove(activeClass, inactiveClass, 'card--past', 'card--upcoming')

        if (i === activeIndex) {
          card.classList.add(activeClass)
        } else if (i < activeIndex) {
          card.classList.add(inactiveClass, 'card--past')
        } else {
          card.classList.add(inactiveClass, 'card--upcoming')
        }

        card.querySelectorAll('.card-dot').forEach((dot, di) => {
          dot.classList.toggle('card-dot--active', di === activeIndex)
        })
      })
    }

    window.addEventListener('scroll', rafThrottle(updateActive), { passive: true })
    updateActive()
    ScrollTrigger.refresh()
  }

  // ============================================================
  // "THERE'S MORE!" CARD ILLUSTRATION
  // ============================================================

  function initMoreCardAnimation() {
    const card = document.querySelector('.usecase-card[data-index="4"]')
    if (!card) return

    const items = card.querySelectorAll('.more-item')
    const main = card.querySelector('.more-main')

    const build = (opts) => {
      gsap.set(items, { y: 400 })
      gsap.set(main, { y: 220 })

      gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: opts.end,
          scrub: opts.scrub,
          invalidateOnRefresh: true
        }
      })
        .to([items, main], { y: 0, stagger: 0.08, duration: 1.2, ease: 'power2.out' })
        .to('.item-1', { y: opts.dispersalLg, duration: 2, ease: 'power1.out' }, 1.2)
        .to('.item-2', { y: opts.dispersalLg, duration: 2, ease: 'power1.out' }, 1.3)
        .to('.item-3', { y: opts.dispersalSm, duration: 2, ease: 'power1.out' }, 1.4)
        .to('.item-4', { y: opts.dispersalSm, duration: 2, ease: 'power1.out' }, 1.5)
    }

    const mm = gsap.matchMedia()
    mm.add('(max-width: 767px)', () => {
      build({ end: 'bottom top+=1200', scrub: 2, dispersalLg: -150, dispersalSm: -120 })
    })
    mm.add('(min-width: 768px)', () => {
      build({ end: 'bottom top+=800', scrub: 1.5, dispersalLg: -280, dispersalSm: -220 })
    })
  }

  // ============================================================
  // THEME TRANSITIONS (CSS custom properties)
  // ============================================================

  function initThemeTransitions() {
    const root = document.documentElement

    const zones = [
      {
        trigger: '.gradient-transition-hero',
        vars: { '--theme-bg': '#1a1a2e', '--theme-text': '#ffffff' },
        start: 'bottom 95%', end: 'top top'
      },
      {
        trigger: '.gradient-transition-what-you-can-create',
        vars: {
          '--theme-1-bg': '#F4F8FF', '--theme-1-gradient-start': '#F4F8FF',
          '--theme-text': '#1a1a2e', '--theme-text-secondary': '#475569',
          '--theme-card-text': '#1a1a2e', '--theme-card-desc': '#64748b',
          '--theme-icon': '#64748b', '--theme-cta-bg': '#6d28d9', '--theme-cta-text': '#ffffff'
        },
        start: 'center 80%', end: 'center 20%'
      },
      {
        trigger: '.gradient-transition-why-pick',
        vars: { '--theme-2-bg': '#FFF', '--theme-2-gradient-start': '#FFF' },
        start: 'center 80%', end: 'center 20%'
      },
      {
        trigger: '.gradient-transition-testimonials',
        vars: { '--theme-3-bg': '#FFE3E9', '--theme-3-gradient-start': '#FFE3E9' },
        start: 'center 80%', end: 'center 20%'
      },
      {
        trigger: '.gradient-transition-blog',
        vars: { '--theme-4-bg': '#FFFFFF', '--theme-4-gradient-start': '#FFFFFF' },
        start: 'center 80%', end: 'center 20%'
      }
    ]

    zones.forEach(({ trigger, vars, start, end }) => {
      const el = document.querySelector(trigger)
      if (!el) return
      gsap.to(root, { ...vars, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 1 } })
    })
  }

  // ============================================================
  // SCROLL-REVEAL ANIMATIONS
  // ============================================================

  function initRevealAnimations() {
    const defaults = { y: 30, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, start: 'top 85%' }

    const reveal = (trigger, elements, custom) => {
      const triggerEl = document.querySelector(trigger)
      if (!triggerEl) return

      const cfg = { ...defaults, ...custom }
      const els = elements ? triggerEl.querySelectorAll(elements) : [triggerEl]
      if (!els.length) return

      gsap.set(els, { y: cfg.y, opacity: 0 })
      ScrollTrigger.create({
        trigger: triggerEl,
        start: cfg.start,
        onEnter: () => {
          gsap.to(els, { y: 0, opacity: 1, duration: cfg.duration, stagger: cfg.stagger, ease: cfg.ease, overwrite: 'auto' })
        },
        once: true
      })
    }

    reveal('.why-pick-header', 'h2, p')
    reveal('.why-pick-grid', '.why-pick-card', { stagger: 0.15 })
    reveal('.why-pick-cta', '.btn', { stagger: 0.1 })
    reveal('.testimonials-header', 'h2')
    reveal('.testimonials-list', '.testimonial-card', { stagger: 0.15 })
    reveal('.trusted-by', 'p, .trusted-logos img', { stagger: 0.05 })
    reveal('.testimonials-cta', '.btn')
    reveal('.distraction-header', '.distraction-cta')
    reveal('.distraction-metrics', '.metric-item', { stagger: 0.2 })
    reveal('.science-header', 'h2')
    reveal('.blog-grid', '.blog-card', { stagger: 0.15 })
    reveal('.science-cta', '.btn')
    reveal('.faq-header', 'h2, p, .faq-contact')
    reveal('.faq-content', '.accordion-item', { stagger: 0.1 })
    reveal('.main-footer', '.footer-column, .footer-brand, .footer-bottom > *', { stagger: 0.05, start: 'top 95%' })
  }

  // ============================================================
  // "WELCOME TO THE SHOW" — Create section entrance
  // ============================================================

  function initCreateSectionEntrance() {
    const title = document.querySelector('.create-main-title')
    const firstCard = document.querySelector('.usecase-card[data-index="0"]')
    if (!title || !firstCard) return

    const imageWrap = firstCard.querySelector('.usecase-card__image-wrap')
    const contentEls = firstCard.querySelector('.usecase-card__content')?.children || []

    let words = title.querySelectorAll('.create-h2-word')
    if (!words.length) {
      title.innerHTML = title.textContent.trim().split(/\s+/)
        .map(w => `<span class="create-h2-word" style="display:inline-block">${w}</span>`)
        .join(' ')
      words = title.querySelectorAll('.create-h2-word')
    }

    const underline = title.parentElement.querySelector('.ai-underline-trigger')

    gsap.set(words, { y: 28, opacity: 0 })
    gsap.set(imageWrap, { y: 80, scale: 0.9, opacity: 0 })
    gsap.set(contentEls, { y: 20, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    if (words.length) {
      tl.to(words, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'back.out(1.4)', overwrite: true })
    }
    if (underline) {
      tl.to(underline, { onStart: () => underline.classList.add('ai-underline-active'), duration: 0.1 }, '-=0.2')
    }
    tl.to(imageWrap, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.2)
    tl.to(contentEls, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 0.5)

    ScrollTrigger.create({
      trigger: '#what-you-can-create',
      start: 'top 80%',
      onEnter: () => tl.play(),
      once: true
    })
  }

  // ============================================================
  // DISTRACTION HEADER — per-character scroll opacity
  // ============================================================

  function initDistractionHeader() {
    const header = document.querySelector('.distraction-header')
    if (!header) return

    const section = header.closest('.distraction-section')
    const headings = header.querySelectorAll('h2')

    headings.forEach(h2 => {
      const text = h2.textContent
      h2.textContent = ''
      for (const char of text) {
        const span = document.createElement('span')
        span.className = 'distraction-h2-char'
        span.textContent = char
        span.style.opacity = '0.3'
        h2.appendChild(span)
      }
    })

    const charGroups = Array.from(headings).map(h2 =>
      Array.from(h2.querySelectorAll('.distraction-h2-char'))
    )

    const others = [...header.children].filter(el => el.tagName !== 'H2')
    gsap.set(others, { y: 30, opacity: 0 })
    ScrollTrigger.create({
      trigger: header,
      start: 'top 85%',
      onEnter: () => gsap.to(others, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }),
      once: true
    })

    ScrollTrigger.create({
      trigger: section || header,
      start: 'bottom 80%',
      end: 'top top',
      onUpdate: (self) => {
        const progress = self.progress
        charGroups.forEach(chars => {
          const N = chars.length
          chars.forEach((span, i) => {
            const t = Math.max(0, Math.min(1, (progress - i / N) / (1 / N)))
            span.style.opacity = (0.3 + 0.7 * t).toFixed(4)
          })
        })
      }
    })
  }

  // ============================================================
  // FAQ ACCORDION
  // ============================================================

  function initAccordion() {
    const items = [...document.querySelectorAll('.accordion-item')]
    if (!items.length) return

    const MINUS = '<path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128Z"></path>'
    const PLUS = '<path d="M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z"></path>'
    const SWAP_DELAY = 200

    const entries = items.map(item => ({
      item,
      header: item.querySelector('.accordion-header'),
      icon: item.querySelector('.accordion-icon')
    }))

    function setItem(entry, active, animate) {
      const was = entry.item.classList.contains('active')
      entry.item.classList.toggle('active', active)
      if (!entry.icon) return

      const path = active ? MINUS : PLUS
      if (!animate || was === active) {
        entry.icon.innerHTML = path
        return
      }
      setTimeout(() => { entry.icon.innerHTML = path }, SWAP_DELAY)
    }

    entries.forEach(entry => {
      setItem(entry, entry.item.classList.contains('active'), false)

      if (!entry.header) return
      entry.header.addEventListener('click', () => {
        const willOpen = !entry.item.classList.contains('active')
        entries.forEach(e => setItem(e, false, true))
        if (willOpen) setItem(entry, true, true)
      })
    })
  }

  // ============================================================
  // METRIC COUNTER
  // ============================================================

  function initMetricCounters() {
    document.querySelectorAll('.metric-number').forEach(el => {
      const target = parseFloat(el.getAttribute('data-target'))
      const suffix = el.getAttribute('data-suffix') || ''
      const obj = { value: 0 }

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(obj, {
            value: target,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = (target % 1 === 0 ? Math.floor(obj.value) : obj.value.toFixed(1)) + suffix
            }
          })
        },
        once: true
      })
    })
  }

  // ============================================================
  // BOOTSTRAP
  // ============================================================

  onReady(() => {
    // Non-GSAP features
    initTopbarForm()
    initHeaderScroll()
    initLazyVideos()

    // GSAP-dependent features
    if (!gsapAvailable()) return

    initHeroEntrance()
    initStackingCards('.usecase-card', 'usecase-card--active', 'usecase-card--inactive', 64, true)
    initStackingCards('.testimonial-card', 'testimonial-card--active', 'testimonial-card--inactive', 80, true)
    initMoreCardAnimation()
    initThemeTransitions()
    initRevealAnimations()
    initCreateSectionEntrance()
    initDistractionHeader()
    initAccordion()
    initMetricCounters()
  })
})()
