"""Adaptateurs de sources. Chacun produit des « candidats » :
{source_id, source_cfg, title, secondary, page_url, product_key, images:[(url, alt)], hint, color_hint, brand_hint, model, license}
"""
import html
import json
import logging
import re
from urllib.parse import quote, urlsplit, urlunsplit, urlencode

log = logging.getLogger("hmscrape")


def _strip_query(url: str) -> str:
    p = urlsplit(url)
    return urlunsplit((p.scheme, p.netloc, p.path, "", ""))


def _hint(item):
    h = item.get("hint")
    return tuple(h) if h else None


# ---------------- Shopify (/products.json public) ----------------
def shopify(sid, cfg, session, store, batch, opts):
    base = cfg["base"]
    for listing in cfg["listings"]:
        coll = listing["collection"]
        path = "/products.json" if coll == "all" else f"/collections/{quote(coll)}/products.json"
        for page in range(1, opts["max_pages"] + 1):
            url = f"{base}{path}?limit=250&page={page}"
            r = session.get(url)
            if r is None:
                store.log_visit(batch, sid, url, "echec", 0)
                break
            products = r.json().get("products", [])
            store.log_visit(batch, sid, url, "ok", len(products))
            if not products:
                break
            for p in products[: opts["max_products"]]:
                color = None
                for i, o in enumerate(p.get("options", [])):
                    if o["name"].lower() in ("color", "couleur", "colour") and o.get("values"):
                        color = o["values"][0]
                tags = p.get("tags", [])
                yield {
                    "source_id": sid, "source_cfg": cfg, "title": p["title"],
                    "secondary": " ".join([p.get("product_type", ""), p.get("vendor", ""), " ".join(tags if isinstance(tags, list) else [tags])]),
                    "page_url": f"{base}/products/{p['handle']}", "product_key": f"{sid}:{p['id']}",
                    "images": [(img["src"], img.get("alt") or "") for img in p.get("images", [])],
                    "hint": _hint(listing), "color_hint": _color_norm(color), "brand_hint": _brand_from_vendor(p.get("vendor")),
                    "model": p["title"],
                }
            if len(products) < 250:
                break


def _brand_from_vendor(v):
    if not v:
        return None
    v2 = v.strip().lower()
    for k, out in [("nike", "Nike"), ("jordan", "Nike"), ("adidas", "Adidas"), ("new balance", "New Balance")]:
        if k in v2:
            return out
    return None


def _color_norm(c):
    if not c:
        return None
    from .taxonomy import COLORS, first_match, norm
    v = first_match(norm(c), COLORS)
    return None if v == "inconnu" else v


def _find_type(o, typ):
    """Parcourt récursivement un JSON-LD (@graph, mainEntity…) et renvoie les objets du @type demandé."""
    if isinstance(o, dict):
        if o.get("@type") == typ:
            yield o
        for v in o.values():
            yield from _find_type(v, typ)
    elif isinstance(o, list):
        for v in o:
            yield from _find_type(v, typ)


# ---------------- Jumia (JSON-LD des listes + galerie produit 680 px) ----------------
CARD_A = re.compile(r'<a href="(/[^"]+\.html)" class="core"([^>]*)>')


def _jumia_cards(text, base):
    """Cartes produit de la liste (40/page) : lien, nom, marque et chemin de catégorie en attributs data-gtm-*."""
    out = []
    for href, attrs in CARD_A.findall(text):
        a = dict(re.findall(r'data-gtm-([a-z0-9]+)="([^"]*)"', attrs))
        out.append({"url": base + href, "name": html.unescape(a.get("name", "")),
                    "brand": {"name": html.unescape(a.get("brand", ""))}, "category": html.unescape(a.get("category", ""))})
    return out


JUMIA_IMG = re.compile(r"https://ma\.jumia\.is/unsafe/fit-in/680x680/filters:fill\(white\)/product/[0-9/]+\.jpg")


def jumia(sid, cfg, session, store, batch, opts):
    base = cfg["base"]
    for listing in cfg["listings"]:
        path = listing["path"]
        is_mlp = path.startswith("/mlp-") or path.startswith("/sp-")
        pages = 1 if is_mlp else opts["max_pages"]  # robots.txt interdit la pagination des /mlp-*
        for page in range(1, pages + 1):
            url = base + path + (f"?page={page}" if page > 1 else "")
            r = session.get(url)
            if r is None:
                store.log_visit(batch, sid, url, "echec", 0)
                break
            items = _jumia_cards(r.text, base)
            if not items:  # repli : JSON-LD (10 produits par page)
                for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', r.text, re.S):
                    try:
                        d = json.loads(block)
                    except json.JSONDecodeError:
                        continue
                    items += [e["item"] for lst in _find_type(d, "ItemList")
                              for e in lst.get("itemListElement", []) if isinstance(e.get("item"), dict)]
            store.log_visit(batch, sid, url, "ok", len(items))
            if not items:
                break
            for it in items[: opts["max_products"]]:
                purl = _strip_query(it.get("url", ""))
                if not purl:
                    continue
                if store.source_full(sid):
                    return
                pr = session.get(purl)
                gallery = []
                if pr is not None:
                    seen = set()
                    for u in JUMIA_IMG.findall(pr.text):
                        if u not in seen:
                            seen.add(u)
                            gallery.append((u, ""))
                    store.log_visit(batch, sid, purl, "ok", len(gallery))
                if not gallery and it.get("image"):
                    gallery = [(it["image"], "")]
                brand = (it.get("brand") or {}).get("name", "")
                yield {
                    "source_id": sid, "source_cfg": cfg, "title": it.get("name", ""),
                    "secondary": f"{it.get('category', '')} {brand}", "page_url": purl,
                    "product_key": f"{sid}:{purl.rsplit('/', 1)[-1]}", "images": gallery, "hint": _hint(listing),
                    "brand_hint": _brand_from_vendor(brand), "model": it.get("name", ""),
                }


