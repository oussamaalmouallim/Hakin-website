"""Exports (CSV, JSON) et rapports (galerie HTML, collecte, rejets, licences, matrice sources)."""
import csv
import html
import json
from collections import Counter, defaultdict
from pathlib import Path

from .taxonomy import TREE

FIELDS = ["nom_fichier", "chemin", "categorie", "sous_categorie", "marque", "modele", "couleur_dominante",
          "couleur_visuelle", "coupe", "matiere_apparente", "col_capuche", "fermeture", "type_photo", "vue",
          "methode_classification", "titre_produit", "url_page_source", "url_image", "site", "source_id", "type_source",
          "marche", "pays_marche_source", "largeur", "hauteur", "format", "taille_octets", "sha256", "phash",
          "date_collecte", "lot", "statut", "statut_verification", "classe_licence", "licence", "licence_url",
          "attribution", "note_licence", "notes_qualite", "quasi_doublon_de", "notes_classification", "variance_nettete"]

LICENSE_LABELS = {
    "commercial_ok": "1. Réutilisation commerciale autorisée par la licence (conditions à respecter)",
    "autorisation_necessaire": "2. Autorisation nécessaire (visuels de marque / enseigne)",
    "reference_interne": "3. Référence interne uniquement",
    "inconnue": "4. Conditions de réutilisation inconnues",
}


def _rows(db, statuses):
    q = f"SELECT status, meta FROM images WHERE status IN ({','.join('?' * len(statuses))}) ORDER BY id"
    out = []
    for st, meta in db.execute(q, statuses):
        m = json.loads(meta)
        m.setdefault("statut", st)
        out.append(m)
    return out


def export(root: Path, db, cfg: dict, run_stats: list[dict]):
    meta_dir, rep = root / "20_Metadata", root / "22_Reports"
    kept = _rows(db, ("ok", "a_verifier", "preexistant"))
    with open(meta_dir / "catalogue.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore", restval="inconnu")
        w.writeheader()
        w.writerows(kept)
    (meta_dir / "catalogue.json").write_text(json.dumps({"version": 1, "images": kept}, ensure_ascii=False, indent=1), encoding="utf-8")
    rejected = _rows(db, ("rejete", "doublon_exact", "erreur_telechargement"))
    with open(meta_dir / "rejets.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["statut", "url_image", "url_page_source", "source_id", "chemin", "raison",
                                          "doublon_de", "notes_qualite", "largeur", "hauteur"], extrasaction="ignore", restval="")
        w.writeheader()
        w.writerows(rejected)
    gallery(rep, kept)
    collection_report(rep, db, cfg, kept, rejected, run_stats)
    rejects_report(rep, kept, rejected)
    license_report(rep, kept)
    return len(kept), len(rejected)


def gallery(rep: Path, rows):
    items = [{k: r.get(k, "") for k in ("chemin", "categorie", "sous_categorie", "marque", "couleur_dominante", "marche",
                                       "site", "statut", "classe_licence", "titre_produit", "url_page_source", "largeur",
                                       "hauteur", "type_photo", "coupe", "col_capuche", "fermeture", "notes_qualite",
                                       "licence", "attribution")} for r in rows]
    data = json.dumps(items, ensure_ascii=False).replace("</", "<\\/")
    (rep / "galerie.html").write_text(GALLERY_TPL.replace("__DATA__", data), encoding="utf-8")


