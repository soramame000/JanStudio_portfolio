(() => {
  const config = window.PORTFOLIO_CONFIG || {};

  async function fetchJson(path, params = {}) {
    const baseUrl = config.CMS_BASE_URL;
    const apiKey = config.CMS_API_KEY;
    if (!baseUrl || !apiKey) {
      console.warn("CMSの設定が未完了のため、ダミーコンテンツを表示します。");
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

  async function renderFeatured() {
    const container = document.getElementById("featured-gallery");
    if (!container) return;
    const toTimestamp = (value) => {
      if (!value) return 0;
      const ts = new Date(value).getTime();
      return Number.isNaN(ts) ? 0 : ts;
    };
    const toPriority = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    const data =
      (await fetchJson("/photos", {
        limit: 100,
        orders: "-createdAt"
      })) || {};
    const items = (data.contents || [])
      .filter((item) => !item.publishStatus || item.publishStatus === "public")
      .sort((a, b) => {
        const byPriority = toPriority(a.featuredPriority) - toPriority(b.featuredPriority);
        if (byPriority !== 0) return byPriority;
        const byEventDate = toTimestamp(b.eventDate) - toTimestamp(a.eventDate);
        if (byEventDate !== 0) return byEventDate;
        return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
      })
      .slice(0, config.FEATURED_LIMIT || 6);

    if (!items.length) {
      container.innerHTML = `
        <div class="gallery-preview-grid">
          <div class="gallery-card hero-image-placeholder"></div>
        </div>
      `;
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
        <article class="gallery-card" data-project-id="${
          item.projectId || ""
        }">
          <img
            src="${item.image?.url || ""}"
            alt="${item.title || ""}"
            loading="lazy"
            decoding="async"
          />
          <div class="gallery-card-meta">
            <span>${item.title || "Untitled"}</span>
            <span>${item.genre || ""}</span>
          </div>
        </article>
      `
      )
      .join("");

    container.addEventListener("click", (e) => {
      const card = e.target.closest(".gallery-card");
      if (!card) return;
      const projectId = card.dataset.projectId;
      if (projectId) {
        window.location.href = `project.html?id=${encodeURIComponent(
          projectId
        )}`;
      } else {
        window.location.href = "gallery.html";
      }
    });
  }

  async function renderLatestPosts() {
    const container = document.getElementById("latest-posts");
    if (!container) return;

    const data =
      (await fetchJson("/blogPosts", {
        limit: config.BLOG_LIMIT || 3,
        orders: "-publishedAt"
      })) || {};
    const posts = data.contents || [];

    if (!posts.length) {
      container.innerHTML = "<p>まだ記事はありません。</p>";
      return;
    }

    container.innerHTML = posts
      .map(
        (post) => `
        <article class="blog-card" data-id="${post.id}">
          <div class="blog-card-thumb">
            ${
              post.thumbnail?.url
                ? `<img src="${post.thumbnail.url}" alt="${post.title}" loading="lazy" decoding="async" />`
                : ""
            }
          </div>
          <div class="blog-card-body">
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-meta">
              ${post.publishedAt ? post.publishedAt.substring(0, 10) : ""}
            </p>
          </div>
        </article>
      `
      )
      .join("");

    container.addEventListener("click", (e) => {
      const card = e.target.closest(".blog-card");
      if (!card) return;
      const id = card.dataset.id;
      if (id) {
        window.location.href = `blog.html?id=${encodeURIComponent(id)}`;
      }
    });
  }

  renderFeatured();
  renderLatestPosts();
})();

