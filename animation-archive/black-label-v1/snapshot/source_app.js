const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector("[data-diamond-intro]");
const introParam = new URLSearchParams(window.location.search).get("intro");
const forceIntro = introParam === "1";
const skipIntro = introParam === "0";
let introFinished = !intro;

function introWasSeen() {
  try {
    return sessionStorage.getItem("hommless-black-label-v1") === "seen";
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem("hommless-black-label-v1", "seen");
  } catch {
    // The intro still works when storage is unavailable.
  }
}

function dispatchIntroComplete() {
  document.dispatchEvent(new CustomEvent("hommless:intro-complete"));
}

function finishIntro(immediate = false) {
  if (!intro || introFinished) return;
  introFinished = true;
  rememberIntro();
  document.body.classList.remove("intro-pending");
  document.body.classList.add("intro-complete");
  dispatchIntroComplete();

  if (immediate) {
    intro.remove();
    return;
  }

  intro.classList.add("is-exiting");
  window.setTimeout(() => intro.remove(), 720);
}

if (!intro || reduceMotion || skipIntro || (introWasSeen() && !forceIntro)) {
  intro?.remove();
  document.body.classList.remove("intro-pending");
  document.body.classList.add("intro-complete");
  introFinished = true;
} else {
  intro.classList.add("is-running");
  document.querySelector("[data-intro-skip]")?.addEventListener("click", () => finishIntro(true));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") finishIntro(true);
  }, { once: true });
  window.setTimeout(() => finishIntro(false), 3100);
}


const diamondFields = [];

