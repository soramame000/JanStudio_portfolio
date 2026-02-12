(() => {
  if (!document.body.classList.contains("page-index")) return;

  const animatedTargets = document.querySelectorAll(
    ".hero, .proof-pill, .gallery-card, .pricing-card, .blog-card, .super-cta-inner, .section-title, .section-kicker, .about-badges li"
  );

  if (!animatedTargets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    }
  );

  animatedTargets.forEach((el, index) => {
    el.style.setProperty("--reveal-delay", `${index * 28}ms`);
    observer.observe(el);
  });
})();

