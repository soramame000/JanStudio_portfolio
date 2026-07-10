// サイト共通ユーティリティ（CMS取得・エスケープ・フローティングCTA）
(() => {
  const config = window.PORTFOLIO_CONFIG || {};

  async function fetchJson(path, params = {}) {
    const baseUrl = config.CMS_BASE_URL;
    if (!baseUrl) {
      console.warn("CMSの設定が未完了のため、コンテンツを取得できません。");
      return null;
    }

    const base = baseUrl.replace(/\/+$/, "");
    const endpoint = path.startsWith("/") ? path : "/" + path;
    const url = new URL(base + endpoint);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, String(value))
    );

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        if (res.status !== 404) {
          console.error("CMS fetch error", res.status, await res.text());
        }
        return null;
      }
      return res.json();
    } catch (error) {
      console.error("CMS fetch failed", error);
      return null;
    }
  }

  // CMS由来のテキストをHTML/属性値として安全に埋め込むためのエスケープ
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toTimestamp(value) {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? 0 : ts;
  }

  function isPublic(item) {
    const status = item.publishStatus;
    if (!status) return true;
    if (Array.isArray(status)) return status.includes("public");
    return status === "public";
  }

  function photoAlt(item) {
    if (item?.title) return String(item.title);
    const genres = Array.isArray(item?.genre) ? item.genre : [item?.genre].filter(Boolean);
    const labels = {
      "american-football": "アメリカンフットボール",
      "music-event": "ライブ・イベント",
      portrait: "ポートレート",
      "fine art": "ファインアート"
    };
    const genre = genres.map((value) => labels[value] || value).join("・") || "撮影実績";
    const date = item?.eventDate ? String(item.eventDate).slice(0, 10).replace(/-/g, "年").replace(/年(\d{2})年/, "年$1月").replace(/月(\d{2})$/, "月$1日") : "";
    return `${genre}の撮影写真${date ? `（${date}）` : ""}`;
  }

  function initFloatingCta() {
    const floatingCta = document.getElementById("floating-cta");
    if (!floatingCta) return;
    window.addEventListener(
      "scroll",
      () => {
        floatingCta.classList.toggle("visible", window.scrollY > 500);
      },
      { passive: true }
    );
  }

  document.addEventListener("DOMContentLoaded", initFloatingCta);

  window.JAN = { fetchJson, esc, toTimestamp, isPublic, photoAlt };
})();