function createDiamondField(canvas, mode = "site") {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return null;

  let glints = [];
  let frameId = 0;
  let previousTime = 0;
  let previousDraw = 0;
  let width = 0;
  let height = 0;

  const signatureLayout = mode === "hero"
    ? [[.42,.24],[.56,.29],[.47,.39],[.6,.46],[.38,.52],[.52,.58],[.63,.64]]
    : [[.07,.16],[.88,.22],[.14,.7],[.92,.78],[.64,.52],[.36,.9]];

  function makeGlint(type, x, y, size, alpha) {
    return {
      type,
      x,
      y,
      size,
      alpha,
      intensity: type === "signature" ? Math.random() * .2 : .08,
      velocity: 0,
      target: 0,
      nextSparkle: performance.now() + 500 + Math.random() * 4200,
    };
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = mode === "site" ? window.innerWidth : Math.max(1, bounds.width);
    height = mode === "site" ? window.innerHeight : Math.max(1, bounds.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mobile = width < 720;
    const microCount = mode === "hero" ? (mobile ? 12 : 22) : (mobile ? 42 : 78);
    const facetCount = mode === "hero" ? (mobile ? 8 : 15) : (mobile ? 10 : 18);
    const signatures = signatureLayout.slice(0, mobile ? 4 : signatureLayout.length);

    glints = [
      ...Array.from({ length: microCount }, () => makeGlint(
        "micro",
        Math.random() * width,
        Math.random() * height,
        .35 + Math.random() * .75,
        .1 + Math.random() * .2,
      )),
      ...Array.from({ length: facetCount }, () => makeGlint(
        "facet",
        Math.random() * width,
        Math.random() * height,
        1.1 + Math.random() * 1.8,
        .22 + Math.random() * .3,
      )),
      ...signatures.map(([x, y], index) => makeGlint(
        "signature",
        x * width,
        y * height,
        (mobile ? 3.2 : 4.2) + (index % 3) * .65,
        mode === "hero" ? .9 : .76,
      )),
    ];
  }

  function drawFacet(glint, power) {
    const size = glint.size * (1 + power * .12);
    context.beginPath();
    context.moveTo(glint.x, glint.y - size);
    context.lineTo(glint.x + size * .54, glint.y);
    context.lineTo(glint.x, glint.y + size);
    context.lineTo(glint.x - size * .54, glint.y);
    context.closePath();
    context.fill();
  }

  function drawSignature(glint, power) {
    const haloRadius = glint.size * (5 + power * 6);
    const halo = context.createRadialGradient(glint.x, glint.y, 0, glint.x, glint.y, haloRadius);
    halo.addColorStop(0, `rgba(255,255,255,${.34 + power * .34})`);
    halo.addColorStop(.16, `rgba(225,232,240,${.12 + power * .18})`);
    halo.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(glint.x, glint.y, haloRadius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = `rgba(255,255,255,${.72 + power * .28})`;
    context.shadowColor = "rgba(255,255,255,.95)";
    context.shadowBlur = 10 + power * 22;
    drawFacet(glint, power);
    context.shadowBlur = 0;

    const horizontal = glint.size * (2.2 + power * 4.8);
    const vertical = glint.size * (3.4 + power * 7.2);
    context.lineWidth = .55;
    context.strokeStyle = `rgba(255,255,255,${.12 + power * .52})`;
    context.beginPath();
    context.moveTo(glint.x - horizontal, glint.y);
    context.lineTo(glint.x + horizontal, glint.y);
    context.moveTo(glint.x, glint.y - vertical);
    context.lineTo(glint.x, glint.y + vertical);
    if (power > .42) {
      const diagonal = glint.size * (1.4 + power * 2.6);
      context.moveTo(glint.x - diagonal, glint.y - diagonal);
      context.lineTo(glint.x + diagonal, glint.y + diagonal);
      context.moveTo(glint.x + diagonal, glint.y - diagonal);
      context.lineTo(glint.x - diagonal, glint.y + diagonal);
    }
    context.stroke();
  }

  function updateSpring(glint, timestamp, delta) {
    if (glint.type === "micro" || reduceMotion) return;
    if (timestamp >= glint.nextSparkle) {
      glint.target = glint.type === "signature" ? 1 : .52;
      glint.nextSparkle = timestamp + (glint.type === "signature" ? 2400 : 3800) + Math.random() * 5200;
    }
    glint.target *= Math.pow(glint.type === "signature" ? .955 : .925, delta);
    const stiffness = glint.type === "signature" ? .075 : .045;
    glint.velocity += (glint.target - glint.intensity) * stiffness * delta;
    glint.velocity *= Math.pow(.76, delta);
    glint.intensity = Math.max(0, Math.min(1, glint.intensity + glint.velocity * delta));
  }

  function draw(timestamp = 0) {
    if (!reduceMotion && timestamp - previousDraw < 32) {
      frameId = requestAnimationFrame(draw);
      return;
    }
    const delta = previousTime ? Math.min(2, (timestamp - previousTime) / 16.67) : 1;
    previousTime = timestamp;
    previousDraw = timestamp;
    context.clearRect(0, 0, width, height);

    glints.forEach((glint) => {
      updateSpring(glint, timestamp, delta);
      const power = reduceMotion ? .16 : glint.intensity;
      if (glint.type === "micro") {
        context.fillStyle = `rgba(255,255,255,${glint.alpha})`;
        context.beginPath();
        context.arc(glint.x, glint.y, glint.size, 0, Math.PI * 2);
        context.fill();
      } else if (glint.type === "facet") {
        context.fillStyle = `rgba(242,246,250,${glint.alpha * (.72 + power * .55)})`;
        context.shadowColor = "rgba(255,255,255,.8)";
        context.shadowBlur = 3 + power * 9;
        drawFacet(glint, power);
        context.shadowBlur = 0;
      } else {
        context.globalAlpha = glint.alpha;
        drawSignature(glint, power);
        context.globalAlpha = 1;
      }
    });

    if (!reduceMotion) frameId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  const handleResize = () => {
    resize();
    if (reduceMotion) draw();
  };
  window.addEventListener("resize", handleResize, { passive: true });

  return {
    stop() {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    },
  };
}

const siteDiamondField = createDiamondField(document.querySelector("#diamond-field"), "site");
const heroDiamondField = createDiamondField(document.querySelector("[data-hero-diamonds]"), "hero");
if (siteDiamondField) diamondFields.push(siteDiamondField);
if (heroDiamondField) diamondFields.push(heroDiamondField);

const menu = document.querySelector(".mobile-menu");
document.querySelector(".menu-toggle")?.addEventListener("click", () => {
  menu?.classList.add("open");
  menu?.setAttribute("aria-hidden", "false");
});
document.querySelector(".menu-close")?.addEventListener("click", () => {
  menu?.classList.remove("open");
  menu?.setAttribute("aria-hidden", "true");
});
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menu.classList.remove("open");
  menu.setAttribute("aria-hidden", "true");
}));

