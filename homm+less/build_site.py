import html
import json
import re
import shutil
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
PRODUCT_ASSETS = ASSETS / "products"
PRODUCT_PAGES = ROOT / "products"
DATA_DIR = ROOT / "data"

CATEGORY_PARTS = {
    "bestseller": ("BESTSELLER", "210983714182"),
    "tshirts": ("ФУТБОЛКИ", "222684726152"),
    "hoodies": ("ХУДИ / ЗИПЫ", "667125347592"),
    "jackets": ("ВЕРХНЯЯ ОДЕЖДА", "306968321262"),
    "pants": ("ШТАНЫ / ДЖИНСЫ", "423659999861"),
    "accessories": ("АКСЕССУАРЫ", "929328705761"),
}


def slugify(value: str, uid: str) -> str:
    value = value.lower().replace("+", " plus ")
    value = re.sub(r"[^a-z0-9\u0400-\u04ff]+", "-", value, flags=re.I).strip("-")
    value = re.sub(r"-+", "-", value)
    return f"{value}-{uid}"


def money(value: str) -> str:
    try:
        return f"{int(float(str(value).replace(' ', ''))):,}".replace(",", " ") + " в‚Ѕ"
    except Exception:
        return str(value or "")


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def parse_gallery(raw: str) -> list[str]:
    try:
        gallery = json.loads(raw or "[]")
    except Exception:
        gallery = []
    return [item.get("img") for item in gallery if item.get("img")]


def parse_options(raw: str) -> list[str]:
    try:
        data = json.loads(raw or "[]")
    except Exception:
        data = []
    sizes = []
    for option in data:
        if option.get("title", "").lower() == "размер":
            sizes.extend(option.get("values", []))
    return sizes


def fetch_products(part_uid: str) -> list[dict]:
    products = []
    slice_no = 1
    while True:
        params = {
            "storepartuid": part_uid,
            "recid": "797625725",
            "c": str(int(time.time() * 1000)),
        }
        if slice_no > 1:
            params["slice"] = str(slice_no)
        url = "https://store.tildaapi.com/api/getproductslist/?" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        products.extend(data.get("products", []))
        if not data.get("nextslice"):
            break
        slice_no = int(data["nextslice"])
    return products


def download(url: str, target: Path) -> None:
    if target.exists() and target.stat().st_size > 0:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        target.write_bytes(response.read())


