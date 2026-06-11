(() => {
  const { fetchJson, esc } = window.JAN;

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

    const project = await fetchJson(`/projects/${encodeURIComponent(id)}`);
    if (!project) {
      if (titleEl) titleEl.textContent = "案件が見つかりませんでした";
      return;
    }

    if (project.title) {
      document.title = `${project.title} | JAN STUDIO`;
    }
    if (titleEl) titleEl.textContent = project.title || "";
    if (metaEl) {
      const date = project.shootDate || project.createdAt;
      metaEl.textContent = [
        project.clientName,
        Array.isArray(project.category) ? project.category.join(", ") : project.category,
        date ? date.substring(0, 10) : ""
      ]
        .filter(Boolean)
        .join(" / ");
    }

    if (mainImageEl && project.mainImage?.url) {
      mainImageEl.src = project.mainImage.url + "?w=1600&q=85";
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
          <div class="project-gallery-item img-skeleton-wrapper" style="height: 200px;">
            <img src="${p.image?.url ? esc(p.image.url) + '?w=800&q=80' : ''}" alt="${esc(p.title || "")}" loading="lazy" decoding="async" onload="this.classList.add('img-loaded'); this.parentElement.classList.add('is-loaded');" />
          </div>
        `
          )
          .join("");
      }
    }

    if (creditsEl) {
      const credits = project.credits || [];
      creditsEl.innerHTML = credits
        .map((c) => `<li>${esc(c.role || "")}：${esc(c.name || "")}</li>`)
        .join("");
    }
  }

  renderProject();
})();
