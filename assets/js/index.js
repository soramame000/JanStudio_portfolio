(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const { fetchJson, esc, toTimestamp, isPublic } = window.JAN;

  /* ---------------------------------------------
     Hero slideshow — progress bars / reduced motion
     --------------------------------------------- */
  function initHeroSlideshow() {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const progressEl = document.getElementById("hero-progress");
    if (slides.length <= 1) return;

    const SLIDE_DUR = 6000;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = 0;
    let timer = null;

    document.documentElement.style.setProperty("--slide-dur", `${SLIDE_DUR}ms`);

    const dots = slides.map((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", `スライド ${i + 1}`);
      btn.addEventListener("click", () => {
        goTo(i);
        restart();
      });
      progressEl?.appendChild(btn);
      return btn;
    });

    function render() {
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      dots.forEach((d, i) => {
        d.classList.remove("active");
        if (i === current) {
          // reflow して progress アニメーションを最初から再生する
          void d.offsetWidth;
          d.classList.add("active");
        }
      });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
    }

    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), SLIDE_DUR);
    }

    // タブ非表示中は止める（バッテリー・CPU節約）
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        restart();
      }
    });

    render();
    restart();
  }

  /* ---------------------------------------------
     Featured works
     --------------------------------------------- */
  async function renderFeatured() {
    const container = document.getElementById("featured-gallery");
    if (!container) return;

    const toPriority = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    const data =
      (await fetchJson("/photos", {
        limit: 100,
        orders: "-createdAt",
        fields: "id,title,image,genre,eventDate,createdAt,publishStatus,featuredPriority,projectId"
      })) || {};
    const items = (data.contents || [])
      .filter(isPublic)
      .sort((a, b) => {
        const byPriority = toPriority(a.featuredPriority) - toPriority(b.featuredPriority);
        if (byPriority !== 0) return byPriority;
        const byEventDate = toTimestamp(b.eventDate) - toTimestamp(a.eventDate);
        if (byEventDate !== 0) return byEventDate;
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      })
      .slice(0, config.FEATURED_LIMIT || 6);

    if (!items.length) {
      container.innerHTML = `<div class="gallery-card hero-image-placeholder"></div>`;
      return;
    }

    // クローラにも辿れる本物のリンクとして描画する
    container.innerHTML = items
      .map((item) => {
        const href = item.projectId
          ? `project.html?id=${encodeURIComponent(item.projectId)}`
          : "works.html";
        return `
        <a class="gallery-card" href="${esc(href)}">
          <div class="img-skeleton-wrapper" style="height: 300px;">
            <img
              src="${item.image?.url ? esc(item.image.url) + '?w=800&q=80' : ''}"
              alt="${esc(item.title || "")}"
              loading="lazy"
              decoding="async"
              onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');"
            />
          </div>
          <div class="gallery-card-meta">
            <span>${esc(item.title || "Untitled")}</span>
            <span>${esc(Array.isArray(item.genre) ? item.genre.join(", ") : (item.genre || ""))}</span>
          </div>
        </a>
      `;
      })
      .join("");
  }

  /* ---------------------------------------------
     Latest journal posts
     --------------------------------------------- */
  async function renderLatestPosts() {
    const container = document.getElementById("latest-posts");
    if (!container) return;

    const data =
      (await fetchJson("/blogPosts", {
        limit: config.BLOG_LIMIT || 3,
        orders: "-publishedAt",
        fields: "id,title,thumbnail,publishedAt"
      })) || {};
    const posts = data.contents || [];

    if (!posts.length) {
      container.innerHTML = "<p>まだ記事はありません。</p>";
      return;
    }

    container.innerHTML = posts
      .map(
        (post) => `
        <a class="blog-card" href="journal.html?id=${encodeURIComponent(post.id)}">
          <div class="blog-card-thumb img-skeleton-wrapper">
            ${post.thumbnail?.url
            ? `<img src="${esc(post.thumbnail.url)}?w=600&q=80" alt="" loading="lazy" decoding="async" onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');" />`
            : ""
          }
          </div>
          <div class="blog-card-body">
            <h3 class="blog-card-title">${esc(post.title)}</h3>
            <p class="blog-card-meta">
              ${post.publishedAt ? esc(post.publishedAt.substring(0, 10)) : ""}
            </p>
          </div>
        </a>
      `
      )
      .join("");
  }

  initHeroSlideshow();
  renderFeatured();
  renderLatestPosts();
})();
