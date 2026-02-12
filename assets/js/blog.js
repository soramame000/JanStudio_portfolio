(() => {
  const config = window.PORTFOLIO_CONFIG || {};

  async function fetchJson(path, params = {}) {
    const baseUrl = config.CMS_BASE_URL;
    const apiKey = config.CMS_API_KEY;
    if (!baseUrl || !apiKey) {
      console.warn("CMSの設定が未完了のため、ブログはダミー表示になります。");
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

  function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  const listEl = document.getElementById("blog-list");
  const detailSection = document.getElementById("blog-detail");
  const backButton = document.getElementById("blog-back-button");
  const detailTitle = document.getElementById("blog-detail-title");
  const detailDate = document.getElementById("blog-detail-date");
  const detailBody = document.getElementById("blog-detail-body");

  async function renderList() {
    if (!listEl) return;

    const data =
      (await fetchJson("/blogPosts", {
        limit: 20,
        orders: "-publishedAt"
      })) || {};
    const posts = data.contents || [];

    if (!posts.length) {
      listEl.innerHTML = "<p>まだ記事はありません。CMSに記事を追加してください。</p>";
      return;
    }

    listEl.innerHTML = posts
      .map(
        (post) => `
      <article class="blog-card" data-id="${post.id}">
        <div class="blog-card-thumb">
          ${
            post.thumbnail?.url
              ? `<img src="${post.thumbnail.url}" alt="${post.title}" />`
              : ""
          }
        </div>
        <div class="blog-card-body">
          <h2 class="blog-card-title">${post.title}</h2>
          <p class="blog-card-meta">
            ${post.publishedAt ? post.publishedAt.substring(0, 10) : ""}
          </p>
        </div>
      </article>
    `
      )
      .join("");

    listEl.addEventListener("click", (e) => {
      const card = e.target.closest(".blog-card");
      if (!card) return;
      const id = card.dataset.id;
      if (id) {
        window.location.search = `?id=${encodeURIComponent(id)}`;
      }
    });
  }

  async function renderDetail(id) {
    if (!detailSection || !detailTitle || !detailDate || !detailBody) return;

    const post = await fetchJson(`/blogPosts/${id}`);
    if (!post) {
      detailTitle.textContent = "記事が見つかりませんでした";
      detailSection.hidden = false;
      return;
    }

    detailTitle.textContent = post.title;
    detailDate.textContent = post.publishedAt
      ? post.publishedAt.substring(0, 10)
      : "";
    detailBody.innerHTML = post.body || "";

    detailSection.hidden = false;
  }

  (async () => {
    const id = getPostId();
    if (id) {
      if (listEl) listEl.hidden = true;
      await renderDetail(id);
    } else {
      if (detailSection) detailSection.hidden = true;
      await renderList();
    }
  })();

  if (backButton && listEl && detailSection) {
    backButton.addEventListener("click", () => {
      window.location.search = "";
    });
  }
})();

