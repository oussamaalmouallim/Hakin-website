# Documentation de H MODE

| Je veux… | Lire |
|---|---|
| Lancer le projet, les commandes, mettre en ligne | [`../README.md`](../README.md) |
| Comprendre comment le site est construit | [`architecture.md`](architecture.md) |
| Savoir pourquoi un choix a été fait | [`decisions/`](decisions/) (ADR, ci-dessous) |
| Voir où en est le projet, lot par lot | [`projet/plan.md`](projet/plan.md) (tableau « Avancement » en haut) |
| Savoir ce qui reste à faire ou à fournir | [`projet/TODO.md`](projet/TODO.md) |
| Modifier l'apparence (pages, couleurs, animations) | [`../web/design.md`](../web/design.md), [`../web/palette.md`](../web/palette.md), [`../web/animation.md`](../web/animation.md) |
| Faire évoluer la base | [`../supabase/README.md`](../supabase/README.md) |
| Ajouter ou remplacer des photos | [`../web/medias/LISEZMOI.md`](../web/medias/LISEZMOI.md) |

## Décisions (ADR)

| N° | Décision | État |
|---|---|---|
| [0001](decisions/0001-commande-whatsapp-sans-backend.md) | Commande par WhatsApp, paiement à la livraison | en vigueur ; « sans backend » remplacé par 0005 |
| [0002](decisions/0002-prix-sur-demande-et-mode-demo.md) | Prix « sur demande » tant qu'ils ne sont pas saisis | en vigueur ; mode démo supprimé le 04/11 |
| [0003](decisions/0003-methode-ui-stealer-charte-hmode.md) | Méthode UI Stealer, charte H MODE | en vigueur ; mise en page refaite par CloneMe (lot 15) |
| 0004 | — | numéro non utilisé |
| [0005](decisions/0005-supabase-comptes-commandes.md) | Supabase pour comptes, panier et commandes | en vigueur |
| [0006](decisions/0006-administration.md) | Administration `/admin` à trois champs, droits vérifiés par la base | en vigueur |
| [0007](decisions/0007-architecture-et-deploiement.md) | Un seul site statique + Supabase, dépôt rangé, CI/CD | en vigueur |

Nouvelle décision : copier [`decisions/0000-modele.md`](decisions/0000-modele.md) avec le numéro suivant.

## Autres dossiers

- [`design/`](design/) : rapport de clonage Original Fit, maquettes d'origine, ancien prompt du logo (remplacé).
- [`projet/planning/`](projet/planning/) : roadmap et plans de cadrage d'octobre 2026 (historique, non tenus à jour).
