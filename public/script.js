(() => {
  'use strict';

  const API_BASE = window.location.origin;
  const STORAGE_KEY = 'ahl-theme';

  // ===== Theme Toggle =====
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private browsing)
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    if (stored) {
      if (stored === 'light') html.classList.add('light');
      return;
    }
    // No stored preference — check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      html.classList.add('light');
    }
  }

  initTheme();

  if (toggle) {
    toggle.addEventListener('click', () => {
      html.classList.toggle('light');
      const isLight = html.classList.contains('light');
      setStoredTheme(isLight ? 'light' : 'dark');
    });
  }

  // ===== JSON Syntax Highlighter =====
  function highlightJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="json-key">$1</span>:'
    ).replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="json-string">$1</span>'
    ).replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      ': <span class="json-number">$1</span>'
    ).replace(
      /:\s*(true|false)/g,
      ': <span class="json-bool">$1</span>'
    ).replace(
      /:\s*(null)/g,
      ': <span class="json-null">$1</span>'
    );
  }

  function highlightStaticJSON(text) {
    // For static sample JSON in code blocks
    return text.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="json-key">$1</span>:'
    ).replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="json-string">$1</span>'
    ).replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      ': <span class="json-number">$1</span>'
    ).replace(
      /:\s*(true|false)/g,
      ': <span class="json-bool">$1</span>'
    ).replace(
      /:\s*(null)/g,
      ': <span class="json-null">$1</span>'
    );
  }

  // ===== Highlight static sample JSON on load =====
  document.querySelectorAll('[data-sample-json]').forEach((el) => {
    const raw = el.textContent.trim();
    el.innerHTML = highlightStaticJSON(raw);
  });

  // ===== Copy to Clipboard =====
  function getCopyText(copyBtn) {
    // Find the nearest code element (sibling pre > code or direct parent)
    const codeBlock = copyBtn.closest('.code-block');
    if (codeBlock) {
      const code = codeBlock.querySelector('code');
      if (code) return code.textContent;
    }
    // Try It response
    const responseBody = copyBtn.closest('.try-response');
    if (responseBody) {
      const code = responseBody.querySelector('code');
      if (code) return code.textContent;
    }
    // Response header copy
    const resp = copyBtn.closest('.response-header');
    if (resp) {
      const pre = resp.parentElement.querySelector('code');
      if (pre) return pre.textContent;
    }
    return '';
  }

  function flashCopied(btn) {
    const label = btn.querySelector('.copy-label');
    if (label) label.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => {
      if (label) label.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  }

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = getCopyText(btn);
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text.trim());
        flashCopied(btn);
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        flashCopied(btn);
      }
    });
  });

  // ===== Try It Live =====
  const tryBtns = document.querySelectorAll('.try-btn');
  const responseBody = document.querySelector('.response-body code');
  const responseStatus = document.querySelector('.response-status');

  // Date input references
  const inputFields = document.getElementById('inputFields');
  const inputYear = document.getElementById('inputYear');
  const inputMonth = document.getElementById('inputMonth');
  const inputDay = document.getElementById('inputDay');

  // Track which endpoint is currently active
  let activeEndpoint = '/api';

  // Pre-fill year with current year on page load
  if (inputYear) {
    inputYear.value = new Date().getFullYear();
  }

  function showInputs() {
    if (inputFields) inputFields.classList.remove('hidden');
  }

  function hideAndClearInputs() {
    if (inputFields) inputFields.classList.add('hidden');
    if (inputYear) inputYear.value = '';
    if (inputMonth) inputMonth.value = '';
    if (inputDay) inputDay.value = '';
  }

  function buildApiUrl() {
    const params = new URLSearchParams();
    if (inputYear && inputYear.value !== '') params.set('year', inputYear.value);
    if (inputMonth && inputMonth.value !== '') params.set('month', inputMonth.value);
    if (inputDay && inputDay.value !== '') params.set('day', inputDay.value);
    const qs = params.toString();
    return qs ? '/api?' + qs : '/api';
  }

  function setActiveEndpoint(endpoint) {
    activeEndpoint = endpoint;
    tryBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.endpoint === endpoint);
    });
  }

  async function fetchEndpoint(endpoint) {
    setActiveEndpoint(endpoint);

    // Show inputs only for /api; hide and clear for /api/today, /api/tomorrow
    if (endpoint === '/api') {
      showInputs();
    } else {
      hideAndClearInputs();
    }

    // Build URL: /api uses input params, others do not
    var url;
    if (endpoint === '/api') {
      url = API_BASE + buildApiUrl();
    } else {
      url = API_BASE + endpoint;
    }

    if (responseStatus) responseStatus.textContent = 'Fetching...';
    if (responseBody) responseBody.innerHTML = 'Loading...';

    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (responseStatus) responseStatus.textContent = res.status + ' ' + res.statusText;
        if (responseBody) responseBody.innerHTML = '<span class="json-null">Error: ' + res.status + ' ' + res.statusText + '</span>';
        return;
      }
      const data = await res.json();
      if (responseStatus) responseStatus.textContent = '200 OK';
      if (responseBody) responseBody.innerHTML = highlightJSON(data);
    } catch (err) {
      if (responseStatus) responseStatus.textContent = 'Error';
      if (responseBody) responseBody.innerHTML = '<span class="json-null">Error: Unable to reach API. ' + (err.message || '') + '</span>';
    }
  }

  tryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fetchEndpoint(btn.dataset.endpoint);
    });
  });

  // Reactive inputs: changing year/month/day auto-refetches when /api is active
  [inputYear, inputMonth, inputDay].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => {
      if (activeEndpoint === '/api') {
        fetchEndpoint('/api');
      }
    });
  });

  // CTA buttons scroll to Try It and trigger
  document.querySelectorAll('.cta-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = document.getElementById('try-it');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      fetchEndpoint(btn.dataset.endpoint);
    });
  });

})();
