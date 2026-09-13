(function () {
  'use strict';

  var STORAGE_KEY = 'portfolio-lang';
  var SUPPORTED = ['pt', 'en', 'es', 'fr', 'de'];
  var DEFAULT = 'pt';

  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    return stored && SUPPORTED.indexOf(stored) !== -1 ? stored : DEFAULT;
  }

  function setLang(locale) {
    if (SUPPORTED.indexOf(locale) === -1) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'pt' ? 'pt-PT' : locale;
    applyTranslations(locale);
    updateSwitcher(locale);
  }

  function getNested(obj, key) {
    var parts = key.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length && cur != null; i++) cur = cur[parts[i]];
    return cur;
  }

  function applyTranslations(locale) {
    var t = window.PORTFOLIO_I18N && window.PORTFOLIO_I18N[locale];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = getNested(t, key);
      if (value == null) return;
      if (el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(function (part) {
        var p = part.trim().split(':');
        var attr = p[0];
        var key = p[1];
        var value = getNested(t, key);
        if (value != null) el.setAttribute(attr, value);
      });
    });
  }

  function updateSwitcher(locale) {
    document.querySelectorAll('.lang-switcher [data-lang]').forEach(function (btn) {
    var lang = btn.getAttribute('data-lang');
    btn.setAttribute('aria-current', lang === locale ? 'true' : null);
    btn.classList.toggle('is-active', lang === locale);
    });
  }

  function renderLangSwitcher() {
    var container = document.querySelector('.lang-switcher');
    if (!container) return;
    var labels = { pt: 'PT', en: 'EN', es: 'ES', fr: 'FR', de: 'DE' };
    container.innerHTML = '';
    SUPPORTED.forEach(function (locale) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn';
      btn.setAttribute('data-lang', locale);
      btn.setAttribute('aria-label', locale.toUpperCase());
      btn.textContent = labels[locale];
      btn.addEventListener('click', function () { setLang(locale); });
      container.appendChild(btn);
    });
    updateSwitcher(getLang());
  }

  function init() {
    var locale = getLang();
    document.documentElement.lang = locale === 'pt' ? 'pt-PT' : locale;
    renderLangSwitcher();
    applyTranslations(locale);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.portfolioI18n = { setLang: setLang, getLang: getLang };
})();
