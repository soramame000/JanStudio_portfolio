import { API_BASE, SITE_URL, escapeHtml } from "./_lib/page.js";

const FIXED_PAGES = [
  ["/", "1.0"],
  ["/works", "0.9"],
  ["/services", "0.9"],
  ["/journal", "0.8"],
  ["/about", "0.8"],
  ["/contact", "0.7"]
];

async function fetchList(endpoint, fields) {
  const url = `${API_BASE}/${endpoint}?limit=100&orders=-updatedAt&fields=${encodeURIComponent(fields)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => null);
  return Array.isArray(data?.contents) ? data.contents : [];
}

function urlEntry(path, lastModified, priority) {
  const lastmod = lastModified ? `<lastmod>${escapeHtml(String(lastModified).slice(0, 10))}</lastmod>` : "";
  const rank = priority ? `<priority>${priority}</priority>` : "";
  return `<url><loc>${SITE_URL}${escapeHtml(path)}</loc>${lastmod}${rank}</url>`;
}

export async function onRequestGet() {
  const [posts, projects] = await Promise.all([
    fetchList("blogPosts", "id,updatedAt,publishedAt"),
    fetchList("projects", "id,updatedAt,shootDate")
  ]);

  const fixed = FIXED_PAGES.map(([path, priority]) => urlEntry(path, "2026-07-10", priority));
  const articleEntries = posts
    .filter((post) => post?.id)
    .map((post) => urlEntry(`/journal/${encodeURIComponent(post.id)}`, post.updatedAt || post.publishedAt));
  const projectEntries = projects
    .filter((project) => project?.id)
    .map((project) => urlEntry(`/project/${encodeURIComponent(project.id)}`, project.updatedAt || project.shootDate));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...fixed, ...articleEntries, ...projectEntries].join("")}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