def collection_report(rep, db, cfg, kept, rejected, run_stats):
    L = ["# Rapport de collecte", "",
         "Toutes les valeurs ci-dessous sont **observées** (comptées dans `20_Metadata/state.sqlite`). Aucune estimation.", ""]
    by_src = defaultdict(Counter)
    for r in kept + rejected:
        by_src[r.get("source_id", "?")][r.get("statut", "?")] += 1
    visits = defaultdict(lambda: [0, 0, 0])
    for sid, st, n in db.execute("SELECT source_id, status, n_found FROM visits"):
        v = visits[sid]
        v[0] += 1
        v[1] += st != "ok"
        v[2] += n or 0
    L += ["## Par source", "", "| Source | Marché | Pages/API visitées | Échecs | ok | à vérifier | rejetées | doublons exacts | erreurs |",
          "|---|---|---|---|---|---|---|---|---|"]
    for sid, s in cfg["sources"].items():
        if not s.get("enabled"):
            continue
        c, v = by_src.get(sid, Counter()), visits.get(sid, [0, 0, 0])
        L.append(f"| {s['name']} | {s.get('market', '?')} | {v[0]} | {v[1]} | {c['ok']} | {c['a_verifier']} | {c['rejete']} | {c['doublon_exact']} | {c['erreur_telechargement']} |")
    L += ["", "## Sources identifiées non collectées", "", "| Source | Raison |", "|---|---|"]
    for sid, s in cfg["sources"].items():
        if not s.get("enabled"):
            L.append(f"| {s['name']} | {s.get('reason', '')} |")
    cnt = Counter((r["categorie"], r.get("sous_categorie", "")) for r in kept if r.get("statut") != "preexistant")
    L += ["", "## Couverture par catégorie / sous-catégorie (images conservées)", "", "| Catégorie | Sous-catégorie | Images | Maroc | International |", "|---|---|---|---|---|"]
    mk = Counter((r["categorie"], r.get("sous_categorie", ""), r.get("marche")) for r in kept)
    for cat, subs in TREE.items():
        if cat in ("12_A_Verifier", "13_Rejets"):
            continue
        for sub in (subs or [""]):
            n = cnt.get((cat, sub), 0)
            flag = " ⚠️ non couvert" if n == 0 else (" (faible)" if n < 5 else "")
            L.append(f"| {cat} | {sub or '—'} | {n}{flag} | {mk.get((cat, sub, 'maroc'), 0)} | {mk.get((cat, sub, 'international'), 0)} |")
    n_av = sum(1 for r in kept if r.get("statut") == "a_verifier")
    L.append(f"| 12_A_Verifier | — | {n_av} restant(s) à vérifier | | |")
    L += ["", "## Exécutions", "", "| Début | Lot | Requêtes HTTP | Bloquées par robots.txt | Résultats par issue |", "|---|---|---|---|---|"]
    for s in run_stats:
        L.append(f"| {s['start']} | {s['batch']} | {s['http']['requests']} | {s['http']['robots_blocked']} | {', '.join(f'{k}={v}' for k, v in sorted(s['outcomes'].items()))} |")
    (rep / "rapport_collecte.md").write_text("\n".join(L) + "\n", encoding="utf-8")

    # Matrice sources × catégories
    M = ["# Matrice sources × catégories (images conservées, observé)", ""]
    cats = [c for c in TREE if c not in ("13_Rejets",)]
    M.append("| Source | " + " | ".join(c[:2] for c in cats) + " |")
    M.append("|---|" + "---|" * len(cats))
    per = Counter((r.get("source_id"), r["categorie"]) for r in kept)
    for sid, s in cfg["sources"].items():
        if s.get("enabled"):
            M.append(f"| {s['name']} | " + " | ".join(str(per.get((sid, c), 0)) for c in cats) + " |")
        else:
            M.append(f"| {s['name']} (non collectée) | " + " | ".join("—" for _ in cats) + " |")
    M += ["", "Légende : " + ", ".join(f"{c[:2]} = {c[3:]}" for c in cats)]
    (rep / "matrice_sources_categories.md").write_text("\n".join(M) + "\n", encoding="utf-8")


