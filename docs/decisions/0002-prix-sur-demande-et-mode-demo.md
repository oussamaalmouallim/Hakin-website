# 0002 — Prix « sur demande » tant qu'ils ne sont pas fixés, et mode démo
- Date : 2026-10-14
- Contexte : la boutique fixera ses prix plus tard (décision D2). Il ne faut ni inventer de prix ni bloquer le développement du panier et de la commande.
- Décision : `prixDH: null` dans `produits.json` affiche « Prix sur demande » et remplace l'ajout au panier par un bouton WhatsApp « Demander prix et disponibilité ». Les filtres et tris sans données (taille, disponibilité, prix) sont masqués. Un mode démo (`VITE_DEMO=1`, `./start.sh demo`, port 6012) fusionne `produits.demo.json` (prix et tailles fictifs) avec un bandeau visible, pour tester le parcours complet.
- Conséquences : saisir un prix dans `produits.json` suffit à activer le panier pour ce produit, sans changer le code. Les valeurs de démo ne doivent jamais être copiées dans les vraies données ni déployées.