def load_catalog() -> list[dict]:
    raw_by_part = {}
    for name, (_, uid) in CATEGORY_PARTS.items():
        raw_path = ROOT / f"raw_{name}.json"
        if raw_path.exists():
            raw_by_part[name] = json.loads(raw_path.read_text(encoding="utf-8"))["products"]
        else:
            raw_by_part[name] = fetch_products(uid)
            raw_path.write_text(
                json.dumps({"part": name, "uid": uid, "products": raw_by_part[name]}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

    all_path = ROOT / "raw_all.json"
    active_products = json.loads(all_path.read_text(encoding="utf-8"))["products"] if all_path.exists() else fetch_products("466076478772")
    products_by_uid = {}
    for product in active_products:
        uid = str(product["uid"])
        products_by_uid[uid] = product

    category_lookup = {}
    for key, products in raw_by_part.items():
        for product in products:
            category_lookup.setdefault(str(product["uid"]), set()).add(key)

    normalized = []
    for uid, product in products_by_uid.items():
        title = clean_text(product.get("title"))
        slug = slugify(title, uid)
        gallery_urls = parse_gallery(product.get("gallery", ""))
        categories = sorted(category_lookup.get(uid, set()))
        is_soldout = all(int(e.get("quantity") or 0) <= 0 for e in product.get("editions", []))
        sizes = parse_options(product.get("json_options", ""))
        normalized.append(
            {
                "uid": uid,
                "slug": slug,
                "title": title,
                "price": money(product.get("price")),
                "oldPrice": money(product.get("priceold")) if product.get("priceold") else "",
                "description": clean_text(product.get("descr") or product.get("text") or ""),
                "sourceUrl": product.get("url", ""),
                "categories": categories,
                "soldOut": is_soldout,
                "sizes": sizes,
                "editions": product.get("editions", []),
                "galleryUrls": gallery_urls,
                "gallery": [],
            }
        )

    normalized = [item for item in normalized if not item["soldOut"]]
    normalized.sort(key=lambda item: item["title"])
    return normalized


def copy_images(products: list[dict]) -> None:
    for product in products:
        gallery = []
        for index, url in enumerate(product["galleryUrls"], start=1):
            suffix = Path(urllib.parse.urlparse(url).path).suffix or ".jpg"
            target = PRODUCT_ASSETS / product["slug"] / f"{index:02d}{suffix}"
            try:
                download(url, target)
                gallery.append(str(target.relative_to(ROOT)).replace("\\", "/"))
            except Exception as exc:
                print(f"image failed: {product['title']} {url} {exc}")
        product["gallery"] = gallery


def esc(value: str) -> str:
    return html.escape(str(value or ""), quote=True)


def header(active: str = "", prefix: str = "") -> str:
    nav = [
        ("index.html#catalog", "СМОТРЕТЬ ВСЕ", "all"),
        ("catalog.html?cat=bestseller", "BESTSELLER", "bestseller"),
        ("catalog.html?cat=tshirts", "ФУТБОЛКИ", "tshirts"),
        ("catalog.html?cat=hoodies", "ХУДИ / ЗИПЫ", "hoodies"),
        ("catalog.html?cat=jackets", "ВЕРХНЯЯ ОДЕЖДА", "jackets"),
        ("catalog.html?cat=pants", "ШТАНЫ / ДЖИНСЫ", "pants"),
        ("catalog.html?cat=accessories", "АКСЕССУАРЫ", "accessories"),
    ]
    links = "".join(f'<a class="{ "active" if key == active else "" }" href="{prefix}{href}">{label}</a>' for href, label, key in nav)
    return f"""
    <header class="site-header">
      <a class="brand" href="{prefix}index.html" aria-label="HOMME+LESS home">HOMME<span>+</span>LESS</a>
      <nav class="desktop-nav" aria-label="Каталог">{links}</nav>
      <button class="menu-toggle" type="button" aria-label="Открыть меню">MENU</button>
    </header>
    <aside class="mobile-menu" aria-hidden="true">
      <button class="menu-close" type="button" aria-label="Закрыть меню">CLOSE</button>
      {links}
    </aside>
    """


def footer() -> str:
    return """
    <footer class="site-footer">
      <div>
        <p class="eyebrow">MOSCOW / DIAMOND DUST</p>
        <h2>Одежда, которая держит свет даже РІ черном.</h2>
      </div>
      <div class="footer-links">
        <a href="https://hommeplusless.com/" target="_blank" rel="noreferrer">Оригинальный сайт</a>
        <a href="https://t.me/hmmls" target="_blank" rel="noreferrer">Telegram</a>
        <a href="https://vk.com/hommeplusless" target="_blank" rel="noreferrer">VK</a>
      </div>
    </footer>
    """


def product_card(product: dict, prefix: str = "") -> str:
    image = prefix + product["gallery"][0] if product["gallery"] else ""
    tags = " ".join(product["categories"])
    badge = '<span class="status live">BUY NOW</span>'
    return f"""
    <article class="product-card" data-cats="{esc(tags)}" data-title="{esc(product['title']).lower()}">
      <a class="product-link" href="{prefix}products/{product['slug']}.html">
        <span class="image-wrap">
          <img src="{esc(image)}" alt="{esc(product['title'])}" loading="lazy">
          <span class="spark"></span>
        </span>
        <span class="product-meta">
          <strong>{esc(product['title'])}</strong>
          <span>{esc(product['price'])}</span>
        </span>
        {badge}
      </a>
    </article>
    """


def page_shell(title: str, body: str, extra_head: str = "") -> str:
    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{extra_head}assets/styles.css">
</head>
<body>
  <canvas id="diamond-field" aria-hidden="true"></canvas>
  {body}
  <script src="{extra_head}assets/app.js"></script>
</body>
</html>
"""


def build_index(products: list[dict]) -> None:
    featured = [p for p in products if "bestseller" in p["categories"] and not p["soldOut"]][:8]
    diamond = [p for p in products if "diamond" in p["title"].lower() and not p["soldOut"]][:6]
    hero = diamond[0] if diamond else products[0]
    hero_img = hero["gallery"][0] if hero["gallery"] else ""
    body = f"""
    {header()}
    <main>
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">HOMME+LESS / DIAMOND SYSTEM</p>
          <h1>BLACK SITE.<br>WHITE DIAMONDS.</h1>
          <p>Редизайн каталога HOMME+LESS РІ эстетике clean brutal luxury: черная одежда, холодный свет, мерцающая diamond-РїС‹Р»СЊ.</p>
          <div class="hero-actions">
            <a class="button primary" href="#catalog">Смотреть коллекцию</a>
            <a class="button ghost" href="catalog.html?cat=bestseller">BESTSELLER</a>
          </div>
        </div>
        <a class="hero-product" href="products/{hero['slug']}.html">
          <img src="{esc(hero_img)}" alt="{esc(hero['title'])}">
          <span>{esc(hero['title'])}</span>
        </a>
      </section>
      <section class="drop-band">
        <p>DROP 02</p>
        <div>DIAMOND DUST / MOSCOW / BLACK UNIFORM / BUY NOW</div>
      </section>
      <section class="editorial">
        <div>
          <p class="eyebrow">Clean Brutal Luxury</p>
          <h2>Бриллианты не как украшение, а как след света на черной форме.</h2>
        </div>
        <div class="editorial-grid">
          {''.join(product_card(p) for p in diamond[:3])}
        </div>
      </section>
      <section class="catalog-section" id="catalog">
        <div class="section-head">
          <p class="eyebrow">FULL CATALOG</p>
          <h2>Все товары</h2>
          <a href="catalog.html">Открыть каталог</a>
        </div>
        <div class="product-grid">
          {''.join(product_card(p) for p in featured)}
        </div>
      </section>
    </main>
    {footer()}
    """
    (ROOT / "index.html").write_text(page_shell("HOMME+LESS — Diamond Luxury Concept", body), encoding="utf-8")


def build_catalog(products: list[dict]) -> None:
    filters = [("all", "ВСЕ"), *[(key, label) for key, (label, _) in CATEGORY_PARTS.items()]]
    body = f"""
    {header()}
    <main class="catalog-page">
      <section class="catalog-hero">
        <p class="eyebrow">CATALOG / {len(products)} ITEMS</p>
        <h1>FULL TRANSFER</h1>
        <p>Все доступные товары собраны в новом многостраничном каталоге.</p>
      </section>
      <section class="catalog-tools">
        <div class="filters" aria-label="Фильтры">
          {''.join(f'<button type="button" data-filter="{key}">{label}</button>' for key, label in filters)}
        </div>
        <label class="search">
          <span>SEARCH</span>
          <input type="search" placeholder="DIAMOND ZIP..." data-search>
        </label>
      </section>
      <section class="product-grid full" data-catalog-grid>
        {''.join(product_card(p) for p in products)}
      </section>
    </main>
    {footer()}
    """
    (ROOT / "catalog.html").write_text(page_shell("HOMME+LESS — Catalog", body), encoding="utf-8")


def build_product_pages(products: list[dict]) -> None:
    PRODUCT_PAGES.mkdir(exist_ok=True)
    lookup = {p["uid"]: p for p in products}
    for product in products:
        related = [p for p in products if p["uid"] != product["uid"] and set(p["categories"]) & set(product["categories"])][:4]
        sizes = "".join(f"<button>{esc(size)}</button>" for size in product["sizes"]) or "<button>one size</button>"
        gallery = "".join(f'<img src="../{esc(img)}" alt="{esc(product["title"])}" loading="lazy">' for img in product["gallery"])
        hero_img = f"../{product['gallery'][0]}" if product["gallery"] else ""
        status = "IN STOCK"
        body = f"""
        {header(prefix="../")}
        <main class="product-page">
          <a class="back-link" href="../catalog.html">в†ђ каталог</a>
          <section class="product-detail">
            <div class="product-gallery">
              {gallery}
            </div>
            <aside class="product-info">
              <p class="eyebrow">{status} / HOMME+LESS</p>
              <h1>{esc(product['title'])}</h1>
              <div class="price-row">
                <strong>{esc(product['price'])}</strong>
                {f'<span>{esc(product["oldPrice"])}</span>' if product["oldPrice"] else ''}
              </div>
              <div class="size-row">
                <p>Размер</p>
                <div>{sizes}</div>
              </div>
              <a class="button primary wide" href="{esc(product['sourceUrl'])}" target="_blank" rel="noreferrer">Открыть оригинал</a>
              <button class="button ghost wide" type="button">Добавить РІ концепт-корзину</button>
              <div class="product-note">
                <p>Фотографии и товарные данные перенесены СЃ текущего сайта HOMME+LESS РґР»СЏ концепта редизайна.</p>
                <p>{esc(product['description']) or 'Описание отсутствует на исходной карточке.'}</p>
              </div>
            </aside>
          </section>
          <section class="related">
            <div class="section-head">
              <p class="eyebrow">SEE ALSO</p>
              <h2>Похожие вещи</h2>
            </div>
            <div class="product-grid">
              {''.join(product_card(p, '../') for p in related)}
            </div>
          </section>
        </main>
        {footer()}
        """
        (PRODUCT_PAGES / f"{product['slug']}.html").write_text(
            page_shell(f"{product['title']} — HOMME+LESS", body, "../"),
            encoding="utf-8",
        )


def build_assets(products: list[dict]) -> None:
    ASSETS.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / "products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.copyfile(ROOT / "source_styles.css", ASSETS / "styles.css")
    shutil.copyfile(ROOT / "source_app.js", ASSETS / "app.js")


def main() -> None:
    PRODUCT_ASSETS.mkdir(parents=True, exist_ok=True)
    products = load_catalog()
    copy_images(products)
    build_assets(products)
    build_index(products)
    build_catalog(products)
    build_product_pages(products)
    redesign = ROOT / "redesign_home.py"
    if redesign.exists():
        namespace = {"__name__": "hommless_redesign"}
        exec(redesign.read_text(encoding="utf-8"), namespace)
        namespace["build"](ROOT)
    print(f"Built {len(products)} products")


if __name__ == "__main__":
    main()
