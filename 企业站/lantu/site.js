/* ============================================================
   澜图设计 LANTU · 交互（v2.4 · 2026-11-05）
   阅读进度 / 抽屉导航 / 滚动目录 / 驾驶舱键盘 / 案例筛选
   / 表格排序 / 表单校验
   无依赖；无 JS 时导航、表格、表单与全部正文可读。
   ============================================================ */
(function () {
  'use strict';
  window.__ltReady = true;

  var doc = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- 阅读进度线 ---------- */
  var progressBar = qs('[data-progress]');
  function updateProgress() {
    if (!progressBar) return;
    var el = doc.documentElement;
    var max = el.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = 'scaleX(' + p + ')';
  }
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* ---------- 抽屉导航 ---------- */
  var toggle = qs('.nav-toggle');
  var nav = qs('#site-nav');
  if (toggle && nav) {
    var mq = window.matchMedia('(max-width: 900px)');
    var label = qs('.sr-only', toggle);
    var top = qs('.lt-top');
    var page = [qs('main'), qs('footer')].filter(Boolean);

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);
      page.forEach(function (el) { el.inert = open; });
      if (label) label.textContent = open ? '关闭菜单' : '打开菜单';
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !top || toggle.getAttribute('aria-expanded') !== 'true') return;
      var items = qsa('a[href],button:not([disabled]),[tabindex="0"]', top)
        .filter(function (el) { return el.getClientRects().length > 0; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var onMq = function () {
      if (!mq.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else mq.addListener(onMq);

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && mq.matches) setOpen(false);
    });
  }

  /* ---------- 轻微入场 ---------- */
  var reveals = qsa('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          ro.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 图 01：驾驶舱折线（单 tab 停靠 + 方向键） ---------- */
  var dash = qs('[data-dash]');
  if (dash) {
    var chart = qs('.dash__chart', dash);
    var tip = qs('.dash__tip', dash);
    var paths = qsa('.dash__line, .dash__line-glow', dash);
    var area = qs('.dash__area', dash);
    var pts = qsa('.dash__pt', dash);
    var live = qs('[data-dash-live]', dash);
    var idx = 0;

    var draw = function () {
      if (reduced) {
        paths.forEach(function (p) { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
        if (area) area.style.opacity = '1';
        return;
      }
      paths.forEach(function (p, i) {
        var len = 0;
        try { len = p.getTotalLength(); } catch (err) { len = 900; }
        p.style.strokeDasharray = len + ' ' + len;
        p.style.strokeDashoffset = len;
        void p.getBoundingClientRect();
        p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.61,.36,1) ' + (i * 0.1) + 's';
        p.style.strokeDashoffset = '0';
      });
      if (area) {
        area.style.opacity = '0';
        area.style.transition = 'opacity .9s ease .4s';
        void area.getBoundingClientRect();
        area.style.opacity = '1';
      }
      pts.forEach(function (pt, i) {
        pt.style.opacity = '0';
        pt.style.transition = 'opacity .35s ease ' + (0.7 + i * 0.045) + 's';
        void pt.getBoundingClientRect();
        pt.style.opacity = '1';
      });
    };

    if ('IntersectionObserver' in window) {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { draw(); dio.disconnect(); }
        });
      }, { threshold: 0.2 });
      dio.observe(dash);
    } else {
      draw();
    }

    var hideTip = function () {
      if (tip) tip.hidden = true;
    };
    var mark = function (i) {
      pts.forEach(function (pt, n) { pt.classList.toggle('lt-is-on', n === i); });
    };
    var showTip = function (pt, i) {
      if (!tip || !chart || !pt) return;
      var t = pt.getAttribute('data-t');
      var v = pt.getAttribute('data-v');
      tip.innerHTML = '<b>' + v + ' MW</b> · ' + t;
      var cr = chart.getBoundingClientRect();
      var pr = pt.getBoundingClientRect();
      var x = pr.left - cr.left + pr.width / 2;
      var y = pr.top - cr.top + pr.height / 2;
      tip.hidden = false;
      var tw = tip.offsetWidth;
      x = Math.max(tw / 2 + 3, Math.min(x, cr.width - tw / 2 - 3));
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      mark(i);
      if (live) live.textContent = t + '，负荷 ' + v + ' 兆瓦';
    };
    var showAt = function (i) {
      if (!pts.length) return;
      idx = Math.max(0, Math.min(i, pts.length - 1));
      showTip(pts[idx], idx);
    };

    pts.forEach(function (pt, i) {
      pt.addEventListener('pointerenter', function () { showAt(i); });
    });

    if (chart) {
      chart.addEventListener('pointerleave', hideTip);
      chart.addEventListener('focus', function () { showAt(idx); });
      chart.addEventListener('focusin', function (e) {
        if (e.target === chart) showAt(idx);
      });
      chart.addEventListener('focusout', hideTip);
      chart.addEventListener('keydown', function (e) {
        var next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(idx + 1, pts.length - 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(idx - 1, 0);
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = pts.length - 1;
        else if (e.key === 'Escape') { hideTip(); return; }
        if (next < 0) return;
        e.preventDefault();
        showAt(next);
      });
    }
  }

  /* ---------- 本页目录 scrollspy（桌面 aside + 移动 details） ---------- */
  (function tocSpy() {
    var links = qsa('.lt-toc a[href^="#"], .lt-toc-m a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var secs = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#' || id === '#') return;
      var el = doc.getElementById(id.slice(1));
      if (el && secs.indexOf(el) < 0) secs.push(el);
    });
    if (!secs.length) return;

    function setCurrent(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setCurrent(en.target.id);
      });
    }, { rootMargin: '-18% 0px -64% 0px', threshold: 0 });

    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ---------- 案例筛选 ---------- */
  var grid = qs('[data-case-grid]');
  if (grid) {
    var cards = qsa('.case-card', grid);
    var btns = qsa('[data-filter]');
    var countEl = qs('[data-filter-count]');
    var filterLive = qs('[data-filter-live]');

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filter');
        btns.forEach(function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        var shown = 0;
        cards.forEach(function (c) {
          var cats = (c.getAttribute('data-cat') || '').split(/\s+/);
          var show = cat === 'all' || cats.indexOf(cat) > -1;
          c.hidden = !show;
          if (show) shown += 1;
        });
        if (countEl) countEl.textContent = shown;
        if (filterLive) filterLive.textContent = '当前显示 ' + shown + ' 个案例。';
      });
    });
  }

  /* ---------- 表格排序 ---------- */
  qsa('table[data-sortable]').forEach(function (table) {
    var body = qs('tbody', table);
    var heads = qsa('th[data-sort-col]', table);
    if (!body || !heads.length) return;

    heads.forEach(function (th) {
      var btn = qs('[data-sort-col]', th) || qs('button', th);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var col = parseInt(th.getAttribute('data-sort-col'), 10);
        var dir = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
        var rows = qsa('tr', body);

        rows.sort(function (r1, r2) {
          var a = (r1.children[col] ? r1.children[col].textContent : '').trim();
          var b = (r2.children[col] ? r2.children[col].textContent : '').trim();
          return a.localeCompare(b, 'zh-CN', { numeric: true }) * dir;
        });

        rows.forEach(function (r) { body.appendChild(r); });

        heads.forEach(function (h) { h.setAttribute('aria-sort', 'none'); });
        th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
      });
    });
  });

  /* ---------- 表单校验 ---------- */
  qsa('form[data-validate]').forEach(function (form) {
    var fields = qsa('[data-required]', form);
    var status = qs('.form-status', form);
    var submitted = false;
    var lastBad = -1;

    function setErr(input, msg) {
      var field = input.closest('.lt-field');
      var err = field ? qs('.lt-field__err', field) : null;
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.hidden = false; }
      } else {
        input.removeAttribute('aria-invalid');
        if (err) { err.textContent = ''; err.hidden = true; }
      }
    }

    function checkField(input) {
      var v = input.value.trim();
      if (!v) {
        setErr(input, '这一项需要填写。');
        return false;
      }
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setErr(input, '邮箱格式看起来不对，请检查一下。');
        return false;
      }
      setErr(input, '');
      return true;
    }

    function refreshStatus() {
      if (!submitted) return;
      var bad = form.querySelectorAll('[aria-invalid="true"]').length;
      if (bad === lastBad) return;
      lastBad = bad;
      if (status) status.textContent = bad ? '还有 ' + bad + ' 项需要处理。' : '已补齐，可以提交。';
    }

    fields.forEach(function (input) {
      input.addEventListener('input', function () {
        if (submitted) checkField(input); else setErr(input, '');
        refreshStatus();
      });
      input.addEventListener('change', function () {
        if (submitted) checkField(input); else setErr(input, '');
        refreshStatus();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      var firstBad = null;
      fields.forEach(function (input) {
        if (!checkField(input) && !firstBad) firstBad = input;
      });

      var bad = qsa('[aria-invalid="true"]', form).length;
      lastBad = bad;
      if (firstBad) {
        if (status) status.textContent = '还有 ' + bad + ' 项需要处理。';
        firstBad.focus();
        return;
      }
      submitted = false;
      lastBad = -1;
      if (status) status.textContent = '校验通过。演示表单，不会发送任何信息。';
      form.reset();
    });
  });

  /* ---------- 年份 ---------- */
  qsa('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
