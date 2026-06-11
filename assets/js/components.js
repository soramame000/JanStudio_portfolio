class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
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
    
    // Toggle menu
    const navToggle = this.querySelector(".nav-toggle");
    const navList = this.querySelector("#global-nav-list");
    if (navToggle && navList) {
      navToggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    // Set active link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const links = this.querySelectorAll("#global-nav-list a");
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
}
customElements.define('site-header', SiteHeader);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div class="footer-brand">
            <span class="logo-small">JAN STUDIO</span>
            <p class="footer-copy">
              © <span>${year}</span>
              JAN STUDIO. All rights reserved.
            </p>
          </div>
          <div class="footer-links">
            <div class="footer-sns">
              <a href="https://www.instagram.com/itsu_photoooo" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram @itsu_photoooo">Instagram @itsu_photoooo</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);
