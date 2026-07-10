import {
  SITE_URL,
  DEFAULT_IMAGE,
  escapeHtml,
  excerpt,
  fetchPublicContent,
  htmlResponse,
  notFoundPage,
  renderPage,
  sanitizeRichHtml
} from "../_lib/page.js";

export async function onRequestGet(context) {
  const id = encodeURIComponent(String(context.params.id || ""));
  const post = await fetchPublicContent(`/blogPosts/${id}`);
  if (!post?.id || !post.title) {
    return notFoundPage("指定された記事は公開されていないか、削除された可能性があります。");
  }

  const canonical = `${SITE_URL}/journal/${id}`;
  const title = `${post.title} | JAN STUDIO Journal`;
  const description = excerpt(post.description || post.body, 150) || "JAN STUDIOの撮影ジャーナル記事。";
  const image = post.thumbnail?.url || DEFAULT_IMAGE;
  const publishedAt = post.publishedAt || post.createdAt;
  const modifiedAt = post.updatedAt || publishedAt;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: post.title,
    description,
    image: [image],
    datePublished: publishedAt,
    dateModified: modifiedAt,
    inLanguage: "ja-JP",
    mainEntityOfPage: canonical,
    author: { "@id": `${SITE_URL}/about#itsuki-serikawa` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    keywords: tags.join(", ")
  };

  const mainHtml = `
    <article class="blog-detail" style="display:block">
      <header class="page-hero container blog-detail-header">
        <nav aria-label="パンくずリスト"><a href="/">Top</a> / <a href="/journal">Journal</a></nav>
        <p class="page-eyebrow">Journal</p>
        <h1 class="page-title">${escapeHtml(post.title)}</h1>
        ${publishedAt ? `<time class="blog-detail-date" datetime="${escapeHtml(publishedAt)}">${escapeHtml(publishedAt.slice(0, 10))}</time>` : ""}
      </header>
      ${post.thumbnail?.url ? `<figure class="container"><img src="${escapeHtml(post.thumbnail.url)}?w=1600&q=85" alt="${escapeHtml(post.title)}" width="${Number(post.thumbnail.width) || 1600}" height="${Number(post.thumbnail.height) || 900}" fetchpriority="high" decoding="async"></figure>` : ""}
      <div class="section"><div class="container blog-detail-body">${sanitizeRichHtml(post.body || "")}</div></div>
      <div class="container" style="padding-bottom:80px"><a class="back-link" href="/journal">記事一覧へ戻る</a></div>
    </article>`;

  return htmlResponse(renderPage({
    title,
    description,
    canonical,
    image,
    imageAlt: post.title,
    ogType: "article",
    bodyClass: "page-blog",
    mainHtml,
    jsonLd
  }));
}
