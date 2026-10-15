/* Steam Genie - shared behaviour */
(function () {
  var PHONE_TEL = "+15878993890";
  // Put the real social page links here, then they replace the defaults on every page.
  var SOCIAL = { facebook: "", instagram: "", yelp: "", google: "", youtube: "" };
  Object.keys(SOCIAL).forEach(function (k) {
    if (!SOCIAL[k]) return;
    document.querySelectorAll('.soc a[data-net="' + k + '"]').forEach(function (a) { a.href = SOCIAL[k]; });
  });
  var doc = document;
  doc.documentElement.classList.remove("no-js");

  // mobile nav
  var top = doc.querySelector(".top"), burger = doc.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var o = top.classList.toggle("open");
      burger.setAttribute("aria-expanded", o ? "true" : "false");
    });
    doc.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { top.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  // scroll reveal (content stays visible if IntersectionObserver is missing)
  var rv = doc.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  // decorative bubbles
  doc.querySelectorAll(".fx[data-bubbles]").forEach(function (fx) {
    var n = +fx.getAttribute("data-bubbles") || 8, h = "";
    for (var i = 0; i < n; i++) {
      var s = 18 + Math.round(Math.random() * 70);
      h += '<span class="bub" style="width:' + s + "px;height:" + s + "px;left:" + Math.round(Math.random() * 96) + "%;top:" + Math.round(Math.random() * 92) +
        "%;animation-delay:-" + (Math.random() * 7).toFixed(1) + "s;animation-duration:" + (6 + Math.random() * 5).toFixed(1) + 's"></span>';
    }
    for (var j = 0; j < 4; j++) {
      h += '<span class="spk" style="--s:' + (16 + Math.round(Math.random() * 22)) + "px;left:" + Math.round(Math.random() * 94) + "%;top:" + Math.round(Math.random() * 90) +
        "%;animation-delay:-" + (Math.random() * 3).toFixed(1) + 's"></span>';
    }
    fx.innerHTML = h;
  });

  // send a request by text message (no server needed), with copy fallback
  window.SG = {
    tel: PHONE_TEL,
    smsHref: function (body) { return "sms:" + PHONE_TEL + "?&body=" + encodeURIComponent(body); },
    copy: function (text, btn) {
      var done = function () { if (btn) { var t = btn.textContent; btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = t; }, 1800); } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
      else { fallback(text); done(); }
      function fallback(t) { var a = doc.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; doc.body.appendChild(a); a.select(); try { doc.execCommand("copy"); } catch (e) {} a.remove(); }
    }
  };

  // quick quote form on the home page (with photo upload)
  var f = doc.getElementById("quick");
  if (f) {
    var msg = doc.getElementById("quick-out"), input = doc.getElementById("q-photos"), thumbs = doc.getElementById("thumbs"), perr = doc.getElementById("photo-err");
    var photos = [], MAX = 6, MAXMB = 12;
    function renderThumbs() {
      thumbs.innerHTML = "";
      photos.forEach(function (file, idx) {
        var li = doc.createElement("li"), im = doc.createElement("img"), bt = doc.createElement("button");
        im.alt = "Selected photo " + (idx + 1); im.src = URL.createObjectURL(file);
        bt.type = "button"; bt.setAttribute("aria-label", "Remove photo " + (idx + 1)); bt.innerHTML = "&times;";
        bt.addEventListener("click", function () { photos.splice(idx, 1); renderThumbs(); });
        li.appendChild(im); li.appendChild(bt); thumbs.appendChild(li);
      });
    }
    input.addEventListener("change", function () {
      perr.style.display = "none"; perr.textContent = "";
      Array.prototype.forEach.call(input.files, function (file) {
        if (!/^image\//.test(file.type)) { perr.textContent = "Only image files can be added."; perr.style.display = "block"; return; }
        if (file.size > MAXMB * 1048576) { perr.textContent = "Each photo must be under " + MAXMB + " MB."; perr.style.display = "block"; return; }
        if (photos.length >= MAX) { perr.textContent = "You can add up to " + MAX + " photos."; perr.style.display = "block"; return; }
        photos.push(file);
      });
      input.value = ""; renderThumbs();
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      f.querySelectorAll("[required]").forEach(function (i) {
        var bad = !i.value.trim();
        i.closest(".fld").classList.toggle("bad", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      var v = function (n) { return (f.elements[n].value || "").trim(); };
      var body = "Hi Steam Genie! I'd like a cleaning quote.\nName: " + v("name") + "\nPhone: " + v("phone") + "\nService: " + v("service") +
        (v("date") ? "\nPreferred date: " + v("date") : "") + (v("msg") ? "\nDetails: " + v("msg") : "");
      var smsBody = body + (photos.length ? "\nI have " + photos.length + " photo" + (photos.length > 1 ? "s" : "") + " to send in this chat." : "");
      msg.hidden = false;
      var note = msg.querySelector("[data-photo-note]");
      msg.querySelector("[data-sms]").href = SG.smsHref(smsBody);
      msg.querySelector("[data-copy]").onclick = function () { SG.copy(smsBody, this); };
      var canShare = photos.length && navigator.canShare && navigator.share && navigator.canShare({ files: photos });
      if (canShare) {
        navigator.share({ title: "Steam Genie quote request", text: body, files: photos }).then(function () { if (note) note.hidden = true; }).catch(function (err) {
          if (err && err.name === "AbortError") return;
          window.location.href = SG.smsHref(smsBody); if (note) note.hidden = false;
        });
      } else {
        window.location.href = SG.smsHref(smsBody);
        if (note) note.hidden = !photos.length;
      }
    });
    f.addEventListener("input", function (e) { var w = e.target.closest(".fld"); if (w) w.classList.remove("bad"); });
  }
})();

/* ---- extras: call-or-text menu, scroll progress, page-wide bubbles ---- */
(function () {
  var d = document, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TEL = "tel:+15878993890", SMS = "sms:+15878993890";

  // Call or text menu
  var menu = d.createElement("div");
  menu.className = "ctmenu"; menu.hidden = true; menu.setAttribute("role", "menu");
  menu.innerHTML = '<a role="menuitem" href="' + TEL + '"><i><svg viewBox="0 0 24 24" fill="currentColor"><use href="#i-phone"/></svg></i><span><b>Call us</b><small>(587) 899-3890</small></span></a>' +
    '<a role="menuitem" href="' + SMS + '?&body=' + encodeURIComponent("Hi Steam Genie! I'd like a cleaning quote.") + '"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><use href="#i-chat"/></svg></i><span><b>Text us</b><small>Opens your messages</small></span></a>';
  d.body.appendChild(menu);
  var openFor = null;
  function closeMenu() { menu.hidden = true; if (openFor) openFor.setAttribute("aria-expanded", "false"); openFor = null; }
  function openMenu(btn) {
    openFor = btn; y0 = window.pageYOffset; btn.setAttribute("aria-expanded", "true"); menu.hidden = false;
    var r = btn.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var left = Math.min(Math.max(12, r.left + r.width / 2 - mw / 2), vw - mw - 12);
    var top = r.bottom + 10; if (top + mh > vh - 12) top = Math.max(12, r.top - mh - 10);
    menu.style.left = left + "px"; menu.style.top = top + "px";
    menu.classList.remove("in"); void menu.offsetWidth; menu.classList.add("in");
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("a.ct");
    if (b) { e.preventDefault(); if (openFor === b && !menu.hidden) closeMenu(); else openMenu(b); return; }
    if (!menu.contains(e.target)) closeMenu();
  });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  var y0 = 0;
  window.addEventListener("scroll", function () { if (!menu.hidden && Math.abs(window.pageYOffset - y0) > 40) closeMenu(); }, { passive: true });
  window.addEventListener("resize", closeMenu);

  // scroll progress bar
  var bar = d.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); d.body.appendChild(bar);
  var tick = false;
  function prog() { var h = d.documentElement.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.pageYOffset / h) : 0) + ")"; tick = false; }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  prog();

  // stagger reveal delays inside groups
  d.querySelectorAll(".cards,.pgrid,.steps,.tgrid,.list").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--d", (i * 0.12) + "s"); });
  });

  // page-wide rising bubbles
  if (!reduce) {
    var sky = d.createElement("div"); sky.className = "sky"; sky.setAttribute("aria-hidden", "true");
    var n = window.innerWidth < 600 ? 8 : 14, h = "";
    for (var i = 0; i < n; i++) {
      var s = 12 + Math.round(Math.random() * 22), dur = 16 + Math.random() * 18, dl = -Math.random() * dur;
      h += '<span style="left:' + Math.round(Math.random() * 98) + "%;width:" + s + "px;height:" + s + "px;animation-duration:" + dur.toFixed(1) + "s," + (3 + Math.random() * 3).toFixed(1) + "s;animation-delay:" + dl.toFixed(1) + 's,0s"></span>';
    }
    sky.innerHTML = h; d.body.appendChild(sky);
  }
})();