const reveals = [...document.querySelectorAll(".reveal")];
document.querySelectorAll(".drop-grid, .catalog-lux-grid, .store-list").forEach((container) => {
  [...container.querySelectorAll(".reveal")].forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 210)}ms`);
  });
});

if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6%" });
  reveals.forEach((element) => observer.observe(element));
}

const hero = document.querySelector(".lux-hero");
const heroMedia = document.querySelector("[data-hero-media]");
const revealHero = () => {
  hero?.classList.add("is-ready");
  document.querySelector(".lux-header")?.classList.add("motion-ready");
};
if (document.body.classList.contains("intro-complete")) revealHero();
else document.addEventListener("hommless:intro-complete", revealHero, { once: true });
window.setTimeout(() => {
  document.body.classList.remove("intro-pending");
  document.body.classList.add("intro-complete");
  revealHero();
}, 4100);

let heroMotionFrame = 0;
const heroTarget = { x: 0, y: 0 };
const heroCurrent = { x: 0, y: 0 };

function animateHeroSpring() {
  heroCurrent.x += (heroTarget.x - heroCurrent.x) * 0.075;
  heroCurrent.y += (heroTarget.y - heroCurrent.y) * 0.075;
  hero?.style.setProperty("--hero-x", `${heroCurrent.x * -11}px`);
  hero?.style.setProperty("--hero-y", `${heroCurrent.y * -8}px`);

  const moving = Math.abs(heroTarget.x - heroCurrent.x) + Math.abs(heroTarget.y - heroCurrent.y) > 0.002;
  heroMotionFrame = moving ? requestAnimationFrame(animateHeroSpring) : 0;
}

function setHeroTarget(x, y) {
  heroTarget.x = x;
  heroTarget.y = y;
  if (!heroMotionFrame) heroMotionFrame = requestAnimationFrame(animateHeroSpring);
}

if (!reduceMotion && hero && window.matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    setHeroTarget((event.clientX - bounds.left) / bounds.width - 0.5, (event.clientY - bounds.top) / bounds.height - 0.5);
  });
  hero.addEventListener("pointerleave", () => setHeroTarget(0, 0));
}

document.querySelectorAll(".lux-card__media").forEach((media) => {
  media.addEventListener("pointermove", (event) => {
    const bounds = media.getBoundingClientRect();
    media.style.setProperty("--glint-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    media.style.setProperty("--glint-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
  media.addEventListener("pointerleave", () => {
    media.style.setProperty("--glint-x", "50%");
    media.style.setProperty("--glint-y", "42%");
  });
});

window.addEventListener("scroll", () => {
  document.querySelector(".lux-header")?.classList.toggle("scrolled", window.scrollY > 40);
  if (!reduceMotion && heroMedia && window.scrollY < window.innerHeight) {
    hero?.style.setProperty("--hero-scroll", `${window.scrollY * 0.08}px`);
  }
}, { passive: true });

const grid = document.querySelector("[data-catalog-grid]");
const search = document.querySelector("[data-search]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const params = new URLSearchParams(window.location.search);
let activeFilter = params.get("cat") || "all";

function applyCatalogFilter() {
  if (!grid) return;
  const query = (search?.value || "").trim().toLowerCase();
  [...grid.querySelectorAll(".product-card")].forEach((card) => {
    const categoryMatch = activeFilter === "all" || (card.dataset.cats || "").includes(activeFilter);
    const searchMatch = !query || (card.dataset.title || "").includes(query);
    card.hidden = !(categoryMatch && searchMatch);
  });
  filterButtons.forEach((button) => button.classList.toggle("active", button.dataset.filter === activeFilter));
}

filterButtons.forEach((button) => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter || "all";
  applyCatalogFilter();
}));
search?.addEventListener("input", applyCatalogFilter);
applyCatalogFilter();

window.addEventListener("pagehide", () => {
  diamondFields.forEach((field) => field.stop());
  cancelAnimationFrame(heroMotionFrame);
}, { once: true });
