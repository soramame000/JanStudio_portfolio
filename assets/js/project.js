(() => {
  const config = window.PORTFOLIO_CONFIG || {};

  async function fetchJson(path, params = {}) {
    const baseUrl = config.CMS_BASE_URL;
    const apiKey = config.CMS_API_KEY;
    if (!baseUrl || !apiKey) {
      console.warn("CMSの設定が未完了のため、案件詳細はダミー表示になります。");
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

  function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  async function renderProject() {
    const id = getProjectId();
    if (!id) return;

    const titleEl = document.getElementById("project-title");
    const metaEl = document.getElementById("project-meta");
    const mainImageEl = document.getElementById("project-main-image");
    const summaryEl = document.getElementById("project-summary-text");
    const storyEl = document.getElementById("project-story-text");
    const galleryEl = document.getElementById("project-gallery");
    const creditsEl = document.getElementById("project-credits-list");

    const project = await fetchJson(`/projects/${id}`);
    if (!project) {
      if (titleEl) titleEl.textContent = "案件が見つかりませんでした";
      return;
    }

    if (titleEl) titleEl.textContent = project.title || "";
    if (metaEl) {
      const date = project.shootDate || project.createdAt;
      metaEl.textContent = [
        project.clientName,
        project.category,
        date ? date.substring(0, 10) : ""
      ]
        .filter(Boolean)
        .join(" / ");
    }

    if (mainImageEl && project.mainImage?.url) {
      mainImageEl.src = project.mainImage.url;
      mainImageEl.alt = project.title || "";
    }

    if (summaryEl) summaryEl.textContent = project.summary || "";
    if (storyEl) storyEl.textContent = project.story || "";

    if (galleryEl) {
      const photos = project.photos || [];
      if (!photos.length) {
        galleryEl.innerHTML = "<p>この案件には登録された写真がまだありません。</p>";
      } else {
        galleryEl.innerHTML = photos
          .map(
            (p) => `
          <div class="project-gallery-item">
            <img src="${p.image?.url || ""}" alt="${p.title || ""}" />
          </div>
        `
          )
          .join("");
      }
    }

    if (creditsEl) {
      const credits = project.credits || [];
      creditsEl.innerHTML = credits
        .map((c) => `<li>${c.role || ""}：${c.name || ""}</li>`)
        .join("");
    }
  }

  renderProject();
})();

