/* Print button on the CV page. */
(function () {
  'use strict';
  var print = document.querySelector('[data-print]');
  if (!print || !window.print) return;
  print.hidden = false;
  print.addEventListener('click', function () { window.print(); });
})();

/* Light / dark theme switch. The choice is remembered on this device. */
(function () {
  'use strict';
  var root = document.documentElement;
  var button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  function current() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  button.hidden = false;
  button.setAttribute('aria-pressed', current() === 'dark');
  button.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    button.setAttribute('aria-pressed', next === 'dark');
    try { localStorage.setItem('theme', next); } catch (error) { /* private browsing */ }
    document.dispatchEvent(new Event('themechange'));
  });
})();