/* ---- testimonial slider (auto-moving, swipe, arrows, dots) ---- */
(function () {
  var root = document.getElementById("tslider"); if (!root) return;
  var strip = root.querySelector(".strip"), slides = strip.children, n = slides.length, i = 0, timer = null, drag = null;
  var dots = root.querySelector(".dots"), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (var k = 0; k < n; k++) {
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", "Show testimonial " + (k + 1));
    (function (k) { b.addEventListener("click", function () { go(k, true); }); })(k); dots.appendChild(b);
  }
  function go(x, user) {
    i = (x + n) % n; strip.style.transform = "translateX(" + (-i * 100) + "%)";
    Array.prototype.forEach.call(dots.children, function (d, j) { d.setAttribute("aria-selected", j === i ? "true" : "false"); });
    Array.prototype.forEach.call(slides, function (s, j) { s.setAttribute("aria-hidden", j === i ? "false" : "true"); });
    if (user) restart();
  }
  function play() { if (reduce || n < 2) return; stop(); timer = setInterval(function () { go(i + 1); }, 5500); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); play(); }
  root.querySelector(".prev").addEventListener("click", function () { go(i - 1, true); });
  root.querySelector(".next").addEventListener("click", function () { go(i + 1, true); });
  root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);
  root.addEventListener("focusin", stop); root.addEventListener("focusout", play);
  root.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") go(i - 1, true); if (e.key === "ArrowRight") go(i + 1, true); });
  // swipe
  var vp = root.querySelector(".viewport");
  vp.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, w: vp.offsetWidth }; stop(); });
  window.addEventListener("pointerup", function (e) {
    if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1), true); else play();
  });
  vp.style.touchAction = "pan-y";
  // only run while visible
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? play() : stop(); }, { threshold: 0.2 }).observe(root);
  go(0);
})();
