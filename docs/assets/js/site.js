(function () {
  "use strict";

  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function todayStamp() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function formatDate(iso) {
    var parts = iso.split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    return day + " " + MONTHS[month - 1] + " " + year;
  }

  function isIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function safeUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value) ? value : "";
  }

  function layoutAbout() {
    var copy = document.querySelector(".about-copy");
    if (!copy) return;
    var details = copy.querySelector("details");
    var desktop = window.matchMedia("(min-width: 900px)").matches;
    var parts = Array.prototype.slice.call(copy.querySelectorAll(".part"));
    if (desktop) {
      parts.sort(function (a, b) {
        return Number(a.dataset.order) - Number(b.dataset.order);
      });
      parts.forEach(function (part) {
        copy.append(part);
      });
      details.hidden = true;
      return;
    }
    var background = copy.querySelector('[data-order="1"]');
    var sound = copy.querySelector('[data-order="4"]');
    var more = parts.filter(function (part) {
      return part.dataset.more === "true";
    }).sort(function (a, b) {
      return Number(a.dataset.order) - Number(b.dataset.order);
    });
    copy.append(background, sound, details);
    more.forEach(function (part) {
      details.append(part);
    });
    details.hidden = false;
  }

  function showCard(show, upcoming) {
    var ticket = upcoming ? safeUrl(show.ticketUrl) : "";
    var city = show.city ? ", " + escapeHtml(show.city) : "";
    var note = show.note ? '<p class="show-note">' + escapeHtml(show.note) + "</p>" : "";
    var sold = show.soldOut ? '<p class="tag">Sold out</p>' : "";
    var ticketHtml = ticket
      ? '<p><a href="' + escapeHtml(ticket) + '" target="_blank" rel="noopener">Tickets</a></p>'
      : "";
    return '<li class="show"><p class="show-date">' + escapeHtml(formatDate(show.date)) +
      '</p><p class="show-place">' + escapeHtml(show.venue) + city + "</p>" +
      note + sold + ticketHtml + "</li>";
  }

  function loadShows() {
    var upcomingEl = document.querySelector("#live-upcoming");
    var pastEl = document.querySelector("#live-past");
    fetch("/data/shows.json")
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) return;
        var rows = data.filter(function (row) {
          return row && isIsoDate(row.date) && row.venue;
        });
        var today = todayStamp();
        var upcoming = rows.filter(function (row) {
          return row.date >= today;
        }).sort(function (a, b) {
          return a.date < b.date ? -1 : 1;
        });
        var past = rows.filter(function (row) {
          return row.date < today;
        }).sort(function (a, b) {
          return a.date < b.date ? 1 : -1;
        });
        if (upcoming.length) {
          upcomingEl.innerHTML = '<h3>Upcoming</h3><ul class="show-list">' +
            upcoming.map(function (row) { return showCard(row, true); }).join("") +
            "</ul>";
        }
        if (past.length) {
          pastEl.innerHTML = '<h3>Past shows</h3><ul class="show-list">' +
            past.map(function (row) { return showCard(row, false); }).join("") +
            "</ul>";
        }
      })
      .catch(function () {
        /* Keep the empty-state message that is already in the page. */
      });
  }

  function loadMerch() {
    var section = document.querySelector("#merch");
    var link = document.querySelector("#merch-link");
    var list = document.querySelector(".merch-list");
    fetch("/data/merch.json")
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) return;
        var items = data.filter(function (item) {
          return item && item.name && safeUrl(item.url);
        });
        if (!items.length) return;
        list.innerHTML = items.map(function (item) {
          var image = typeof item.image === "string" ? item.image : "";
          var src = "";
          if (image.indexOf("http") === 0 || image.charAt(0) === "/") src = image;
          else if (image) src = "/" + image;
          var img = src
            ? '<img src="' + escapeHtml(src) + '" alt="" loading="lazy">'
            : "";
          var price = item.price
            ? '<span class="price">' + escapeHtml(item.price) + "</span>"
            : "";
          return '<li><a href="' + escapeHtml(safeUrl(item.url)) + '" target="_blank" rel="noopener">' +
            img + '<span class="name">' + escapeHtml(item.name) + "</span>" + price + "</a></li>";
        }).join("");
        section.hidden = false;
        link.hidden = false;
      })
      .catch(function () {
        /* Merch stays hidden when the file cannot be read. */
      });
  }

  function setupVideos() {
    Array.prototype.forEach.call(document.querySelectorAll(".facade"), function (link) {
      link.addEventListener("click", function (event) {
        var id = link.dataset.id || "";
        if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
        event.preventDefault();
        var frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
        frame.title = link.dataset.title || "YouTube video";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
        frame.allowFullscreen = true;
        var player = document.createElement("div");
        player.className = "player";
        player.append(frame);
        link.replaceWith(player);
      });
    });
  }

  function setupLightbox() {
    var dialog = document.querySelector("#lightbox");
    var img = document.querySelector("#lb-img");
    var caption = document.querySelector("#lb-cap");
    var count = document.querySelector("#lb-count");
    var prev = document.querySelector(".lb-prev");
    var next = document.querySelector(".lb-next");
    var closeBtn = document.querySelector(".lb-close");
    var shots = Array.prototype.slice.call(document.querySelectorAll(".gallery .shot"));
    if (!dialog || !shots.length) return;
    var index = 0;
    var opener = null;

    function show(nextIndex) {
      index = nextIndex;
      var shot = shots[index];
      var source = shot.querySelector("img");
      var figure = shot.closest("figure");
      var cap = figure ? figure.querySelector("figcaption") : null;
      img.src = shot.dataset.full;
      img.alt = source ? source.alt : "";
      caption.textContent = cap ? cap.textContent : "";
      count.textContent = (index + 1) + " of " + shots.length;
      prev.disabled = index === 0;
      next.disabled = index === shots.length - 1;
      dialog.style.maxWidth = "min(96vw, " + (Number(shot.dataset.w) + 32) + "px)";
    }

    shots.forEach(function (shot, shotIndex) {
      shot.addEventListener("click", function () {
        opener = shot;
        show(shotIndex);
        if (!dialog.open) dialog.showModal();
        closeBtn.focus();
      });
    });

    prev.addEventListener("click", function () {
      if (index > 0) show(index - 1);
    });
    next.addEventListener("click", function () {
      if (index < shots.length - 1) show(index + 1);
    });
    closeBtn.addEventListener("click", function () {
      dialog.close();
    });

    dialog.addEventListener("close", function () {
      img.removeAttribute("src");
      if (opener) opener.focus();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight" && index < shots.length - 1) {
        event.preventDefault();
        show(index + 1);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        show(index - 1);
      }
    });

    dialog.addEventListener("click", function (event) {
      var rect = dialog.getBoundingClientRect();
      var inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) dialog.close();
    });

    var startX = 0;
    dialog.addEventListener("touchstart", function (event) {
      startX = event.changedTouches[0].clientX;
    }, { passive: true });
    dialog.addEventListener("touchend", function (event) {
      var delta = event.changedTouches[0].clientX - startX;
      if (delta <= -40 && index < shots.length - 1) show(index + 1);
      if (delta >= 40 && index > 0) show(index - 1);
    }, { passive: true });
  }

  function setupNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));
    var sections = links.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.removeAttribute("aria-current");
        });
        var current = document.querySelector('.site-nav a[href="#' + entry.target.id + '"]');
        if (current && !current.hidden) current.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function setupEmbed() {
    var box = document.querySelector("#spotify-embed");
    if (!box || !box.dataset.src) return;
    function mount() {
      if (box.querySelector("iframe")) return;
      var frame = document.createElement("iframe");
      frame.src = box.dataset.src;
      frame.height = "352";
      frame.setAttribute("width", "100%");
      frame.loading = "lazy";
      frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      frame.title = "Ash Fuller on Spotify";
      box.append(frame);
    }
    if (!("IntersectionObserver" in window)) {
      mount();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        mount();
        observer.disconnect();
      });
    // Load when Listen enters the screen, so the first view stays free of the player.
    }, { rootMargin: "0px" });
    observer.observe(box);
  }

  layoutAbout();
  window.matchMedia("(min-width: 900px)").addEventListener("change", layoutAbout);
  setupEmbed();
  setupVideos();
  setupLightbox();
  setupNav();
  loadShows();
  loadMerch();
})();
