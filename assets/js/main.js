(() => {
  const navToggle = document.querySelector(".nav-toggle");
  const navList = document.getElementById("global-nav-list");

  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const yearEls = document.querySelectorAll(
    "#copyright-year, [id^='footer-year-']"
  );
  const year = new Date().getFullYear();
  yearEls.forEach((el) => (el.textContent = String(year)));
})();

