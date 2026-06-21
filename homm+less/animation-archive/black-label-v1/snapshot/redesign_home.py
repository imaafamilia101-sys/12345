import html
import json
from pathlib import Path


ROOT = Path(r"E:\portfolio-sites\hommless-placeholder")


def esc(value):
    return html.escape(str(value or ""), quote=True)


def load_products(root):
    return json.loads((root / "data" / "products.json").read_text(encoding="utf-8"))


def by_title(products, title):
    return next(product for product in products if product["title"] == title)


def image(product, index=0):
    gallery = product.get("gallery", [])
    return gallery[min(index, max(0, len(gallery) - 1))] if gallery else ""


def product_href(product):
    return f"products/{product['slug']}.html"


def card(product, class_name=""):
    status = "SOLD OUT" if product.get("soldOut") else "IN STOCK"
    sizes = " / ".join(product.get("sizes", [])[:5]) or "ONE SIZE"
    return f"""
    <article class="lux-card {class_name} reveal">
      <a href="{product_href(product)}" aria-label="{esc(product['title'])}">
        <span class="lux-card__media">
          <img src="{esc(image(product))}" alt="{esc(product['title'])}" loading="lazy">
          <span class="lux-card__dust" aria-hidden="true"></span>
          <span class="lux-card__status">{status}</span>
        </span>
        <span class="lux-card__info">
          <strong>{esc(product['title'])}</strong>
          <span>{esc(product['price'])}</span>
          <small>{esc(sizes)}</small>
        </span>
      </a>
    </article>
    """


