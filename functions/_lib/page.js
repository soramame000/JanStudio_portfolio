export const SITE_URL = "https://janstudio.app";
export const API_BASE = "https://api-proxy.nagori.workers.dev/api";
export const DEFAULT_IMAGE = `${SITE_URL}/assets/img/hero-bg.jpg`;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripHtml(value) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(value, maxLength = 150) {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function sanitizeRichHtml(value) {
  return String(value ?? "")
    .replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
}

export async function fetchPublicContent(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  return data && typeof data === "object" ? data : null;
}

export function renderPage({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  imageAlt,
  ogType = "article",
  bodyClass,
  mainHtml,
  jsonLd
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const safeImage = escapeHtml(image);
  const safeImageAlt = escapeHtml(imageAlt || title);
  const structuredData = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0a0a0b">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="${safeCanonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Instrument+Serif:ital@0;1&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/reset.css?v=8">
  <link rel="stylesheet" href="/assets/css/style.css?v=8">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <meta property="og:site_name" content="JAN STUDIO">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:alt" content="${safeImageAlt}">
  <meta property="og:url" content="${safeCanonical}">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImage}">
  <script type="application/ld+json">${structuredData}</script>
  <script src="/assets/js/components.js?v=8" defer></script>
</head>
<body class="${escapeHtml(bodyClass)}">
  <site-header></site-header>
  <main id="main">${mainHtml}</main>
  <site-footer></site-footer>
  <a href="/contact?type=shoot" class="floating-cta" id="floating-cta">撮影を相談する</a>
  <script src="/assets/js/api.js?v=8"></script>
  <script src="/assets/js/motion.js?v=8"></script>
</body>
</html>`;
}

export function notFoundPage(message) {
  return new Response(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>ページが見つかりません | JAN STUDIO</title><link rel="stylesheet" href="/assets/css/style.css?v=8"></head><body><main class="container" style="padding:120px 24px"><h1>ページが見つかりません</h1><p>${escapeHtml(message)}</p><p><a href="/works">撮影実績を見る</a></p></main></body></html>`, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" }
  });
}

export function htmlResponse(html) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}
