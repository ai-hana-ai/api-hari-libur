(() => {
  'use strict';

  const API_BASE = window.location.origin;
  const THEME_KEY = 'ahl-theme';
  const LANG_KEY = 'lang';

  // ===== i18n Translations =====
  const i18n = {
    en: {
      navDocs: 'Docs',
      navTryIt: 'Try It',
      heroTagline: 'Indonesian public holiday API. Simple, fast, free. Query <code>/api</code>, <code>/api/today</code>, or <code>/api/tomorrow</code>.',
      tryItHeading: 'Try It Live',
      labelYear: 'Year',
      labelMonth: 'Month',
      labelDay: 'Day',
      selectYear: 'Select Year',
      selectMonth: 'Select Month',
      selectDay: 'Select Day',
      copy: 'Copy',
      copied: 'Copied',
      defaultResponse: 'Click an endpoint to fetch live data.',
      fetching: 'Fetching...',
      loading: 'Loading...',
      error: 'Error',
      errorUnable: 'Error: Unable to reach API.',
      endpointsHeading: 'Endpoints',
      endpointDesc1: 'Retrieve public holidays. Returns all holidays for a given year, optionally filtered by month and day.',
      endpointDesc2: 'Check if today is a public holiday. Returns holiday status and a list of holidays for the current date.',
      endpointDesc3: 'Check if tomorrow is a public holiday. Same response shape as <code>/api/today</code> but for the next date.',
      queryParams: 'Query Parameters',
      thParam: 'Param',
      thType: 'Type',
      thRequired: 'Required',
      thDescription: 'Description',
      no: 'No',
      yearDesc: 'Year to query. Range: 2011 - current year + 1. Defaults to current year.',
      monthDesc: 'Month filter. Range: 1 - 12.',
      dayDesc: 'Day filter. Range: 1 - 31. Requires <code>month</code> to be set.',
      exampleRequest: 'Example Request',
      exampleResponse: 'Example Response',
      noParamsToday: 'None. Uses the server\'s current date (Asia/Jakarta timezone).',
      noParamsTomorrow: 'None. Uses the server\'s current date + 1 day (Asia/Jakarta timezone).',
      themeToggleLabel: 'Toggle theme',
      langToggleLabel: 'Toggle language',
      langLabel: 'EN',
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    },
    id: {
      navDocs: 'Dokumentasi',
      navTryIt: 'Coba',
      heroTagline: 'API hari libur nasional Indonesia. Simpel, cepat, gratis. Query <code>/api</code>, <code>/api/today</code>, atau <code>/api/tomorrow</code>.',
      tryItHeading: 'Coba Langsung',
      labelYear: 'Tahun',
      labelMonth: 'Bulan',
      labelDay: 'Hari',
      selectYear: 'Pilih Tahun',
      selectMonth: 'Pilih Bulan',
      selectDay: 'Pilih Hari',
      copy: 'Salin',
      copied: 'Tersalin',
      defaultResponse: 'Klik endpoint untuk mengambil data.',
      fetching: 'Memuat...',
      loading: 'Memuat...',
      error: 'Error',
      errorUnable: 'Error: Tidak dapat mencapai API.',
      endpointsHeading: 'Endpoint',
      endpointDesc1: 'Mengambil hari libur. Mengembalikan semua hari libur untuk tahun tertentu, bisa difilter berdasarkan bulan dan hari.',
      endpointDesc2: 'Cek apakah hari ini libur. Mengembalikan status libur dan daftar hari libur untuk tanggal hari ini.',
      endpointDesc3: 'Cek apakah besok libur. Format response sama dengan <code>/api/today</code> tapi untuk tanggal berikutnya.',
      queryParams: 'Parameter Query',
      thParam: 'Parameter',
      thType: 'Tipe',
      thRequired: 'Wajib',
      thDescription: 'Deskripsi',
      no: 'Tidak',
      yearDesc: 'Tahun yang diquery. Rentang: 2011 - tahun sekarang + 1. Default: tahun sekarang.',
      monthDesc: 'Filter bulan. Rentang: 1 - 12.',
      dayDesc: 'Filter hari. Rentang: 1 - 31. Membutuhkan <code>month</code> harus diisi.',
      exampleRequest: 'Contoh Request',
      exampleResponse: 'Contoh Response',
      noParamsToday: 'Tidak ada. Menggunakan tanggal server saat ini (zona waktu Asia/Jakarta).',
      noParamsTomorrow: 'Tidak ada. Menggunakan tanggal server saat ini + 1 hari (zona waktu Asia/Jakarta).',
      themeToggleLabel: 'Ganti tema',
      langToggleLabel: 'Ganti bahasa',
      langLabel: 'ID',
      months: [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
    }
  };

  // ===== Current Language State =====
  let currentLang = 'en';

  function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.en[key]) || key;
  }

  // ===== Language Persistence =====
  function getStoredLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null;
    }
  }

  function setStoredLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // localStorage unavailable
    }
  }

  function detectBrowserLang() {
    var navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return navLang.toLowerCase().startsWith('id') ? 'id' : 'en';
  }

  function initLang() {
    var stored = getStoredLang();
    if (stored === 'id' || stored === 'en') {
      currentLang = stored;
    } else {
      currentLang = detectBrowserLang();
    }
  }

  // ===== Apply Translations =====
  function applyTranslations() {
    // data-i18n: textContent
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (typeof val === 'string') {
        el.textContent = val;
      }
    });

    // data-i18n-html: innerHTML (for elements with inline <code> etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      var val = t(key);
      if (typeof val === 'string') {
        el.innerHTML = val;
      }
    });

    // Language toggle label
    var langLabel = document.querySelector('.lang-label');
    if (langLabel) {
      langLabel.textContent = t('langLabel');
    }

    // Aria labels
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', t('themeToggleLabel'));
    }
    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.setAttribute('aria-label', t('langToggleLabel'));
    }

    // Update html lang attribute
    document.documentElement.setAttribute('lang', currentLang);

    // Update month names in dropdown
    updateMonthOptions();

    // Update dropdown placeholders
    updateDropdownPlaceholders();

    // Update select aria-labels
    var yearSel = document.getElementById('inputYear');
    var monthSel = document.getElementById('inputMonth');
    var daySel = document.getElementById('inputDay');
    if (yearSel) yearSel.setAttribute('aria-label', t('labelYear'));
    if (monthSel) monthSel.setAttribute('aria-label', t('labelMonth'));
    if (daySel) daySel.setAttribute('aria-label', t('labelDay'));
  }

  // ===== Dropdown Population =====
  var inputYear = document.getElementById('inputYear');
  var inputMonth = document.getElementById('inputMonth');
  var inputDay = document.getElementById('inputDay');

  function populateDropdowns() {
    if (!inputYear) return;

    // Clear existing options
    inputYear.innerHTML = '';
    if (inputMonth) inputMonth.innerHTML = '';
    if (inputDay) inputDay.innerHTML = '';

    // Year placeholder + options
    var yearPlaceholder = document.createElement('option');
    yearPlaceholder.value = '';
    yearPlaceholder.textContent = t('selectYear');
    yearPlaceholder.setAttribute('data-placeholder', 'year');
    inputYear.appendChild(yearPlaceholder);

    for (var y = 2011; y <= 2027; y++) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      inputYear.appendChild(opt);
    }

    // Month placeholder + options
    if (inputMonth) {
      var monthPlaceholder = document.createElement('option');
      monthPlaceholder.value = '';
      monthPlaceholder.textContent = t('selectMonth');
      monthPlaceholder.setAttribute('data-placeholder', 'month');
      inputMonth.appendChild(monthPlaceholder);

      var months = t('months');
      for (var m = 1; m <= 12; m++) {
        var mopt = document.createElement('option');
        mopt.value = m;
        mopt.textContent = m + ' - ' + months[m - 1];
        mopt.setAttribute('data-month-index', m - 1);
        inputMonth.appendChild(mopt);
      }
    }

    // Day placeholder + options
    if (inputDay) {
      var dayPlaceholder = document.createElement('option');
      dayPlaceholder.value = '';
      dayPlaceholder.textContent = t('selectDay');
      dayPlaceholder.setAttribute('data-placeholder', 'day');
      inputDay.appendChild(dayPlaceholder);

      for (var d = 1; d <= 31; d++) {
        var dopt = document.createElement('option');
        dopt.value = d;
        dopt.textContent = d;
        inputDay.appendChild(dopt);
      }
    }
  }

  function updateMonthOptions() {
    if (!inputMonth) return;
    var months = t('months');
    var options = inputMonth.querySelectorAll('option[data-month-index]');
    options.forEach(function(opt) {
      var idx = parseInt(opt.getAttribute('data-month-index'), 10);
      opt.textContent = (idx + 1) + ' - ' + months[idx];
    });
  }

  function updateDropdownPlaceholders() {
    var yearPh = inputYear ? inputYear.querySelector('[data-placeholder="year"]') : null;
    var monthPh = inputMonth ? inputMonth.querySelector('[data-placeholder="month"]') : null;
    var dayPh = inputDay ? inputDay.querySelector('[data-placeholder="day"]') : null;
    if (yearPh) yearPh.textContent = t('selectYear');
    if (monthPh) monthPh.textContent = t('selectMonth');
    if (dayPh) dayPh.textContent = t('selectDay');
  }

  // ===== Theme Toggle =====
  var html = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage unavailable (private browsing)
    }
  }

  function initTheme() {
    var stored = getStoredTheme();
    if (stored) {
      if (stored === 'light') html.classList.add('light');
      return;
    }
    // No stored preference -- check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      html.classList.add('light');
    }
  }

  initTheme();
  initLang();
  populateDropdowns();
  applyTranslations();

  if (toggle) {
    toggle.addEventListener('click', function() {
      html.classList.toggle('light');
      var isLight = html.classList.contains('light');
      setStoredTheme(isLight ? 'light' : 'dark');
    });
  }

  // ===== Language Toggle =====
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function() {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      setStoredLang(currentLang);
      applyTranslations();
      // Re-apply static JSON highlighting (sample blocks have highlight spans)
      document.querySelectorAll('[data-sample-json]').forEach(function(el) {
        // Re-read raw text from the sample (stored in data attr or original textContent)
        // Since highlightStaticJSON already wrapped spans, we stored raw in _rawText
        if (el._rawText) {
          el.innerHTML = highlightStaticJSON(el._rawText);
        }
      });
    });
  }

  // ===== JSON Syntax Highlighter =====
  function highlightJSON(obj) {
    var json = JSON.stringify(obj, null, 2);
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
  document.querySelectorAll('[data-sample-json]').forEach(function(el) {
    var raw = el.textContent.trim();
    el._rawText = raw;
    el.innerHTML = highlightStaticJSON(raw);
  });

  // ===== Copy to Clipboard =====
  function getCopyText(copyBtn) {
    var codeBlock = copyBtn.closest('.code-block');
    if (codeBlock) {
      var code = codeBlock.querySelector('code');
      if (code) return code.textContent;
    }
    var responseBody = copyBtn.closest('.try-response');
    if (responseBody) {
      var code2 = responseBody.querySelector('code');
      if (code2) return code2.textContent;
    }
    var resp = copyBtn.closest('.response-header');
    if (resp) {
      var pre = resp.parentElement.querySelector('code');
      if (pre) return pre.textContent;
    }
    return '';
  }

  function flashCopied(btn) {
    var label = btn.querySelector('.copy-label');
    if (label) label.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(function() {
      if (label) label.textContent = t('copy');
      btn.classList.remove('copied');
    }, 1500);
  }

  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var text = getCopyText(btn);
      if (!text) return;
      navigator.clipboard.writeText(text.trim()).then(function() {
        flashCopied(btn);
      }).catch(function() {
        var ta = document.createElement('textarea');
        ta.value = text.trim();
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        flashCopied(btn);
      });
    });
  });

  // ===== Try It Live =====
  var tryBtns = document.querySelectorAll('.try-btn');
  var responseBody = document.querySelector('.response-body code');
  var responseStatus = document.querySelector('.response-status');
  var dateDropdowns = document.getElementById('dateDropdowns');

  var activeEndpoint = '/api';

  function showDropdowns() {
    if (dateDropdowns) dateDropdowns.classList.remove('hidden');
  }

  function hideDropdowns() {
    if (dateDropdowns) dateDropdowns.classList.add('hidden');
  }

  function buildApiUrl() {
    var params = new URLSearchParams();
    if (inputYear && inputYear.value !== '') params.set('year', inputYear.value);
    if (inputMonth && inputMonth.value !== '') params.set('month', inputMonth.value);
    if (inputDay && inputDay.value !== '') params.set('day', inputDay.value);
    var qs = params.toString();
    return qs ? '/api?' + qs : '/api';
  }

  function setActiveEndpoint(endpoint) {
    activeEndpoint = endpoint;
    tryBtns.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.endpoint === endpoint);
    });
  }

  async function fetchEndpoint(endpoint) {
    setActiveEndpoint(endpoint);

    if (endpoint === '/api') {
      showDropdowns();
    } else {
      hideDropdowns();
    }

    var url;
    if (endpoint === '/api') {
      url = API_BASE + buildApiUrl();
    } else {
      url = API_BASE + endpoint;
    }

    if (responseStatus) responseStatus.textContent = t('fetching');
    if (responseBody) responseBody.innerHTML = t('loading');

    try {
      var res = await fetch(url);
      if (!res.ok) {
        if (responseStatus) responseStatus.textContent = res.status + ' ' + res.statusText;
        if (responseBody) responseBody.innerHTML = '<span class="json-null">' + t('error') + ': ' + res.status + ' ' + res.statusText + '</span>';
        return;
      }
      var data = await res.json();
      if (responseStatus) responseStatus.textContent = '200 OK';
      if (responseBody) responseBody.innerHTML = highlightJSON(data);
    } catch (err) {
      if (responseStatus) responseStatus.textContent = t('error');
      if (responseBody) responseBody.innerHTML = '<span class="json-null">' + t('errorUnable') + ' ' + (err.message || '') + '</span>';
    }
  }

  tryBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      fetchEndpoint(btn.dataset.endpoint);
    });
  });

  // Reactive dropdowns
  [inputYear, inputMonth, inputDay].forEach(function(sel) {
    if (!sel) return;
    sel.addEventListener('change', function() {
      if (activeEndpoint === '/api') {
        fetchEndpoint('/api');
      }
    });
  });

  // CTA buttons
  document.querySelectorAll('.cta-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var section = document.getElementById('try-it');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      fetchEndpoint(btn.dataset.endpoint);
    });
  });

})();
