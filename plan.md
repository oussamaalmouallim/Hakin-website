# H MODE — Plan de refonte e-commerce premium

> Plan d'exécution lot par lot, rédigé **après audit complet** du projet (14/10/2026).
> Aucune modification du site n'a encore été faite. Chaque lot se termine par une vérification
> et une validation avant de passer au suivant.

### Décisions actées (14/10/2026)

| # | Décision |
|---|---|
| D1 | **Les marques sont conservées.** H MODE se déclare **revendeur agréé** de ces marques. Les photos à logos sont utilisées sur le site. *À garder à disposition : les justificatifs d'agrément, à produire en cas de contrôle ou de refus publicitaire Meta.* |
| D2 | **Prix figés prochainement.** On construit le boilerplate complet maintenant. Les produits sans prix affichent « Prix sur demande » et se commandent sur WhatsApp. Le panier fonctionne dès que `prixDH` est renseigné. |
| D8 | La « page Skills » était une erreur de saisie : la référence de qualité est la **skill UI Stealer** (`Documents/SKILLS/UI-Stealer`). On applique sa méthode, sa stack et son boilerplate (dossier `ui/`, `Template/`, scripts, Docker), avec la charte **H MODE** et non la charte Melko. |
| Ports | Dev `6011` (6010 déjà occupé sur la machine), prod Docker `6111`. |

---

### Avancement (14/10/2026) — boilerplate livré

