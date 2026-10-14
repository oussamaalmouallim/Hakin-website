#!/usr/bin/env python3
"""Collecte d'images mode homme AH — point d'entrée.

  .venv/bin/python run.py collect --batch pilot             # lot pilote (quotas réduits)
  .venv/bin/python run.py collect --batch full              # collecte étendue (quotas de config.yaml)
  .venv/bin/python run.py collect --batch full --sources kiabi_ma,nike_fr
  .venv/bin/python run.py report                            # régénère CSV/JSON/rapports sans réseau
  .venv/bin/python run.py status                            # compteurs rapides
"""
import argparse
import json
import logging
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent  # dossier Scrapping/
sys.path.insert(0, str(HERE))

from hmscrape.http import PoliteSession  # noqa: E402
from hmscrape.report import export  # noqa: E402
from hmscrape.sources import ADAPTERS  # noqa: E402
from hmscrape.store import Store, apply_verifications, reclassify  # noqa: E402

log = logging.getLogger("hmscrape")


def setup_logging(tag: str) -> Path:
    logs = ROOT / "21_Logs"
    logs.mkdir(exist_ok=True)
    path = logs / f"{datetime.now():%Y%m%d_%H%M%S}_{tag}.log"
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    log.setLevel(logging.INFO)
    for h in (logging.FileHandler(path, encoding="utf-8"), logging.StreamHandler()):
        h.setFormatter(fmt)
        log.addHandler(h)
    return path


def load_cfg():
    return yaml.safe_load((HERE / "config.yaml").read_text(encoding="utf-8"))


def run_stats_path():
    return ROOT / "21_Logs" / "runs.jsonl"


def load_run_stats():
    p = run_stats_path()
    return [json.loads(line) for line in p.read_text().splitlines() if line.strip()] if p.exists() else []


def collect(args, cfg):
    batch = cfg["batches"][args.batch]
    quotas = {**cfg["quotas"], **batch.get("quotas", {})}
    if args.max_per_source:
        quotas["max_per_source"] = args.max_per_source
    opts = {"max_pages": batch.get("max_pages_per_listing", 1), "max_products": quotas["max_products_per_listing"]}
    store = Store(ROOT, cfg, quotas)
    store.ensure_tree()
    n_existing = store.index_existing()
    log.info("Lot %s — quotas %s — images préexistantes nouvellement indexées : %d", args.batch, quotas, n_existing)
    session = PoliteSession(cfg)
    wanted = set(args.sources.split(",")) if args.sources else None
    outcomes = Counter()
    start = datetime.now().isoformat(timespec="seconds")
    for sid, scfg in cfg["sources"].items():
        if not scfg.get("enabled") or (wanted and sid not in wanted):
            continue
        adapter = ADAPTERS.get(scfg["type"])
        if not adapter:
            continue
        log.info("=== Source %s (%s)", sid, scfg["name"])
        if scfg.get("min_delay"):
            session.set_host_delay(scfg["base"], scfg["min_delay"])
        src_out = Counter()
        try:
            for cand in adapter(sid, scfg, session, store, args.batch, opts):
                if store.source_full(sid) or session.host_blocked(scfg["base"]):
                    break
                for pos, (url, alt) in enumerate(cand["images"][: quotas["max_images_per_product"]], 1):
                    res = store.process(session, cand, url, alt, pos, args.batch)
                    src_out[res] += 1
                    if res in ("hors_perimetre", "quota_categorie", "quota_sous_categorie", "quota_produit", "quota_source"):
                        break
        except KeyboardInterrupt:
            log.warning("Interrompu — l'état est sauvegardé, relancer la même commande pour reprendre.")
            outcomes.update(src_out)
            break
        except Exception:
            log.exception("Erreur sur la source %s — passage à la suivante", sid)
        log.info("Source %s : %s", sid, dict(src_out))
        outcomes.update(src_out)
    stats = {"start": start, "end": datetime.now().isoformat(timespec="seconds"), "batch": args.batch,
             "sources": sorted(wanted) if wanted else "toutes_actives", "http": session.stats, "outcomes": dict(outcomes)}
    with open(run_stats_path(), "a", encoding="utf-8") as f:
        f.write(json.dumps(stats, ensure_ascii=False) + "\n")
    log.info("Bilan : %s", stats)
    log.info("Vérifications manuelles appliquées : %d", apply_verifications(store))
    kept, rej = export(ROOT, store.db, cfg, load_run_stats())
    log.info("Exports régénérés : %d images conservées, %d rejets/doublons/erreurs", kept, rej)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("collect")
    c.add_argument("--batch", default="pilot")
    c.add_argument("--sources", default="")
    c.add_argument("--max-per-source", type=int, default=0, help="surcharge ponctuelle du quota par source")
    sub.add_parser("report")
    sub.add_parser("reclassify", help="ré-applique les règles de classification (sans réseau)")
    sub.add_parser("status")
    args = ap.parse_args()
    cfg = load_cfg()
    if args.cmd == "collect":
        setup_logging(args.batch)
        collect(args, cfg)
    else:
        store = Store(ROOT, cfg, cfg["quotas"])
        if args.cmd == "reclassify":
            setup_logging("reclassify")
            for old, new, title in reclassify(store):
                log.info("Reclassé : %s -> %s (%s)", old, new, title)
            log.info("Vérifications manuelles appliquées : %d", apply_verifications(store))
            export(ROOT, store.db, cfg, load_run_stats())
        elif args.cmd == "report":
            print("vérifications appliquées :", apply_verifications(store))
            print(export(ROOT, store.db, cfg, load_run_stats()))
        else:
            for row in store.db.execute("SELECT source_id, status, COUNT(*) FROM images GROUP BY 1,2 ORDER BY 1,2"):
                print(*row)


if __name__ == "__main__":
    main()
