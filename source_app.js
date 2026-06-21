const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  let isVisible = true;
  let resizeFrame = 0;

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
    const mobile = width < 720;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const microCount = mode === "hero" ? (mobile ? 10 : 16) : (mobile ? 30 : 56);
    const facetCount = mode === "hero" ? (mobile ? 6 : 11) : (mobile ? 8 : 14);
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
    frameId = 0;
    if (!reduceMotion && (!isVisible || document.hidden)) return;
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

    if (!reduceMotion && isVisible && !document.hidden) frameId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  const handleResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      cancelAnimationFrame(frameId);
      frameId = 0;
      resize();
      if (reduceMotion || (isVisible && !document.hidden)) draw();
    });
  };
  const handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      return;
    }
    previousTime = 0;
    if (!reduceMotion && isVisible && !frameId) frameId = requestAnimationFrame(draw);
  };
  window.addEventListener("resize", handleResize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    setVisible(value) {
      isVisible = value;
      if (!isVisible) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!reduceMotion && !document.hidden && !frameId) {
        previousTime = 0;
        frameId = requestAnimationFrame(draw);
      }
    },
    stop() {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    },
  };
}

const siteDiamondField = createDiamondField(document.querySelector("#diamond-field"), "site");
const heroDiamondField = createDiamondField(document.querySelector("[data-hero-diamonds]"), "hero");
if (siteDiamondField) diamondFields.push(siteDiamondField);
if (heroDiamondField) diamondFields.push(heroDiamondField);

const heroDiamondCanvas = document.querySelector("[data-hero-diamonds]");
if (heroDiamondField && heroDiamondCanvas && !reduceMotion && "IntersectionObserver" in window) {
  const diamondObserver = new IntersectionObserver(([entry]) => {
    heroDiamondField.setVisible(entry.isIntersecting);
  }, { rootMargin: "100px 0px" });
  diamondObserver.observe(heroDiamondCanvas);
}

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) diamondFields.forEach((field) => field.stop());
});

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
    element.style.setProperty("--reveal-delay", `${Math.min(index * 40, 120)}ms`);
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
const revealHero = () => {
  hero?.classList.add("is-ready");
  document.querySelector(".lux-header")?.classList.add("motion-ready");
};
revealHero();

if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".lux-card__media").forEach((media) => {
    let pointerFrame = 0;
    let pointerX = 50;
    let pointerY = 42;
    media.addEventListener("pointermove", (event) => {
      const bounds = media.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
      pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        media.style.setProperty("--glint-x", `${pointerX}%`);
        media.style.setProperty("--glint-y", `${pointerY}%`);
      });
    }, { passive: true });
    media.addEventListener("pointerleave", () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      media.style.setProperty("--glint-x", "50%");
      media.style.setProperty("--glint-y", "42%");
    });
  });
}

const stickyHeader = document.querySelector(".lux-header");
let scrollFrame = 0;
if (stickyHeader) {
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      stickyHeader.classList.toggle("scrolled", window.scrollY > 40);
    });
  }, { passive: true });
}

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

const CART_STORAGE_KEY = "hommless-cart-v1";
const appScript = document.currentScript;
const assetBaseUrl = new URL(".", appScript?.src || window.location.href);
let cart = [];
let lastCartTrigger = null;

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((item) => item?.id && item?.quantity > 0) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // The cart remains usable for the current page when storage is unavailable.
  }
}

function escapeCartText(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function formatPrice(value) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(value) || 0)} ₽`;
}

function cartItemKey(item) {
  return `${item.id}::${item.size}`;
}

document.body.insertAdjacentHTML("beforeend", `
  <aside class="cart-drawer" data-cart-drawer aria-hidden="true">
    <button class="cart-drawer__overlay" type="button" data-cart-close aria-label="Закрыть корзину"></button>
    <section class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
      <header class="cart-drawer__header">
        <h2 id="cart-title">Корзина <span data-cart-panel-count>0</span></h2>
        <button class="cart-icon-button" type="button" data-cart-close aria-label="Закрыть корзину" title="Закрыть">×</button>
      </header>
      <div class="cart-drawer__body">
        <div class="cart-empty" data-cart-empty>Корзина пуста</div>
        <div data-cart-items></div>
      </div>
      <footer class="cart-drawer__footer">
        <div class="cart-total"><span>Итого</span><strong data-cart-total>0 ₽</strong></div>
        <a class="cart-checkout" href="https://t.me/hmmls" target="_blank" rel="noreferrer" data-cart-checkout>Оформить заказ</a>
      </footer>
    </section>
  </aside>
