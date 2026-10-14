"""Téléchargement, contrôle qualité, déduplication, rangement et état de reprise (SQLite)."""
import hashlib
import io
import json
import logging
import re
import sqlite3
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import imagehash
import numpy as np
from PIL import Image

from .taxonomy import TREE, classify

log = logging.getLogger("hmscrape")
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
KEPT = ("ok", "a_verifier")

# Palette nommée pour la couleur dominante visuelle (RGB)
PALETTE = {
    "noir": (25, 25, 25), "blanc": (245, 245, 245), "ecru": (235, 228, 210), "gris": (135, 135, 135),
    "beige": (200, 180, 145), "marron": (110, 75, 50), "bleu_marine": (30, 40, 75), "bleu": (60, 110, 190),
    "vert": (70, 110, 70), "bordeaux": (110, 30, 45), "rouge": (200, 40, 40), "rose": (230, 150, 170),
    "jaune": (230, 200, 60), "orange": (230, 130, 50), "violet": (120, 80, 150),
}


def slug(s: str, n: int = 40) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return (s[:n].rstrip("-")) or "x"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class Store:
    def __init__(self, root: Path, cfg: dict, quotas: dict):
        self.root = root
        self.cfg = cfg
        self.q = quotas
        self.qual = cfg["quality"]
        meta = root / "20_Metadata"
        meta.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(meta / "state.sqlite")
        self.db.execute("""CREATE TABLE IF NOT EXISTS images(
            id INTEGER PRIMARY KEY, url TEXT UNIQUE, sha256 TEXT, phash TEXT, status TEXT,
            source_id TEXT, categorie TEXT, sous_categorie TEXT, product_key TEXT, file_path TEXT,
            meta TEXT, created TEXT)""")
        self.db.execute("""CREATE TABLE IF NOT EXISTS visits(
            id INTEGER PRIMARY KEY, ts TEXT, batch TEXT, source_id TEXT, url TEXT, status TEXT, n_found INTEGER)""")
        self.db.commit()
        self._phashes = [(imagehash.hex_to_hash(p), f) for p, f in
                         self.db.execute("SELECT phash, file_path FROM images WHERE phash IS NOT NULL AND status IN ('ok','a_verifier','preexistant')")]
        self._shas = {s: f for s, f in self.db.execute(
            "SELECT sha256, file_path FROM images WHERE sha256 IS NOT NULL AND status IN ('ok','a_verifier','preexistant','rejete')")}

    # ---------- arborescence & existant ----------
    def ensure_tree(self):
        for cat, subs in TREE.items():
            (self.root / cat).mkdir(exist_ok=True)
            for s in subs:
                (self.root / cat / s).mkdir(exist_ok=True)
        for d in ("20_Metadata", "21_Logs", "22_Reports", "23_Scripts"):
            (self.root / d).mkdir(exist_ok=True)

    def index_existing(self) -> int:
        """Référence dans la base les images déjà présentes qui n'y figurent pas (aucun déplacement)."""
        known = {f for (f,) in self.db.execute("SELECT file_path FROM images WHERE file_path IS NOT NULL")}
        added = 0
        for p in self.root.rglob("*"):
            rel = str(p.relative_to(self.root))
            if p.suffix.lower() not in IMG_EXT or rel in known or rel.startswith(("23_Scripts", "22_Reports")):
                continue
            data = p.read_bytes()
            sha = hashlib.sha256(data).hexdigest()
            try:
                im = Image.open(io.BytesIO(data))
                ph = str(imagehash.phash(im.convert("RGB")))
                w, h = im.size
            except Exception:
                ph, w, h = None, None, None
            meta = {"nom_fichier": p.name, "origine": "fichier_preexistant", "dossier_d_origine": str(p.parent.relative_to(self.root)),
                    "largeur": w, "hauteur": h, "sha256": sha, "date_collecte": "inconnu"}
            self.db.execute("INSERT OR IGNORE INTO images(url, sha256, phash, status, source_id, file_path, meta, created) VALUES(?,?,?,?,?,?,?,?)",
                            (f"file://{rel}", sha, ph, "preexistant", "preexistant", rel, json.dumps(meta, ensure_ascii=False), now_iso()))
            self._shas.setdefault(sha, rel)
            if ph:
                self._phashes.append((imagehash.hex_to_hash(ph), rel))
            added += 1
        self.db.commit()
        return added

    # ---------- quotas ----------
    def count(self, **where) -> int:
        cond = " AND ".join(f"{k}=?" for k in where)
        sql = f"SELECT COUNT(*) FROM images WHERE status IN ('ok','a_verifier') AND {cond}"
        return self.db.execute(sql, tuple(where.values())).fetchone()[0]

    def quota_reason(self, source_id: str, cat: str, sub: str, product_key: str) -> str | None:
        if self.count(source_id=source_id) >= self.q["max_per_source"]:
            return "quota_source"
        if self.count(categorie=cat) >= self.q["max_per_category"]:
            return "quota_categorie"
        if sub and self.count(categorie=cat, sous_categorie=sub) >= self.q["max_per_subcategory"]:
            return "quota_sous_categorie"
        if self.count(product_key=product_key) >= self.q["max_images_per_product"]:
            return "quota_produit"
        return None

    def source_full(self, source_id: str) -> bool:
        return self.count(source_id=source_id) >= self.q["max_per_source"]

    def seen(self, url: str) -> bool:
        return self.db.execute("SELECT 1 FROM images WHERE url=?", (url,)).fetchone() is not None

    def log_visit(self, batch, source_id, url, status, n):
        self.db.execute("INSERT INTO visits(ts,batch,source_id,url,status,n_found) VALUES(?,?,?,?,?,?)",
                        (now_iso(), batch, source_id, url, status, n))
        self.db.commit()

    def _record(self, url, status, source_id, meta, sha=None, ph=None, cat=None, sub=None, pkey=None, path=None):
        self.db.execute("""INSERT OR REPLACE INTO images(url, sha256, phash, status, source_id, categorie, sous_categorie,
                           product_key, file_path, meta, created) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                        (url, sha, ph, status, source_id, cat, sub, pkey, path, json.dumps(meta, ensure_ascii=False), now_iso()))
        self.db.commit()

    # ---------- analyse visuelle ----------
    @staticmethod
    def _visual(im: Image.Image) -> dict:
        rgb = im.convert("RGB")
        small = rgb.copy()
        small.thumbnail((512, 512))
        gray = np.asarray(small.convert("L"), dtype=np.float32)
        lap = (gray[:-2, 1:-1] + gray[2:, 1:-1] + gray[1:-1, :-2] + gray[1:-1, 2:] - 4 * gray[1:-1, 1:-1])
        arr = np.asarray(small, dtype=np.float32)
        h, w = gray.shape
        b = max(2, min(h, w) // 25)
        border = np.concatenate([arr[:b].reshape(-1, 3), arr[-b:].reshape(-1, 3), arr[:, :b].reshape(-1, 3), arr[:, -b:].reshape(-1, 3)])
        bstd = float(border.std(axis=0).mean())
        bmean = border.mean(axis=0)
        neutral_bg = bstd < 12 and float(bmean.mean()) > 170 and float(np.ptp(bmean)) < 25
        # couleur dominante : zone centrale, hors pixels proches du fond
        cy, cx = h // 2, w // 2
        center = arr[cy - h // 4: cy + h // 4, cx - w // 4: cx + w // 4].reshape(-1, 3)
        dist_bg = np.abs(center - bmean).sum(axis=1)
        subj = center[dist_bg > 40] if neutral_bg else center
        if len(subj) < 50:
            subj = center
        med = np.median(subj, axis=0)
        name = min(PALETTE, key=lambda k: sum((med[i] - PALETTE[k][i]) ** 2 for i in range(3)))
        return {"blur_var": float(lap.var()), "fond_neutre": neutral_bg, "couleur_visuelle": name}

    # ---------- traitement d'une image ----------
    def process(self, session, cand: dict, img_url: str, img_alt: str, position: int, batch: str) -> str:
        sid = cand["source_id"]
        src = cand["source_cfg"]
        if self.seen(img_url):
            return "deja_vu"
        cls = classify(cand["title"], cand.get("secondary", ""), cand.get("hint"))
        if cls["categorie"] == "HORS_PERIMETRE":
            return "hors_perimetre"  # non téléchargé, non enregistré (compté par l'appelant)
        if cand.get("brand_hint") and cls["marque"] == "inconnu":
            cls["marque"] = cand["brand_hint"]
            if cls["categorie"] == "08_Sneakers":
                from .taxonomy import subcategory, norm
                cls["sous_categorie"] = subcategory("08_Sneakers", norm(cand["title"]), cls["marque"])
        if cand.get("color_hint") and cls["couleur"] == "inconnu":
            cls["couleur"] = cand["color_hint"]
        cat, sub = cls["categorie"], cls["sous_categorie"]
        q = self.quota_reason(sid, cat, sub, cand["product_key"])
        if q:
            return q
        r = session.get(img_url)
        base_meta = {
            "titre_produit": cand["title"], "url_page_source": cand["page_url"], "url_image": img_url,
            "texte_alt": img_alt or "", "site": src["name"], "source_id": sid, "type_source": src.get("source_type", "autre"),
            "marche": src.get("market", "inconnu"), "date_collecte": now_iso(), "lot": batch, "position_galerie": position,
        }
        if r is None:
            self._record(img_url, "erreur_telechargement", sid, {**base_meta, "raison": "HTTP/robots"})
            return "erreur"
        data = r.content
        try:
            im = Image.open(io.BytesIO(data))
            im.verify()
            im = Image.open(io.BytesIO(data))
            im.load()
        except Exception as e:
            self._record(img_url, "rejete", sid, {**base_meta, "raison": f"fichier illisible : {e}"})
            return "illisible"
        fmt = (im.format or "inconnu").lower()
        w, h = im.size
        sha = hashlib.sha256(data).hexdigest()
        if sha in self._shas:
            self._record(img_url, "doublon_exact", sid, {**base_meta, "doublon_de": self._shas[sha]}, sha=sha)
            return "doublon_exact"
        ph = imagehash.phash(im.convert("RGB"))
        near = [f for p, f in self._phashes if (ph - p) <= self.qual["near_dup_hamming"]]
        vis = self._visual(im)

        quality = []
        status = "ok" if cls["statut_verification"] == "auto" else "a_verifier"
        if min(w, h) < self.qual["reject_min_side"]:
            status, quality = "rejete", ["miniature"]
        elif min(w, h) < self.qual["small_min_side"]:
            quality.append("petite")
        if vis["blur_var"] < self.qual["blur_threshold"]:
            quality.append("flou_possible")
        if len(data) / (w * h) < 0.04 and fmt == "jpeg":
            quality.append("compression_forte_possible")
        if near:
            quality.append("quasi_doublon")

        method = cls["methode_classification"]
        color = cls["couleur"]
        if color == "inconnu":
            color, method = vis["couleur_visuelle"], "mixte"
        photo = "produit_fond_neutre" if vis["fond_neutre"] else "porte_ou_lifestyle"
        view = "inconnu"
        from .taxonomy import view_from, norm
        if img_alt:
            view = view_from(norm(img_alt))

        lic = cand.get("license") or {}
        lic_class = lic.get("classe") or src.get("license_class", "inconnue")
        ext = {"jpeg": "jpg", "png": "png", "webp": "webp", "gif": "gif", "avif": "avif"}.get(fmt, "img")
        folder = "13_Rejets" if status == "rejete" else (f"{cat}/{sub}" if sub else cat)
        brand = cls["marque"] if cls["marque"] != "inconnu" else "nomarque"
        fname = f"{cat[:2]}_{slug(brand, 14)}_{slug(cand['title'], 38)}_{slug(sid, 10)}_{sha[:10]}.{ext}"
        rel = f"{folder}/{fname}"
        dest = self.root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            dest.write_bytes(data)

        meta = {
            "nom_fichier": fname, "chemin": rel, "categorie": cat, "sous_categorie": sub or "",
            "marque": cls["marque"], "modele": cand.get("model") or "inconnu", "couleur_dominante": color,
            "couleur_visuelle": vis["couleur_visuelle"], "coupe": cls["coupe"], "matiere_apparente": cls["matiere"],
            "col_capuche": cls["col_capuche"], "fermeture": cls["fermeture"], "type_photo": photo, "vue": view,
            "methode_classification": method, **base_meta,
            "pays_marche_source": src.get("market", "inconnu"),
            "largeur": w, "hauteur": h, "format": fmt, "taille_octets": len(data), "sha256": sha, "phash": str(ph),
            "statut": status, "statut_verification": cls["statut_verification"] if status != "rejete" else "rejete",
            "classe_licence": lic_class, "licence": lic.get("nom") or "inconnu", "licence_url": lic.get("url") or "",
            "attribution": lic.get("attribution") or "", "note_licence": lic.get("note") or src.get("license_note", ""),
            "notes_qualite": ",".join(quality), "quasi_doublon_de": ";".join(near[:3]),
            "notes_classification": cls["notes_classification"], "variance_nettete": round(vis["blur_var"], 1),
            "textes_secondaires": cand.get("secondary", ""), "indice_rubrique": list(cand["hint"]) if cand.get("hint") else None,
        }
        self._record(img_url, status, sid, meta, sha=sha, ph=str(ph), cat=cat, sub=sub, pkey=cand["product_key"], path=rel)
        self._shas[sha] = rel
        if status != "rejete":
            self._phashes.append((ph, rel))
        return status


def apply_verifications(store: "Store") -> int:
    """Applique 20_Metadata/verifications_manuelles.csv : reclasse (déplacement du fichier) et trace la méthode 'visuel'."""
    import csv
    path = store.root / "20_Metadata" / "verifications_manuelles.csv"
    if not path.exists():
        return 0
    n = 0
    with open(path, encoding="utf-8") as f:
        for v in csv.DictReader(f):
            for rowid, meta_s, fp in store.db.execute(
                    "SELECT id, meta, file_path FROM images WHERE sha256 LIKE ? AND status IN ('ok','a_verifier','rejete')",
                    (v["sha256_prefix"] + "%",)).fetchall():
                meta = json.loads(meta_s)
                if meta.get("verification_appliquee") == v["verifie_le"] + v["categorie"] + v["sous_categorie"]:
                    continue
                cat, sub = v["categorie"], v["sous_categorie"]
                status = "ok" if v["decision"] == "ok" else "rejete"
                folder = "13_Rejets" if status == "rejete" else (f"{cat}/{sub}" if sub else cat)
                old_name = Path(fp).name
                new_name = (cat[:2] if status == "ok" else "13") + old_name[2:]
                new_rel = f"{folder}/{new_name}"
                src, dst = store.root / fp, store.root / new_rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                if src.exists() and src != dst:
                    src.rename(dst)
                meta.update({"categorie": cat if status == "ok" else meta.get("categorie"), "sous_categorie": sub,
                             "col_capuche": v["col_capuche"], "fermeture": v["fermeture"], "methode_classification": "visuel",
                             "statut": status, "statut_verification": "verifie_visuel", "nom_fichier": new_name, "chemin": new_rel,
                             "notes_classification": v["note"], "ancien_chemin": fp,
                             "verification_appliquee": v["verifie_le"] + v["categorie"] + v["sous_categorie"]})
                if status == "rejete":
                    meta["raison"] = v["decision"] + " : " + v["note"]
                store.db.execute("UPDATE images SET status=?, categorie=?, sous_categorie=?, file_path=?, meta=? WHERE id=?",
                                 (status, meta["categorie"], sub, new_rel, json.dumps(meta, ensure_ascii=False), rowid))
                n += 1
    store.db.commit()
    return n


def reclassify(store: "Store") -> list[tuple[str, str, str]]:
    """Ré-applique les règles textuelles aux images conservées non vérifiées visuellement ; déplace les fichiers."""
    changes = []
    for rowid, meta_s, fp in store.db.execute(
            "SELECT id, meta, file_path FROM images WHERE status IN ('ok','a_verifier')").fetchall():
        meta = json.loads(meta_s)
        if meta.get("methode_classification") == "visuel":
            continue
        hint = tuple(meta["indice_rubrique"]) if meta.get("indice_rubrique") else None
        cls = classify(meta.get("titre_produit", ""), meta.get("textes_secondaires", ""), hint)
        if cls["categorie"] == "HORS_PERIMETRE":
            cls.update(categorie="13_Rejets", sous_categorie="", statut_verification="rejete")
        cat, sub = cls["categorie"], cls["sous_categorie"]
        if cat == "08_Sneakers" and cls["marque"] == "inconnu" and meta.get("marque") not in (None, "inconnu"):
            from .taxonomy import subcategory, norm
            cls["marque"] = meta["marque"]
            sub = subcategory(cat, norm(meta.get("titre_produit", "")), cls["marque"])
        if (cat, sub) == (meta.get("categorie"), meta.get("sous_categorie") or ""):
            continue
        status = "rejete" if cat == "13_Rejets" else ("ok" if cls["statut_verification"] == "auto" else "a_verifier")
        folder = f"{cat}/{sub}" if sub else cat
        new_name = cat[:2] + Path(fp).name[2:]
        new_rel = f"{folder}/{new_name}"
        (store.root / new_rel).parent.mkdir(parents=True, exist_ok=True)
        if (store.root / fp).exists():
            (store.root / fp).rename(store.root / new_rel)
        changes.append((fp, new_rel, meta.get("titre_produit", "")))
        meta.update({k: cls[k] for k in ("col_capuche", "fermeture", "coupe", "matiere", "notes_classification")
                     if k in cls})
        meta.update({"categorie": cat, "sous_categorie": sub, "statut": status, "statut_verification": cls["statut_verification"],
                     "nom_fichier": new_name, "chemin": new_rel, "ancien_chemin": fp, "marque": cls["marque"]})
        if status == "rejete":
            meta["raison"] = "hors_perimetre (reclassement)"
        store.db.execute("UPDATE images SET status=?, categorie=?, sous_categorie=?, file_path=?, meta=? WHERE id=?",
                         (status, cat, sub, new_rel, json.dumps(meta, ensure_ascii=False), rowid))
    store.db.commit()
    return changes
