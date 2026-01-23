'use strict';

const STORAGE_KEYS = {
  theme: 'crm-theme-preference',
  rtl: 'crm-rtl-enabled'
};

const SELECTORS = {
  themeToggle: '[data-theme-toggle]',
  rtlToggle: '[data-rtl-toggle]',
  mobileToggle: '[data-mobile-toggle]',
  mobileNav: '[data-mobile-nav]',
  navLinks: 'a[data-nav-link]',
  lazyImages: 'img[data-lazy]',
  forms: 'form[data-validate]'
};

const ATTRS = {
  theme: 'data-theme',
  rtl: 'data-rtl'
};

function initApp() {
  const root = document.documentElement;
  const body = document.body;

  const initialTheme = getStoredTheme() || getPreferredTheme();
  applyTheme(initialTheme, root);

  const rtlEnabled = getStoredRTL();
  applyRTL(rtlEnabled, body);

  bindThemeToggle(root);
  bindRTLToggles(body);
  bindMobileNavigation();
  initScrollReveal();
  initLazyImages();
  enhanceForms();
  observeHeaderScroll();
}

function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme);
}

function getPreferredTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme, root) {
  root.setAttribute(ATTRS.theme, theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function bindThemeToggle(root) {
  document.querySelectorAll(SELECTORS.themeToggle).forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute(ATTRS.theme) === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, root);
      syncToggleState(toggle, next === 'dark');
    });

    const currentTheme = root.getAttribute(ATTRS.theme);
    syncToggleState(toggle, currentTheme === 'dark');
  });
}

function syncToggleState(toggle, isActive) {
  toggle.setAttribute('aria-pressed', String(isActive));
  const icon = toggle.querySelector('[data-toggle-icon]');
  if (icon) {
    icon.textContent = isActive ? '🌙' : '☀️';
  }
}

function getStoredRTL() {
  return localStorage.getItem(STORAGE_KEYS.rtl) === 'true';
}

function applyRTL(enabled, body) {
  if (enabled) {
    body.setAttribute(ATTRS.rtl, 'true');
  } else {
    body.removeAttribute(ATTRS.rtl);
  }
  localStorage.setItem(STORAGE_KEYS.rtl, String(enabled));
}

function bindRTLToggles(body) {
  document.querySelectorAll(SELECTORS.rtlToggle).forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const isEnabled = body.getAttribute(ATTRS.rtl) === 'true';
      applyRTL(!isEnabled, body);
      toggle.setAttribute('aria-pressed', String(!isEnabled));
    });

    toggle.setAttribute('aria-pressed', String(body.getAttribute(ATTRS.rtl) === 'true'));
  });
}

function bindMobileNavigation() {
  const toggleBtn = document.querySelector(SELECTORS.mobileToggle);
  const mobileNav = document.querySelector(SELECTORS.mobileNav);
  const sidebar = document.querySelector('[data-sidebar]');

  if (!toggleBtn) return;

  const closeNav = () => {
    mobileNav?.classList.remove('open');
    toggleBtn?.setAttribute('aria-expanded', 'false');
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(Boolean(isOpen)));

    if (sidebar) {
      sidebar.classList.toggle('open', Boolean(isOpen));
    }
  });

  document.querySelectorAll(SELECTORS.navLinks).forEach((link) => {
    link.addEventListener('click', () => {
      closeNav();
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      mobileNav?.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      sidebar?.classList.remove('open');
    }
  });
}

function initScrollReveal() {
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

function initLazyImages() {
  const lazyImages = document.querySelectorAll(SELECTORS.lazyImages);
  if (!lazyImages.length) return;

  const loadImage = (img) => {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.src = src;
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          obs.unobserve(entry.target);
        }
      });
    });

    lazyImages.forEach((img) => observer.observe(img));
  } else {
    lazyImages.forEach(loadImage);
  }
}

function enhanceForms() {
  document.querySelectorAll(SELECTORS.forms).forEach((form) => {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        showFormErrors(form);
      } else {
        form.classList.add('is-loading');
        setTimeout(() => {
          form.classList.remove('is-loading');
        }, 1200);
      }
    });

    form.querySelectorAll('input, textarea, select').forEach((field) => {
      field.addEventListener('input', () => clearFieldError(field));
      field.addEventListener('blur', () => validateField(field));
    });
  });
}

function showFormErrors(form) {
  form.querySelectorAll('input, textarea, select').forEach((field) => validateField(field));
}

function validateField(field) {
  const errorTarget = field.closest('.input-group')?.querySelector('.form-error');
  if (!errorTarget) return;

  if (!field.checkValidity()) {
    field.classList.add('is-invalid');
    const message = field.validationMessage || getCustomMessage(field);
    errorTarget.textContent = message;
  } else {
    clearFieldError(field);
  }
}

function clearFieldError(field) {
  field.classList.remove('is-invalid');
  const errorTarget = field.closest('.input-group')?.querySelector('.form-error');
  if (errorTarget) {
    errorTarget.textContent = '';
  }
}

function getCustomMessage(field) {
  if (field.type === 'email') {
    return 'Please enter a valid email address.';
  }
  if (field.name && field.name.toLowerCase().includes('password')) {
    return 'Password must be at least 8 characters including a number.';
  }
  if (field.required) {
    return 'This field is required.';
  }
  return 'Please check this field.';
}

function observeHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const shadowClass = 'scrolled';
  const updateHeaderShadow = () => {
    if (window.scrollY > 40) {
      header.classList.add(shadowClass);
    } else {
      header.classList.remove(shadowClass);
    }
  };

  document.addEventListener('scroll', updateHeaderShadow, { passive: true });
  updateHeaderShadow();
}

window.addEventListener('DOMContentLoaded', initApp);
