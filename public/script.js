const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

const quoteSlider = document.querySelector('[data-quote-slider]');
if (quoteSlider) {
  const quoteSlides = [...quoteSlider.querySelectorAll('.quote-slide')];
  const dotsWrap = quoteSlider.querySelector('.quote-dots');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTOPLAY_MS = 7000;
  let activeQuote = 0;
  let timer = null;

  const dots = quoteSlides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'quote-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `${index + 1}. alıntı`);
    dot.addEventListener('click', () => {
      showQuote(index);
      restart();
    });
    dotsWrap.append(dot);
    return dot;
  });

  function showQuote(index) {
    activeQuote = (index + quoteSlides.length) % quoteSlides.length;
    quoteSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeQuote;
      slide.hidden = !isActive;
      slide.classList.toggle('is-active', isActive);
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeQuote;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.tabIndex = isActive ? 0 : -1;
    });
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    if (reduceMotion) return;
    timer = window.setInterval(() => showQuote(activeQuote + 1), AUTOPLAY_MS);
  }

  quoteSlider.querySelector('.quote-arrow--prev').addEventListener('click', () => {
    showQuote(activeQuote - 1);
    restart();
  });
  quoteSlider.querySelector('.quote-arrow--next').addEventListener('click', () => {
    showQuote(activeQuote + 1);
    restart();
  });

  // Klavye: sol/sağ ok tuşları
  quoteSlider.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showQuote(activeQuote + (event.key === 'ArrowRight' ? 1 : -1));
    restart();
  });

  // Dokunmatik: yatay kaydırma
  let touchStartX = null;
  quoteSlider.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  quoteSlider.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) {
      showQuote(activeQuote + (delta < 0 ? 1 : -1));
      restart();
    }
    touchStartX = null;
  }, { passive: true });

  // Üzerine gelince / odaklanınca dursun, sekme arka plandayken boşa dönmesin
  quoteSlider.addEventListener('pointerenter', stop);
  quoteSlider.addEventListener('focusin', stop);
  quoteSlider.addEventListener('pointerleave', restart);
  quoteSlider.addEventListener('focusout', (event) => {
    if (!quoteSlider.contains(event.relatedTarget)) restart();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else restart();
  });

  showQuote(0);
  restart();
}

if (menuButton && navigation) {
  const menuLabel = menuButton.querySelector('.sr-only');

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = 'Menüyü aç';
    navigation.classList.remove('is-open');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    if (menuLabel) menuLabel.textContent = isOpen ? 'Menüyü aç' : 'Menüyü kapat';
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  navigation.querySelector('.mobile-nav-backdrop')?.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('is-visible'));
}

// İletişim formu
// Form, aynı domaindeki Vercel Function üzerinden Resend'e iletilir.
// API anahtarı yalnızca sunucu ortamında tutulur; tarayıcıya gönderilmez.
const FORM_ENDPOINT = '/api/contact';

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const submitButton = contactForm.querySelector('.form-submit');

  const setStatus = (message, state) => {
    let status = contactForm.querySelector('.form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status';
      status.setAttribute('role', 'status');
      contactForm.append(status);
    }
    status.textContent = message;
    if (state) status.dataset.state = state; else delete status.dataset.state;
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Bal küpü: bot doldurursa sessizce yok say
    if (contactForm.elements._gotcha && contactForm.elements._gotcha.value) return;

    const data = new FormData(contactForm);
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      preference: data.get('preference'),
      topic: data.get('topic'),
      message: data.get('message'),
      consent: data.get('consent') === 'evet',
      website: data.get('_gotcha')
    };

    submitButton.setAttribute('aria-busy', 'true');
    setStatus('Gönderiliyor…');

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || response.status);
      contactForm.reset();
      setStatus(result.message || 'Mesajınız iletildi. En kısa sürede size dönüş yapacağım.');
    } catch (error) {
      setStatus(error.message || 'Mesaj gönderilemedi. Lütfen psk.selinunal@gmail.com adresine yazın.', 'error');
    } finally {
      submitButton.removeAttribute('aria-busy');
    }
  });
}

// Destek alanı etiketleri: tıklanınca konu alanını doldurur
const topicPills = document.querySelectorAll('.topic-pill');
const subjectField = document.querySelector('[data-subject-field]');
if (topicPills.length && subjectField) {
  topicPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      subjectField.value = pill.dataset.topic || pill.textContent.trim();
      window.setTimeout(() => subjectField.focus({ preventScroll: true }), 600);
    });
  });
}

// Künye sayıları: görünür olunca kısa bir sayma animasyonu
const counters = document.querySelectorAll('.stat strong[data-count-to]');
if (counters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const runCount = (el) => {
    const target = Number(el.dataset.countTo);
    const suffix = el.dataset.countSuffix || '';
    const duration = 900;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      runCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));
}

// Header gölgesi yalnızca sayfa kaydırıldığında görünsün
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const syncHeaderScroll = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  syncHeaderScroll();
  window.addEventListener('scroll', syncHeaderScroll, { passive: true });
}