NIKE_SRC = re.compile(r"(https://static\.nike\.com/a/images/[^\s\",]+)\s+(\d+)w")
NIKE_ID = re.compile(r"/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/[^/]+$")


def _nike_srcset_best(text):
    """uuid d'image -> (largeur, URL) la plus large présente dans les srcset de la page."""
    best = {}
    for url, w in NIKE_SRC.findall(text):
        m = NIKE_ID.search(url)
        if m and int(w) > best.get(m.group(1), (0, ""))[0]:
            best[m.group(1)] = (int(w), url)
    return best


def _nike_upgrade(url, best):
    """Taille la plus large du srcset si présente dans le HTML ; sinon même préréglage que le front Nike
    applique à chaque vignette (t_web_pw_592_v2 -> 1184 px en densité 2x). t_default ne fait que 400 px."""
    m = NIKE_ID.search(url)
    if m and m.group(1) in best:
        return best[m.group(1)][1]
    return url.replace("/t_default/", "/t_web_pw_592_v2/f_auto/")


# ---------------- Nike (pages liste /w/, données __NEXT_DATA__) ----------------
def nike(sid, cfg, session, store, batch, opts):
    base = cfg["base"]
    for listing in cfg["listings"]:
        url = base + listing["path"]
        r = session.get(url)
        if r is None:
            store.log_visit(batch, sid, url, "echec", 0)
            continue
        best = _nike_srcset_best(r.text)
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', r.text, re.S)
        prods = []
        if m:
            data = json.loads(m.group(1))
            for g in data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("Wall", {}).get("productGroupings", []):
                prods += (g.get("products") or [])[:1]  # un coloris par groupe pour varier les modèles
        store.log_visit(batch, sid, url, "ok", len(prods))
        for p in prods[: opts["max_products"]]:
            c = p.get("copy", {})
            title = f"{c.get('title', '')} — {c.get('subTitle', '')}"
            imgs = p.get("colorwayImages", {})
            images = [(_nike_upgrade(u, best), alt) for u, alt in
                      [(imgs.get("squarishURL"), "produit"), (imgs.get("portraitURL"), "portrait")] if u]
            colors = p.get("displayColors", {})
            yield {
                "source_id": sid, "source_cfg": cfg, "title": title,
                "secondary": f"{p.get('productType', '')} {colors.get('colorDescription', '')}",
                "page_url": (p.get("pdpUrl") or {}).get("url", url), "product_key": f"{sid}:{p.get('productCode')}",
                "images": images, "hint": _hint(listing), "brand_hint": "Nike",
                "color_hint": _color_norm((colors.get("simpleColor") or {}).get("label")),
                "model": f"{c.get('title', '')} {p.get('productCode', '')}".strip(),
            }


# ---------------- Openverse (images sous licence CC / domaine public) ----------------
def openverse(sid, cfg, session, store, batch, opts):
    for qd in cfg["queries"]:
        params = {"q": qd["q"], "license_type": "commercial", "page_size": min(20, opts["max_products"] * 2),
                  "mature": "false", "size": "large"}
        url = f"{cfg['base']}/v1/images/?{urlencode(params)}"
        r = session.get(url)
        if r is None:
            store.log_visit(batch, sid, url, "echec", 0)
            continue
        results = r.json().get("results", [])
        store.log_visit(batch, sid, url, "ok", len(results))
        for it in results[: opts["max_products"]]:
            lic = (it.get("license") or "").lower()
            if "nc" in lic:
                continue
            note = "Licence libre — attribution requise" if lic not in ("cc0", "pdm") else "Domaine public / CC0"
            if "nd" in lic:
                note += " ; ND : aucune modification autorisée (usage tel quel uniquement)"
            name = f"CC {lic.upper()} {it.get('license_version') or ''}".strip() if lic not in ("pdm",) else "Public Domain Mark"
            yield {
                "source_id": sid, "source_cfg": cfg, "title": it.get("title") or "",
                "secondary": " ".join(t.get("name", "") for t in (it.get("tags") or [])[:15]),
                "page_url": it.get("foreign_landing_url") or "", "product_key": f"{sid}:{it.get('id')}",
                "images": [(it["url"], "")], "hint": _hint(qd), "model": "inconnu",
                "license": {"classe": "commercial_ok", "nom": name, "url": it.get("license_url"),
                            "attribution": it.get("attribution") or it.get("creator") or "", "note": note},
            }


ADAPTERS = {"shopify": shopify, "jumia": jumia, "nike": nike, "openverse": openverse}
