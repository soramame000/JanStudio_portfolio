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
        console.error("CMS fetch error", res.status, await res.text());
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

  window.JAN = { fetchJson, esc, toTimestamp, isPublic };
})();
