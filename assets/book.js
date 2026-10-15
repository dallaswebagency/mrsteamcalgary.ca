/* Steam Genie - booking wizard (builds a text-message request, no server) */
(function () {
  var CATS = [
    { id: "carpet", title: "Carpet cleaning", icon: "i-carpet", img: "carpet.webp", tint: "blue", items: [
      ["Bedroom", "up to 150 sq ft", 69], ["Large bedroom", "up to 250 sq ft", 99],
      ["Living room", "up to 350 sq ft", 129], ["Basement / large area", "", 199]] },
    { id: "upholstery", title: "Upholstery cleaning", icon: "i-sofa", img: "upholstery.webp", tint: "gold", items: [
      ["Sofa", "up to 7 ft", 99], ["Loveseat", "", 79], ["Chair", "", 59], ["Sectional", "", 149]] },
    { id: "rugs", title: "Area rug cleaning", icon: "i-rug", img: "rugs.webp", tint: "green", items: [
      ["Small rug", "up to 5 x 8 ft", 59], ["Medium rug", "up to 8 x 10 ft", 89],
      ["Large rug", "up to 9 x 12 ft", 129], ["Extra large rug", "10 x 14 ft and up", 199]] }
  ];
  var MIN = 199, step = 1, qty = {}; // key: cat|idx|std/hvy
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + n.toLocaleString("en-CA"); };

  // build services panel
  var host = $("#cats"), html = "";
  CATS.forEach(function (c) {
    html += '<section class="cat t-' + c.tint + '" id="' + c.id + '"><header><button type="button" class="chead" aria-expanded="true" aria-controls="b-' + c.id + '"><img src="../assets/img/' + c.img + '" alt="" aria-hidden="true"><i><svg viewBox="0 0 32 32"><use href="#' + c.icon + '"/></svg></i><h3>' + c.title + '</h3><span class="cnt" data-cnt="' + c.id + '"></span><svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button></header><div class="cbody" id="b-' + c.id + '">';
    c.items.forEach(function (it, i) {
      var k = c.id + "|" + i;
      html += '<div class="row" data-p="' + it[2] + '"><span class="ri"><svg viewBox="0 0 32 32"><use href="#' + c.icon + '"/></svg></span><div class="nm"><b>' + it[0] + "</b>" + (it[1] ? "<small>" + it[1] + "</small>" : "") + "<em><span>Starting at</span> " + money(it[2]) + "</em></div>" +
        ["std", "hvy"].map(function (t) {
          return '<div class="qty"><span class="lb">' + (t === "std" ? "Standard<small>Good condition</small>" : "Heavy Duty<small>Pet hair, stains or odours</small>") + "</span>" +
            '<span class="stp" data-k="' + k + "|" + t + '"><button type="button" class="m" aria-label="Remove one ' + it[0] + " " + (t === "std" ? "standard" : "heavy duty") + '" disabled>&minus;</button><output>0</output><button type="button" class="p" aria-label="Add one ' + it[0] + " " + (t === "std" ? "standard" : "heavy duty") + '">+</button></span></div>';
        }).join("") + "</div>";
    });
    html += "</div></section>";
  });
  host.innerHTML = html;

  host.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("chead")) {
      var sec = b.closest(".cat"), shut = sec.classList.toggle("shut");
      b.setAttribute("aria-expanded", shut ? "false" : "true"); return;
    }
    var s = b.closest(".stp"), k = s.getAttribute("data-k"), n = qty[k] || 0;
    n = b.classList.contains("p") ? Math.min(n + 1, 20) : Math.max(n - 1, 0);
    qty[k] = n; s.querySelector("output").textContent = n;
    s.querySelector(".m").disabled = n === 0;
    rowState(s.closest(".row"));
    render();
  });


  function rowState(row) {
    var n = 0;
    $$(".stp", row).forEach(function (st) { n += qty[st.getAttribute("data-k")] || 0; });
    row.classList.toggle("sel", n > 0);
    var tag = $(".rt", row);
    if (!tag) { tag = document.createElement("span"); tag.className = "rt"; row.appendChild(tag); }
    tag.textContent = n ? n + " selected = " + money(n * (+row.getAttribute("data-p"))) : "";
    var cat = row.closest(".cat"), c = 0;
    $$(".stp", cat).forEach(function (st) { c += qty[st.getAttribute("data-k")] || 0; });
    var badge = $(".cnt", cat); badge.textContent = c ? c + " added" : ""; badge.classList.toggle("on", c > 0);
  }

  function lines() {
    var out = [];
    CATS.forEach(function (c) {
      c.items.forEach(function (it, i) {
        ["std", "hvy"].forEach(function (t) {
          var n = qty[c.id + "|" + i + "|" + t] || 0;
          if (n) out.push({ n: n, name: it[0], kind: t === "std" ? "Standard" : "Heavy Duty", cat: c.title, price: it[2], line: n * it[2] });
        });
      });
    });
    return out;
  }
  function totals() {
    var L = lines(), sub = L.reduce(function (a, l) { return a + l.line; }, 0);
    return { L: L, sub: sub, total: sub ? Math.max(sub, MIN) : 0, hvy: L.some(function (l) { return l.kind === "Heavy Duty"; }) };
  }

  function render() {
    var T = totals(), h = "";
    if (!T.L.length) {
      h = '<div class="empty"><b>No items selected yet.</b>Choose your services to see pricing here.</div>';
    } else {
      h = "<ul>" + T.L.map(function (l) {
        return "<li><span>" + l.n + " &times; " + l.name + "<small>" + l.kind + " &middot; " + l.cat + "</small></span><span>" + money(l.line) + "</span></li>";
      }).join("") + "</ul>" +
        '<div class="tot"><span>Starting at</span><b>' + money(T.total) + "</b></div>";
    }
    h += '<div class="min"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg><span>Minimum service call is ' + money(MIN) + "." + (T.hvy ? " Heavy Duty items are priced after we see them, so your final price is confirmed by text." : " Final price is confirmed by text.") + "</span></div>";
    $$(".sumbody").forEach(function (el) { el.innerHTML = h; });
    $("#bt").textContent = T.total ? "Starting at " + money(T.total) : "No items yet";
    gate();
  }

  // stepper + navigation
  var panels = $$(".panel"), items = $$(".stepper li");
  function show(n, quiet) {
    step = n;
    panels.forEach(function (p, i) { p.classList.toggle("on", i === n - 1); });
    items.forEach(function (li, i) {
      li.classList.toggle("cur", i === n - 1); li.classList.toggle("done", i < n - 1);
      if (i === n - 1) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    document.body.classList.toggle("thanks", n === 5);
    if (n === 4) buildReview();
    gate();
    if (!quiet) { var tgt = $("#wizard"); window.scrollTo({ top: tgt.getBoundingClientRect().top + window.pageYOffset - 90, behavior: "smooth" }); }
  }
  function val(id) { return ($("#" + id).value || "").trim(); }
  function mark(id, bad) { var w = $("#" + id).closest(".fld"); w.classList.toggle("bad", bad); return !bad; }
  function valid(n) {
    if (n === 1) { var ok = totals().L.length > 0; $("#need").hidden = ok; return ok; }
    if (n === 2) {
      var phone = val("d-phone").replace(/\D/g, "");
      var a = mark("d-name", !val("d-name")), b = mark("d-phone", phone.length < 10), c = mark("d-addr", !val("d-addr"));
      return a && b && c;
    }
    if (n === 3) {
      var d = mark("d-date", !val("d-date")), t = !!$('input[name="slot"]:checked');
      $("#slot-fld").classList.toggle("bad", !t);
      return d && t;
    }
    return true;
  }
  function gate() { /* bottom bar button label */
    var b = $("#bnext"); if (!b) return;
    b.textContent = step === 4 ? "Send booking" : "Continue";
  }
  function next() {
    if (step === 4) { $("#send").click(); return; }
    if (valid(step)) show(step + 1);
  }
  $$("[data-next]").forEach(function (b) { b.addEventListener("click", next); });
  $$("[data-back]").forEach(function (b) { b.addEventListener("click", function () { show(Math.max(1, step - 1)); }); });
  $("#bnext").addEventListener("click", next);
  items.forEach(function (li, i) { li.addEventListener("click", function () { if (li.classList.contains("done")) show(i + 1); }); });
  document.addEventListener("input", function (e) { var w = e.target.closest && e.target.closest(".fld"); if (w) w.classList.remove("bad"); });

  // photos (step 2)
  var photos = [], MAXP = 6, MAXMB = 12, pin = $("#d-photos"), pth = $("#d-thumbs"), perr = $("#d-photo-err");
  function thumbs() {
    pth.innerHTML = "";
    photos.forEach(function (file, idx) {
      var li = document.createElement("li"), im = document.createElement("img"), bt = document.createElement("button");
      im.alt = "Selected photo " + (idx + 1); im.src = URL.createObjectURL(file);
      bt.type = "button"; bt.setAttribute("aria-label", "Remove photo " + (idx + 1)); bt.innerHTML = "&times;";
      bt.addEventListener("click", function () { photos.splice(idx, 1); thumbs(); });
      li.appendChild(im); li.appendChild(bt); pth.appendChild(li);
    });
  }
  pin.addEventListener("change", function () {
    perr.style.display = "none"; perr.textContent = "";
    Array.prototype.forEach.call(pin.files, function (file) {
      if (!/^image\//.test(file.type)) { perr.textContent = "Only image files can be added."; perr.style.display = "block"; return; }
      if (file.size > MAXMB * 1048576) { perr.textContent = "Each photo must be under " + MAXMB + " MB."; perr.style.display = "block"; return; }
      if (photos.length >= MAXP) { perr.textContent = "You can add up to " + MAXP + " photos."; perr.style.display = "block"; return; }
      photos.push(file);
    });
    pin.value = ""; thumbs();
  });
  function photoLine() { return photos.length ? "\n\nPHOTOS\nI have " + photos.length + " photo" + (photos.length > 1 ? "s" : "") + " to send in this chat." : ""; }

  // review + send
  var SLOTS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", flex: "Flexible" };
  function pretty(d) { try { return new Date(d + "T12:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); } catch (e) { return d; } }
  function message(withPhotoLine) {
    var T = totals(), s = $('input[name="slot"]:checked');
    var m = "Hi Steam Genie! I'd like to book a cleaning.\n\nSERVICES\n" +
      T.L.map(function (l) { return l.n + " x " + l.name + " (" + l.kind + ")"; }).join("\n") +
      "\nStarting at " + money(T.total) + "\n\nDETAILS\nName: " + val("d-name") + "\nPhone: " + val("d-phone") +
      (val("d-email") ? "\nEmail: " + val("d-email") : "") + "\nAddress: " + val("d-addr") +
      "\nProperty: " + val("d-type") + "\nPets: " + val("d-pets") +
      "\n\nPREFERRED TIME\n" + pretty(val("d-date")) + ", " + (s ? SLOTS[s.value] : "") +
      (val("d-alt") ? "\nBackup date: " + pretty(val("d-alt")) : "") +
      (val("d-notes") ? "\n\nNOTES\n" + val("d-notes") : "") + (withPhotoLine ? photoLine() : "");
    return m;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function buildReview() {
    var T = totals(), s = $('input[name="slot"]:checked');
    $("#rv-serv").innerHTML = T.L.map(function (l) { return "<dt>" + l.n + " &times; " + esc(l.name) + "</dt><dd>" + l.kind + " &middot; " + money(l.line) + "</dd>"; }).join("") +
      "<dt>Starting at</dt><dd>" + money(T.total) + "</dd>";
    $("#rv-det").innerHTML = "<dt>Name</dt><dd>" + esc(val("d-name")) + "</dd><dt>Phone</dt><dd>" + esc(val("d-phone")) + "</dd>" +
      (val("d-email") ? "<dt>Email</dt><dd>" + esc(val("d-email")) + "</dd>" : "") +
      "<dt>Address</dt><dd>" + esc(val("d-addr")) + "</dd><dt>Property</dt><dd>" + esc(val("d-type")) + "</dd><dt>Pets</dt><dd>" + esc(val("d-pets")) + "</dd>" +
      "<dt>When</dt><dd>" + esc(pretty(val("d-date"))) + ", " + (s ? SLOTS[s.value] : "") + "</dd>" +
      (val("d-notes") ? "<dt>Notes</dt><dd>" + esc(val("d-notes")) + "</dd>" : "") +
      (photos.length ? "<dt>Photos</dt><dd>" + photos.length + " added</dd>" : "");
    var m = message(true);
    $("#send").href = SG.smsHref(m);
    $("#copy").onclick = function () { SG.copy(m, this); };
    $("#copy2").onclick = function () { SG.copy(m, this); };
  }
  $("#send").addEventListener("click", function (e) {
    var body = message(false), canShare = photos.length && navigator.canShare && navigator.share && navigator.canShare({ files: photos });
    if (canShare) {
      e.preventDefault();
      navigator.share({ title: "Steam Genie booking request", text: body, files: photos })
        .then(function () { thanks(); })
        .catch(function (err) { if (err && err.name === "AbortError") return; window.location.href = SG.smsHref(message(true)); thanks(); });
    } else {
      thanks();
    }
  });
  function thanks() {
    setTimeout(function () {
      show(5, true);
      var p = $("#p5"); window.scrollTo({ top: $("#wizard").getBoundingClientRect().top + window.pageYOffset - 80, behavior: "smooth" });
      try { p.focus({ preventScroll: true }); } catch (e) {}
    }, 400);
  }

  // date limits
  var today = new Date(), iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  $("#d-date").min = iso(today); $("#d-alt").min = iso(today);

  // deep link (#carpet etc.)
  render(); show(1, true);
  window.addEventListener("hashchange", function () { var el = location.hash && $(location.hash); if (el && el.classList.contains("cat")) { if (step !== 1) show(1, true); el.classList.remove("shut"); setTimeout(function () { el.scrollIntoView({ behavior: "smooth" }); }, 50); } });
  if (location.hash) setTimeout(function () { var el = $(location.hash); if (el && el.classList.contains("cat")) el.scrollIntoView(); }, 300);
})();
