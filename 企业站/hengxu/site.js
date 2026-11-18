/* ============================================================
   衡序数据 HENGXU · site.js · v3.0（2026-11-05）
   1. 移动端 rail 抽屉（<1080）
   2. 轻微揭示（8px）
   3. 数据浏览器：行业筛选 + 表头排序（aria-sort）
   4. 申请单表单校验
   5. 年份
   原生实现，无依赖。
   ============================================================ */
(function () {
  'use strict';
  window.__hxReady = true;

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- 1. 抽屉导航 ---------------- */
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    var label = toggle.querySelector('.sr-only');
    var mqDesktop = window.matchMedia('(min-width: 1080px)');
    var lastFocus = null;
    var rail = document.querySelector('.hx-rail');
    var page = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setNav(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      page.forEach(function (el) { el.inert = open; });
      if (label) label.textContent = open ? '关闭菜单' : '打开菜单';
    }

    toggle.addEventListener('click', function () {
      var open = !isOpen();
      if (open) {
        lastFocus = toggle;
        setNav(true);
        var first = nav.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else {
        setNav(false);
        var back = lastFocus && lastFocus.focus ? lastFocus : toggle;
        back.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setNav(false);
        var back = lastFocus && lastFocus.focus ? lastFocus : toggle;
        back.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !isOpen() || !rail) return;
      var items = [].slice.call(rail.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]'))
        .filter(function (el) { return el.getClientRects().length > 0; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    nav.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a') : null;
      if (link && isOpen()) setNav(false);
    });

    function onChange(e) {
      if (e.matches) setNav(false);
    }
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onChange);
    else if (mqDesktop.addListener) mqDesktop.addListener(onChange);
  })();

  /* ---------------- 2. 轻微揭示 ---------------- */
  (function () {
    var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- 3. 数据浏览器：筛选 ---------------- */
  (function () {
    var chips = [].slice.call(document.querySelectorAll('[data-hx-industry]'));
    var body = document.querySelector('[data-hx-browser]');
    if (!chips.length || !body) return;

    var rows = [].slice.call(body.querySelectorAll('tbody tr'));
    var count = document.querySelector('[data-hx-count]');

    function apply(key) {
      var shown = 0;
      rows.forEach(function (row) {
        var ok = key === '全部' || row.getAttribute('data-industry') === key;
        row.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = String(shown);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        apply(chip.getAttribute('data-hx-industry'));
      });
    });
  })();

  /* ---------------- 4. 数据浏览器：排序 ---------------- */
  (function () {
    [].slice.call(document.querySelectorAll('table[data-hx-sort]')).forEach(function (table) {
      var tbody = table.tBodies[0];
      if (!tbody) return;

      var sortableTh = [].slice.call(table.querySelectorAll('th[aria-sort]'));

      sortableTh.forEach(function (th) {
        var btn = th.querySelector('.hx-sort');
        if (!btn) return;

        btn.addEventListener('click', function () {
          var ascending = th.getAttribute('aria-sort') !== 'ascending';
          sortableTh.forEach(function (other) {
            if (other !== th) other.setAttribute('aria-sort', 'none');
          });
          th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');

          var col = parseInt(btn.getAttribute('data-hx-col'), 10) || 0;
          var type = btn.getAttribute('data-hx-type') || 'text';
          var dir = ascending ? 1 : -1;
          var rows = [].slice.call(tbody.rows);

          rows.sort(function (a, b) {
            var av = a.cells[col] ? a.cells[col].textContent.trim() : '';
            var bv = b.cells[col] ? b.cells[col].textContent.trim() : '';
            if (type === 'num') {
              var an = parseFloat(av.replace(/[^\d.-]/g, ''));
              var bn = parseFloat(bv.replace(/[^\d.-]/g, ''));
              if (isNaN(an)) an = -Infinity;
              if (isNaN(bn)) bn = -Infinity;
              return (an - bn) * dir;
            }
            return av.localeCompare(bv, 'zh-CN') * dir;
          });

          rows.forEach(function (row) { tbody.appendChild(row); });
        });
      });
    });
  })();

  /* ---------------- 5. 申请单校验 ---------------- */
  [].slice.call(document.querySelectorAll('form[data-validate]')).forEach(function (form) {
    var status = form.querySelector('.form-status');
    var submitted = false;
    var lastBad = -1;
    form.setAttribute('novalidate', 'novalidate');

    function errBox(input) {
      var field = input.closest('.hx-field');
      return field ? field.querySelector('.hx-err') : null;
    }

    function setError(input, msg) {
      var box = errBox(input);
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        if (box) { box.textContent = msg; box.hidden = false; }
      } else {
        input.removeAttribute('aria-invalid');
        if (box) { box.textContent = ''; box.hidden = true; }
      }
    }

    function validate(input) {
      var value = (input.value || '').trim();
      if (input.hasAttribute('data-required') && !value) {
        setError(input, '这一项需要填写。');
        return false;
      }
      if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(input, '邮箱格式看起来不对，请检查一下。');
        return false;
      }
      setError(input, '');
      return true;
    }

    function refreshStatus() {
      if (!submitted) return;
      var bad = form.querySelectorAll('[aria-invalid="true"]').length;
      if (bad === lastBad) return;
      lastBad = bad;
      if (status) status.textContent = bad ? '还有 ' + bad + ' 项需要处理。' : '已补齐，可以提交。';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      var fields = [].slice.call(form.querySelectorAll('input,textarea,select'));
      var bad = fields.filter(function (field) { return !validate(field); });
      lastBad = bad.length;
      if (bad.length) {
        bad[0].focus();
        if (status) status.textContent = '还有 ' + bad.length + ' 项需要处理。';
        return;
      }
      submitted = false;
      lastBad = -1;
      if (status) status.textContent = '这是演示站，申请单不会真的发送；正式版会接到你的邮箱或企业微信。';
    });

    form.addEventListener('input', function (e) {
      if (e.target.matches && e.target.matches('input,textarea,select')) { validate(e.target); refreshStatus(); }
    });
    form.addEventListener('change', function (e) {
      if (e.target.matches && e.target.matches('input,textarea,select')) { validate(e.target); refreshStatus(); }
    });
  });

  /* ---------------- 5b. 横向滚动表：键盘可达 ---------------- */
  (function () {
    var wraps = [].slice.call(document.querySelectorAll('.hx-scroll'));

    function sync() {
      wraps.forEach(function (el) {
        var overflow = el.scrollWidth > el.clientWidth + 1;
        if (overflow) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'region');
          if (!el.hasAttribute('aria-label')) {
            var cap = el.querySelector('caption');
            el.setAttribute('aria-label', (cap ? cap.textContent : '数据表') + '，可横向滚动');
          }
        } else {
          el.removeAttribute('tabindex');
          el.removeAttribute('role');
          el.removeAttribute('aria-label');
        }
      });
    }

    sync();
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(sync, 180);
    });
  })();

  /* ---------------- 6. 年份 ---------------- */
  [].slice.call(document.querySelectorAll('[data-year]')).forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

