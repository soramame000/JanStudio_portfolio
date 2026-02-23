// premium.js - 高度な演出・UX向上スクリプト

document.addEventListener("DOMContentLoaded", () => {
    // 1. Lenis (Smooth Scroll) の初期化
    let lenis;
    if (typeof Lenis !== "undefined") {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // GSAP と Lenis の連動
    if (typeof gsap !== "undefined" && lenis && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0, 0);

        // 3. ページロード時の出現アニメーション (GSAP Stagger)
        gsap.from(".page-title, .hero-title", {
            y: 80,
            opacity: 0,
            duration: 1.4,
            ease: "power4.out",
            stagger: 0.15,
            delay: 0.1
        });

        gsap.from(".page-lead, .page-meta, .page-eyebrow, .hero-subtitle", {
            y: 40,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.5
        });

        // 4. スクロールに応じたセクションタイトルの出現
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: "top 85%", // 画面の下から15%の位置に来たら発火
                },
                y: 50,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out"
            });
        });

        // 5. ちょっとしたパララックス効果 (画像がスクロールでわずかに動く)
        gsap.utils.toArray('.img-skeleton-wrapper img').forEach(img => {
            gsap.to(img, {
                scrollTrigger: {
                    trigger: img,
                    start: "top bottom",
                    scrub: 0.8 // スクロールに少し遅れて追従する心地よいエフェクト
                },
                y: "10%",
                ease: "none"
            });
        });
    }

    // 2. カスタム・マグネティック・カーソル
    if (typeof gsap !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
        // JSが正常稼働し、かつマウス操作環境の場合のみカスタムカーソルを有効化
        document.body.classList.add('has-custom-cursor');

        const cursor = document.createElement('div');
        cursor.classList.add('premium-cursor');
        document.body.appendChild(cursor);

        const cursorFollower = document.createElement('div');
        cursorFollower.classList.add('premium-cursor-follower');
        document.body.appendChild(cursorFollower);

        // 中心を起点にするためのGSAP設定
        gsap.set(cursor, { xPercent: -50, yPercent: -50 });
        gsap.set(cursorFollower, { xPercent: -50, yPercent: -50 });

        let mouseX = 0, mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // メインカーソル（点）は瞬時に追従
            gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0 });
            // フォロワー（円）は滑らかに追従
            gsap.to(cursorFollower, {
                x: mouseX,
                y: mouseY,
                duration: 0.5,
                ease: "power3.out"
            });
        });

        // リンクやボタンに乗った際のカーソルの変形（吸い付くようなホバー体験）
        const selectables = document.querySelectorAll('a, button, .gallery-item, .blog-card, input, textarea');
        selectables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorFollower.classList.add('is-hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursorFollower.classList.remove('is-hovering');
            });
        });
    }
});
