import {
  SITE_URL,
  DEFAULT_IMAGE,
  escapeHtml,
  excerpt,
  fetchPublicContent,
  htmlResponse,
  notFoundPage,
  renderPage
} from "../_lib/page.js";

export async function onRequestGet(context) {
  const id = encodeURIComponent(String(context.params.id || ""));
  const project = await fetchPublicContent(`/projects/${id}`);
  if (!project?.id || !project.title) {
    return notFoundPage("指定された撮影案件は公開されていないか、削除された可能性があります。");
  }

  const canonical = `${SITE_URL}/project/${id}`;
  const title = `${project.title} | 撮影実績 | JAN STUDIO`;
  const description = excerpt(project.summary || project.story, 150) || "JAN STUDIOの撮影実績・ケーススタディ。";
  const image = project.mainImage?.url || DEFAULT_IMAGE;
  const photos = Array.isArray(project.photos) ? project.photos : [];
  const imageUrls = [image, ...photos.map((photo) => photo.image?.url).filter(Boolean)];
  const dateCreated = project.shootDate || project.createdAt;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${canonical}#work`,
    name: project.title,
    description,
    image: imageUrls,
    dateCreated,
    inLanguage: "ja-JP",
    mainEntityOfPage: canonical,
    creator: { "@id": `${SITE_URL}/about#itsuki-serikawa` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    genre: project.category
  };

  const gallery = photos.map((photo) => {
    if (!photo.image?.url) return "";
    return `<figure class="project-gallery-item"><img src="${escapeHtml(photo.image.url)}?w=1200&q=82" alt="${escapeHtml(photo.title || project.title)}" width="${Number(photo.image.width) || 1200}" height="${Number(photo.image.height) || 800}" loading="lazy" decoding="async"></figure>`;
  }).join("");

  const meta = [project.clientName, project.category, dateCreated ? String(dateCreated).slice(0, 10) : ""]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" / ");

  const mainHtml = `
    <article>
      <header class="page-hero container">
        <nav aria-label="パンくずリスト"><a href="/">Top</a> / <a href="/works">Works</a></nav>
        <p class="page-eyebrow">Case Study</p>
        <h1 class="page-title">${escapeHtml(project.title)}</h1>
        ${meta ? `<p class="page-meta">${meta}</p>` : ""}
      </header>
      <section class="section" style="padding-top:0"><div class="container project-hero">
        ${project.mainImage?.url ? `<figure class="project-hero-image"><img src="${escapeHtml(project.mainImage.url)}?w=1800&q=88" alt="${escapeHtml(project.title)}" width="${Number(project.mainImage.width) || 1800}" height="${Number(project.mainImage.height) || 1200}" fetchpriority="high" decoding="async"></figure>` : ""}
        <div class="project-summary"><h2 class="section-title">背景と課題</h2><p>${escapeHtml(project.summary || "")}</p></div>
      </div></section>
      ${gallery ? `<section class="section"><div class="container"><h2 class="section-title">成果物</h2><div class="project-gallery-grid">${gallery}</div></div></section>` : ""}
      ${project.story ? `<section class="section band"><div class="container project-story"><h2 class="section-title">撮影プロセス・成果</h2><p>${escapeHtml(project.story)}</p></div></section>` : ""}
      <div class="container" style="padding:40px 0 80px"><a class="back-link" href="/works">撮影実績一覧へ戻る</a></div>
    </article>`;

  return htmlResponse(renderPage({
    title,
    description,
    canonical,
    image,
    imageAlt: project.title,
    ogType: "article",
    bodyClass: "page-project",
    mainHtml,
    jsonLd
  }));
}
