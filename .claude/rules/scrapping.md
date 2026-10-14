---
paths:
  - "Scrapping/**"
---
- Recherche visuelle interne : les images collectées ne sont PAS publiables sur le site sans preuve de droits.
- Respecter `robots.txt`, les conditions d'utilisation et les limites de requêtes. Ne contourner ni connexion, ni CAPTCHA, ni paywall ; après des 429 répétés, l'hôte est abandonné (coupe-circuit `max_429_per_host` dans `hmscrape/http.py`).
- Aucune clé API dans le code ou les logs (variables d'environnement seulement).
- Ne supprimer aucun fichier existant ; pas de collecte massive sans validation du pilote par l'utilisateur.
- Python via `uv` dans `23_Scripts/.venv` ; point d'entrée `23_Scripts/run.py` (collect, report, reclassify, status).