| Lot | État | Détail |
|---|---|---|
| 0 | ✅ en partie | D1, D2 et D8 tranchés. Restent D3 (paiement, appliqué par défaut : paiement à la livraison), D5 (logo source), D6 (photo de campagne sans texte), D9 (adresse, livraison, retours). |
| 1 | ✅ | Export WhatsApp archivé dans `legacy/export-whatsapp/` (91 fichiers, aucun référencé ; `assets/` passe de 38 Mo à 1,2 Mo). `hero.png` est dans `Template/`. 12 photos → 10 produits (T4/T5 et T6/T7 = même produit, face et dos), WebP 480/960. |
| 2 | ✅ | `ui/` : Vite 5, React 18, TS strict, Tailwind 3, framer-motion, React Router, Zustand. Scripts `start.sh`, `stop.sh`, `deploy.sh`, Docker/nginx, `_redirects`. |
| 3 | ✅ | Tokens H MODE, composants dans `src/design-system/`, page `/design-system`. Lightswind : `scroll-reveal` et `image-reveal` installés via la CLI et ré-habillés. |
| 4 | ✅ | Catalogue JSON (prix `null`), panier, favoris, compte local, message WhatsApp, recherche, filtres synchronisés dans l'URL. Mode démo `VITE_DEMO=1` (prix fictifs, bandeau visible). |
| 5 → 11 | ✅ v1 | Toutes les pages de la section D existent et fonctionnent. Les contenus manquants sont affichés « À confirmer ». |
| 12 | 🔄 en cours | **Accueil fait** (14/10) : logo de l'en-tête masqué sur le héros, boutons du héros pleine largeur sur mobile, carrousel « Sélection » recalé + flèches au clavier et à la souris, engagements compacts sur mobile, bloc Instagram sans photos produits répétées, interlignage des titres corrigé (accents), bouton WhatsApp visible sur le pied de page sombre, contenu visible d'emblée en « animations off ». **Boutique faite** (14/10) : filtres vides masqués (taille, disponibilité) et tri par prix masqué tant qu'aucun prix n'est saisi, compteurs de filtres croisés (valeurs à 0 désactivées, test ajouté), encart éditorial sans photo trompeuse, espacements des groupes de filtres harmonisés, « Prix sur demande » sur une ligne. Compteurs de collections ajoutés. **Fiche produit faite** (14/10) : barre d'achat mobile sortie du conteneur animé (portail vers `body`, non focusable quand masquée), bouton WhatsApp flottant masqué sur la fiche en mobile (doublon avec la barre), lien « Guide des tailles » masqué tant qu'aucune taille n'est saisie, puce « À confirmer » alignée sur plusieurs lignes, bandeau démo sur une ligne avec barre placée au-dessus, contenu visible d'emblée en « animations off ». **Panier et commande faits** (14/10) : total de ligne sur la rangée quantité en mobile, étapes de commande sans légende posée sur le filet, récapitulatif repliable en haut de la commande sur mobile, total rappelé au-dessus du bouton d'envoi, mention « en espèces » retirée (non confirmée, D3), message WhatsApp « Mode de paiement : … », bouton flottant au-dessus du bandeau démo. Parcours complet vérifié en démo (erreurs + focus, message WhatsApp, panier conservé puis vidé à la confirmation, commande enregistrée dans le compte). **Cartes et images de luxe** (14/10) : cadre passe-partout partout (`Cadre`, Lightswind magic-card + border-beam ré-habillés), packshots de chaussures fondus dans le sable, dossier unique `ui/medias/` (+ `LISEZMOI.md`, `provenance.json`), 52 produits du Scrapping publiés sans doublon (vendeur agréé, décision utilisateur), 5 catégories activées. **Retouches accueil** (14/10) : cadre en arche statique à double filet (effets animés retirés), cartes de la sélection réduites, « Par signature » en bandeau défilant au survol (marquee-menu), écrin « La sélection » + chiffres réels à la place de la photo (looping-words, count-up), réseaux par le nom H MODE (shiny-text). Cartes refaites en cartes éditoriales plein cadre (seasonal-hover-cards : nom sur l'image, prix et coloris au survol, variante claire pour les chaussures), arches et filets retirés. Pages suivantes : compte, pages infos. |
| 13 | ⏳ en partie | 15 tests Vitest (logique + parcours d'achat) verts, `tsc` et build OK, contrôles DOM mobile/desktop faits. Restent : Lighthouse, audit clavier complet, Playwright. |
| 14 | ⏳ | Mise en ligne après validation. |

---

<a id="sommaire"></a>
## Sommaire

**Cadrage**
- [A. Synthèse de l'audit](#audit)
- [B. Décisions à prendre avant de coder](#decisions)
- [C. Architecture cible](#architecture)
- [D. Plan de site (pages et routes)](#plan-de-site)

**Lots**

| Lot | Titre | Dépend de |
|---|---|---|
| [Lot 0](#lot-0) | Décisions et cadrage | — |
| [Lot 1](#lot-1) | Nettoyage et réorganisation des ressources | 0 |
| [Lot 2](#lot-2) | Socle technique (Vite · React · Tailwind · Lightswind) | 1 |
| [Lot 3](#lot-3) | Design system H MODE | 2 |
| [Lot 4](#lot-4) | Données catalogue et état (panier, favoris, compte) | 2 |
| [Lot 5](#lot-5) | Layout global (en-tête, menus, recherche, mini-panier, pied de page) | 3 · 4 |
| [Lot 6](#lot-6) | Accueil | 5 |
| [Lot 7](#lot-7) | Catalogue, catégories et collections | 5 |
| [Lot 8](#lot-8) | Fiche produit | 7 |
| [Lot 9](#lot-9) | Panier et parcours de commande | 8 |
| [Lot 10](#lot-10) | Compte client | 9 |
| [Lot 11](#lot-11) | Pages d'information (contact, maison, livraison, FAQ, légal, 404) | 5 |
| [Lot 12](#lot-12) | Animations, finitions et cohérence visuelle | 6 → 11 |
| [Lot 13](#lot-13) | Vérification : fonctionnel, responsive, accessibilité, performance | 12 |
| [Lot 14](#lot-14) | Mise en ligne et passation | 13 |

**Annexes**
- [E. Inventaire des images](#inventaire-images)
- [F. Fonctionnalités existantes à préserver](#fonctionnalites-existantes)
- [G. Prérequis externes et limites](#prerequis)
- [H. Risques](#risques)

---

<a id="audit"></a>
## A. Synthèse de l'audit

### A.1 Le site actuel

| Élément | Constat |
|---|---|
| Technologie | Site statique : un seul `index.html` (565 lignes), `css/style.css` (766 lignes), `js/main.js` (192 lignes). Pas de build, pas de framework. |
| Pages | **Une seule page** à ancres : Hero, bandeau défilant, arguments, 3 catégories, « Collection Demo », marques, témoignages, contact, pied de page. |
| Routes | Aucune. Les liens `#collection` du menu et du pied de page pointent vers une ancre **qui n'existe pas**. |
| E-commerce | Aucun : pas de fiche produit, de panier, de prix, de stock ni de compte. Tous les boutons « Commander » mènent à la section contact. |
| Commande réelle | WhatsApp : formulaire de contact → message pré-rempli vers `wa.me/212625490034`. C'est la **seule fonctionnalité opérationnelle** de vente. |
| Charte actuelle | Fond crème `#fafaf8`, noir `#0e0e0d`, or `#c8a96e` / `#e8d9b8`. Typos **Cormorant Garamond** (titres et texte) et **Geist Mono** (labels). Loader noir « H MODE ». |
| Responsive | 3 points de rupture (1024 / 768 / 480 px), menu burger mobile. |
| Réseaux sociaux | Liens **génériques** (`instagram.com/`, `facebook.com/`) et pseudo `@hakim_almouallim` : à remplacer par les comptes officiels. |
| README | Décrit un dossier `hakim-store` et des dossiers `pants/`, `sneakers/`, `heroes/` **qui n'existent pas**. |

### A.2 Contenus problématiques repérés

| Contenu | Problème |
|---|---|
| Photos produits | **Les 12 photos de t-shirts portent des logos de grandes marques** : Dior, Prada, Givenchy, Balenciaga, Amiri, motifs Casablanca. Elles sont prises en boutique, devant un lettrage mural de marque (« PHILIPP PLEIN »). |
| « 100 % authentique », « Marques authentiques », liste Gucci, Balenciaga, Hugo Boss… | Affirmations non vérifiables. Contradiction avec la décision du Planning : **« aucune pièce avec logo ou design copiant une marque connue »**. Risque juridique (contrefaçon) et risque de refus des publicités Meta. |
| Témoignages (Youssef B., Sara L., Karim M.) | Non vérifiés : à retirer tant qu'il n'y a pas de vrais avis. |
| Compteurs « 500+ références », « 20+ marques », « Depuis 2010 » | Non sourcés. |
| « Hommes et femmes » | Le Planning cible la **mode homme**. |
| Adresse | « Adresse complète à ajouter ». |

### A.3 Ressources

- **`assets/tshirts/` pèse 38 Mo** alors que seules 12 photos (≈ 1,2 Mo) sont utiles. Le reste est une **page WhatsApp Web sauvegardée** : `DIOR-TSHIRT.html` (1,7 Mo), des dizaines de `.js.download`, `.enc` et `.css`, plus 2 icônes d'interface WhatsApp. Tout cela est commité dans git.
- **Aucun doublon d'image confirmé.** Le SHA-256 est différent pour toutes les images. Le seul quasi-doublon pHash (PRADA-T / T11) est un faux positif : même mise en scène, mais marques différentes.
- **Photos utilisées :** DIOR-T, PRADA-T, T2–T6 (DIOR-T, PRADA-T, T2, T3 et T4 apparaissent deux fois).
- **Photos non utilisées :** T7, T8, T9, T10, T11.
- **`Hero/hero.png`** (1672×940, non commité) est une **maquette de direction artistique**. Elle montre :
  - un fond sable,
  - un monogramme H bronze traversé d'une courbe,
  - « H MODE » en capitales serif espacées et « STYLE · QUALITY · YOU »,
  - « Plus qu'un style, une attitude. »,
  - un homme en costume lin écru et un olivier en pot.
  
  C'est une **image aplatie** : le menu et le logo font partie des pixels. Elle peut servir de référence, mais pas de visuel de site.
- **`Scrapping/`** contient 130 images collectées pour la recherche visuelle. Elles sont **toutes à usage interne** (autorisation nécessaire ou droits inconnus) : **aucune ne peut être publiée sur le site**.

### A.4 Références de conception

- **Skill UI Stealer** (`/Users/user/Documents/DEV/Mysalary/Skills/UI-Stealer`, identique à `Documents/SKILLS/UI-Stealer`). On en garde :
  - **la méthode** : référence visuelle dans `Template/` → on reproduit la **structure** ;
  - **le niveau d'exigence** : vivant mais doux, cascade framer-motion, hover qui soulève, transitions sans à-coup, bouton « animations off » et `prefers-reduced-motion` ;
  - **l'usage des assets fournis** plutôt que des redessins ;
  - **la vérification** par DOM, styles calculés, build et tests plutôt que par captures ;
  - **la stack** : Vite, React, TypeScript, Tailwind, framer-motion, lucide.
  
  ⚠️ On **n'applique pas** la charte Melko (Encre/Forêt/Saphir, Inter) : la skill est écrite pour Melko. Ici, c'est **l'identité H MODE qui prime**.
- **Lightswind** (lightswind.com) est une bibliothèque React (Tailwind et Framer Motion, copier-coller ou `npx lightswind`) de plus de 300 composants. Candidats pertinents pour H MODE :
  - Scroll Reveal, Text Reveal, Shiny Text, Count Up ;
  - Marquee / Text Scroll Marquee, Parallax Scroll, Hero Parallax ;
  - Direction Aware Hover, 3D Image Carousel / Cool Slide Gallery, Bento Grid ;
  - Navigation Menu, Breadcrumb, Pagination, Alert Dialog, Animated Notification.
  
  **Ils seront tous ré-habillés** aux tokens H MODE : pas de néon, pas de verre coloré, pas d'effet « tech ».
- **Lightswind impose React** : le site doit migrer d'un HTML statique vers une application Vite/React (voir [C](#architecture)).

---

<a id="decisions"></a>
## B. Décisions à prendre avant de coder

Ces points bloquent ou changent le contenu. Une recommandation est donnée pour chacun.

| # | Décision | Options | Recommandation |
|---|---|---|---|
| **D1** | **Photos avec logos de marques** (les 12 t-shirts actuels) | a) les garder comme produits ; b) les garder seulement en local en attendant de nouvelles photos ; c) les retirer du site | **c) + b)** : cohérent avec la règle « pas de logo » du Planning. Le site part avec les photos sans logo que Hakim fournira. Les anciennes sont archivées hors du dossier publié (pas supprimées). |
| **D2** | **Catalogue réel** : noms, prix (DH), tailles, couleurs, disponibilité | Fournis par toi ou Hakim | Indispensable : **aucun prix ni stock ne sera inventé**. Un modèle `produits.json` et un tableur seront fournis pour la saisie. Sans prix, un produit affiche « Prix sur demande » et ne peut pas aller au panier. |
| **D3** | **Paiement** | Paiement à la livraison (COD) + confirmation WhatsApp ; ou paiement en ligne | **COD + WhatsApp** : c'est ce qui existe et fonctionne, et c'est conforme au Planning. Le paiement en ligne (CMI, Stripe…) demande un backend et un contrat : il est hors périmètre, documenté en [G](#prerequis). |
| **D4** | **Compte client** | a) compte local (dans le navigateur) ; b) vrai compte avec backend (Supabase, Shopify…) | **a) d'abord, présenté honnêtement**. Il garde dans l'appareil les coordonnées, les adresses, les favoris et l'historique des commandes envoyées. b) est prévu comme évolution. |
| **D5** | **Logo** | Monogramme H de `hero.png` vectorisé ; ou logo texte actuel | Fournir le **fichier source du logo** (SVG ou AI) s'il existe. Sinon, on le redessine en SVG d'après la maquette. Cette validation t'appartient. |
| **D6** | **Photos de campagne** (hero, ambiance) | Fichiers sources de la maquette `hero.png` (calques) ; shooting ; banque d'images libre | Fournir **la photo seule** (sans texte incrusté). En attendant, le hero sera composé typographiquement : monogramme, fond sable, photo produit. |
| **D7** | **Cible** | Homme uniquement ou homme + femme | **Homme** (Planning). |
| **D8** | **« Page Skills »** citée dans la demande | Ce projet ne contient **aucune page Skills** | Préciser la page de référence (un autre projet ? la skill UI Stealer ?). Par défaut, la référence de qualité sera `hero.png` + les critères UI Stealer. |
| **D9** | **Adresse, horaires, zones et frais de livraison, politique de retour** | À fournir | Indispensable pour les pages Livraison, Retours et Contact. Sans ces informations, les sections afficheront « À confirmer » (jamais de valeur inventée). |
| **D10** | Contenus non vérifiés (témoignages, compteurs, « depuis 2010 ») | Retirer ; ou remplacer par des données réelles | **Retirer** et prévoir des emplacements pour de vrais avis (captures Instagram/WhatsApp avec accord des clients). |

---

<a id="architecture"></a>
## C. Architecture cible

**Pourquoi migrer :**
- passer d'une page unique à une boutique multi-pages ;
- gérer un panier qui calcule des totaux ;
- filtrer et rechercher ;
- intégrer Lightswind (React).

Tout cela demande un front applicatif. Le site reste **100 % statique à l'hébergement** (pas de serveur) : il est déployable sur Netlify ou GitHub Pages comme aujourd'hui.

```
Hakin-website/
├── plan.md                 ← ce document
├── Template/               ← références visuelles (hero.png déplacé ici, convention UI Stealer)
├── ui/                     ← nouvelle application (Vite + React + TS) — arborescence UI Stealer
│   ├── index.html · package.json · vite.config.ts · tailwind.config.ts · tsconfig.json
│   ├── public/
│   │   ├── images/produits/<slug>/<n>.webp     (images optimisées : 400/800/1600 px)
│   │   ├── images/campagne/ · favicon.svg · logo.svg
│   └── src/
│       ├── main.tsx · App.tsx · routes.tsx
│       ├── styles/ (tokens.css, base.css)
│       ├── design-system/   Bouton · Champ · Select · CaseACocher · Pastille · Badge · Modale ·
│       │                    Tiroir · Notification · Squelette · EtatVide · EtatErreur · Fil d'Ariane ·
│       │                    Pagination · Onglets · Accordeon · Prix · Quantite · SelecteurTaille …
│       ├── components/      EnTete · MegaMenu · MenuMobile · Recherche · MiniPanier · PiedDePage ·
│       │                    CarteProduit · GalerieProduit · Filtres · Tri · LienReseaux · BandeauDefilant …
│       ├── features/        accueil · catalogue · produit · panier · commande · compte · infos
│       ├── data/            produits.json · categories.json · collections.json · boutique.json
│       ├── state/           panier · favoris · compte · animations (Zustand + localStorage)
│       ├── lib/             format (DH), whatsapp (message de commande), recherche, filtres
│       └── tests/
├── legacy/                 ← ancien index.html / css / js conservés pour référence (pas publiés)
├── Scrapping/              ← inchangé (recherche visuelle, usage interne)
└── Planning/               ← inchangé
```

**Stack** (alignée sur UI Stealer, adaptée à H MODE) :

| Rôle | Outils |
|---|---|
| Base | Vite 5, React 18, TypeScript, Tailwind 3 |
| Animations | framer-motion |
| Navigation | React Router |
| État | Zustand avec `persist` (localStorage) |
| Icônes | lucide-react |
| Polices | Fontsource |
| Tests | Vitest + Testing Library, Playwright pour le parcours d'achat |
| Optimisation images | sharp (WebP + tailles responsives) |

---

<a id="plan-de-site"></a>
## D. Plan de site (pages et routes)

| Route | Page | Objectif |
|---|---|---|
| `/` | Accueil | Image de marque, collections, catégories, nouveautés, réseaux |
| `/boutique` | Catalogue complet | Parcourir, filtrer, trier, rechercher |
| `/boutique/:categorie` | Catégorie (t-shirts, pantalons, sneakers… selon le catalogue réel) | Présentation éditoriale propre à la catégorie + liste filtrable |
| `/collections` · `/collections/:slug` | Collections (ex. « Été », « Essentiels ») | Récit éditorial + produits liés |
| `/produit/:slug` | Fiche produit | Galerie, variantes, prix, ajout au panier, guide des tailles |
| `/recherche?q=` | Résultats de recherche | Résultats + suggestions |
| `/panier` | Panier | Quantités, suppression, totaux |
| `/commande` · `/commande/confirmation` | Parcours de commande | Coordonnées, livraison, récapitulatif, envoi WhatsApp (COD) |
| `/compte` (+ `/compte/commandes`, `/compte/adresses`, `/compte/favoris`) | Compte client (local) | Profil, adresses, historique, favoris |
| `/maison` | À propos de H MODE | Histoire, valeurs (contenu à fournir) |
| `/contact` | Contact | Formulaire → WhatsApp, réseaux, adresse |
| `/livraison-retours` · `/faq` · `/guide-des-tailles` | Informations commerciales | Conditions réelles (D9) |
| `/mentions-legales` · `/confidentialite` · `/cgv` | Légal | Contenu à fournir ou à valider |
| `*` | 404 | Retour vers la boutique |

---

<a id="lot-0"></a>
## Lot 0 — Décisions et cadrage

**Objectif.** Lever les points bloquants de la [section B](#decisions) avant d'écrire du code.

**Tâches**
1. Obtenir une réponse sur D1 à D10, en priorité **D1 (logos), D2 (catalogue) et D8 (page Skills)**.
2. Fournir un **modèle de saisie produit** (`catalogue-modele.csv`) : nom, catégorie, prix DH, tailles, couleurs, disponibilité, matière, description courte, photos.
3. Créer le dossier `Template/` et y déplacer `Hero/hero.png` (référence de direction artistique).
4. Valider la palette et la typographie proposées au [Lot 3](#lot-3) sur une planche visuelle (une page HTML statique).

**Livrables** : décisions consignées en tête de ce fichier, modèle de catalogue, planche visuelle.

**Critère de sortie** : D1, D2, D3, D7 et D8 tranchés. Les autres peuvent arriver au fil des lots ; leurs emplacements resteront marqués « À confirmer ».

[↑ Sommaire](#sommaire)

---

<a id="lot-1"></a>
## Lot 1 — Nettoyage et réorganisation des ressources

**Objectif.** Ne garder que les ressources utiles, sans rien perdre et sans casser de référence.

**Tâches**
1. **Vérifier** avant chaque suppression que la ressource n'est référencée nulle part (`grep` sur HTML, CSS, JS et README).
2. **Archiver**, et non supprimer, l'export WhatsApp Web : `assets/tshirts/DIOR-TSHIRT.html`, `*.js.download`, `*.enc`, `*.css`, `T_xj3a3ApC9.webp`, `xK9mP2qLwR7nT4vJ_v2.png`.
   - Ils seront déplacés vers `legacy/export-whatsapp/` puis retirés du suivi git (`.gitignore`), après ton accord.
   - Gain attendu : ≈ 37 Mo dans le dépôt de travail.
   - ⚠️ L'historique git garde les fichiers : une purge de l'historique serait une opération séparée, à ta demande uniquement.
3. **Photos produits** : renommer avec des noms explicites (`t-shirt-…-01.jpg`), générer les WebP 400/800/1600 px, les ranger par produit.
   - Selon D1 : soit dans `ui/public/images/produits/`, soit dans `legacy/photos-marques/` (non publiées).
4. Inventaire final dans `ui/public/images/README.md` : pour chaque image, sa provenance, son usage (page et produit) et ses droits.
5. Conserver l'ancien site dans `legacy/` (référence des fonctionnalités et de la charte).
6. Corriger le README racine, qui décrit des dossiers inexistants.

**Critères d'acceptation**
- Aucune image utilisée ne manque : contrôle automatique des chemins au build.
- Aucun doublon : script SHA-256 + pHash relancé, rapport joint.
- Toutes les suppressions sont tracées dans le commit (liste des fichiers déplacés).

[↑ Sommaire](#sommaire)

---

<a id="lot-2"></a>
## Lot 2 — Socle technique

**Objectif.** Une application qui démarre, se construit et se teste, prête à recevoir le design system.

**Tâches**
1. Initialiser `ui/` : Vite, React, TypeScript, Tailwind, PostCSS, framer-motion, React Router, Zustand, lucide-react, Fontsource.
2. Installer **Lightswind** et vérifier son mode d'intégration (CLI copier-coller ou package). On importe **uniquement** les composants retenus ([A.4](#audit)), copiés dans `src/design-system/lightswind/` pour être ré-habillés.
3. Mettre en place les routes de la [section D](#plan-de-site) avec des pages vides, le **défilement remis en haut** à chaque navigation et la **page 404**.
4. Mettre en place l'outillage : `npm run dev | build | preview | test | lint`, Vitest + Testing Library, Playwright, et un script d'optimisation d'images (sharp).
5. Configurer `prefers-reduced-motion` et le **contexte « animations off »** (critère UI Stealer).
6. Préparer le déploiement statique : `base`, redirections SPA (`_redirects` Netlify ou `404.html` GitHub Pages).

**Critères d'acceptation** : `npm run build`, `tsc --noEmit` et `vitest run` passent ; toutes les routes s'affichent ; un lien inconnu mène à la 404.

[↑ Sommaire](#sommaire)

---

<a id="lot-3"></a>
## Lot 3 — Design system H MODE

**Objectif.** Un langage visuel unique, réutilisable sur toutes les pages. Il **prolonge** l'identité actuelle (crème, noir, or, serif Cormorant, labels mono) et la maquette `hero.png` (sable, bronze, capitales espacées).

### 3.1 Couleurs (proposition, mesurée sur `hero.png` et `style.css`)

| Token | Valeur | Usage |
|---|---|---|
| `--nacre` | `#FBF9F5` | Fond principal, blanc nacré |
| `--neige` | `#FFFFFF` | Cartes, modales |
| `--sable-50` | `#F4EDE3` | Sections alternées |
| `--sable-200` | `#E4D0B7` | Aplats d'ambiance (fond de `hero.png`) |
| `--sable-400` | `#CAB59B` | Bordures marquées, séparateurs |
| `--bronze` | `#836240` | Monogramme, accents, liens actifs |
| `--bronze-fonce` | `#5F4831` | Survol des accents |
| `--or` | `#C8A96E` | Filets fins, étoile ✦ (couleur actuelle conservée) |
| `--encre` | `#0E0E0D` | Texte, boutons principaux (noir actuel conservé) |
| `--gris` | `#888884` | Texte secondaire (actuel) |
| `--ligne` | `#E8E4DC` | Bordures fines |
| `--succes` / `--erreur` / `--alerte` | tons sourds (vert olive, brique, ocre) | États |
| `--whatsapp` | `#25D366` | Uniquement l'icône du bouton WhatsApp |

Le contraste AA est vérifié pour chaque couple texte/fond. Le texte courant ne passe jamais en or ni en sable.

### 3.2 Typographie
- **Titres et éditorial** : Cormorant Garamond (actuelle). Grandes tailles, interlignage serré, italique pour l'accent (« au *meilleur* prix »).
- **Labels, navigation, prix, boutons** : capitales espacées (tracking 0,18–0,3 em), comme `ACCUEIL · BOUTIQUE` dans la maquette.
  - Geist Mono reste disponible pour les références et les SKU.
  - Un **sans-serif fin** (Jost ou Manrope) est proposé pour la lisibilité des textes longs et des formulaires, car le Cormorant est peu lisible en petit. **À valider au Lot 0.**
- Échelle fluide (`clamp`) : Display 64–120 px · H1 44–72 · H2 32–48 · H3 22–28 · Corps 16–17 · Petit 13 · Label 11.

### 3.3 Espacements, grille et formes
- Échelle de 4 px ; sections espacées de 96 à 160 px en desktop.
- Grille de 12 colonnes, largeur max 1440 px, gouttières de 24 à 32 px.
- **Angles vifs ou très légèrement arrondis** (2–4 px) : code luxe plutôt que « pilules » d'app.
- Ombres très douces ; filets de 1 px.

### 3.4 Composants (chacun avec états repos, survol, focus, actif, désactivé, chargement et erreur)

| Famille | Composants |
|---|---|
| Actions | Bouton (plein encre, contour, texte souligné animé, icône), Lien fléché |
| Formulaires | Champ (label flottant, message d'erreur), Zone de texte, Select, Case, Radio, Sélecteur de quantité, Sélecteur de taille (pastilles, indisponible barré), Sélecteur de couleur |
| Navigation | En-tête transparent → nacré au défilement, Méga-menu, Menu mobile plein écran, Fil d'Ariane, Pagination / « Voir plus », Onglets |
| Produit | Carte produit (2 images : survol = 2e vue, favori, badge Nouveau/Épuisé), Prix (DH, prix barré si promotion réelle), Galerie (zoom, vignettes, glisser sur mobile), Pastilles de couleur |
| Catalogue | Panneau de filtres (tiroir en mobile), Puces de filtres actifs, Tri, Compteur de résultats |
| Retours | Modale, Tiroir latéral (mini-panier, filtres), Notification (toast « ajouté au panier »), Squelettes de chargement, État vide, État d'erreur |
| Éditorial | Bandeau défilant (texte), Bloc image + texte, Mosaïque bento, Citation, Bloc réseaux sociaux |

### 3.5 Animations
- Courbe maison `cubic-bezier(0.16, 1, 0.3, 1)` (déjà dans le site). Durées : 150 ms (micro), 400 ms (composants), 700–900 ms (révélations).
- Animations : révélation au défilement en cascade, images qui se dévoilent (masque), légère parallaxe sur les visuels éditoriaux, soulignement animé des liens, transitions de page en fondu.
- **Aucun effet tape-à-l'œil** : pas de tilt 3D sur les produits, pas de néon.
- Bouton « animations off » et respect de `prefers-reduced-motion`.

### 3.6 Responsive
- Points de rupture : 375 · 640 · 768 · 1024 · 1280 · 1536.
- Mobile en priorité pour le parcours d'achat (le trafic Instagram/Facebook est mobile).
- Cibles tactiles d'au moins 44 px ; barre d'action collante sur la fiche produit en mobile.

**Livrable** : une page `/design-system` (interne, non liée dans le menu) qui montre chaque token et chaque composant dans tous ses états. Elle sert de référence de validation.

**Critères d'acceptation** : tous les composants rendus sur `/design-system` ; un test de rendu par composant clé ; aucune couleur codée en dur hors tokens.

[↑ Sommaire](#sommaire)

---

<a id="lot-4"></a>
## Lot 4 — Données catalogue et état

**Objectif.** Les pages lisent des données réelles et le panier calcule juste.

**Tâches**
1. **Schéma produit** (`types.ts` + `produits.json`) :
   - `slug`, `nom`, `categorie`, `collections[]`, `prixDH` (nullable), `prixBarreDH` (nullable) ;
   - `variantes[{couleur, taille, disponible}]`, `matiere`, `entretien`, `description`, `images[{src, alt, vue}]` ;
   - `nouveau`, `misEnAvant`.
2. **Remplir avec le catalogue fourni (D2).** Tant qu'il n'est pas fourni, l'environnement de développement utilise **uniquement** des produits marqués `demo: true`, visibles comme tels. Ils sont exclus du build de production.
3. **Store panier** (Zustand + localStorage) : ajouter, retirer, modifier une quantité (bornes 1–10), vider ; une ligne par produit + couleur + taille.
   - Sous-total calculé.
   - **Livraison** : selon les règles fournies (D9), sinon « calculée à la confirmation ».
   - Total.
4. Stores **favoris** et **compte local** (profil, adresses, historique des commandes envoyées).
5. `lib/whatsapp.ts` : génération du message de commande (articles, tailles, quantités, total, coordonnées, adresse, « paiement à la livraison »), encodé pour `wa.me/212625490034`.
6. `lib/recherche.ts` : recherche sans accents ni casse sur le nom, la catégorie, la couleur et la matière.
7. `lib/filtres.ts` : filtres catégorie, taille, couleur, fourchette de prix, disponibilité ; tri nouveautés / prix croissant / prix décroissant.
8. `boutique.json` : coordonnées, réseaux, numéro WhatsApp. **Source unique** : le numéro est aujourd'hui recopié 5 fois dans le HTML.

**Critères d'acceptation** : tests unitaires sur les totaux, la fusion de lignes identiques, les bornes de quantité, la génération du message WhatsApp, la recherche avec accents et la combinaison de filtres.

[↑ Sommaire](#sommaire)

---

<a id="lot-5"></a>
## Lot 5 — Layout global

**Objectif.** Le cadre commun à toutes les pages.

**Tâches**
1. **Barre d'annonce** fine, avec des messages réels uniquement (ex. « Paiement à la livraison partout au Maroc », si confirmé en D9).
2. **En-tête** :
   - Navigation : logo monogramme centré, Boutique / Collections / La Maison / Contact à gauche, Recherche / Compte / Favoris / Panier (avec compteur) à droite, comme dans la maquette `hero.png`.
   - Comportement : transparent sur le hero, nacré et compact au défilement.
3. **Méga-menu** Boutique : catégories réelles + une image éditoriale par colonne.
4. **Menu mobile** plein écran avec ouverture en cascade, fermeture par Échap et par clic sur un lien, focus piégé.
5. **Recherche en surcouche** : champ, résultats instantanés avec miniatures, Entrée → `/recherche`.
6. **Mini-panier en tiroir** : lignes, quantités, suppression, sous-total, boutons « Voir le panier » et « Commander ».
7. **Pied de page éditorial** :
   - liens boutique, aide et légal ;
   - adresse (D9) ;
   - **réseaux officiels** : Instagram `https://www.instagram.com/hmod_e2121/` et Facebook `https://www.facebook.com/profile.php?id=61594200016066` ;
   - WhatsApp et mentions.
8. **Bouton WhatsApp flottant** conservé, redessiné (discret, aux tokens), masqué pendant le parcours de commande pour ne pas gêner.
9. **Loader** : on garde l'animation de marque actuelle, raccourcie (≤ 800 ms) et affichée **seulement à la première visite**. Le loader actuel bloque 1,8 s à chaque chargement.

**Critères d'acceptation** : navigation au clavier complète ; liens réseaux ouverts dans un nouvel onglet avec `rel="noopener"` ; compteur du panier synchronisé entre onglets.

[↑ Sommaire](#sommaire)

---

<a id="lot-6"></a>
## Lot 6 — Accueil

**Objectif.** Une entrée éditoriale et immersive qui mène vers les produits.

**Composition**
1. **Hero plein écran** d'après `hero.png`.
   - Contenu : monogramme H et « H MODE », filet or avec ✦, « STYLE · QUALITY · YOU », « Plus qu'un style, une attitude. », appel « Découvrir » avec flèche animée, mention verticale « H MODE » à droite.
   - Visuel : photo de campagne (D6) ; à défaut, composition typographique sur fond sable avec une photo produit.
2. **Bandeau défilant** (existant conservé) avec des textes réels : catégories, « Paiement à la livraison », « Livraison Casablanca », sans noms de marques tierces.
3. **Catégories** : grande mosaïque éditoriale asymétrique (bento) avec une image par catégorie réelle. Survol : zoom lent et lien souligné. Reprend la section « Catégories » existante.
4. **Nouveautés** : carrousel de cartes produit (Lightswind Cool Slide Gallery ré-habillé), glissable au doigt.
5. **Collection mise en avant** : bloc image + texte en double page, avec parallaxe douce.
6. **Engagements** (reprise de la bande de confiance) avec des engagements **vérifiables** seulement : COD, échange de taille, réponse WhatsApp. Pictos fins en trait, sans emoji.
7. **Instagram** : bloc « Suivez @hmod_e2121 » avec mosaïque et lien vers le compte. Les images sont importées manuellement : pas d'API Instagram sans jeton (voir [G](#prerequis)).
8. **Contact rapide** WhatsApp avant le pied de page.

**Retirés** (après accord, voir D1 et D10) : section « Nos Marques », témoignages non vérifiés, compteurs non sourcés, « Collection Demo » T2–T6.

**Critères d'acceptation** :
- chaque bloc mène vers une page réelle ;
- LCP du hero < 2,5 s sur mobile (image prioritaire, WebP) ;
- aucune image répétée sur la page.

[↑ Sommaire](#sommaire)

---

<a id="lot-7"></a>
## Lot 7 — Catalogue, catégories et collections

**Objectif.** Parcourir et trouver un produit rapidement, dans une présentation premium.

**Tâches**
1. **`/boutique`** :
   - en-tête éditorial court ;
   - grille 2 colonnes (mobile), 3 (tablette), 4 (desktop), avec bascule d'affichage 2/4 colonnes ;
   - une **image éditoriale insérée** toutes les 8 cartes pour casser la grille générique.
2. **Filtres** : panneau latéral (desktop) ou tiroir (mobile). Ils s'appliquent sans recharger la page, sont **synchronisés dans l'URL** (partage d'un lien filtré), affichent des puces actives, un « Tout effacer » et le nombre de résultats.
3. **Tri** + **pagination « Voir plus »** avec compteur (« 24 sur 60 »).
4. **Pages catégorie `/boutique/:categorie`**, chacune avec une **mise en page adaptée** :
   - *T-shirts et hauts* : visuels portés en grand, filtre coupe (oversize, regular) ;
   - *Pantalons et jeans* : filtre coupe et taille de tour ;
   - *Sneakers* : images produit sur fond neutre, filtre pointure ;
   - les autres catégories selon le catalogue réel (D2), sans créer de catégorie vide.
5. **Collections** : page index (grandes cartes) et page collection (récit + produits).
6. **États** : chargement (squelettes), aucun résultat (suggestions + réinitialisation), erreur de chargement.

**Critères d'acceptation** : filtres combinés justes (tests) ; l'URL restaure les filtres ; zéro résultat → état vide utile ; catégorie inconnue → 404.

[↑ Sommaire](#sommaire)

---

<a id="lot-8"></a>
## Lot 8 — Fiche produit

**Objectif.** Donner envie et permettre d'ajouter au panier sans erreur.

**Composition**
1. **Galerie** :
   - desktop : images empilées à gauche avec infos collantes à droite, zoom au clic en plein écran ;
   - mobile : carrousel à points et glissement.
2. **Infos** :
   - fil d'Ariane, nom (serif), prix en DH (ou « Prix sur demande »), pastilles couleur ;
   - **sélecteur de taille** : indisponible barré, lien « Guide des tailles » en modale ;
   - quantité, puis **« Ajouter au panier »**.
3. **Règles d'ajout** :
   - désactivé tant qu'aucune taille n'est choisie ;
   - message d'erreur clair si on clique sans taille ;
   - « Épuisé » si aucune variante n'est disponible.
4. **Confirmation** : toast + ouverture du mini-panier.
5. **Bouton secondaire** « Commander sur WhatsApp » (message pré-rempli avec produit, taille et couleur) : conserve le canal actuel.
6. **Accordéons** : Description · Matière et entretien · Livraison et retours (D9).
7. **Compléter le look** / **Vous aimerez aussi** : même catégorie ou même collection.
8. **Barre d'achat collante** en mobile.
9. Données structurées `Product` (schema.org) pour le référencement, **seulement avec des prix réels**.

**Critères d'acceptation** : impossible d'ajouter sans taille ; la variante choisie apparaît dans le panier ; un produit épuisé ne peut pas être ajouté ; test end-to-end (Playwright) de fiche → panier.

[↑ Sommaire](#sommaire)

---

<a id="lot-9"></a>
## Lot 9 — Panier et parcours de commande

**Objectif.** Un parcours d'achat complet et honnête, qui aboutit à une commande réellement transmise.

**Panier `/panier`**
- Lignes : image, nom, couleur, taille, prix unitaire, quantité (− / +), total de ligne, suppression avec annulation (« Article retiré · Annuler »).
- Récapitulatif : sous-total, livraison (D9 ou « calculée à la confirmation »), total. Message « Paiement à la livraison ».
- Panier vide : état éditorial et retour vers la boutique.

**Commande `/commande`** (une page, 3 étapes repliables)
1. **Coordonnées** : nom, téléphone marocain (validation du format `+212` / `06` / `07`), e-mail facultatif.
2. **Livraison** : ville (liste), adresse, instructions.
3. **Récapitulatif + paiement** : « Paiement à la livraison » (seul mode réel, D3), case d'acceptation des CGV.

**Validation**
- Erreurs affichées au niveau de chaque champ, et focus sur la première erreur.
- **Envoi** : ouvre WhatsApp avec le message de commande complet, puis mène à `/commande/confirmation`.
  - La confirmation affiche le récapitulatif, un **numéro de référence généré localement** et « Votre commande sera confirmée par WhatsApp ».
  - Elle est enregistrée dans l'historique du compte local.
- **Honnêteté** : aucun écran ne prétend que la commande est « payée » ou « validée » par un système. La validation réelle a lieu sur WhatsApp.
- Le panier n'est vidé qu'après confirmation de l'envoi, avec un bouton « Je n'ai pas pu envoyer → réessayer ».

**Critères d'acceptation** : test end-to-end du parcours complet (ajout → quantité → suppression → commande → message WhatsApp généré → confirmation) ; totaux exacts ; formulaire inaccessible avec un panier vide.

[↑ Sommaire](#sommaire)

---

<a id="lot-10"></a>
## Lot 10 — Compte client

**Objectif.** Un espace client utile, sans prétendre à un backend qui n'existe pas (D4).

**Tâches**
1. `/compte` : tableau de bord (bonjour + raccourcis).
2. **Profil** : nom et téléphone, qui pré-remplissent la commande.
3. **Adresses** : ajouter, modifier, supprimer, choisir l'adresse par défaut.
4. **Commandes** : historique des commandes envoyées depuis cet appareil, avec détail et « Recommander » (remet les articles au panier).
5. **Favoris** : liste, retrait, ajout au panier.
6. **Mention claire** : « Vos informations sont enregistrées uniquement sur cet appareil » + bouton « Effacer mes données ».
7. Évolution prévue (hors périmètre) : vrais comptes avec authentification (voir [G](#prerequis)).

**Critères d'acceptation** : les données survivent au rechargement ; « Effacer mes données » vide tout ; aucun champ mot de passe factice.

[↑ Sommaire](#sommaire)

---

<a id="lot-11"></a>
## Lot 11 — Pages d'information

**Objectif.** Toutes les pages secondaires au même niveau de finition.

**Tâches**
1. **Contact** : reprise du formulaire existant (→ WhatsApp pré-rempli, **fonctionnalité conservée**), adresse, horaires (D9), réseaux officiels, carte (lien Google Maps, sans clé API).
2. **La Maison** : récit de marque (texte à fournir ; sinon gabarit avec emplacements marqués).
3. **Livraison et retours**, **FAQ** (accordéons), **Guide des tailles** (tableaux à fournir).
4. **Mentions légales**, **Confidentialité** (le compte local stocke des données dans le navigateur), **CGV**. Gabarits à faire valider : je ne rédige pas de texte juridique définitif.
5. **404** éditoriale avec recherche et liens vers la boutique.

**Critères d'acceptation** : chaque lien du pied de page mène à une page existante ; aucune information commerciale inventée.

[↑ Sommaire](#sommaire)

---

<a id="lot-12"></a>
## Lot 12 — Animations, finitions et cohérence visuelle

**Objectif.** Le rendu « maison de luxe » homogène sur tout le site.

**Tâches**
1. Passe de cohérence page par page avec la grille de contrôle ci-dessous.
2. Transitions de page (fondu + léger glissement) et révélations en cascade harmonisées.
3. Micro-interactions : survol des cartes (2e image), boutons (remplissage), soulignements, compteur du panier qui pulse à l'ajout, favoris.
4. Performance des animations : uniquement `transform` et `opacity`, `will-change` ciblé, aucune animation déclenchée au défilement sans IntersectionObserver.
5. Contrôle avec « animations off » et `prefers-reduced-motion`.

**Grille de contrôle (par page)**
- Mêmes tokens de couleur, typographie et espacement.
- Images nettes, bien cadrées, jamais déformées, pas de répétition.
- Hiérarchie claire avec une action principale visible.
- États vide, chargement et erreur présents.

[↑ Sommaire](#sommaire)

---

<a id="lot-13"></a>
## Lot 13 — Vérification complète

**Objectif.** Prouver que tout fonctionne avant la mise en ligne.

**Tâches**
1. **Tests** : `tsc --noEmit`, `vitest run` (logique), Playwright (parcours : navigation, recherche, filtres, fiche, panier, commande, compte, contact, 404).
2. **Responsive** : 375, 768, 1024, 1440 px, sur toutes les pages, avec contrôle de l'absence de défilement horizontal.
3. **Accessibilité** : navigation clavier, focus visibles, contrastes AA, textes alternatifs, libellés de formulaire, rôles des modales et tiroirs. Audit Lighthouse ≥ 95.
4. **Performance** : Lighthouse mobile ≥ 90, images WebP dimensionnées, chargement différé, polices préchargées.
5. **SEO** : titres et descriptions par page, Open Graph (partage Instagram/Facebook/WhatsApp), `sitemap.xml`, `robots.txt`.
6. **Régressions** vis-à-vis de l'ancien site ([annexe F](#fonctionnalites-existantes)) : chaque fonctionnalité est cochée.
7. **Liens** : vérification automatique de tous les liens internes et des liens réseaux.

**Livrable** : `RAPPORT-VERIFICATION.md` avec les résultats observés (scores réels, tests passés ou échoués).

[↑ Sommaire](#sommaire)

---

<a id="lot-14"></a>
## Lot 14 — Mise en ligne et passation

**Tâches**
1. Build de production et déploiement (Netlify recommandé, comme indiqué dans le README actuel), redirections SPA.
2. Domaine personnalisé si disponible.
3. **README** : lancer en local, ajouter un produit (procédure pas à pas sur `produits.json` + images), changer les coordonnées, déployer.
4. Commit par lot (Conventional Commits) ; aucun push sans ton accord.

[↑ Sommaire](#sommaire)

---

<a id="inventaire-images"></a>
## E. Inventaire des images

| Fichier | Taille | Contenu | Utilisé aujourd'hui | Décision proposée |
|---|---|---|---|---|
| `DIOR-T.jpg` | 959×1280 | T-shirts logo Dior | Hero + Collection Demo (×2) | Selon D1 (archiver par défaut) |
| `PRADA-T.jpg` | 959×1280 | T-shirts logo Prada | Hero mini + Collection Demo (×2) | Selon D1 |
| `T2.jpg` → `T6.jpg` | 959×1280 | T-shirts motifs Casablanca | Catégories + Collection Demo | Selon D1 |
| `T7.jpg` | 959×1280 | T-shirts motifs Casablanca | Non | Selon D1 |
| `T8.jpg` | 959×1280 | T-shirts logo Amiri | Non | Selon D1 |
| `T9.jpg` | 958×1280 | T-shirts « Casa Way » | Non | Selon D1 |
| `T10.jpg` | 959×1280 | T-shirts logo Givenchy | Non | Selon D1 |
| `T11.jpg` | 959×1280 | T-shirts logo Balenciaga | Non | Selon D1 |
| `T_xj3a3ApC9.webp` | 84×84 | Icône d'interface WhatsApp | Non | Archiver (export WhatsApp) |
| `xK9mP2qLwR7nT4vJ_v2.png` | 300×300 | Icône d'interface WhatsApp | Non | Archiver |
| `DIOR-TSHIRT.html` + `_files/*.js, *.enc, *.css` | ≈ 37 Mo | Page WhatsApp Web sauvegardée | Non | Archiver hors du dossier publié |
| `Hero/hero.png` | 1672×940 | Maquette de DA H MODE (texte incrusté) | Non | Déplacer dans `Template/` comme référence |
| `Scrapping/**` | 130 images | Recherche visuelle | Non | **Jamais publiées** (droits) |

**Doublons confirmés : aucun** (SHA-256 distincts ; quasi-doublon pHash PRADA-T/T11 vérifié visuellement : images différentes).

[↑ Sommaire](#sommaire)

---

<a id="fonctionnalites-existantes"></a>
## F. Fonctionnalités existantes à préserver

| Fonctionnalité actuelle | Devenir |
|---|---|
| Formulaire de contact → message WhatsApp pré-rempli | Conservé (Contact) et généralisé (commande, fiche produit) |
| Bouton WhatsApp flottant | Conservé, redessiné |
| Liens WhatsApp / Instagram / Facebook | Conservés, avec les **comptes officiels** |
| Menu mobile (burger) | Remplacé par un menu plein écran accessible |
| En-tête qui change au défilement | Conservé |
| Loader animé H MODE | Conservé, raccourci, première visite seulement |
| Bandeau défilant | Conservé (contenus réels) |
| Révélations au défilement | Conservées (framer-motion) |
| Défilement doux vers les ancres | Remplacé par le routage + défilement doux intra-page |
| Parallaxe des visuels | Conservée, plus douce |
| Compteurs animés | Composant conservé (Count Up), réutilisé seulement avec des chiffres réels |
| Tilt 3D (hero, témoignages) | Retiré (peu « luxe »), sauf avis contraire |

[↑ Sommaire](#sommaire)

---

<a id="prerequis"></a>
## G. Prérequis externes et limites

| Fonctionnalité | Prérequis absent | Ce qui sera fait sans |
|---|---|---|
| Paiement en ligne | Passerelle (CMI, Stripe…), backend, contrat | Paiement à la livraison + confirmation WhatsApp |
| Stock en temps réel | Back-office / base de données | Disponibilité par variante dans `produits.json`, mise à jour manuelle |
| Comptes multi-appareils | Authentification + base (Supabase, Firebase, Shopify) | Compte local au navigateur, clairement signalé |
| E-mails de confirmation | Service d'envoi (Resend, Brevo…) | Confirmation sur WhatsApp |
| Flux Instagram automatique | API Instagram Graph (compte pro + jeton) | Mosaïque d'images choisies + lien vers le compte |
| Avis clients | Collecte réelle | Emplacement prêt, vide tant qu'aucun avis n'est fourni |

[↑ Sommaire](#sommaire)

---

<a id="risques"></a>
## H. Risques

| Risque | Impact | Parade |
|---|---|---|
| Publication de photos à logos de marques | Juridique, publicité Meta refusée | D1 : retrait du site, nouvelles photos sans logo |
| Catalogue ou prix non fournis | Panier inutilisable en production | D2 en priorité ; modèle de saisie ; « Prix sur demande » |
| Composants Lightswind trop « tech » | Rendu peu luxe | Sélection stricte + ré-habillage complet aux tokens |
| Animations lourdes sur mobile | Saccades, mauvais LCP | `transform`/`opacity` uniquement, reduced-motion, budget Lighthouse |
| Hébergement statique et routes SPA | 404 au rafraîchissement | Redirections Netlify / `404.html` |
| Données du compte local perdues (changement d'appareil) | Frustration | Message explicite + évolution backend documentée |

[↑ Sommaire](#sommaire)
