(() => {
  const config = window.PORTFOLIO_CONFIG || {};

  async function fetchJson(path, params = {}) {
    const baseUrl = config.CMS_BASE_URL;
    const apiKey = config.CMS_API_KEY;
    if (!baseUrl || !apiKey) {
      console.warn("CMSの設定が未完了のため、ギャラリーはダミー表示になります。");
      return null;
    }

    const url = new URL(path, baseUrl);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, String(value))
    );

    const res = await fetch(url.toString(), {
      headers: {
        "X-API-KEY": apiKey
      }
    });
    if (!res.ok) {
      console.error("CMS fetch error", res.status, await res.text());
      return null;
    }
    return res.json();
  }

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

  let allPhotos = [];
  let currentGenre = "all";
  let currentItems = [];
  let currentIndex = -1;

  function getCurrentItems(genre) {
    return genre === "all" ? allPhotos : allPhotos.filter((p) => p.genre === genre);
  }

  function toTimestamp(value) {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? 0 : ts;
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
          aria-label="${item.title || "Untitled"}"
        >
          <img
            src="${item.image?.url || ""}"
            alt="${item.title || ""}"
            loading="lazy"
            decoding="async"
          />
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
        data-id="${item.id}"
        data-title="${item.title || ""}"
        data-caption="${item.caption || ""}"
        data-project-id="${item.projectId || ""}"
        data-src="${item.image?.url || ""}"
        data-index="${index}"
        style="--item-delay:${index * 36}ms"
      >
        <img
          src="${item.image?.url || ""}"
          alt="${item.title || ""}"
          loading="lazy"
          decoding="async"
        />
        <div class="gallery-item-label">
          <span>${item.title || "Untitled"}</span>
          <span>${item.genre || ""}</span>
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

    const src = target.image?.url || "";
    const title = target.title || "";
    const caption = target.caption || "";
    const projectId = target.projectId;

    lbImg.src = src;
    lbImg.alt = title;
    lbTitle.textContent = title;
    lbCaption.textContent = caption;

    if (projectId) {
      lbProjectLink.href = `project.html?id=${encodeURIComponent(projectId)}`;
      lbProjectLink.style.display = "";
    } else {
      lbProjectLink.style.display = "none";
    }

    updateLightboxNavigationState();
    renderLightboxThumbs();
    preloadNeighbors(currentIndex);
    lightboxEl.classList.add("is-open");
    lightboxEl.setAttribute("aria-hidden", "false");
  }

  function moveLightbox(step) {
    if (currentIndex < 0 || !currentItems.length) return;
    openLightboxByIndex(currentIndex + step);
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("aria-hidden", "true");
  }

  async function loadPhotos() {
    if (!gridEl) return;

    const data =
      (await fetchJson("/photos", {
        limit: 100,
        orders: "-createdAt"
      })) || {};
    allPhotos = (data.contents || [])
      .filter((item) => !item.publishStatus || item.publishStatus === "public")
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
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
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
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        moveLightbox(e.key === "ArrowRight" ? 1 : -1);
      }
    });
  }

  loadPhotos();
})();

