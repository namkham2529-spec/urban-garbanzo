/* ============================================================
   บุรีรัมย์ลีก อะคาเดมี่ — main.js
   ต้องโหลด assets/js/data.js ก่อน (window.BLA)
   ============================================================ */
(function () {
  "use strict";
  var BLA = window.BLA || {};
  var CFG = BLA.config || {};
  var IMG = "assets/img/teams/";
  var LEAGUE_LOGO = "assets/img/bla-league.png";

  document.documentElement.classList.add("js");

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function teamBy(name) {
    return (BLA.teams || []).filter(function (t) { return t.name === name; })[0] || null;
  }
  function logoUrl(name) {
    var t = teamBy(name);
    return t ? IMG + t.slug + ".png" : "";
  }
  function bgLogo(name) {
    var u = logoUrl(name);
    return u ? ' style="background-image:url(' + u + ')"' : "";
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- mobile nav ---------- */
  (function () {
    var toggle = $(".nav-toggle"), links = $(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") links.classList.remove("open"); });
  })();

  /* ---------- active nav link ---------- */
  (function () {
    var here = location.pathname.split("/").pop() || "index.html";
    $all(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === here || (here === "" && href === "index.html")) a.classList.add("active");
    });
  })();

  /* ---------- footer year (พ.ศ.) ---------- */
  (function () { var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear() + 543; })();

  /* ---------- reveal on scroll ---------- */
  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observeReveals(scope) {
    $all(".reveal:not(.in)", scope).forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });
  }
  setTimeout(function () {
    $all(".reveal:not(.in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 1.5) el.classList.add("in");
    });
  }, 2500);

  /* ---------- club grid (cards) ---------- */
  function renderClubs() {
    $all("[data-clubs]").forEach(function (host) {
      var limit = parseInt(host.getAttribute("data-clubs"), 10);
      var teams = (BLA.teams || []).slice().sort(function (a, b) {
        if (!!b.founding - !!a.founding) return !!b.founding - !!a.founding;
        return a.name.localeCompare(b.name, "th");
      });
      if (limit > 0) teams = teams.slice(0, limit);
      host.innerHTML = teams.map(function (t) {
        return '<article class="club-card reveal" data-province="' + esc(t.province) + '" data-since="' + t.since + '">' +
          '<span class="club-logo" style="background-image:url(' + IMG + t.slug + '.png)" aria-hidden="true"></span>' +
          '<div><div class="en">' + esc(t.en) + '</div><h3>' + esc(t.name) + '</h3>' +
          '<div class="loc">' + esc(t.city) + " · " + esc(t.province) + '</div>' +
          (t.venue ? '<div class="venue">🏟 ' + esc(t.venue) + '</div>' : "") +
          '<span class="tag ' + (t.founding ? "founding" : "joined") + '">' +
          (t.founding ? "รุ่นก่อตั้ง 2567" : "เข้าร่วม " + t.since) + "</span>" +
          (t.note ? '<div class="note">' + esc(t.note) + "</div>" : "") +
          "</div></article>";
      }).join("");
      observeReveals(host);
    });
  }

  function wireClubFilters() {
    var bar = $("[data-club-filters]");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      $all(".chip", bar).forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      var f = chip.getAttribute("data-filter");
      $all(".club-card").forEach(function (card) {
        var show = f === "all" ||
          (f === "founding" && card.getAttribute("data-since") === "2567") ||
          (f === "new" && card.getAttribute("data-since") === "2568") ||
          (f === card.getAttribute("data-province"));
        card.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- club directory (logos linked to facebook) ---------- */
  function renderRoster() {
    var host = $("[data-roster]");
    if (!host) return;
    var teams = (BLA.teams || []).slice().sort(function (a, b) {
      if (!!b.founding - !!a.founding) return !!b.founding - !!a.founding;
      return a.name.localeCompare(b.name, "th");
    });
    host.innerHTML = teams.map(function (t) {
      var logo = '<span class="r-logo" style="background-image:url(' + IMG + t.slug + '.png)" aria-hidden="true"></span>';
      var name = '<span class="r-name">' + esc(t.name) + "</span>";
      var fb = t.fb
        ? '<span class="r-fb">Facebook &rarr;</span>'
        : '<span class="r-fb off">ยังไม่มีลิงก์</span>';
      var inner = logo + name + fb;
      return t.fb
        ? '<a class="roster-item reveal" href="' + esc(t.fb) + '" target="_blank" rel="noopener" ' +
          'title="เฟซบุ๊ก ' + esc(t.name) + '">' + inner + "</a>"
        : '<div class="roster-item reveal">' + inner + "</div>";
    }).join("");
    observeReveals(host);
  }

  /* ---------- full fixtures (with venues) ---------- */
  function renderSchedule() {
    var host = $("[data-schedule]");
    if (!host) return;
    var cap = parseInt(host.getAttribute("data-rounds"), 10);
    var list = BLA.schedule || [];
    if (cap > 0) list = list.slice(0, cap);
    var timeLabels = { U14:"U14", U12:"U12", parent:"รุ่นผู้ปกครอง", U10:"U10", U8:"U8" };
    host.innerHTML = list.map(function (r) {
      var rows = r.matches.map(function (m) {
        var times = m.times ? '<div class="m-times">' +
          ["U14","U12","parent","U10","U8"].filter(function (k) { return m.times[k]; }).map(function (k) {
            return '<span class="m-time' + (k === "parent" ? " parent" : "") + '"><b>' + timeLabels[k] + '</b>' + esc(m.times[k]) + "</span>";
          }).join("") + "</div>" : "";
        return '<div class="match">' +
          '<div class="side home"><span class="m-logo"' + bgLogo(m.home) + ' aria-hidden="true"></span><span class="m-name">' + esc(m.home) + "</span></div>" +
          '<span class="vs">พบ</span>' +
          '<div class="side away"><span class="m-logo"' + bgLogo(m.away) + ' aria-hidden="true"></span><span class="m-name">' + esc(m.away) + "</span></div>" +
          (m.venue ? '<div class="m-venue">' + esc(m.venue) + "</div>" : "") +
          times +
          "</div>";
      }).join("");
      var label = "สัปดาห์ที่ " + r.round + (r.date ? " · " + esc(r.date) : "");
      if (r.final) label += " · นัดปิดฤดูกาล";
      var venueLine = r.central ? "สนามกลาง · " + esc(r.venue) : "เจ้าภาพหมุนเวียนตามสนามสโมสร";
      var note = r.note ? '<p class="round-note">' + esc(r.note) + "</p>" : "";
      return '<section class="round reveal' + (r.final ? " final" : (r.central ? " central" : "")) + '">' +
        '<header class="round-head"><span class="r-no">' + label + "</span>" +
        '<span class="r-venue">' + venueLine + "</span></header>" +
        note +
        '<div class="match-list">' + rows + "</div></section>";
    }).join("");
    observeReveals(host);
  }

  /* ---------- history timeline ---------- */
  function renderHistory() {
    var host = $("[data-history]");
    if (!host) return;
    host.innerHTML = (BLA.history || []).map(function (h) {
      return '<div class="tl-item reveal"><div class="tl-year' + (h.now ? " now" : "") + '">' + h.year + "</div><div>" +
        '<span class="tl-tag">' + esc(h.tag) + "</span><p>" + esc(h.body) + "</p>" +
        (h.teams && h.teams.length ? '<div class="tl-teams">' + h.teams.map(esc).join("  ·  ") + "</div>" : "") +
        "</div></div>";
    }).join("");
    observeReveals(host);
  }

  /* ---------- age-group tabs ---------- */
  function wireTabs() {
    $all("[data-tabs]").forEach(function (bar) {
      var panes = bar.getAttribute("data-tabs");
      bar.addEventListener("click", function (e) {
        var tab = e.target.closest(".tab"); if (!tab) return;
        $all(".tab", bar).forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        var val = tab.getAttribute("data-tab");
        $all("[data-tabpane='" + panes + "']").forEach(function (p) {
          p.hidden = p.getAttribute("data-value") !== val;
        });
      });
    });
  }

  /* ---------- standings (computed from results) ---------- */
  function computeStandings(ageGroup) {
    var table = {};
    (BLA.teams || []).forEach(function (t) {
      table[t.name] = { name: t.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
    });
    (BLA.results || []).forEach(function (m) {
      if (ageGroup && m.ageGroup !== ageGroup) return;
      if (!table[m.home] || !table[m.away]) return;
      if (m.hs == null || m.as == null) return;
      var h = table[m.home], a = table[m.away];
      h.P++; a.P++; h.GF += m.hs; h.GA += m.as; a.GF += m.as; a.GA += m.hs;
      if (m.hs > m.as) { h.W++; a.L++; h.Pts += 3; }
      else if (m.hs < m.as) { a.W++; h.L++; a.Pts += 3; }
      else { h.D++; a.D++; h.Pts++; a.Pts++; }
    });
    return Object.keys(table).map(function (k) { return table[k]; }).sort(function (x, y) {
      return (y.Pts - x.Pts) || ((y.GF - y.GA) - (x.GF - x.GA)) || (y.GF - x.GF) ||
        x.name.localeCompare(y.name, "th");
    });
  }

  function renderStandings() {
    var host = $("[data-standings]");
    if (!host) return;
    var hasResults = (BLA.results || []).length > 0;
    var groups = (BLA.meta && BLA.meta.ageGroups) || ["U8", "U10", "U12", "U14"];

    host.innerHTML =
      '<div class="tabs" role="tablist" data-tabs="standings">' +
      groups.map(function (g, i) {
        return '<button class="tab" role="tab" data-tab="' + g + '" aria-selected="' + (i === 0) + '">' + g + "</button>";
      }).join("") + "</div>" +
      groups.map(function (g, i) {
        var rows = computeStandings(g).map(function (r, idx) {
          return "<tr><td class='pos'>" + (idx + 1) + "</td>" +
            "<td class='team'><span class='team-cell'><span class='t-logo'" + bgLogo(r.name) + "></span>" + esc(r.name) + "</span></td>" +
            "<td>" + r.P + "</td><td>" + r.W + "</td><td>" + r.D + "</td><td>" + r.L + "</td>" +
            "<td>" + r.GF + "</td><td>" + r.GA + "</td><td>" + (r.GF - r.GA) + "</td>" +
            "<td class='pts'>" + r.Pts + "</td></tr>";
        }).join("");
        var body =
          (hasResults ? "" : '<p class="pill-note" style="margin-bottom:.9rem">ฤดูกาลยังไม่เริ่ม — ทุกทีมขึ้นต้นที่ 0 คะแนน เรียงตามชื่อสโมสร จะอัปเดตอัตโนมัติเมื่อบันทึกผลการแข่งขัน</p>') +
          '<div class="table-wrap"><table class="standings"><thead><tr>' +
            "<th class='pos'>#</th><th class='team'>สโมสร</th><th>แข่ง</th><th>ชนะ</th><th>เสมอ</th><th>แพ้</th>" +
            "<th>ได้</th><th>เสีย</th><th>+/−</th><th class='pts'>แต้ม</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
        return '<div class="tabpane" data-tabpane="standings" data-value="' + g + '"' + (i === 0 ? "" : " hidden") + ">" + body + "</div>";
      }).join("");
    wireTabs();
  }

  /* ---------- results ---------- */
  function renderResults() {
    var host = $("[data-results]");
    if (!host) return;
    var groups = (BLA.meta && BLA.meta.ageGroups) || ["U8", "U10", "U12", "U14"];
    var all = BLA.results || [];

    if (!all.length) {
      host.innerHTML = '<div class="empty-state"><strong>ยังไม่มีผลการแข่งขัน</strong>' +
        "ผลการแข่งขันแต่ละรุ่นอายุจะแสดงที่นี่เมื่อเริ่มฤดูกาล</div>";
      return;
    }
    host.innerHTML =
      '<div class="tabs" role="tablist" data-tabs="results">' +
      groups.map(function (g, i) {
        return '<button class="tab" role="tab" data-tab="' + g + '" aria-selected="' + (i === 0) + '">' + g + "</button>";
      }).join("") + "</div>" +
      groups.map(function (g, i) {
        var byRound = {};
        all.filter(function (m) { return m.ageGroup === g; }).forEach(function (m) {
          (byRound[m.round] = byRound[m.round] || []).push(m);
        });
        var rounds = Object.keys(byRound).sort(function (a, b) { return a - b; });
        var body = rounds.length
          ? rounds.map(function (rn) {
              return '<div class="result-round"><h3>สัปดาห์ที่ ' + rn + "</h3>" +
                byRound[rn].map(function (m) {
                  return '<div class="result-row">' +
                    '<div class="side home"><span class="r-logo"' + bgLogo(m.home) + '></span><span class="m-name">' + esc(m.home) + "</span></div>" +
                    '<span class="score">' + esc(m.hs) + " – " + esc(m.as) + "</span>" +
                    '<div class="side away"><span class="r-logo"' + bgLogo(m.away) + '></span><span class="m-name">' + esc(m.away) + "</span></div>" +
                    "</div>";
                }).join("") + "</div>";
            }).join("")
          : '<div class="empty-state">ยังไม่มีผลของรุ่น ' + g + "</div>";
        return '<div class="tabpane" data-tabpane="results" data-value="' + g + '"' + (i === 0 ? "" : " hidden") + ">" + body + "</div>";
      }).join("");
    wireTabs();
  }

  /* ---------- register ---------- */
  function renderRegister() {
    var host = $("[data-register]");
    if (!host) return;

    /* 1) ฟอร์มในเว็บ (ส่งไป Apps Script /exec) */
    if (CFG.registerEndpoint) {
      var opts = (BLA.teams || []).slice()
        .sort(function (a, b) { return a.name.localeCompare(b.name, "th"); })
        .map(function (t) { return '<option value="' + esc(t.name) + '">' + esc(t.name) + "</option>"; }).join("");
      host.innerHTML =
        '<iframe name="blaRegSink" style="display:none" title="sink"></iframe>' +
        '<form class="reg-form" id="blaRegForm" method="POST" action="' + esc(CFG.registerEndpoint) + '" target="blaRegSink" novalidate>' +
          '<div class="rf-grid">' +
            '<div class="rf-section rf-full">ข้อมูลนักกีฬา</div>' +
            fld_("ชื่อสโมสร", '<select name="ชื่อสโมสร" required><option value="" disabled selected>— เลือกสโมสร —</option>' + opts + "</select>", true, true) +
            fld_("รุ่นอายุ",
              '<div class="rf-radios">' + ["U8", "U10", "U12", "U14"].map(function (g) {
                return '<label class="rf-radio"><input type="radio" name="รุ่นอายุ" value="' + g + '" required> ' + g + "</label>";
              }).join("") + "</div>", true, true) +
            fld_("ชื่อ-นามสกุลนักกีฬา", '<input type="text" name="ชื่อ-นามสกุลนักกีฬา" required autocomplete="name">', true, true) +
            fld_("วันเดือนปีเกิด", '<input type="date" name="วันเดือนปีเกิด" required>', true) +
            fld_("เลขบัตรประชาชน / เลขนักเรียน", '<input type="text" name="เลขบัตร" inputmode="numeric" autocomplete="off">', false) +
            fld_("เบอร์เสื้อ", '<input type="text" name="เบอร์เสื้อ" inputmode="numeric" style="max-width:8rem">', false) +

            '<div class="rf-section rf-full">รูปถ่ายนักกีฬา</div>' +
            '<label class="rf-field rf-full">' +
              '<span class="rf-label">อัปโหลดรูปถ่ายหน้าตรง เห็นหน้าชัดเจน <em class="rf-req">*</em></span>' +
              '<input type="file" id="blaPhotoFile" accept="image/*" required>' +
              '<input type="hidden" name="รูปภาพ" id="blaPhotoData">' +
              '<input type="hidden" name="ชื่อไฟล์รูป" id="blaPhotoName">' +
              '<span class="rf-hint">ใช้พิมพ์ลงบัตรประจำตัวนักกีฬา — ไฟล์ JPG/PNG ไม่เกิน 10 MB ระบบจะย่อขนาดให้อัตโนมัติ</span>' +
              '<div class="rf-photo-preview" id="blaPhotoPreview" hidden><img id="blaPhotoImg" alt="ตัวอย่างรูปที่เลือก"><span id="blaPhotoInfo"></span></div>' +
            "</label>" +

            '<div class="rf-section rf-full">ข้อมูลผู้ปกครอง</div>' +
            fld_("ชื่อผู้ปกครอง", '<input type="text" name="ชื่อผู้ปกครอง" required>', true) +
            fld_("เบอร์ติดต่อผู้ปกครอง", '<input type="tel" name="เบอร์ติดต่อผู้ปกครอง" required pattern="[0-9\\-() ]{9,}" placeholder="08x-xxx-xxxx">', true) +
          "</div>" +
          '<p class="rf-note">รุ่นอายุ: U8 = เกิด พ.ศ. 2561 · U10 = 2559 · U12 = 2557 · U14 = 2555 — รุ่น U14 ลงทะเบียนนักกีฬาอายุ 15 ปีได้ไม่จำกัด แต่ลงสนามพร้อมกันได้ไม่เกิน 2 คน/ทีม/นัด</p>' +
          '<button type="submit" class="btn btn-ember" id="blaRegBtn">ส่งลงทะเบียน</button>' +
          '<div class="rf-msg" id="blaRegMsg" hidden></div>' +
        "</form>";
      wireRegForm();
      return;
    }

    /* 2) หรือฝัง Google Form */
    if (CFG.registerFormUrl) {
      host.innerHTML = '<div class="form-embed"><iframe src="' + esc(CFG.registerFormUrl) +
        '" loading="lazy" title="แบบฟอร์มลงทะเบียนนักกีฬา">กำลังโหลดฟอร์ม…</iframe></div>' +
        '<p style="margin-top:1rem"><a class="btn btn-ghost" target="_blank" rel="noopener" href="' +
        esc(CFG.registerFormUrl) + '">เปิดฟอร์มในแท็บใหม่</a></p>';
      return;
    }

    /* 3) ยังไม่ตั้งค่า */
    host.innerHTML = '<div class="form-missing"><strong style="display:block;color:var(--ink);font-size:1.1rem;margin-bottom:.5rem">ยังไม่ได้เชื่อมระบบลงทะเบียน</strong>' +
      "ติดตั้ง <code>tools/registration-backend.gs</code> แล้ววาง URL <code>/exec</code> ที่ <code>config.registerEndpoint</code> ใน <code>assets/js/data.js</code> — ฟอร์มจะปรากฏที่นี่ทันที</div>";
  }

  function fld_(label, control, req, full) {
    return '<label class="rf-field' + (full ? " rf-full" : "") + '"><span class="rf-label">' + esc(label) +
      (req ? ' <em class="rf-req">*</em>' : "") + "</span>" + control + "</label>";
  }

  /* ย่อรูปด้วย canvas ก่อนแปลงเป็น base64 (จำกัดด้านยาวสุด + คุณภาพ JPEG) */
  function resizePhoto_(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement("canvas");
          canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), w: cw, h: ch });
        };
        img.onerror = function () { reject(new Error("โหลดรูปไม่สำเร็จ")); };
        img.src = ev.target.result;
      };
      reader.onerror = function () { reject(new Error("อ่านไฟล์ไม่สำเร็จ")); };
      reader.readAsDataURL(file);
    });
  }

  function wireRegForm() {
    var form = $("#blaRegForm"), btn = $("#blaRegBtn"), msg = $("#blaRegMsg");
    if (!form) return;

    var fileInput = $("#blaPhotoFile"), dataField = $("#blaPhotoData"), nameField = $("#blaPhotoName"),
      preview = $("#blaPhotoPreview"), previewImg = $("#blaPhotoImg"), previewInfo = $("#blaPhotoInfo");

    if (fileInput) fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      dataField.value = ""; nameField.value = "";
      if (preview) preview.hidden = true;
      if (!f) return;
      if (!/^image\//.test(f.type)) { alert("กรุณาเลือกไฟล์รูปภาพ (JPG หรือ PNG)"); fileInput.value = ""; return; }
      if (f.size > 10 * 1024 * 1024) { alert("ไฟล์รูปใหญ่เกิน 10 MB กรุณาเลือกไฟล์อื่น"); fileInput.value = ""; return; }
      resizePhoto_(f, 720, 0.82).then(function (r) {
        dataField.value = r.dataUrl;
        nameField.value = f.name;
        if (previewImg) previewImg.src = r.dataUrl;
        if (previewInfo) previewInfo.textContent = f.name + " · " + r.w + "×" + r.h + "px";
        if (preview) preview.hidden = false;
      }).catch(function () {
        alert("ไม่สามารถประมวลผลไฟล์รูปนี้ได้ ลองไฟล์อื่น");
        fileInput.value = "";
      });
    });

    form.addEventListener("submit", function (e) {
      var photoMissing = fileInput && fileInput.hasAttribute("required") && !dataField.value;
      if (!form.checkValidity() || photoMissing) {
        e.preventDefault();
        if (photoMissing) alert("กรุณาอัปโหลดรูปถ่ายนักกีฬาก่อนส่งลงทะเบียน");
        else form.reportValidity();
        return;
      }
      btn.disabled = true; btn.textContent = "กำลังส่ง…";
      setTimeout(function () {
        msg.hidden = false;
        msg.className = "rf-msg ok";
        msg.textContent = "ส่งข้อมูลเรียบร้อย ขอบคุณครับ — ฝ่ายจัดการแข่งขันจะออกบัตรประจำตัวนักกีฬาให้ต่อไป";
        form.reset();
        if (preview) preview.hidden = true;
        if (dataField) dataField.value = "";
        if (nameField) nameField.value = "";
        btn.disabled = false; btn.textContent = "ส่งลงทะเบียนอีกคน";
      }, 1200);
    });
  }

  /* ---------- athlete ID-card generator ---------- */
  function parseCSV(text) {
    var rows = [], row = [], val = "", q = false, i, c;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { val += '"'; i++; }
        else if (c === '"') q = false;
        else val += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(val); val = ""; }
      else if (c === "\n") { row.push(val); rows.push(row); row = []; val = ""; }
      else val += c;
    }
    if (val.length || row.length) { row.push(val); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ""; }); });
  }

  /* จับคู่กับหัวคอลัมน์ในชีต 'ทะเบียนนักกีฬา' ของไฟล์กลาง BLA 2026 */
  var FIELD_ALIASES = {
    name: ["ชื่อ-นามสกุลนักกีฬา", "ชื่อ-สกุล", "ชื่อ - สกุล", "ชื่อสกุล", "ชื่อ", "name", "full name", "fullname"],
    team: ["ชื่อสโมสร", "สโมสร", "ทีม", "อะคาเดมี่", "club", "team"],
    age: ["รุ่นอายุ", "รุ่น", "age group", "agegroup", "age", "รุ่น อายุ"],
    dob: ["วันเดือนปีเกิด", "วันเกิด", "วัน/เดือน/ปีเกิด", "dob", "date of birth", "birthdate"],
    number: ["เบอร์เสื้อ", "หมายเลข", "number", "shirt number", "no"],
    id: ["เลขบัตร ปชช./เลขนักเรียน", "เลขบัตรประชาชน", "เลขนักเรียน", "รหัสนักกีฬา", "รหัส", "id", "player id", "citizen id"],
    guardian: ["ชื่อผู้ปกครอง", "ผู้ปกครอง", "guardian"],
    guardianPhone: ["เบอร์ติดต่อผู้ปกครอง", "เบอร์ผู้ปกครอง", "guardian phone"],
    photo: ["ลิงก์รูป", "รูปถ่าย", "photo", "photo url", "image", "picture"],
    pos: ["ตำแหน่ง", "position", "pos"],
    ts: ["ประทับเวลา", "timestamp", "เวลาบันทึก", "วันที่บันทึก"]
  };

  /* คีย์เรียงเวลาจากรูปแบบ M/D/YYYY H:MM:SS (Google ฟอร์ม) */
  function tsKey_(s) {
    var m = String(s || "").match(/(\d+)\/(\d+)\/(\d+)[ T]+(\d+):(\d+)(?::(\d+))?/);
    if (!m) return "";
    var p2 = function (x) { return ("0" + x).slice(-2); };
    return m[3] + p2(m[1]) + p2(m[2]) + p2(m[4]) + p2(m[5]) + p2(m[6] || 0);
  }
  /* ตัดคำนำหน้าชื่อ + ช่องว่างซ้ำ เพื่อจับชื่อซ้ำ */
  function normName_(n) {
    return String(n || "").trim()
      .replace(/^(ด\.ช\.?|ด\.ญ\.?|เด็กชาย|เด็กหญิง|น\.ส\.?|นางสาว|นาย|นาง)\s*/, "")
      .replace(/\s+/g, " ");
  }

  function pickCol(headers, key) {
    var lower = headers.map(function (h) { return h.trim().toLowerCase(); });
    var aliases = FIELD_ALIASES[key] || [];
    for (var a = 0; a < aliases.length; a++) {
      var idx = lower.indexOf(aliases[a].toLowerCase());
      if (idx !== -1) return idx;
    }
    for (var i = 0; i < lower.length; i++) {
      for (var j = 0; j < aliases.length; j++) {
        if (lower[i].indexOf(aliases[j].toLowerCase()) !== -1) return i;
      }
    }
    return -1;
  }

  /* แปลงลิงก์ Google Drive ทุกแบบ → ลิงก์ที่ฝังใน <img> ข้ามโดเมนได้จริง
     ใช้ lh3.googleusercontent.com/d/<id>=w1000 : เสิร์ฟ image/png พร้อม
     Access-Control-Allow-Origin: * และไม่มี Cross-Origin-Resource-Policy บล็อก
     (drive.usercontent.google.com/download ส่ง CORP: same-site จึงโดนบล็อกบนเน็ตลิฟาย) */
  function drivePhoto_(url) {
    if (!url) return "";
    var id = "";
    var m = url.match(/\/file\/d\/([-\w]{20,})/) ||
            url.match(/[?&]id=([-\w]{20,})/) ||
            url.match(/googleusercontent\.com\/d\/([-\w]{20,})/) ||
            url.match(/[-\w]{25,}/);
    if (m) id = m[1] || m[0];
    return id ? "https://lh3.googleusercontent.com/d/" + id + "=w1000" : url;
  }

  function normAge(raw) {
    var s = String(raw || "").toUpperCase().replace(/[^0-9]/g, "");
    if (s === "8") return "U8";
    if (s === "10") return "U10";
    if (s === "12") return "U12";
    if (s === "14") return "U14";
    var m = String(raw || "").toUpperCase().match(/U\s*(8|10|12|14)/);
    return m ? "U" + m[1] : "";
  }

  /* กรองบัตรตามสโมสร + รุ่นอายุ (ซ่อนด้วย CSS เท่านั้น — ข้อมูลและบัตรเดิมไม่ถูกแก้) */
  var cardFilter = { team: "all", age: "all" };
  (function () {
    var q = new URLSearchParams(location.search);
    if (q.get("club")) cardFilter.team = q.get("club");
    if (q.get("age")) cardFilter.age = q.get("age");
  })();

  function applyCardFilters() {
    var shown = 0;
    $all("[data-cards] .id-card").forEach(function (card) {
      var ok = (cardFilter.team === "all" || card.getAttribute("data-team") === cardFilter.team) &&
               (cardFilter.age === "all" || card.getAttribute("data-age") === cardFilter.age);
      card.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    var cb = $("[data-club-filter]");
    if (cb) $all(".chip", cb).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-team") === cardFilter.team ? "true" : "false"); });
    var ab = $("[data-card-filter]");
    if (ab) $all(".chip", ab).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-age") === cardFilter.age ? "true" : "false"); });
    var cnt = $("[data-card-count]"); if (cnt) cnt.textContent = "แสดง " + shown + " ใบ";
    var title = $("[data-print-title]");
    if (title) title.textContent = "บัตรประจำตัวนักกีฬา · " + (cardFilter.team === "all" ? "ทุกสโมสร" : cardFilter.team) +
      (cardFilter.age === "all" ? "" : " · " + cardFilter.age) + " · ฤดูกาล 2026";
    var cp = $("[data-copy-link]"); if (cp) cp.hidden = cardFilter.team === "all";
    try {
      var p = new URLSearchParams();
      if (cardFilter.team !== "all") p.set("club", cardFilter.team);
      if (cardFilter.age !== "all") p.set("age", cardFilter.age);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
    } catch (e) {}
  }

  function buildClubFilter(teams) {
    var bar = $("[data-club-filter]"); if (!bar) return;
    var counts = {}; teams.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    var names = Object.keys(counts).sort(function (a, b) { return a.localeCompare(b, "th"); });
    if (cardFilter.team !== "all" && !counts[cardFilter.team]) cardFilter.team = "all";
    bar.innerHTML = '<button class="chip" data-team="all" aria-pressed="true">ทุกสโมสร (' + teams.length + ')</button>' +
      names.map(function (n) { return '<button class="chip" data-team="' + esc(n) + '" aria-pressed="false">' + esc(n || "ไม่ระบุสโมสร") + ' (' + counts[n] + ')</button>'; }).join("");
    bar.hidden = false;
  }

  function renderCards(text) {
    var out = $("[data-cards]");
    var status = $("[data-gen-status]");
    if (!out) return;
    var rows = parseCSV(text);
    if (rows.length < 2) { out.innerHTML = ""; if (status) status.textContent = "ไม่พบข้อมูล — วางข้อมูล CSV ที่มีหัวตารางอย่างน้อย 1 แถว"; return; }
    var headers = rows[0];
    var col = {};
    Object.keys(FIELD_ALIASES).forEach(function (k) { col[k] = pickCol(headers, k); });
    if (col.name === -1) { out.innerHTML = ""; if (status) status.textContent = "ไม่พบคอลัมน์ชื่อนักกีฬา (เช่น \"ชื่อ-สกุล\")"; return; }

    var themes = BLA.cardThemes || {};
    var body = rows.slice(1).filter(function (r) { return (r[col.name] || "").trim() !== ""; });

    /* ตัดชื่อซ้ำ — เก็บใบที่ประทับเวลาใหม่สุด (ไม่มีคอลัมน์เวลา = เก็บแถวล่างสุด) */
    var dupCount = 0, seen = {};
    body.forEach(function (r, i) {
      var k = normName_(r[col.name]);
      if (!k) return;
      var t = col.ts > -1 ? tsKey_(r[col.ts]) : ("0000000000000" + (10000 + i));
      if (!seen[k]) { seen[k] = { r: r, t: t }; }
      else { dupCount++; if (t >= seen[k].t) seen[k] = { r: r, t: t }; }
    });
    body = Object.keys(seen).map(function (k) { return seen[k].r; });

    /* เรียง สโมสร → รุ่นอายุ → ชื่อ เพื่อพิมพ์บัตรเป็นชุด */
    var ageOrd = { U8: 1, U10: 2, U12: 3, U14: 4 };
    body.sort(function (a, b) {
      var ca = (a[col.team] || ""), cb = (b[col.team] || "");
      if (ca !== cb) return ca.localeCompare(cb, "th");
      var aa = ageOrd[normAge(a[col.age])] || 9, ab = ageOrd[normAge(b[col.age])] || 9;
      if (aa !== ab) return aa - ab;
      return normName_(a[col.name]).localeCompare(normName_(b[col.name]), "th");
    });

    var count = 0;
    var html = body.map(function (r, idx) {
      var get = function (k) { return col[k] > -1 ? (r[col[k]] || "").trim() : ""; };
      var age = normAge(get("age"));
      var th = themes[age] || { label: "รุ่นอายุ —", accent: "#2F80ED" };
      var team = get("team");
      var tLogo = logoUrl(team);
      var photo = drivePhoto_(get("photo"));
      var cardNo = get("id") || String(idx + 1).padStart(4, "0");
      count++;

      var meta = "";
      if (get("dob")) meta += "<div><dt>วันเกิด</dt><dd>" + esc(get("dob")) + "</dd></div>";
      if (get("number")) meta += "<div><dt>เบอร์เสื้อ</dt><dd>" + esc(get("number")) + "</dd></div>";
      if (get("pos")) meta += "<div><dt>ตำแหน่ง</dt><dd>" + esc(get("pos")) + "</dd></div>";

      return '<div class="id-card" data-age="' + esc(age) + '" data-team="' + esc(team) + '" style="--c:' + esc(th.accent) + '">' +
        '<span class="ic-slot" aria-hidden="true"></span>' +
        '<span class="ic-wm" aria-hidden="true">BLA</span>' +
        '<header class="ic-head">' +
          '<img class="ic-crest" src="' + LEAGUE_LOGO + '" alt="">' +
          '<span class="ic-wordmark">บุรีรัมย์ลีก อะคาเดมี่<em>Buriram League Academy</em></span>' +
        '</header>' +
        '<div class="ic-photo-wrap">' +
        (photo
          ? '<img class="ic-photo" src="' + esc(photo) + '" alt="" referrerpolicy="no-referrer">'
          : '<span class="ic-photo--empty">รูปถ่าย<br>นักกีฬา</span>') +
        '</div>' +
        '<div class="ic-cat"><b>' + esc(age || "—") + '</b><span>' + esc(th.label) + '</span></div>' +
        '<div class="ic-name">' + esc(get("name") || "—") + '</div>' +
        '<div class="ic-club">' +
        (tLogo ? '<img src="' + tLogo + '" alt="">' : '<span class="ic-club-dot"></span>') +
        '<span>' + esc(team || "บุรีรัมย์ลีก อะคาเดมี่") + '</span></div>' +
        (meta ? '<dl class="ic-meta">' + meta + '</dl>' : '') +
        '<footer class="ic-foot"><span>เลขที่บัตร <b>' + esc(cardNo) + '</b></span><span>ฤดูกาล 2026</span></footer>' +
        '</div>';
    }).join("");

    out.innerHTML = html;
    if (status) status.textContent = "สร้างบัตรแล้ว " + count + " ใบ (แนวตั้ง)" +
      (dupCount ? " · ตัดชื่อซ้ำอัตโนมัติ " + dupCount + " รายการ" : "") +
      " · เรียงตามสโมสร→รุ่น — กรองรุ่นอายุแล้วสั่งพิมพ์ PDF ได้เลย";
    var bar = $("[data-card-filter]");
    if (bar) bar.hidden = false;
    var teamsOf = []; $all("[data-cards] .id-card").forEach(function (c) { teamsOf.push(c.getAttribute("data-team") || ""); });
    buildClubFilter(teamsOf);
    applyCardFilters();
  }

  function wireGenerator() {
    var ta = $("[data-csv-input]");
    if (!ta) return;
    var file = $("[data-csv-file]");
    var run = $("[data-csv-run]");
    var sample = $("[data-csv-sample]");

    if (run) run.addEventListener("click", function () { renderCards(ta.value); });
    if (file) file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { ta.value = fr.result; renderCards(ta.value); };
      fr.readAsText(f, "utf-8");
    });
    if (sample) sample.addEventListener("click", function () {
      ta.value = [
        "ชื่อสโมสร,รุ่นอายุ,ชื่อ-นามสกุลนักกีฬา,วันเดือนปีเกิด,เลขบัตร ปชช./เลขนักเรียน,เบอร์เสื้อ,ชื่อผู้ปกครอง,เบอร์ติดต่อผู้ปกครอง",
        "กองฟาง ยูไนเต็ด,U8,เด็กชายก้องภพ ใจเพชร,12/05/2561,,7,นางสาวมาลี ใจเพชร,08x-xxx-xxxx",
        "เซเว่น,U10,เด็กชายรัชชานนท์ พูนสุข,03/09/2559,,10,นายสมชาย พูนสุข,08x-xxx-xxxx",
        "โซล,U12,เด็กชายภูริณัฐ แก้วดี,21/01/2557,,4,นางสาวกนกพร แก้วดี,08x-xxx-xxxx",
        "แสงเพชร,U14,เด็กชายธนกร มั่นคง,08/07/2555,,1,นายอนุชา มั่นคง,08x-xxx-xxxx"
      ].join("\n");
      renderCards(ta.value);
    });

    var bar = $("[data-card-filter]");
    if (bar) bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      cardFilter.age = chip.getAttribute("data-age");
      applyCardFilters();
    });

    var clubBar = $("[data-club-filter]");
    if (clubBar) clubBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"); if (!chip) return;
      cardFilter.team = chip.getAttribute("data-team");
      applyCardFilters();
    });

    var copyBtn = $("[data-copy-link]");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var done = function () { copyBtn.textContent = "คัดลอกแล้ว ✓"; setTimeout(function () { copyBtn.textContent = "คัดลอกลิงก์สโมสรนี้"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done); else { prompt("คัดลอกลิงก์", location.href); }
    });

    var printBtn = $("[data-print]");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    var auto = $("[data-csv-fetch]");
    var status = $("[data-gen-status]");

    /* ดึงข้อมูลล่าสุดจากชีต — ต่อ timestamp กันแคช เพื่อให้ได้ผู้ลงทะเบียนใหม่ทุกครั้ง */
    function loadFromSheet(silent) {
      if (!CFG.athleteSheetCsvUrl) {
        if (!silent && status) status.textContent = "ยังไม่ได้ตั้งค่า — วางลิงก์ CSV ของชีตที่ config.athleteSheetCsvUrl ใน assets/js/data.js";
        return;
      }
      var sep = CFG.athleteSheetCsvUrl.indexOf("?") > -1 ? "&" : "?";
      var url = CFG.athleteSheetCsvUrl + sep + "t=" + Date.now();
      if (auto) auto.textContent = "กำลังโหลด…";
      if (status) status.textContent = "กำลังดึงข้อมูลผู้ลงทะเบียนล่าสุดจากชีต…";
      fetch(url, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (t) {
        ta.value = t;
        renderCards(t);
        if (auto) auto.textContent = "ดึงข้อมูลล่าสุดอีกครั้ง";
      }).catch(function () {
        if (auto) auto.textContent = "ดึงข้อมูลจากชีตใหม่";
        if (status) status.textContent = "โหลดจากชีตไม่สำเร็จ — ตรวจว่าตั้งค่าแชร์ชีตเป็น 'ทุกคนที่มีลิงก์ · ผู้อ่าน' แล้ว หรือวางลิงก์ CSV เอง";
      });
    }

    if (auto) auto.addEventListener("click", function () { loadFromSheet(false); });

    /* โหลดอัตโนมัติเมื่อเปิดหน้า: ระบบเข้าถึงข้อมูลในชีตทันทีที่มีการอัปเดตการลงทะเบียน */
    if (CFG.athleteSheetCsvUrl) loadFromSheet(true);
  }

  /* ---------- athlete stats (หน้า athletes.html) ---------- */
  function computeRoster(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) return null;
    var headers = rows[0], col = {};
    Object.keys(FIELD_ALIASES).forEach(function (k) { col[k] = pickCol(headers, k); });
    if (col.name === -1) return null;
    var body = rows.slice(1).filter(function (r) { return (r[col.name] || "").trim() !== ""; });
    var seen = {}, dup = 0;
    body.forEach(function (r, i) {
      var k = normName_(r[col.name]); if (!k) return;
      var t = col.ts > -1 ? tsKey_(r[col.ts]) : ("0000000000000" + (10000 + i));
      if (!seen[k]) seen[k] = { r: r, t: t };
      else { dup++; if (t >= seen[k].t) seen[k] = { r: r, t: t }; }
    });
    var list = Object.keys(seen).map(function (k) { return seen[k].r; });
    return { col: col, list: list, dup: dup, raw: body.length };
  }

  function renderAthleteStats() {
    var host = $("[data-athlete-stats]");
    if (!host) return;
    var status = $("[data-athlete-status]");

    function paint(text) {
      var R = computeRoster(text);
      if (!R) { if (status) status.textContent = "ยังไม่มีข้อมูลผู้ลงทะเบียน"; return; }
      var col = R.col;
      var groups = (BLA.meta && BLA.meta.ageGroups) || ["U8", "U10", "U12", "U14"];
      var themes = BLA.cardThemes || {};
      var byAge = {}, byClub = {}, mat = {};
      groups.forEach(function (g) { byAge[g] = 0; });
      var other = 0;
      R.list.forEach(function (r) {
        var g = normAge(col.age > -1 ? r[col.age] : "");
        var c = (col.team > -1 ? (r[col.team] || "") : "").trim() || "ไม่ระบุสโมสร";
        if (byAge[g] == null) { if (g) { byAge[g] = 0; } }
        if (g && byAge[g] != null) byAge[g]++; else other++;
        byClub[c] = (byClub[c] || 0) + 1;
        mat[c] = mat[c] || {};
        if (g) mat[c][g] = (mat[c][g] || 0) + 1;
      });

      var maxAge = Math.max.apply(null, groups.map(function (g) { return byAge[g] || 0; }).concat([1]));
      var ageCards = groups.map(function (g) {
        var v = byAge[g] || 0, th = themes[g] || { accent: "#2F80ED", label: g };
        var h = Math.round((v / maxAge) * 100);
        return '<div class="ast-age" style="--c:' + esc(th.accent) + '">' +
          '<b>' + v + '</b><span>' + esc(g) + '</span>' +
          '<i style="height:' + h + '%"></i></div>';
      }).join("");

      var teams = (BLA.teams || []).slice().sort(function (a, b) {
        return (byClub[b.name] || 0) - (byClub[a.name] || 0) || a.name.localeCompare(b.name, "th");
      });
      var maxClub = Math.max.apply(null, teams.map(function (t) { return byClub[t.name] || 0; }).concat([1]));
      var clubRows = teams.map(function (t) {
        var v = byClub[t.name] || 0, w = Math.round((v / maxClub) * 100);
        var cells = groups.map(function (g) { return "<td>" + ((mat[t.name] && mat[t.name][g]) || "–") + "</td>"; }).join("");
        return "<tr" + (v === 0 ? ' class="zero"' : "") + ">" +
          '<td class="ac-team"><span class="ac-logo" style="background-image:url(' + IMG + t.slug + '.png)"></span>' + esc(t.name) + "</td>" +
          cells + '<td class="ac-tot">' + v + "</td>" +
          '<td class="ac-bar"><span style="width:' + w + '%"></span></td></tr>';
      }).join("");

      host.innerHTML =
        '<div class="ast-total"><b>' + R.list.length + '</b><span>นักกีฬาลงทะเบียนแล้ว' +
          (R.dup ? " · ตัดชื่อซ้ำ " + R.dup : "") + "</span></div>" +
        '<div class="ast-ages">' + ageCards + "</div>" +
        '<div class="table-wrap"><table class="athlete-table"><thead><tr><th>สโมสร</th>' +
          groups.map(function (g) { return "<th>" + esc(g) + "</th>"; }).join("") +
          "<th>รวม</th><th></th></tr></thead><tbody>" + clubRows + "</tbody></table></div>";
      if (status) status.textContent = "อัปเดตจากชีตทะเบียนนักกีฬา · " + new Date().toLocaleString("th-TH");
    }

    if (!CFG.athleteSheetCsvUrl) {
      host.innerHTML = '<p class="pill-note">ยังไม่ได้ตั้งค่าลิงก์ชีต (config.athleteSheetCsvUrl)</p>';
      return;
    }
    if (status) status.textContent = "กำลังโหลดข้อมูลล่าสุด…";
    var sep = CFG.athleteSheetCsvUrl.indexOf("?") > -1 ? "&" : "?";
    fetch(CFG.athleteSheetCsvUrl + sep + "t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(paint)
      .catch(function () {
        if (status) status.textContent = "โหลดไม่สำเร็จ — ตรวจว่าแชร์ชีตเป็น 'ทุกคนที่มีลิงก์ · ผู้อ่าน' แล้ว";
      });
  }

  /* ---------- athlete mini widget (หน้าแรก) ---------- */
  function renderAthleteMini() {
    var host = $("[data-athlete-mini]");
    if (!host || !CFG.athleteSheetCsvUrl) return;
    var groups = (BLA.meta && BLA.meta.ageGroups) || ["U8", "U10", "U12", "U14"];
    var themes = BLA.cardThemes || {};
    var sep = CFG.athleteSheetCsvUrl.indexOf("?") > -1 ? "&" : "?";
    fetch(CFG.athleteSheetCsvUrl + sep + "t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var R = computeRoster(text);
        if (!R) { host.innerHTML = '<div class="empty-state" style="padding:1.6rem">ยังไม่มีผู้ลงทะเบียน</div>'; return; }
        var byAge = {};
        groups.forEach(function (g) { byAge[g] = 0; });
        R.list.forEach(function (r) {
          var g = normAge(R.col.age > -1 ? r[R.col.age] : "");
          if (byAge[g] != null) byAge[g]++;
        });
        host.innerHTML =
          '<div class="am-total"><b>' + R.list.length + '</b><span>คน · ลงทะเบียนแล้ว</span></div>' +
          '<div class="am-ages">' + groups.map(function (g) {
            var th = themes[g] || { accent: "#2F80ED" };
            return '<span class="am-chip" style="--c:' + esc(th.accent) + '"><i></i>' + esc(g) +
              ' <b>' + (byAge[g] || 0) + '</b></span>';
          }).join("") + "</div>";
      })
      .catch(function () {
        host.innerHTML = '<div class="empty-state" style="padding:1.6rem">โหลดยอดลงทะเบียนไม่สำเร็จ</div>';
      });
  }

  /* ---------- facebook footer link ---------- */
  (function () {
    var a = $("[data-fb-link]");
    if (a && CFG.facebookPage) { a.href = CFG.facebookPage; a.hidden = false; }
  })();

  /* ---------- go ---------- */
  renderClubs();
  wireClubFilters();
  renderRoster();
  renderSchedule();
  renderHistory();
  renderStandings();
  renderResults();
  renderRegister();
  wireGenerator();
  renderAthleteStats();
  renderAthleteMini();
  observeReveals(document);
  addEventListener("load", function () {
    $all(".reveal:not(.in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
    });
  });
})();