/* ---------------- 7. 首页指数走势图（独立 IIFE） ---------------- */
(function () {
  'use strict';

  var plot = document.querySelector('[data-hx-chart]');
  if (!plot) return;

  var QUARTERS = ['2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3', '2026 Q4'];
  var SERIES = [
    { name: '零售', vals: [68.0, 69.4, 70.1, 71.6, 72.0, 73.1, 73.6, 74.2] },
    { name: '制造', vals: [62.4, 63.0, 64.2, 64.8, 65.9, 66.4, 67.3, 68.5] },
    { name: '金融', vals: [74.8, 75.6, 76.4, 77.1, 78.2, 78.9, 80.1, 81.0] },
    { name: '医疗', vals: [57.9, 58.8, 59.4, 60.2, 60.9, 61.6, 62.4, 63.1] },
    { name: '物流', vals: [64.9, 65.8, 66.4, 67.9, 68.8, 69.6, 70.4, 71.3] }
  ];

  var cross = plot.querySelector('[data-hx-crossline]');
  var dots = [].slice.call(plot.querySelectorAll('[data-hx-dot]'));
  var tip = plot.querySelector('[data-hx-tip]');
  var tipQ = plot.querySelector('[data-hx-tip-q]');
  var tipVs = [].slice.call(plot.querySelectorAll('[data-hx-tip-v]'));
  var hits = [].slice.call(plot.querySelectorAll('[data-hx-q]'));
  var live = document.querySelector('[data-hx-chart-live]');
  var active = -1;
  var STEP = (680 - 52) / 7;

  function xAt(i) {
    return 52 + STEP * i;
  }

  function yAt(v) {
    return 224 - (v - 55) * (200 / 30);
  }

  function announce(i) {
    if (!live) return;
    var parts = SERIES.map(function (s) {
      return s.name + ' ' + s.vals[i].toFixed(1);
    });
    live.textContent = QUARTERS[i] + '：' + parts.join('，') + '。';
  }

  function setActive(i, speak) {
    if (i < 0 || i >= QUARTERS.length) return;
    active = i;
    plot.classList.add('hx-is-on');

    var x = xAt(i);
    if (cross) {
      cross.setAttribute('x1', x);
      cross.setAttribute('x2', x);
    }

    dots.forEach(function (dot, j) {
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', yAt(SERIES[j].vals[i]));
    });

    if (tip) {
      var tx = x + 14;
      if (tx + 150 > 680) tx = x - 164;
      if (tx < 8) tx = 8;
      if (tx > 662) tx = 662;
      tip.setAttribute('transform', 'translate(' + tx + ',26)');
    }

    if (tipQ) tipQ.textContent = QUARTERS[i];
    tipVs.forEach(function (el, j) {
      el.textContent = SERIES[j].vals[i].toFixed(1);
    });

    if (speak) announce(i);
  }

  function hide() {
    plot.classList.remove('hx-is-on');
    active = -1;
  }

  plot.addEventListener('focus', function () {
    if (active < 0) setActive(QUARTERS.length - 1, false);
  });

  plot.addEventListener('blur', hide);

  plot.addEventListener('keydown', function (e) {
    var key = e.key;
    var next;

    if (key === 'ArrowRight') {
      next = active < 0 ? 0 : Math.min(QUARTERS.length - 1, active + 1);
    } else if (key === 'ArrowLeft') {
      next = active < 0 ? QUARTERS.length - 1 : Math.max(0, active - 1);
    } else if (key === 'Home') {
      next = 0;
    } else if (key === 'End') {
      next = QUARTERS.length - 1;
    } else if (key === 'Escape') {
      hide();
      e.preventDefault();
      return;
    } else {
      return;
    }

    e.preventDefault();
    setActive(next, true);
  });

  hits.forEach(function (hit) {
    var i = parseInt(hit.getAttribute('data-hx-q'), 10);
    if (isNaN(i)) return;
    hit.addEventListener('pointermove', function () { setActive(i, false); });
    hit.addEventListener('pointerenter', function () { setActive(i, false); });
    hit.addEventListener('pointerdown', function () { setActive(i, false); });
  });

  plot.addEventListener('pointerleave', function () {
    if (document.activeElement !== plot) hide();
  });
})();
