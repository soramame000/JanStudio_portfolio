(() => {
  const { fetchJson, esc, toTimestamp, isPublic, photoAlt } = window.JAN;

  const gridEl = document.getElementById("gallery-grid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const countEl = document.getElementById("gallery-count");
  const lightboxEl = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-image");
  const lbTitle = document.getElementById("lightbox-title");
  const lbCaption = document.getElementById("lightbox-caption");
  const lbProjectLink = document.getElementById("lightbox-project-link");
  const lbPrev = document.getElementById("lightbox-prev");
  const lbNext = document.getElementById("lightbox-next");
  const lbThumbs = document.getElementById("lightbox-thumbs");
  const lbCloseBtn = lightboxEl?.querySelector(".lightbox-close");

  let allPhotos = [];
  let currentGenre = "all";
  let currentItems = [];
  let currentIndex = -1;
  let lastFocusedEl = null;

  function isLightboxOpen() {
    return Boolean(lightboxEl?.classList.contains("is-open"));
  }

  function getCurrentItems(genre) {
    return genre === "all" ? allPhotos : allPhotos.filter((p) => {
      if (Array.isArray(p.genre)) {
        return p.genre.includes(genre);
      }
      return p.genre === genre;
    });
  }

  function preloadNeighbors(index) {
    if (!currentItems.length || index < 0) return;
    const prevIndex = (index - 1 + currentItems.length) % currentItems.length;
    const nextIndex = (index + 1) % currentItems.length;
    [prevIndex, nextIndex].forEach((i) => {
      const src = currentItems[i]?.image?.url;
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }

  function renderLightboxThumbs() {
    if (!lbThumbs) return;
    if (!currentItems.length || currentIndex < 0) {
      lbThumbs.innerHTML = "";
      return;
    }
    lbThumbs.innerHTML = currentItems
      .map(
        (item, index) => `
        <button
          type="button"
          class="lightbox-thumb ${index === currentIndex ? "is-active" : ""}"
          data-thumb-index="${index}"
          aria-label="${esc(item.title || "Untitled")}"
        >
          <div class="img-skeleton-wrapper" style="height: 100%;">
            <img
              src="${item.image?.url ? esc(item.image.url) + '?w=200&q=60' : ''}"
              alt="${esc(photoAlt(item))}"
              width="${Number(item.image?.width) || 200}"
              height="${Number(item.image?.height) || 150}"
              loading="lazy"
              decoding="async"
              onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');"
            />
          </div>
        </button>
      `
      )
      .join("");
  }

  function updateLightboxNavigationState() {
    const canNavigate = currentItems.length > 1;
    if (lbPrev) lbPrev.style.display = canNavigate ? "" : "none";
    if (lbNext) lbNext.style.display = canNavigate ? "" : "none";
  }

  function renderPhotos(genre = "all") {
    if (!gridEl) return;
    currentGenre = genre;
    const items = getCurrentItems(genre);
    currentItems = items;

    if (countEl) {
      countEl.textContent =
        genre === "all"
          ? `${items.length} photos`
          : `${items.length} photos / ${genre}`;
    }

    if (!items.length) {
      gridEl.innerHTML = "<p>該当する作品がありません。</p>";
      return;
    }

    gridEl.innerHTML = items
      .map(
        (item, index) => `
      <article class="gallery-item"
        data-id="${esc(item.id)}"
        data-index="${index}"
        style="--item-delay:${index * 36}ms"
        role="button"
        tabindex="0"
        aria-label="${esc(item.title || "Untitled")} を拡大表示"
      >
        <div class="img-skeleton-wrapper">
          <img
            src="${item.image?.url ? esc(item.image.url) + '?w=800&q=80' : ''}"
            alt="${esc(photoAlt(item))}"
            width="${Number(item.image?.width) || 800}"
            height="${Number(item.image?.height) || 600}"
            loading="lazy"
            decoding="async"
            onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');"
          />
        </div>
        <div class="gallery-item-label">
          <span>${esc(item.title || "Untitled")}</span>
          <span>${esc(Array.isArray(item.genre) ? item.genre.join(", ") : (item.genre || ""))}</span>
        </div>
      </article>
    `
      )
      .join("");

    requestAnimationFrame(() => {
      gridEl.querySelectorAll(".gallery-item").forEach((item) => {
        item.classList.add("is-visible");
      });
    });
  }

  function openLightboxByIndex(index) {
    if (!lightboxEl || !lbImg || !lbTitle || !lbCaption || !lbProjectLink)
      return;
    if (!currentItems.length) return;
    const normalizedIndex = ((index % currentItems.length) + currentItems.length) % currentItems.length;
    const target = currentItems[normalizedIndex];
    currentIndex = normalizedIndex;

    const src = target.image?.url ? target.image.url + "?w=1600&q=85" : "";
    const title = target.title || "";
    const caption = target.caption || "";
    const projectId = target.projectId;

    lbImg.src = src;
    lbImg.alt = title;
    lbTitle.textContent = title;
    lbCaption.textContent = caption;

    if (projectId) {
      lbProjectLink.href = `/project/${encodeURIComponent(projectId)}`;
      lbProjectLink.style.display = "";
    } else {
      lbProjectLink.style.display = "none";
    }

    updateLightboxNavigationState();
    renderLightboxThumbs();
    preloadNeighbors(currentIndex);

    if (!isLightboxOpen()) {
      lastFocusedEl = document.activeElement;
      lightboxEl.classList.add("is-open");
      lightboxEl.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbCloseBtn?.focus();
    }
  }

  function moveLightbox(step) {
    if (currentIndex < 0 || !currentItems.length) return;
    openLightboxByIndex(currentIndex + step);
  }

  function closeLightbox() {
    if (!lightboxEl || !isLightboxOpen()) return;
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedEl instanceof HTMLElement) {
      lastFocusedEl.focus();
      lastFocusedEl = null;
    }
  }

  async function loadPhotos() {
    if (!gridEl) return;

    const data =
      (await fetchJson("/photos", {
        limit: 100,
        orders: "-createdAt",
        fields: "id,title,caption,image,genre,eventDate,createdAt,publishStatus,projectId"
      })) || {};
    allPhotos = (data.contents || [])
      .filter(isPublic)
      .sort((a, b) => {
        const byEventDate = toTimestamp(b.eventDate) - toTimestamp(a.eventDate);
        if (byEventDate !== 0) return byEventDate;
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      });

    if (!allPhotos.length) {
      gridEl.innerHTML =
        "<p>まだ作品が登録されていません。CMSに写真を追加してください。</p>";
      return;
    }

    renderPhotos("all");
  }

  filterButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.classList.contains("is-active")));
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      const genre = btn.dataset.genre || "all";
      renderPhotos(genre);
    });
  });

  if (gridEl) {
    gridEl.addEventListener("click", (e) => {
      const item = e.target.closest(".gallery-item");
      if (item) {
        openLightboxByIndex(Number(item.dataset.index || "0"));
      }
    });
    // キーボードでも開けるように（role="button" の実装）
    gridEl.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".gallery-item");
      if (item) {
        e.preventDefault();
        openLightboxByIndex(Number(item.dataset.index || "0"));
      }
    });
  }

  if (lbThumbs) {
    lbThumbs.addEventListener("click", (e) => {
      const thumb = e.target.closest(".lightbox-thumb");
      if (!thumb) return;
      const thumbIndex = Number(thumb.dataset.thumbIndex || "0");
      openLightboxByIndex(thumbIndex);
    });
  }

  if (lbPrev) {
    lbPrev.addEventListener("click", () => moveLightbox(-1));
  }

  if (lbNext) {
    lbNext.addEventListener("click", () => moveLightbox(1));
  }

  if (lightboxEl) {
    lightboxEl.addEventListener("click", (e) => {
      if (e.target.matches("[data-lightbox-close]")) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (!isLightboxOpen()) return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        moveLightbox(e.key === "ArrowRight" ? 1 : -1);
      } else if (e.key === "Tab") {
        // フォーカスをダイアログ内に閉じ込める
        const focusables = lightboxEl.querySelectorAll(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  loadPhotos();
})();
