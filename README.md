# Hakim Al Mouallim — Site Web Mode & Style
## 🇲🇦 Casablanca, Maroc

---

## 📁 Structure du projet

```
hakim-store/
│
├── index.html              ← Page principale (ouvrez ce fichier)
│
├── css/
│   └── style.css           ← Tout le design et les animations
│
├── js/
│   └── main.js             ← Animations, scroll effects, 3D tilt
│
└── assets/
    ├── tshirts/            ← Mettez vos photos de t-shirts ici
    │   └── REPLACE_ME.txt  ← Instructions
    ├── pants/              ← Mettez vos photos de pantalons ici
    │   └── REPLACE_ME.txt
    ├── sneakers/           ← Mettez vos photos de sneakers ici
    │   └── REPLACE_ME.txt
    └── heroes/             ← Mettez vos photos hero/banner ici
        └── REPLACE_ME.txt
```

---

## 🚀 Comment lancer le site

### Option 1 — Ouvrir directement (le plus simple)
1. Double-cliquez sur `index.html`
2. Le site s'ouvre dans votre navigateur (Chrome, Firefox, Edge...)
3. **C'est tout !** Aucune installation nécessaire.

### Option 2 — Serveur local (recommandé pour les photos)
Si certaines images ne s'affichent pas, utilisez un mini serveur :

**Avec Python (déjà installé sur macOS/Linux) :**
```bash
cd hakim-store
python3 -m http.server 8000
```
Puis ouvrez : http://localhost:8000

**Avec Node.js :**
```bash
npm install -g serve
cd hakim-store
serve .
```
Puis ouvrez : http://localhost:3000

---

## 🖼️ Comment ajouter vos photos

### Photos T-Shirts
1. Copiez vos photos dans `assets/tshirts/`
2. Nommez-les : `tshirt-1.jpg`, `tshirt-2.jpg`, `tshirt-3.jpg`
3. Dans `index.html`, trouvez la section T-Shirts et remplacez :
   ```html
   <!-- AVANT (placeholder) -->
   <div class="img-placeholder" style="background:#e8e4dd">
     <span>👕</span>
     <small>tshirt-1.jpg</small>
   </div>

   <!-- APRÈS (avec votre photo) -->
   <img src="assets/tshirts/tshirt-1.jpg" alt="T-Shirt Premium">
   ```

### Photos Pantalons
- Dossier : `assets/pants/`
- Noms : `pants-1.jpg`, `pants-2.jpg`, `pants-3.jpg`
- Même procédure que les t-shirts

### Photos Sneakers
- Dossier : `assets/sneakers/`
- Noms : `sneakers-1.jpg`, `sneakers-2.jpg`, `sneakers-3.jpg`
- Même procédure

### Photo Hero (bannière principale)
- Dossier : `assets/heroes/`
- Nom : `hero-1.jpg`
- Dans `index.html`, trouvez et remplacez le `.hero-bg-placeholder`

**Format recommandé :**
| Section | Dimensions | Format |
|---------|-----------|--------|
| Hero banner | 1400 × 900 px | JPG/WebP |
| T-Shirts | 800 × 1000 px | JPG/WebP |
| Pantalons | 800 × 1000 px | JPG/WebP |
| Sneakers | 800 × 800 px | JPG/WebP |

---

## ✏️ Personnaliser le contenu

### Changer l'adresse
Dans `index.html`, cherchez `Adresse complète à ajouter` et remplacez par votre vraie adresse.

### Changer les liens réseaux sociaux
Cherchez et remplacez :
- `https://www.instagram.com/` → votre vrai lien Instagram
- `https://www.facebook.com/` → votre vrai lien Facebook
- `@hakim_almouallim` → votre vrai compte Instagram

### Changer les marques
Dans la section "Nos Marques", trouvez `.brand-card` et modifiez les noms.

### Changer le numéro WhatsApp
Le numéro `212625490034` apparaît 4-5 fois dans index.html.
Utilisez Ctrl+F pour tout trouver et remplacer.

---

## 🌍 Mettre en ligne (hébergement)

### Option gratuite — Netlify (recommandé)
1. Allez sur https://netlify.com (créez un compte gratuit)
2. Glissez-déposez le dossier `hakim-store` sur la page Netlify
3. Votre site est en ligne en 30 secondes avec une URL du type `hakim-store.netlify.app`
4. Vous pouvez connecter un domaine personnalisé (ex: `hakimstore.ma`)

### Option gratuite — GitHub Pages
1. Créez un compte GitHub sur https://github.com
2. Créez un nouveau repository
3. Uploadez tous les fichiers
4. Activez GitHub Pages dans les Settings

---

## 🎨 Fonctionnalités du site

- ✅ **Loader animé** — animation d'entrée avec votre nom
- ✅ **Navbar** — transparente qui devient blanche au scroll
- ✅ **Hero section** — titre animé + carte 3D avec effet tilt
- ✅ **Ticker animé** — bande défilante avec vos produits
- ✅ **Bande de confiance** — 4 arguments qualité
- ✅ **3 catégories** — T-Shirts, Pantalons, Sneakers (avec vos photos)
- ✅ **Section marques** — Gucci, Tommy, Nike...
- ✅ **Témoignages clients** — avec effet hover 3D
- ✅ **Formulaire de contact** → redirige vers WhatsApp
- ✅ **Bouton WhatsApp flottant** — toujours visible
- ✅ **Footer complet** — Instagram, Facebook, WhatsApp
- ✅ **Compteurs animés** — 500+ refs, 20+ marques, 100% authentique
- ✅ **Parallax scroll** — effets de profondeur au défilement
- ✅ **Menu mobile** — responsive sur téléphone
- ✅ **Animations scroll** — éléments qui apparaissent en douceur

---

## 📞 Support

Des questions ? Contactez Claude directement dans le chat.

---

*Site conçu par Claude — Anthropic · 2026*
