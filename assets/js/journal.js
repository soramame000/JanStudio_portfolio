(() => {
  const { fetchJson, esc } = window.JAN;

  const PER_PAGE = 9;

  function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  const listEl = document.getElementById("blog-list");
  const paginationEl = document.getElementById("pagination");
  const filterButtons = document.querySelectorAll(".filter-btn[data-cat]");
  const filterSection = document.getElementById("journal-controls");
  const detailSection = document.getElementById("blog-detail");
  const detailTitle = document.getElementById("blog-detail-title");
  const detailDate = document.getElementById("blog-detail-date");
  const detailBody = document.getElementById("blog-detail-body");

  let allPosts = [];
  let currentCategory = "all";
  let currentPage = 1;

  function matchesCategory(post, category) {
    if (category === "all") return true;
    const tags = Array.isArray(post.tags) ? post.tags : [];
    return tags.some(
      (tag) => String(tag).toLowerCase() === category.toLowerCase()
    );
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }
    paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      const isActive = page === currentPage;
      return `
        <button
          type="button"
          class="filter-btn ${isActive ? "is-active" : ""}"
          data-page="${page}"
          aria-label="${page}ページ目"
          ${isActive ? 'aria-current="page"' : ""}
        >${page}</button>
      `;
    }).join("");
  }

  function renderList() {
    if (!listEl) return;

    const filtered = allPosts.filter((post) =>
      matchesCategory(post, currentCategory)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const pagePosts = filtered.slice(
      (currentPage - 1) * PER_PAGE,
      currentPage * PER_PAGE
    );

    if (!pagePosts.length) {
      listEl.innerHTML = "<p>該当する記事はまだありません。</p>";
      renderPagination(0);
      return;
    }

    // クローラにも辿れる本物のリンクとして描画する
    listEl.innerHTML = pagePosts
      .map(
        (post) => `
      <a class="blog-card" href="/journal/${encodeURIComponent(post.id)}">
        <div class="blog-card-thumb img-skeleton-wrapper">
          ${post.thumbnail?.url
            ? `<img src="${esc(post.thumbnail.url)}?w=800&q=80" alt="${esc(post.title)}" width="${Number(post.thumbnail.width) || 800}" height="${Number(post.thumbnail.height) || 533}" loading="lazy" decoding="async" onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');" />`
            : ""
          }
        </div>
        <div class="blog-card-body">
          <h2 class="blog-card-title">${esc(post.title)}</h2>
          <p class="blog-card-meta">
            ${post.publishedAt ? esc(post.publishedAt.substring(0, 10)) : ""}
          </p>
        </div>
      </a>
    `
      )
      .join("");

    renderPagination(totalPages);
  }

  async function loadPosts() {
    const data =
      (await fetchJson("/blogPosts", {
        limit: 100,
        orders: "-publishedAt",
        fields: "id,title,thumbnail,publishedAt,tags"
      })) || {};
    allPosts = data.contents || [];

    if (!allPosts.length) {
      if (listEl) {
        listEl.innerHTML =
          "<p>まだ記事はありません。CMSに記事を追加してください。</p>";
      }
      return;
    }

    renderList();
  }

  async function renderDetail(id) {
    if (!detailSection || !detailTitle || !detailDate || !detailBody) return;

    const post = await fetchJson(`/blogPosts/${encodeURIComponent(id)}`);
    if (!post) {
      detailTitle.textContent = "記事が見つかりませんでした";
      detailSection.hidden = false;
      return;
    }

    document.title = `${post.title} | JAN STUDIO`;
    detailTitle.textContent = post.title;
    detailDate.textContent = post.publishedAt
      ? post.publishedAt.substring(0, 10)
      : "";
    // body はCMS管理者のみが編集するリッチテキストのためそのまま挿入する
    detailBody.innerHTML = post.body || "";

    detailSection.hidden = false;
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
      currentCategory = btn.dataset.cat || "all";
      currentPage = 1;
      renderList();
    });
  });

  if (paginationEl) {
    paginationEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      currentPage = Number(btn.dataset.page) || 1;
      renderList();
      listEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  (async () => {
    const id = getPostId();
    if (id) {
      if (listEl) listEl.hidden = true;
      if (filterSection) filterSection.hidden = true;
      if (paginationEl) paginationEl.hidden = true;
      await renderDetail(id);
    } else {
      if (detailSection) detailSection.hidden = true;
      await loadPosts();
    }
  })();
})();
