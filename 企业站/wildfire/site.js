/* ============================================================
   野火创意 WILDFIRE · 交互 v3（2026-11-05）
   全屏覆盖菜单 / 跑马灯（CSS）/ 打字机 / 筛选 / 引语 / 手风琴 / 表单
   无依赖；prefers-reduced-motion 下关闭动效。
   ============================================================ */
(function () {
  'use strict';
  window.__wfReady = true;

  var doc = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- 全屏覆盖菜单 ---------- */
  var toggle = qs('.nav-toggle');
  var nav = qs('#site-nav');
  if (toggle && nav) {
    var label = qs('.wf-menu__txt', toggle);
    var srLabel = qs('.sr-only', toggle);
    var page = [qs('main'), qs('footer')].filter(Boolean);

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);
      page.forEach(function (el) { el.inert = open; });
      if (label) label.textContent = open ? '关闭' : '菜单';
      if (srLabel) srLabel.textContent = open ? '关闭菜单' : '打开菜单';
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    };

    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || toggle.getAttribute('aria-expanded') !== 'true') return;
      var items = [toggle].concat(qsa('a[href],button:not([disabled]),[tabindex="0"]', nav))
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

    toggle.addEventListener('click', function () {
      var next = toggle.getAttribute('aria-expanded') !== 'true';
      setOpen(next);
      if (!next) toggle.focus();
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
  }

  /* ---------- 入场 ---------- */
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

  /* ---------- 首屏打字机 ---------- */
  var typeEl = qs('[data-type-words]');
  if (typeEl) {
    var words = (typeEl.getAttribute('data-type-words') || '').split('|').filter(Boolean);
    if (!words.length) {
      typeEl.textContent = '记住';
    } else if (reduced) {
      typeEl.textContent = words[words.length - 1];
    } else {
      typeEl.textContent = words[0];
      var wi = 0;
      var ci = words[0].length;
      var deleting = true;
      var tick = function () {
        var word = words[wi];
        if (deleting) {
          ci -= 1;
          typeEl.textContent = word.slice(0, Math.max(ci, 0));
          if (ci <= 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
            ci = 0;
            window.setTimeout(tick, 320);
            return;
          }
          window.setTimeout(tick, 70);
          return;
        }
        var nextWord = words[wi];
        ci += 1;
        typeEl.textContent = nextWord.slice(0, ci);
        if (ci >= nextWord.length) {
          deleting = true;
          window.setTimeout(tick, 2100);
          return;
        }
        window.setTimeout(tick, 120);
      };
      window.setTimeout(tick, 1900);
    }
  }

  /* ---------- 磁吸（仅精细指针） ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduced) {
    qsa('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width * 12;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height * 12;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------- 作品筛选 ---------- */
  var grid = qs('[data-work-grid]');
  if (grid) {
    var cards = qsa('.work-card', grid);
    var fbtns = qsa('[data-filter]');
    var countEl = qs('[data-filter-count]');

    var applyFilter = function (cat) {
      var shown = 0;
      cards.forEach(function (c) {
        var cats = (c.getAttribute('data-cat') || '').split(/\s+/);
        var show = cat === 'all' || cats.indexOf(cat) > -1;
        c.hidden = !show;
        if (show) {
          shown += 1;
          c.classList.add('is-in');
        }
      });
      if (countEl) countEl.textContent = String(shown);
    };

    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        fbtns.forEach(function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        applyFilter(b.getAttribute('data-filter'));
      });
    });
  }

  /* ---------- 引语轮播 ---------- */
  var track = qs('[data-quotes]');
  if (track) {
    var items = qsa('.wf-quote', track);
    var prev = qs('[data-q-prev]');
    var next = qs('[data-q-next]');
    var status = qs('[data-q-status]');
    var step = function () {
      if (!items.length) return track.clientWidth * 0.9;
      return items[0].getBoundingClientRect().width;
    };
    var go = function (dir) {
      track.scrollBy({ left: dir * step(), behavior: reduced ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    var sync = function () {
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      if (status && items.length) {
        var idx = Math.round(track.scrollLeft / Math.max(step(), 1)) + 1;
        idx = Math.max(1, Math.min(idx, items.length));
        status.textContent = '第 ' + idx + ' 条，共 ' + items.length + ' 条';
      }
    };
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---------- 手风琴（FAQ / 服务 / 招聘共用） ---------- */
  var accBtns = qsa('[data-acc]');
  var panelOf = function (btn) {
    var id = btn.getAttribute('aria-controls');
    return id ? doc.getElementById(id) : null;
  };
  var closePanel = function (btn) {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    var p = panelOf(btn);
    if (!p) return;
    p.style.height = p.scrollHeight + 'px';
    void p.offsetHeight;
    p.style.height = '0px';
    p.setAttribute('aria-hidden', 'true');
    p.inert = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  var openPanel = function (btn) {
    var p = panelOf(btn);
    if (!p) return;
    btn.setAttribute('aria-expanded', 'true');
    p.removeAttribute('aria-hidden');
    p.inert = false;
    p.style.height = p.scrollHeight + 'px';
    var done = function (e) {
      if (e.propertyName !== 'height') return;
      p.style.height = 'auto';
      p.removeEventListener('transitionend', done);
    };
    p.addEventListener('transitionend', done);
  };
  var groupOf = function (btn) {
    return btn.closest('.wf-faq, .wf-acc, .wf-jobs') || doc;
  };
  accBtns.forEach(function (btn) {
    var p0 = panelOf(btn);
    if (p0) {
      var isOpen0 = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen0) p0.removeAttribute('aria-hidden'); else p0.setAttribute('aria-hidden', 'true');
      p0.inert = !isOpen0;
    }
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      var group = groupOf(btn);
      qsa('[data-acc]', group).forEach(function (o) {
        if (o !== btn) closePanel(o);
      });
      if (isOpen) closePanel(btn); else openPanel(btn);
    });
  });

  function openFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var target = doc.getElementById(id);
    if (!target) return;
    var item = target.closest('.wf-acc__item, .wf-faq__item, .wf-job');
    var btn = item ? qs('[data-acc]', item) : null;
    if (btn && btn.getAttribute('aria-expanded') !== 'true') openPanel(btn);
  }

  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- 预算 chips ---------- */
  var chips = qsa('[data-budget]');
  if (chips.length) {
    var budgetInput = qs('#budget');
    var syncChips = function (value) {
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-budget') === value ? 'true' : 'false');
      });
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var v = c.getAttribute('data-budget');
        if (c.getAttribute('aria-pressed') === 'true') {
          v = '';
        }
        syncChips(v);
        if (budgetInput) budgetInput.value = v;
      });
    });
  }

  /* ---------- 表单校验 ---------- */
  qsa('form[data-validate]').forEach(function (form) {
    var fields = qsa('[data-required]', form);
    var status = qs('.form-status', form);
    var submitted = false;
    var lastBad = -1;
    var setErr = function (input, msg) {
      var field = input.closest('.wf-field');
      var err = field ? qs('.wf-field__err', field) : null;
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.hidden = false; }
      } else {
        input.removeAttribute('aria-invalid');
        if (err) { err.textContent = ''; err.hidden = true; }
      }
    };
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
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      var firstBad = null;
      fields.forEach(function (input) {
        if (!checkField(input) && !firstBad) firstBad = input;
      });
      lastBad = qsa('[aria-invalid="true"]', form).length;
      if (firstBad) {
        if (status) status.textContent = '还有 ' + lastBad + ' 项需要处理。';
        firstBad.focus();
        return;
      }
      submitted = false;
      lastBad = -1;
      if (status) status.textContent = '校验通过。演示表单，不会发送任何信息。';
      form.reset();
      if (chips.length) syncChips('');
    });
  });

  /* ---------- 年份 ---------- */
  qsa('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
