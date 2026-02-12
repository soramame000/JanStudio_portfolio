(() => {
  const root = document.documentElement;
  const isReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const hardwareThreads = navigator.hardwareConcurrency || 4;
  const deviceMemory = navigator.deviceMemory || 4;
  const prefersDataSave =
    navigator.connection && navigator.connection.saveData === true;
  const isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
  const isLiteDevice =
    prefersDataSave ||
    hardwareThreads <= 4 ||
    deviceMemory <= 4 ||
    isSmallViewport;
  const stage =
    document.querySelector(".apple-chargers-home") ||
    document.querySelector(".apple-chargers-gallery");
  const hotSections = document.querySelectorAll(
    ".apple-chargers-home .section, .apple-chargers-gallery .section, .hero, .page-hero-gallery"
  );

  if (isLiteDevice) {
    root.classList.add("fx-lite");
  } else {
    root.classList.add("fx-full");
  }

  function setupPointerAndParallax() {
    const orbA = document.querySelector(".fx-orb-a");
    const orbB = document.querySelector(".fx-orb-b");
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let rafId = 0;

    const render = () => {
      root.style.setProperty("--pointer-x", `${pointerX}px`);
      root.style.setProperty("--pointer-y", `${pointerY}px`);

      if (orbA && orbB && !isLiteDevice) {
        const nx = pointerX / window.innerWidth - 0.5;
        const ny = pointerY / window.innerHeight - 0.5;
        orbA.style.transform = `translate(${nx * 24}px, ${ny * 20}px) scale(1.02)`;
        orbB.style.transform = `translate(${nx * -18}px, ${ny * -14}px) scale(1.04)`;
      }
      rafId = 0;
    };

    const onPointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    window.addEventListener(
      "pointermove",
      onPointerMove,
      { passive: true }
    );
    render();
  }

  function setupTilt() {
    if (isLiteDevice) return;
    const tiltTargets = document.querySelectorAll(
      ".hero, .super-cta-inner, .pricing-card, .blog-card, .gallery-item, .gallery-card"
    );
    if (!tiltTargets.length) return;

    tiltTargets.forEach((target) => {
      target.classList.add("fx-tilt-card");
      target.addEventListener("pointermove", (event) => {
        const rect = target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 8;
        const rotateX = (0.5 - y) * 8;
        target.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
        target.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      });

      target.addEventListener("pointerleave", () => {
        target.style.setProperty("--tilt-x", "0deg");
        target.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  function setupSparkLayer() {
    if (!stage) return;

    const layer = document.createElement("div");
    layer.className = "fx-spark-layer";
    layer.setAttribute("aria-hidden", "true");

    const sparkCount = isLiteDevice ? 0 : window.innerWidth < 720 ? 8 : 14;
    if (!sparkCount) return;
    for (let i = 0; i < sparkCount; i += 1) {
      const spark = document.createElement("span");
      spark.className = "fx-spark";
      spark.style.setProperty("--spark-left", `${Math.random() * 100}%`);
      spark.style.setProperty("--spark-size", `${2 + Math.random() * 5}px`);
      spark.style.setProperty("--spark-delay", `${Math.random() * 6}s`);
      spark.style.setProperty("--spark-duration", `${4 + Math.random() * 5}s`);
      layer.appendChild(spark);
    }
    stage.appendChild(layer);
  }

  function setupScrollCinema() {
    if (isLiteDevice) return;
    let ticking = false;
    const update = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const hueShift = Math.sin(progress * Math.PI * 2) * 12;
      const tickerSpeed = 20 - progress * 8;
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--hue-shift", `${hueShift.toFixed(2)}deg`);
      root.style.setProperty("--ticker-speed", `${tickerSpeed.toFixed(2)}s`);
      ticking = false;
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
  }

  function setupSectionHeat() {
    if (isLiteDevice) return;
    if (!hotSections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-stage-hot");
          } else {
            entry.target.classList.remove("is-stage-hot");
          }
        });
      },
      {
        root: null,
        threshold: 0.45
      }
    );
    hotSections.forEach((section) => observer.observe(section));
  }

  function setupLightningBursts() {
    if (isLiteDevice) return;
    if (!stage) return;

    const flash = document.createElement("div");
    flash.className = "fx-lightning-flash";
    flash.setAttribute("aria-hidden", "true");
    stage.appendChild(flash);

    const burst = () => {
      flash.classList.add("is-flashing");
      setTimeout(() => flash.classList.remove("is-flashing"), 220);
      setTimeout(() => flash.classList.add("is-flashing"), 360);
      setTimeout(() => flash.classList.remove("is-flashing"), 560);
    };

    const schedule = () => {
      const waitMs = 2200 + Math.random() * 3200;
      setTimeout(() => {
        burst();
        schedule();
      }, waitMs);
    };

    schedule();
  }

  function setupGlitchBursts() {
    if (isLiteDevice) return;
    const headings = document.querySelectorAll(".fx-glitch-heading");
    if (!headings.length) return;

    const burst = () => {
      headings.forEach((heading) => {
        heading.classList.add("is-glitching");
      });
      setTimeout(() => {
        headings.forEach((heading) => heading.classList.remove("is-glitching"));
      }, 340);
    };

    const schedule = () => {
      const waitMs = 1800 + Math.random() * 3600;
      setTimeout(() => {
        burst();
        schedule();
      }, waitMs);
    };

    schedule();
  }

  setupPointerAndParallax();
  if (!isReducedMotion) {
    setupTilt();
    setupSparkLayer();
    setupScrollCinema();
    setupSectionHeat();
    setupLightningBursts();
    setupGlitchBursts();
  }
})();

