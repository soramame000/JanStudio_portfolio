// FORGE モーションレイヤー
// スクロールリビール / 文字点灯 / 視差 / カスタムカーソル / 磁力ボタン
// すべて prefers-reduced-motion とポインタ種別を尊重する。
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------------------------------------------
     1. Scroll reveal
     --------------------------------------------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
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
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const delay = el.dataset.revealDelay;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
      observer.observe(el);
    });
  }

  /* ---------------------------------------------
     2. スクロールに合わせて1文字ずつ灯る見出し
        [data-split-words] を文字span化して進捗で点灯
     --------------------------------------------- */
  function splitChars(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
    }
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      for (const ch of node.nodeValue) {
        if (/\s/.test(ch)) {
          frag.appendChild(document.createTextNode(ch));
          continue;
        }
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = ch;
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    });
    return Array.from(root.querySelectorAll(".word"));
  }

  function initScrollText() {
    if (reduceMotion) return;
    document.querySelectorAll("[data-split-words]").forEach((el) => {
      const chars = splitChars(el);
      if (!chars.length) return;
      let ticking = false;
      const update = () => {
        ticking = false;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.min(1, Math.max(0, (vh * 0.9 - rect.top) / (rect.height + vh * 0.45)));
        const lit = Math.floor(progress * chars.length * 1.2);
        chars.forEach((c, i) => c.classList.toggle("is-lit", i < lit));
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
      update();
    });
  }

  /* ---------------------------------------------
     3. Parallax — [data-parallax="0.2"] が視差係数
     --------------------------------------------- */
  function initParallax() {
    if (reduceMotion) return;
    const els = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;

    let items = [];
    const measure = () => {
      items = els.map((el) => {
        el.style.transform = "";
        const rect = el.getBoundingClientRect();
        return {
          el,
          speed: parseFloat(el.dataset.parallax) || 0.2,
          top: rect.top + window.scrollY,
          height: rect.height
        };
      });
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      items.forEach(({ el, speed, top, height }) => {
        const center = top + height / 2;
        const viewCenter = y + vh / 2;
        const offset = (viewCenter - center) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      update();
    });
  }

  /* ---------------------------------------------
     4. Custom cursor — 写真上でも視認できる difference 合成
     --------------------------------------------- */
  function initCursor() {
    if (reduceMotion || !finePointer) return;

    const dot = document.createElement("div");
    dot.className = "cursor-dot is-hidden";
    const ring = document.createElement("div");
    ring.className = "cursor-ring is-hidden";
    document.body.append(dot, ring);
    document.body.classList.add("has-cursor");

    let x = innerWidth / 2, y = innerHeight / 2;
    let rx = x, ry = y;
    let visible = false;

    document.addEventListener("mousemove", (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      if (!visible) {
        visible = true;
        dot.classList.remove("is-hidden");
        ring.classList.remove("is-hidden");
      }
    });
    document.addEventListener("mouseleave", () => {
      visible = false;
      dot.classList.add("is-hidden");
      ring.classList.add("is-hidden");
    });

    // リングは遅れて追従（lerp）
    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
      requestAnimationFrame(loop);
    })();

    // インタラクティブ要素上でリングを拡大
    document.addEventListener("mouseover", (e) => {
      const interactive = e.target.closest("a, button, [role='button'], summary");
      ring.classList.toggle("is-active", Boolean(interactive));
    });
  }

  /* ---------------------------------------------
     5. Magnetic buttons — カーソルに吸い付くCTA
     --------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll(".btn, .floating-cta, .nav-cta").forEach((el) => {
      const strength = 0.28;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  function init() {
    initReveal();
    initScrollText();
    initParallax();
    initCursor();
    initMagnetic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