`);

const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartPanel = cartDrawer?.querySelector(".cart-drawer__panel");

function renderCart() {
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.querySelectorAll("[data-cart-count], [data-cart-panel-count]").forEach((counter) => {
    counter.textContent = String(quantity);
  });

  const items = document.querySelector("[data-cart-items]");
  const empty = document.querySelector("[data-cart-empty]");
  const checkout = document.querySelector("[data-cart-checkout]");
  if (empty) empty.hidden = cart.length > 0;
  if (checkout) checkout.setAttribute("aria-disabled", String(cart.length === 0));
  document.querySelector("[data-cart-total]").textContent = formatPrice(total);
  if (!items) return;

  items.innerHTML = cart.map((item) => {
    const imageUrl = item.image ? new URL(item.image.replace(/^assets\//, ""), assetBaseUrl).href : "";
    const key = escapeCartText(cartItemKey(item));
    return `
      <article class="cart-item" data-cart-key="${key}">
        ${imageUrl ? `<img src="${escapeCartText(imageUrl)}" alt="${escapeCartText(item.title)}">` : ""}
        <div class="cart-item__content">
          <strong>${escapeCartText(item.title)}</strong>
          <span class="cart-item__price">${formatPrice(item.price * item.quantity)}</span>
          <span class="cart-item__size">РАЗМЕР: ${escapeCartText(item.size)}</span>
          <div class="cart-item__actions">
            <div class="cart-quantity" aria-label="Количество">
              <button type="button" data-cart-action="decrease" aria-label="Уменьшить количество" title="Уменьшить">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-action="increase" aria-label="Увеличить количество" title="Увеличить">+</button>
            </div>
            <button class="cart-remove" type="button" data-cart-action="remove">УДАЛИТЬ</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function openCart(trigger) {
  lastCartTrigger = trigger || document.activeElement;
  menu?.classList.remove("open");
  menu?.setAttribute("aria-hidden", "true");
  cartDrawer?.classList.add("open");
  cartDrawer?.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  cartPanel?.focus();
}

function closeCart() {
  cartDrawer?.classList.remove("open");
  cartDrawer?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
  lastCartTrigger?.focus?.();
}

document.querySelectorAll("[data-cart-open]").forEach((button) => {
  button.addEventListener("click", () => openCart(button));
});
document.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", closeCart));
window.addEventListener("keydown", (event) => {
  if (!cartDrawer?.classList.contains("open")) return;
  if (event.key === "Escape") {
    closeCart();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...cartPanel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getAttribute("aria-disabled") !== "true");
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-size]").forEach((size) => {
      const selected = size === button;
      size.classList.toggle("selected", selected);
      size.setAttribute("aria-pressed", String(selected));
    });
  });
});

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
  button.addEventListener("click", () => {
    const size = document.querySelector("[data-size].selected")?.dataset.size || "ONE SIZE";
    const item = {
      id: button.dataset.productId,
      title: button.dataset.productTitle,
      price: Number((button.dataset.productPrice || "").replace(/\D/g, "")),
      image: button.dataset.productImage,
      size,
      quantity: 1,
    };
    const existing = cart.find((entry) => cartItemKey(entry) === cartItemKey(item));
    if (existing) existing.quantity += 1;
    else cart.push(item);
    saveCart();
    renderCart();
    openCart(button);
  });
});

cartDrawer?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-cart-action]");
  const row = action?.closest("[data-cart-key]");
  if (!action || !row) return;
  const index = cart.findIndex((item) => cartItemKey(item) === row.dataset.cartKey);
  if (index < 0) return;
  if (action.dataset.cartAction === "increase") cart[index].quantity += 1;
  if (action.dataset.cartAction === "decrease") cart[index].quantity -= 1;
  if (action.dataset.cartAction === "remove" || cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
});

window.addEventListener("storage", (event) => {
  if (event.key !== CART_STORAGE_KEY) return;
  cart = readCart();
  renderCart();
});

cart = readCart();
renderCart();