def rejects_report(rep, kept, rejected):
    L = ["# Doublons, erreurs et rejets", "", "Aucune image n'est supprimée : les rejets qualité sont rangés dans `13_Rejets/`, "
         "les doublons exacts ne sont pas re-téléchargés (référence vers le fichier d'origine).", ""]
    c = Counter(r.get("statut") for r in rejected)
    L += [f"- Rejets qualité/illisibles : {c['rejete']}", f"- Doublons exacts (SHA-256) : {c['doublon_exact']}",
          f"- Erreurs de téléchargement : {c['erreur_telechargement']}", ""]
    near = [r for r in kept if r.get("quasi_doublon_de")]
    flags = Counter(f for r in kept for f in (r.get("notes_qualite") or "").split(",") if f)
    L += ["## Signalements qualité sur images conservées", ""] + [f"- {k} : {v}" for k, v in flags.most_common()] + [""]
    L += ["## Quasi-doublons (pHash) — conservés, à arbitrer", "", "| Fichier | Proche de |", "|---|---|"]
    L += [f"| {r['chemin']} | {r['quasi_doublon_de']} |" for r in near]
    L += ["", "## Détail des rejets", "", "| Statut | Raison / doublon de | Source | URL image |", "|---|---|---|---|"]
    for r in rejected:
        why = r.get("raison") or r.get("doublon_de") or r.get("notes_qualite", "")
        L.append(f"| {r.get('statut')} | {why} | {r.get('source_id')} | {r.get('url_image', '')[:120]} |")
    (rep / "rapport_doublons_rejets.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def license_report(rep, kept):
    L = ["# Inventaire des licences et droits", "",
         "Une image publique ou téléchargeable n'est **pas** libre de droits. Seules les images de la classe 1 ont une licence "
         "vérifiable autorisant un usage commercial, sous ses conditions (attribution, ND = sans modification).",
         "Les visuels de marque collectés ne peuvent pas être publiés sur la boutique sans autorisation du titulaire. "
         "Une retouche superficielle d'une image protégée ne la rend pas conforme.", ""]
    by = defaultdict(list)
    for r in kept:
        by[r.get("classe_licence", "inconnue")].append(r)
    for k, label in LICENSE_LABELS.items():
        rows = by.get(k, [])
        L += [f"## {label} — {len(rows)} image(s)", ""]
        sites = Counter(r.get("site") for r in rows)
        L += [f"- {s} : {n}" for s, n in sites.most_common()]
        if k == "commercial_ok" and rows:
            L += ["", "| Fichier | Licence | Attribution | Page source |", "|---|---|---|---|"]
            L += [f"| {r['chemin']} | {r.get('licence')} | {html.escape(r.get('attribution', ''))[:120]} | {r.get('url_page_source')} |" for r in rows]
        L.append("")
    (rep / "inventaire_licences.md").write_text("\n".join(L) + "\n", encoding="utf-8")


GALLERY_TPL = r"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Galerie H Mode</title><style>
:root{--bg:#f5f1eb;--paper:#fffdf9;--ink:#1e211f;--muted:#77736c;--line:#e5dfd5;--accent:#8b6f47}
@media (prefers-color-scheme:dark){:root{--bg:#1b1c1a;--paper:#252724;--ink:#eee9e0;--muted:#a39e94;--line:#3a3a36;--accent:#d8c4a4}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 -apple-system,"Segoe UI",sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px;z-index:2}
h1{font:600 20px Georgia,serif;margin:0 0 10px}.f{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
select,input{background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font:inherit;max-width:100%}
#n{color:var(--muted);margin-left:auto}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:16px}
.c{background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer}
.c img{width:100%;aspect-ratio:1;object-fit:contain;background:#fff;display:block}.c div{padding:8px;font-size:12px}
.c b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.t{display:inline-block;background:var(--bg);border-radius:99px;padding:1px 7px;margin:2px 2px 0 0;color:var(--muted)}
.w{color:#b5542d}dialog{max-width:min(900px,94vw);border:1px solid var(--line);border-radius:14px;background:var(--paper);color:var(--ink)}
dialog img{max-width:100%;max-height:70vh;display:block;margin:auto;background:#fff}dialog table{font-size:12px;margin-top:8px}dialog td{padding:2px 8px;vertical-align:top}
a{color:var(--accent)}</style></head><body>
<header><h1>Galerie — collecte mode homme AH</h1><div class="f" id="f"><input id="s" placeholder="Rechercher un titre…"><span id="n"></span></div></header>
<main id="g"></main><dialog id="d"></dialog>
<script>
const D=__DATA__;const K=["categorie","sous_categorie","marque","couleur_dominante","marche","site","statut","classe_licence"];
const L={categorie:"Catégorie",sous_categorie:"Sous-catégorie",marque:"Marque",couleur_dominante:"Couleur",marche:"Marché",site:"Source",statut:"Statut",classe_licence:"Licence"};
const f=document.getElementById("f"),sel={};
for(const k of K){const s=document.createElement("select");s.innerHTML=`<option value="">${L[k]} (tous)</option>`+[...new Set(D.map(d=>d[k]||"—"))].sort().map(v=>`<option>${v}</option>`).join("");s.onchange=draw;sel[k]=s;f.insertBefore(s,document.getElementById("n"))}
document.getElementById("s").oninput=draw;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function draw(){const q=document.getElementById("s").value.toLowerCase();
const r=D.filter(d=>K.every(k=>!sel[k].value||(d[k]||"—")===sel[k].value)&&(!q||(d.titre_produit||"").toLowerCase().includes(q)));
document.getElementById("n").textContent=r.length+" / "+D.length+" images";
document.getElementById("g").innerHTML=r.map((d,i)=>`<div class="c" data-i="${D.indexOf(d)}"><img loading="lazy" src="../${encodeURI(d.chemin)}" alt=""><div><b title="${esc(d.titre_produit)}">${esc(d.titre_produit)}</b><span class="t">${esc(d.sous_categorie||d.categorie)}</span><span class="t">${esc(d.marque)}</span><span class="t">${esc(d.largeur)}×${esc(d.hauteur)}</span>${d.statut==="a_verifier"?'<span class="t w">à vérifier</span>':""}</div></div>`).join("")}
document.getElementById("g").onclick=e=>{const c=e.target.closest(".c");if(!c)return;const d=D[c.dataset.i],dl=document.getElementById("d");
dl.innerHTML=`<img src="../${encodeURI(d.chemin)}"><table>${Object.entries(d).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${k==="url_page_source"&&/^https?:/.test(v)?`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>`:esc(v)}</td></tr>`).join("")}</table><p><button onclick="this.closest('dialog').close()">Fermer</button></p>`;dl.showModal()};
draw();
</script></body></html>"""
