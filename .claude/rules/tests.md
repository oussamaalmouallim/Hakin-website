---
paths:
  - "ui/src/test/**"
---
- Les tests moquent `@/data/produits.json` avec un mini-catalogue (un produit avec prix, un « prix sur demande ») : ne pas dépendre du vrai catalogue.
- `setup.ts` remplace `localStorage`/`sessionStorage` par un stockage mémoire (Node ≥ 25) : ne pas le retirer.
- Le mock de `matchMedia` doit garder `addListener`/`removeListener` (framer-motion les appelle).
- Montants : comparer avec l'espace insécable (`'1 250 DH'`) ; les matchers Testing Library normalisent en espace simple.
- Parcours (`parcours.test.tsx`) : vérifier aussi que `window.open` reçoit le lien WhatsApp et que le panier n'est vidé qu'à la confirmation.