def build(root):
    products = load_products(root)
    hero = by_title(products, "DIAMOND ZIP HOODIE V2 BLACK")
    shirt = by_title(products, "DIAMOND SHIRT")
    hoodie = by_title(products, "DIAMOND HOODIE BLACK")
    bomber = by_title(products, "DIAMOND BOMBER")
    pants = by_title(products, "DIAMOND PANTS BLACK")
    jacket = by_title(products, "HOMME LEATHER JACKET BLACK")
    corset = by_title(products, "CORSET BOMBER")
    bag = by_title(products, "MILLION DOLLAR BIRKIN BAG")
    drop = [hero, shirt, bomber, pants]
    catalog = [hero, shirt, hoodie, bomber, pants, jacket, corset, bag]

    document = f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#030303">
  <meta name="description" content="HOMME+LESS — black uniform, diamond light. Концепт интернет-магазина российского бренда одежды.">
  <title>HOMME+LESS — Diamond System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"></noscript>
  <link rel="preload" as="image" href="/{esc(image(hero, 1))}">
  <link rel="preload" as="image" href="/{esc(image(hero, 0))}">
  <style>
    [data-diamond-intro]{{position:fixed;inset:0;z-index:120;overflow:hidden;background:#030303;color:#f4f1ea}}
    [data-diamond-intro] .diamond-intro__code,[data-diamond-intro] .diamond-intro__edition,[data-diamond-intro] .diamond-intro__word,[data-diamond-intro] .diamond-intro__skip{{opacity:0}}
  </style>
  <link rel="stylesheet" href="assets/styles.css?v=20260620-blacklabel1">
</head>
<body class="home-redesign intro-pending">
  <a class="skip-link" href="#main">К содержанию</a>
  <canvas id="diamond-field" aria-hidden="true"></canvas>

  <div class="diamond-intro black-label-intro" data-diamond-intro aria-label="HOMME+LESS black label reveal" style="--intro-image: url(/{esc(image(hero, 1))}); --fabric-image: url(/{esc(image(hero, 0))})">
    <div class="black-label__fabric" aria-hidden="true"><i></i><i></i></div>
    <div class="black-label__model" aria-hidden="true"></div>
    <div class="black-label__tag" aria-hidden="true">
      <i class="black-label__seam black-label__seam--top"></i>
      <i class="black-label__seam black-label__seam--right"></i>
      <i class="black-label__seam black-label__seam--bottom"></i>
      <i class="black-label__seam black-label__seam--left"></i>
      <small>H+L / LABEL 01</small>
      <strong>HOMME<span>+</span>LESS</strong>
      <em>MOSCOW / 2026</em>
    </div>
    <p class="diamond-intro__code">HM+LS / BLACK LABEL 01</p>
    <div class="diamond-intro__word" aria-hidden="true">
      <span>H</span><span>O</span><span>M</span><span>M</span><span>E</span><b>+</b><span>L</span><span>E</span><span>S</span><span>S</span>
    </div>
    <p class="diamond-intro__edition">MADE IN MOSCOW</p>
    <button class="diamond-intro__skip" type="button" data-intro-skip>SKIP</button>
  </div>

  <header class="lux-header">
    <button class="menu-toggle lux-header__menu" type="button" aria-label="Открыть меню">MENU</button>
    <a class="lux-header__brand" href="index.html" aria-label="HOMME+LESS — главная">HOMME<span>+</span>LESS</a>
    <div class="lux-header__actions">
      <a href="catalog.html">SEARCH</a>
      <a href="catalog.html?cat=bestseller">BAG <span>0</span></a>
    </div>
  </header>

  <aside class="mobile-menu" aria-hidden="true">
    <button class="menu-close" type="button" aria-label="Закрыть меню">CLOSE</button>
    <a href="catalog.html">СМОТРЕТЬ ВСЕ</a>
    <a href="catalog.html?cat=bestseller">BESTSELLER</a>
    <a href="catalog.html?cat=tshirts">ФУТБОЛКИ</a>
    <a href="catalog.html?cat=hoodies">ХУДИ / ЗИПЫ</a>
    <a href="catalog.html?cat=jackets">ВЕРХНЯЯ ОДЕЖДА</a>
    <a href="catalog.html?cat=pants">ШТАНЫ / ДЖИНСЫ</a>
    <a href="catalog.html?cat=accessories">АКСЕССУАРЫ</a>
  </aside>

  <main id="main">
    <section class="lux-hero" aria-labelledby="hero-title">
      <div class="lux-hero__image" data-hero-media>
        <img src="{esc(image(hero, 1))}" alt="{esc(hero['title'])}">
      </div>
      <div class="lux-hero__shade" aria-hidden="true"></div>
      <canvas class="hero-diamond-field" data-hero-diamonds aria-hidden="true"></canvas>
      <div class="lux-hero__meta lux-hero__meta--left">
        <span>DROP 02 / 2026</span>
        <span>MOSCOW 55.7558 N</span>
      </div>
      <div class="lux-hero__meta lux-hero__meta--right">
        <span>DIAMOND SYSTEM</span>
        <span>BLACK UNIFORM</span>
      </div>
      <div class="lux-hero__copy reveal">
        <p>Одежда держит форму.<br>Свет оставляет след.</p>
        <div>
          <a class="lux-cta lux-cta--light" href="#drop">Смотреть коллекцию</a>
          <a class="lux-cta" href="catalog.html?cat=bestseller">BESTSELLER</a>
        </div>
      </div>
      <h1 id="hero-title" class="lux-hero__title" aria-label="HOMME PLUS LESS">HOMME<span>+</span>LESS</h1>
      <a class="lux-hero__product" href="{product_href(hero)}">{esc(hero['title'])} <span>{esc(hero['price'])}</span></a>
    </section>

    <section class="category-ticker" aria-label="Категории">
      <a href="catalog.html?cat=bestseller">BESTSELLER</a>
      <a href="catalog.html?cat=tshirts">ФУТБОЛКИ</a>
      <a href="catalog.html?cat=hoodies">ХУДИ / ЗИПЫ</a>
      <a href="catalog.html?cat=jackets">ВЕРХНЯЯ ОДЕЖДА</a>
      <a href="catalog.html?cat=pants">ШТАНЫ / ДЖИНСЫ</a>
      <a href="catalog.html?cat=accessories">АКСЕССУАРЫ</a>
    </section>

    <section class="drop-scene" id="drop">
      <header class="scene-heading reveal">
        <div><span>01</span><span>NEW DROP</span></div>
        <h2>DIAMOND<br>SYSTEM</h2>
        <p>Не декор. Не принт. Световая поверхность, которая меняется вместе СЃ движением.</p>
      </header>
      <div class="drop-grid">
        {card(drop[0], "drop-a")}
        {card(drop[1], "drop-b")}
        {card(drop[2], "drop-c")}
        {card(drop[3], "drop-d")}
      </div>
      <a class="text-link reveal" href="catalog.html">VIEW FULL DROP <span>в†—</span></a>
    </section>

    <section class="catalog-preview" id="catalog">
      <header class="catalog-preview__head reveal">
        <div><span>02</span><span>CATALOG</span></div>
        <h2>BLACK<br>SELECTION</h2>
        <a href="catalog.html">СМОТРЕТЬ ВСЕ / 176</a>
      </header>
      <nav class="catalog-categories" aria-label="Фильтры каталога">
        <a class="active" href="catalog.html">ALL</a>
        <a href="catalog.html?cat=bestseller">BESTSELLER</a>
        <a href="catalog.html?cat=tshirts">T-SHIRTS</a>
        <a href="catalog.html?cat=hoodies">HOODIES</a>
        <a href="catalog.html?cat=jackets">OUTERWEAR</a>
        <a href="catalog.html?cat=pants">PANTS</a>
      </nav>
      <div class="catalog-lux-grid">
        {''.join(card(product) for product in catalog)}
      </div>
    </section>

    <section class="lookbook-scene">
      <div class="lookbook-scene__intro reveal">
        <div><span>03</span><span>LOOKBOOK / MOSCOW</span></div>
        <p>55.7558 N<br>37.6173 E</p>
      </div>
      <div class="lookbook-scene__canvas">
        <figure class="lookbook-shot lookbook-shot--main reveal">
          <img src="{esc(image(jacket, 4))}" alt="HOMME leather jacket, Moscow lookbook" loading="lazy">
        </figure>
        <figure class="lookbook-shot lookbook-shot--top reveal">
          <img src="{esc(image(corset, 5))}" alt="Corset bomber detail" loading="lazy">
        </figure>
        <figure class="lookbook-shot lookbook-shot--bottom reveal">
          <img src="{esc(image(bag, 2))}" alt="HOMME+LESS bag detail" loading="lazy">
        </figure>
        <h2 class="lookbook-scene__title">MOSCOW<br>AFTER DARK</h2>
        <p class="lookbook-scene__copy">Город выключает цвет.<br>Остаются силуэт, металл и точки света.</p>
      </div>
      <a class="text-link text-link--lookbook" href="catalog.html?cat=bestseller">EXPLORE THE LOOKS <span>в†—</span></a>
    </section>

    <section class="stores-scene" id="stores">
      <header class="stores-scene__head reveal">
        <div><span>04</span><span>STORES / MOSCOW</span></div>
        <h2>COME<br>IN BLACK.</h2>
      </header>
      <div class="store-list">
        <article class="store-row reveal">
          <span>01</span><h3>ФЛАКОН</h3><p>Большая Новодмитровская ул., 36, стр. 1, вход 3</p><a href="https://yandex.ru/maps/?text=Большая%20Новодмитровская%2036" target="_blank" rel="noreferrer">MAP в†—</a>
        </article>
        <article class="store-row reveal">
          <span>02</span><h3>АВИАПАРК</h3><p>Ходынский бульвар, 4, корнер Trend Island</p><a href="https://yandex.ru/maps/?text=РўР¦%20Авиапарк" target="_blank" rel="noreferrer">MAP в†—</a>
        </article>
        <article class="store-row reveal">
          <span>03</span><h3>ЕВРОПЕЙСКИЙ</h3><p>РїР». Киевского Вокзала, 2, этаж 2, Trend Island</p><a href="https://yandex.ru/maps/?text=РўР¦%20Европейский" target="_blank" rel="noreferrer">MAP в†—</a>
        </article>
      </div>
    </section>
  </main>

  <footer class="lux-footer">
    <div class="lux-footer__brand">HOMME<span>+</span>LESS</div>
    <div class="lux-footer__columns">
      <div><p>COLLECTION</p><a href="catalog.html">Смотреть все</a><a href="catalog.html?cat=bestseller">Bestseller</a><a href="catalog.html?cat=soldout">Sold out</a><a href="https://hommeplusless.com/certificate" target="_blank" rel="noreferrer">Gift card</a></div>
      <div><p>SUPPORT</p><a href="https://hommeplusless.com/help#delivery" target="_blank" rel="noreferrer">Доставка</a><a href="https://hommeplusless.com/help#returns" target="_blank" rel="noreferrer">Возврат</a><a href="https://hommeplusless.com/help#contacts" target="_blank" rel="noreferrer">Контакты</a></div>
      <div><p>SOCIAL</p><a href="https://t.me/hmmls" target="_blank" rel="noreferrer">Telegram</a><a href="https://www.instagram.com/hommeplusless" target="_blank" rel="noreferrer">Instagram</a><a href="https://vk.com/hommeplusless" target="_blank" rel="noreferrer">VK</a></div>
    </div>
    <div class="lux-footer__bottom"><span>В© 2026 HOMME+LESS CONCEPT</span><span>MOSCOW / RUSSIA</span><a href="#main">BACK TO TOP в†‘</a></div>
  </footer>
  <script src="assets/app.js?v=20260620-blacklabel1"></script>
</body>
</html>"""
    (root / "index.html").write_text(document, encoding="utf-8")


if __name__ == "__main__":
    import sys
    build(Path(sys.argv[1]))
