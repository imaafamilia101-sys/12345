# HOMME+LESS Concept Store

Static multi-page concept store for the Russian clothing brand HOMME+LESS.

## Local preview

```powershell
python -m http.server 4190
```

Open `http://127.0.0.1:4190/`.

## GitHub Pages

The site is ready to publish from the repository root. In GitHub, select `Settings -> Pages -> Deploy from a branch`, then choose the main branch and `/ (root)`.

## Structure

- `index.html` - homepage
- `catalog.html` - active catalog
- `products/` - product pages
- `assets/products/` - product images
- `data/products.json` - active product data
- `source_styles.css`, `source_app.js` - source assets
- `build_site.py`, `redesign_home.py` - build scripts
- `animation-archive/` - archived intro concepts
