/* Steam Genie - shared behaviour */
(function () {
  var PHONE_TEL = "+15878993890";
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

  // quick quote form on the home page
  var f = doc.getElementById("quick");
  if (f) {
    var msg = doc.getElementById("quick-out");
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
      msg.hidden = false;
      msg.querySelector("[data-sms]").href = SG.smsHref(body);
      msg.querySelector("[data-copy]").onclick = function () { SG.copy(body, this); };
      window.location.href = SG.smsHref(body);
    });
    f.addEventListener("input", function (e) { var w = e.target.closest(".fld"); if (w) w.classList.remove("bad"); });
  }
})();
