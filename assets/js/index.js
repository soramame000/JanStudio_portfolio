(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const { fetchJson, esc, toTimestamp, isPublic } = window.JAN;

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

    container.innerHTML = items
      .map(
        (item) => `
        <article class="gallery-card" data-project-id="${esc(item.projectId || "")}">
          <div class="img-skeleton-wrapper" style="height: 220px;">
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
        </article>
      `
      )
      .join("");

    container.addEventListener("click", (e) => {
      const card = e.target.closest(".gallery-card");
      if (!card) return;
      const projectId = card.dataset.projectId;
      if (projectId) {
        window.location.href = `project.html?id=${encodeURIComponent(projectId)}`;
      } else {
        window.location.href = "works.html";
      }
    });
  }

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
        <article class="blog-card" data-id="${esc(post.id)}">
          <div class="blog-card-thumb img-skeleton-wrapper">
            ${post.thumbnail?.url
            ? `<img src="${esc(post.thumbnail.url)}?w=600&q=80" alt="${esc(post.title)}" loading="lazy" decoding="async" onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');" />`
            : ""
          }
          </div>
          <div class="blog-card-body">
            <h3 class="blog-card-title">${esc(post.title)}</h3>
            <p class="blog-card-meta">
              ${post.publishedAt ? esc(post.publishedAt.substring(0, 10)) : ""}
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
        window.location.href = `journal.html?id=${encodeURIComponent(id)}`;
      }
    });
  }

  renderFeatured();
  renderLatestPosts();
})();
