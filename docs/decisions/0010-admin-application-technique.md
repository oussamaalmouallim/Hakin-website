# 0010 — Administration en application technique : thème propre, composants Lightswind, supervision en 5 pages
- Date : 2026-11-11
- Contexte : l'administration reprenait l'esthétique de la boutique (titres Archivo Black en capitales, pilules mono,
  fonds crème) et la supervision tenait sur une seule page à onglets. L'utilisateur veut une vraie application de gestion
  technique de type SaaS : barre latérale, barre du haut, pages indépendantes, KPI, tableaux et graphiques de qualité,
  sur la base de la bibliothèque Lightswind, sans toucher aux pages publiques ni inventer de chiffre.
- Décisions (validées par l'utilisateur, « go, avec recharts ») :
  - **Thème `theme-admin`** posé sur `<html>` seulement pendant `/admin` (fenêtres en portail comprises) : il redéfinit les
    tokens (`tokens.css`, `palette.md` § Administration) et ajoute `--admin-*` (barre latérale, accent beige, séries).
    Les composants du design-system restent la seule source (règle « pas de doublon ») ; leur habillage admin passe par des
    crochets `ds-*` stylés sous `.theme-admin` dans `index.css`.
  - **Composants Lightswind** pris dans son registre officiel (`lightswind.com/r/<nom>.json`, celui de sa CLI), sans lancer
    la CLI (elle réécrit `tailwind.config.js`) : `sidebar`, `card`, `badge`, `table`, `toggle-group`, `chart`, `command`,
    `tooltip`, `skeleton`, `progress`, adaptés (NavLink, français, tokens, animations coupées, ARIA), licence MIT en tête.
    Écarté : ce qui n'aurait été que décoratif (fonds animés, effets 3D).
  - **recharts** (`chart` de Lightswind) : seule nouvelle dépendance, chargée dans le bloc de l'admin uniquement
    (≈ 155 Ko gzip pour tout l'admin), jamais préchargé pour les visiteurs.
  - **Supervision en 5 routes** (`/admin/supervision`, `/sante`, `/journaux`, `/securite`, `/maintenance`) au lieu d'onglets ;
    les adresses `?onglet=` sont redirigées. Chaque page lit ses données ; les états vides le disent, aucune courbe d'exemple.
  - **Volume de requêtes API** : seules les écritures publiques (limitées par `passer_limite`) sont mesurables sans clé
    secrète ; elles sont affichées comme telles, avec un lien vers les rapports Supabase pour le total.
- Conséquences :
  - Toute nouvelle page d'admin utilise le kit (`commun.tsx` : `EnTeteAdmin`, `CarteAdmin`, `KpiCarte`, `GrilleKpi`,
    `EtatVide`, `SqueletteAdmin`, `Pastille` ; `components/lightswind/`) et s'ajoute à `navigation.ts`.
  - Un tableau qui défile est focalisable au clavier (axe `scrollable-region-focusable`) ; une carte dans une grille porte
    `min-w-0` (sinon un tableau large élargit toute la page sur mobile).
  - Le Playwright de l'admin passe axe sur 14 écrans et vérifie 375 px sans défilement horizontal.
