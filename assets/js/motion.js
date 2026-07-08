// スクロール連動のリビール演出。prefers-reduced-motion を尊重する。
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealAll() {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
  }

  function init() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    document.querySelectorAll("[data-reveal]").forEach((el, i) => {
      // 兄弟同士は軽くスタッガーさせる（data-reveal-delay で明示指定も可）
      const delay = el.dataset.revealDelay;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
      observer.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
