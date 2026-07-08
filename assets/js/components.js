class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <a class="skip-link" href="#main">本文へスキップ</a>
      <header class="site-header">
        <div class="container header-inner">
          <a href="index.html" class="logo">JAN STUDIO</a>
          <nav class="global-nav" aria-label="メインナビゲーション">
            <button class="nav-toggle" aria-expanded="false" aria-controls="global-nav-list" aria-label="メニューを開閉">
              <span></span><span></span>
            </button>
            <ul id="global-nav-list">
              <li><a href="index.html">Top</a></li>
              <li><a href="works.html">Works</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="journal.html">Journal</a></li>
              <li><a href="about.html">About</a></li>
              <li><a href="contact.html" class="nav-cta">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>
    `;

    const header = this.querySelector(".site-header");
    const navToggle = this.querySelector(".nav-toggle");
    const navList = this.querySelector("#global-nav-list");

    if (navToggle && navList) {
      navToggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
      });
      // メニュー内リンクを押したら閉じる
      navList.addEventListener("click", (e) => {
        if (e.target.closest("a")) {
          navList.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      });
    }

    // スクロール量に応じて背景を付け、下スクロールで隠し上スクロールで出す
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      const menuOpen = navList?.classList.contains("is-open");
      if (!menuOpen) {
        if (y > lastY && y > 320) {
          header.classList.add("is-hidden");
        } else {
          header.classList.remove("is-hidden");
        }
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();

    // Set active link
    const path = window.location.pathname.split("/").pop() || "index.html";
    this.querySelectorAll("#global-nav-list a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
}
customElements.define("site-header", SiteHeader);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <p class="footer-wordmark" aria-hidden="true">Jan Studio®</p>
          <div class="footer-grid">
            <div class="footer-brand">
              <span class="logo-small">JAN STUDIO</span>
              <p class="footer-tagline">一瞬を鍛え、記憶に残す。</p>
              <p class="footer-status">
                <span class="status-dot" aria-hidden="true"></span>
                <span>Available for bookings</span>
                <span class="sep" aria-hidden="true">/</span>
                <span>Osaka, JP <span class="footer-clock" data-footer-clock>--:--:--</span> JST</span>
                <span class="sep" aria-hidden="true">/</span>
                <span aria-hidden="true">34.69°N 135.50°E</span>
              </p>
              <p class="footer-copy">© ${year} JAN STUDIO. All rights reserved.</p>
            </div>
            <nav class="footer-links" aria-label="フッターナビゲーション">
              <div class="footer-nav">
                <ul>
                  <li><a href="works.html">Works</a></li>
                  <li><a href="services.html">Services</a></li>
                  <li><a href="journal.html">Journal</a></li>
                  <li><a href="about.html">About</a></li>
                  <li><a href="contact.html">Contact</a></li>
                </ul>
              </div>
              <div class="footer-sns">
                <a href="https://www.instagram.com/itsu_photoooo" target="_blank" rel="noopener noreferrer"
                  aria-label="Instagram @itsu_photoooo">Instagram ↗</a>
              </div>
            </nav>
          </div>
        </div>
      </footer>
    `;

    // 大阪（JST）の現在時刻
    const clockEl = this.querySelector("[data-footer-clock]");
    if (clockEl) {
      const fmt = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const tick = () => {
        clockEl.textContent = fmt.format(new Date());
      };
      tick();
      setInterval(tick, 1000);
    }
  }
}
customElements.define("site-footer", SiteFooter);
